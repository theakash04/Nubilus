//! Windows Service support for Nubilus Agent
//!
//! This module implements the Windows Service Control Manager (SCM) protocol,
//! allowing the agent to run as a proper Windows Service.
//!
//! When launched via `nubilus-agent service`, the binary:
//! 1. Calls `StartServiceCtrlDispatcher()` to register with SCM
//! 2. Reports `SERVICE_RUNNING`
//! 3. Handles `Stop` control events for graceful shutdown
//! 4. Runs the same agent logic as `nubilus-agent run`

use std::ffi::OsString;
use std::path::PathBuf;
use std::time::Duration;

use windows_service::{
    define_windows_service,
    service::{
        ServiceControl, ServiceControlAccept, ServiceExitCode, ServiceState, ServiceStatus,
        ServiceType,
    },
    service_control_handler::{self, ServiceControlHandlerResult},
    service_dispatcher,
};

use anyhow::Result;
use tracing::{error, info};

const SERVICE_NAME: &str = "nubilus-agent";
const SERVICE_TYPE: ServiceType = ServiceType::OWN_PROCESS;

/// Entry point when running as a Windows Service.
/// Called from `main()` when the `service` subcommand is used.
pub fn run() -> Result<()> {
    // Register the service entry point with Windows SCM.
    // This call blocks until the service stops.
    service_dispatcher::start(SERVICE_NAME, ffi_service_main)
        .map_err(|e| anyhow::anyhow!("Failed to start service dispatcher: {}", e))?;
    Ok(())
}

// Generate the FFI-compatible service main function
define_windows_service!(ffi_service_main, service_main);

/// The actual service main function called by SCM after dispatch.
fn service_main(arguments: Vec<OsString>) {
    if let Err(e) = run_service(arguments) {
        error!("Service failed: {}", e);
    }
}

fn run_service(_arguments: Vec<OsString>) -> Result<()> {
    // Create a channel to signal shutdown
    let (shutdown_tx, shutdown_rx) = std::sync::mpsc::channel::<()>();

    // Register the service control handler
    let status_handle = service_control_handler::register(SERVICE_NAME, move |control_event| {
        match control_event {
            ServiceControl::Stop => {
                // Signal the agent to shut down
                let _ = shutdown_tx.send(());
                ServiceControlHandlerResult::NoError
            }
            ServiceControl::Interrogate => ServiceControlHandlerResult::NoError,
            _ => ServiceControlHandlerResult::NotImplemented,
        }
    })
    .map_err(|e| anyhow::anyhow!("Failed to register service control handler: {}", e))?;

    // Report that the service is starting
    status_handle
        .set_service_status(ServiceStatus {
            service_type: SERVICE_TYPE,
            current_state: ServiceState::StartPending,
            controls_accepted: ServiceControlAccept::empty(),
            exit_code: ServiceExitCode::Win32(0),
            checkpoint: 0,
            wait_hint: Duration::from_secs(10),
            process_id: None,
        })
        .map_err(|e| anyhow::anyhow!("Failed to set service status: {}", e))?;

    // Setup logging (write to Windows Event Log could be added later;
    // for now, tracing logs go to the service's stdout which NSSM or
    // similar can capture, or we just rely on file logging)
    let subscriber = tracing_subscriber::FmtSubscriber::builder()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .with_thread_ids(false)
        .finish();
    // Ignore error if subscriber is already set (e.g. in tests)
    let _ = tracing::subscriber::set_global_default(subscriber);

    // Determine config path
    let config_path = crate::config::default_config_path().into();

    // Build the tokio runtime
    let runtime = tokio::runtime::Runtime::new()
        .map_err(|e| anyhow::anyhow!("Failed to create tokio runtime: {}", e))?;

    // Report SERVICE_RUNNING
    status_handle
        .set_service_status(ServiceStatus {
            service_type: SERVICE_TYPE,
            current_state: ServiceState::Running,
            controls_accepted: ServiceControlAccept::STOP,
            exit_code: ServiceExitCode::Win32(0),
            checkpoint: 0,
            wait_hint: Duration::default(),
            process_id: None,
        })
        .map_err(|e| anyhow::anyhow!("Failed to set service status: {}", e))?;

    // Run the agent with shutdown support
    let result = runtime.block_on(run_agent_with_shutdown(&config_path, shutdown_rx));

    // Report SERVICE_STOPPED
    let exit_code = if result.is_ok() {
        ServiceExitCode::Win32(0)
    } else {
        ServiceExitCode::Win32(1)
    };

    status_handle
        .set_service_status(ServiceStatus {
            service_type: SERVICE_TYPE,
            current_state: ServiceState::Stopped,
            controls_accepted: ServiceControlAccept::empty(),
            exit_code,
            checkpoint: 0,
            wait_hint: Duration::default(),
            process_id: None,
        })
        .ok(); // Best-effort; process is about to exit anyway

    result
}

/// Run the agent, listening for a shutdown signal from the SCM control handler.
async fn run_agent_with_shutdown(
    config_path: &PathBuf,
    shutdown_rx: std::sync::mpsc::Receiver<()>,
) -> Result<()> {
    use anyhow::Context;
    use tokio::time::{interval, sleep};
    use tracing::{debug, warn};

    use crate::api::{backoff_duration, ApiClient, ApiError};
    use crate::collectors::MetricsCollector;
    use crate::config::Config;
    use crate::models::RegisterRequest;

    info!("Starting Nubilus Agent v{} (Windows Service mode)", env!("CARGO_PKG_VERSION"));

    // Load configuration
    let config = Config::from_file(config_path)
        .with_context(|| format!("Failed to load config from: {}", config_path.display()))?;

    info!("Loaded configuration for server: {}", config.agent.name);
    info!("Connecting to: {}", config.server.api_url);

    // Create API client
    let api_client = ApiClient::new(&config)?;

    // Create metrics collector
    let mut metrics_collector = MetricsCollector::new();

    // Register this server
    let server_id = crate::register_with_retry(&api_client, &config).await?;
    info!("Registered as server: {}", server_id);

    // Start the main loops
    let metrics_interval = Duration::from_secs(config.agent.metrics_interval_seconds);
    let heartbeat_interval = Duration::from_secs(config.agent.heartbeat_interval_seconds);

    info!(
        "Starting collection loops - Metrics: {}s, Heartbeat: {}s",
        config.agent.metrics_interval_seconds, config.agent.heartbeat_interval_seconds
    );

    // Wrap the sync receiver in a task that completes when shutdown is signaled
    let shutdown_signal = async move {
        tokio::task::spawn_blocking(move || {
            // Block until we receive the stop signal
            let _ = shutdown_rx.recv();
        })
        .await
        .ok();
    };

    // Metrics loop
    let metrics_future = async {
        let mut ticker = interval(metrics_interval);
        let mut consecutive_failures = 0u32;

        loop {
            ticker.tick().await;

            let metrics = metrics_collector.collect();

            debug!(
                "Collected: CPU={:.1}%, Mem={:.1}%, Disk={:.1}%",
                metrics.cpu_usage, metrics.memory_usage, metrics.disk_usage
            );

            match api_client.submit_metrics(&metrics).await {
                Ok(()) => {
                    consecutive_failures = 0;
                }
                Err(ApiError::Unauthorized) => {
                    error!("API key became invalid. Stopping agent.");
                    break;
                }
                Err(ApiError::NotRegistered) => {
                    warn!("Server not found. Agent may need to restart to re-register.");
                }
                Err(e) => {
                    consecutive_failures += 1;
                    warn!(
                        "Failed to submit metrics (failure #{}): {}",
                        consecutive_failures, e
                    );
                }
            }
        }
    };

    // Heartbeat loop
    let heartbeat_future = async {
        let mut ticker = interval(heartbeat_interval);

        loop {
            ticker.tick().await;

            if let Err(e) = api_client.heartbeat().await {
                warn!("Heartbeat failed: {}", e);
            } else {
                debug!("Heartbeat sent");
            }
        }
    };

    // Run everything concurrently, stopping when any completes
    tokio::select! {
        _ = metrics_future => {
            error!("Metrics loop exited");
        }
        _ = heartbeat_future => {
            error!("Heartbeat loop exited");
        }
        _ = shutdown_signal => {
            info!("Received service stop signal, shutting down gracefully...");
        }
    }

    Ok(())
}
