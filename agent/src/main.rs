//! Nubilus Agent - Lightweight server monitoring daemon
//!
//! This agent runs on target servers and periodically reports system metrics
//! to the Nubilus monitoring platform.

mod api;
mod collectors;
mod config;
mod models;

use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use std::path::PathBuf;
use std::time::Duration;
use tokio::time::{interval, sleep};
use tracing::{debug, error, info, warn, Level};
use tracing_subscriber::FmtSubscriber;

use crate::api::{backoff_duration, ApiClient, ApiError};
use crate::collectors::MetricsCollector;
use crate::config::{default_config_path, Config};
use crate::models::RegisterRequest;

/// Nubilus Agent - Server monitoring daemon
#[derive(Parser)]
#[command(name = "nubilus-agent")]
#[command(author, version, about, long_about = None)]
struct Cli {
    /// Path to configuration file
    #[arg(short, long, default_value = default_config_path())]
    config: PathBuf,

    /// Enable verbose logging
    #[arg(short, long)]
    verbose: bool,

    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    /// Run the agent (default)
    Run,

    /// Generate a configuration file template
    Init {
        /// Output path for the config file
        #[arg(short, long)]
        output: Option<PathBuf>,
    },

    /// Configure the agent interactively
    Configure {
        /// API key to use
        #[arg(long)]
        api_key: String,

        /// Nubilus API URL
        #[arg(long, default_value = crate::config::DEFAULT_API_URL)]
        api_url: String,

        /// Server name
        #[arg(long)]
        name: Option<String>,
    },

    /// Test the connection to the Nubilus backend
    Test,

    /// Show current system metrics (one-shot)
    Metrics,

    /// Update to the latest version
    Update,

    /// Uninstall the agent from this system
    Uninstall {
        /// Keep configuration files
        #[arg(long)]
        keep_config: bool,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();

    // Setup logging
    let log_level = if cli.verbose { Level::DEBUG } else { Level::INFO };
    FmtSubscriber::builder()
        .with_max_level(log_level)
        .with_target(false)
        .with_thread_ids(false)
        .init();

    match cli.command.unwrap_or(Commands::Run) {
        Commands::Run => run_agent(&cli.config).await,
        Commands::Init { output } => init_config(output),
        Commands::Configure { api_key, api_url, name } => {
            configure_agent(&cli.config, api_key, api_url, name)
        }
        Commands::Test => test_connection(&cli.config).await,
        Commands::Metrics => show_metrics(),
        Commands::Update => update_agent().await,
        Commands::Uninstall { keep_config } => uninstall_agent(keep_config),
    }
}

/// Run the main agent loop
async fn run_agent(config_path: &PathBuf) -> Result<()> {
    info!("Starting Nubilus Agent v{}", env!("CARGO_PKG_VERSION"));

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
    let server_id = register_with_retry(&api_client, &config).await?;
    info!("Registered as server: {}", server_id);

    // Start the main loops
    let metrics_interval = Duration::from_secs(config.agent.metrics_interval_seconds);
    let heartbeat_interval = Duration::from_secs(config.agent.heartbeat_interval_seconds);

    info!(
        "Starting collection loops - Metrics: {}s, Heartbeat: {}s",
        config.agent.metrics_interval_seconds, config.agent.heartbeat_interval_seconds
    );

    // Run metrics and heartbeat loops concurrently
    tokio::select! {
        result = metrics_loop(&api_client, &mut metrics_collector, metrics_interval) => {
            error!("Metrics loop exited: {:?}", result);
        }
        result = heartbeat_loop(&api_client, heartbeat_interval) => {
            error!("Heartbeat loop exited: {:?}", result);
        }
        _ = tokio::signal::ctrl_c() => {
            info!("Received shutdown signal, exiting...");
        }
    }

    Ok(())
}

/// Register with the server, retrying on failure
async fn register_with_retry(api_client: &ApiClient, config: &Config) -> Result<String> {
    let hostname = hostname::get()
        .map(|h| h.to_string_lossy().to_string())
        .unwrap_or_else(|_| "unknown".to_string());

    let os_info = os_info::get();
    
    let request = RegisterRequest {
        name: config.agent.name.clone(),
        hostname,
        ip_address: None, // Could be detected but often unreliable
        os_type: os_info.os_type().to_string(),
        os_version: os_info.version().to_string(),
        agent_version: env!("CARGO_PKG_VERSION").to_string(),
    };

    let mut attempt = 0u32;
    loop {
        match api_client.register(&request).await {
            Ok(server_id) => return Ok(server_id),
            Err(ApiError::Unauthorized) => {
                error!("Invalid API key. Please check your configuration.");
                anyhow::bail!("Authentication failed - invalid API key");
            }
            Err(e) => {
                attempt += 1;
                let delay = backoff_duration(attempt);
                warn!(
                    "Registration failed (attempt {}): {}. Retrying in {:?}...",
                    attempt, e, delay
                );
                sleep(delay).await;

                if attempt >= 10 {
                    anyhow::bail!("Failed to register after 10 attempts: {}", e);
                }
            }
        }
    }
}

/// Main metrics collection and submission loop
async fn metrics_loop(
    api_client: &ApiClient,
    collector: &mut MetricsCollector,
    interval_duration: Duration,
) -> Result<()> {
    let mut ticker = interval(interval_duration);
    let mut consecutive_failures = 0u32;

    loop {
        ticker.tick().await;

        let metrics = collector.collect();
        
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
                anyhow::bail!("Authentication failed");
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
}

/// Heartbeat loop to keep server status active
async fn heartbeat_loop(api_client: &ApiClient, interval_duration: Duration) -> Result<()> {
    let mut ticker = interval(interval_duration);

    loop {
        ticker.tick().await;

        if let Err(e) = api_client.heartbeat().await {
            warn!("Heartbeat failed: {}", e);
        } else {
            debug!("Heartbeat sent");
        }
    }
}

/// Generate a configuration file template
fn init_config(output: Option<PathBuf>) -> Result<()> {
    let output_path = output.unwrap_or_else(|| PathBuf::from("agent.toml"));
    let template = Config::template();

    std::fs::write(&output_path, template)
        .with_context(|| format!("Failed to write config to: {}", output_path.display()))?;

    info!("Configuration template written to: {}", output_path.display());
    info!("Edit the file and set your API key, then run: nubilus-agent run");
    
    Ok(())
}

/// Configure the agent with provided settings
fn configure_agent(
    config_path: &PathBuf,
    api_key: String,
    api_url: String,
    name: Option<String>,
) -> Result<()> {
    let hostname = hostname::get()
        .map(|h| h.to_string_lossy().to_string())
        .unwrap_or_else(|_| "server".to_string());

    let server_name = name.unwrap_or(hostname);

    let config = Config {
        server: config::ServerConfig {
            api_url,
            api_key,
        },
        agent: config::AgentConfig {
            name: server_name.clone(),
            metrics_interval_seconds: 30,
            heartbeat_interval_seconds: 30,
        },
        features: config::FeaturesConfig::default(),
    };

    // Create parent directories if needed
    if let Some(parent) = config_path.parent() {
        std::fs::create_dir_all(parent)
            .with_context(|| format!("Failed to create config directory: {}", parent.display()))?;
    }

    let toml_content = toml::to_string_pretty(&config)
        .context("Failed to serialize configuration")?;

    std::fs::write(config_path, toml_content)
        .with_context(|| format!("Failed to write config to: {}", config_path.display()))?;

    info!("Configuration saved to: {}", config_path.display());
    info!("Server name: {}", server_name);
    info!("Run 'nubilus-agent run' to start the agent");

    Ok(())
}

/// Test connection to the Nubilus backend
async fn test_connection(config_path: &PathBuf) -> Result<()> {
    info!("Testing connection to Nubilus backend...");

    let config = Config::from_file(config_path)?;
    let api_client = ApiClient::new(&config)?;

    info!("API URL: {}", config.server.api_url);
    info!("Testing authentication...");

    // Try to send a heartbeat as a connection test
    match api_client.heartbeat().await {
        Ok(()) => {
            info!("✓ Connection successful!");
            info!("✓ API key is valid");
        }
        Err(ApiError::Unauthorized) => {
            error!("✗ Authentication failed - check your API key");
        }
        Err(ApiError::NotRegistered) => {
            info!("✓ Connection works, but server not yet registered");
            info!("  This is normal for first-time setup");
        }
        Err(e) => {
            error!("✗ Connection failed: {}", e);
        }
    }

    Ok(())
}

/// Show current system metrics
fn show_metrics() -> Result<()> {
    let mut collector = MetricsCollector::new();
    
    // Wait a moment for CPU usage to stabilize
    std::thread::sleep(Duration::from_millis(500));
    
    let metrics = collector.collect();

    println!("=== System Metrics ===\n");
    
    println!("CPU:");
    println!("  Usage:    {:.1}%", metrics.cpu_usage);
    println!("  Cores:    {}", metrics.cpu_count);
    if let Some(load) = metrics.load_average_1m {
        println!("  Load Avg: {:.2} / {:.2} / {:.2}", 
                 load, 
                 metrics.load_average_5m.unwrap_or(0.0),
                 metrics.load_average_15m.unwrap_or(0.0));
    }
    
    println!("\nMemory:");
    println!("  Usage:     {:.1}%", metrics.memory_usage);
    println!("  Total:     {}", format_bytes(metrics.memory_total));
    println!("  Used:      {}", format_bytes(metrics.memory_used));
    println!("  Available: {}", format_bytes(metrics.memory_available));
    
    println!("\nDisk:");
    println!("  Usage: {:.1}%", metrics.disk_usage);
    println!("  Total: {}", format_bytes(metrics.disk_total));
    println!("  Used:  {}", format_bytes(metrics.disk_used));
    println!("  Read:  {}", format_bytes(metrics.disk_read_bytes));
    println!("  Write: {}", format_bytes(metrics.disk_write_bytes));
    
    println!("\nNetwork:");
    println!("  Received:    {}", format_bytes(metrics.network_in));
    println!("  Transmitted: {}", format_bytes(metrics.network_out));

    Ok(())
}

/// Format bytes into human-readable format
fn format_bytes(bytes: i64) -> String {
    const KB: i64 = 1024;
    const MB: i64 = KB * 1024;
    const GB: i64 = MB * 1024;
    const TB: i64 = GB * 1024;

    if bytes >= TB {
        format!("{:.2} TB", bytes as f64 / TB as f64)
    } else if bytes >= GB {
        format!("{:.2} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.2} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}

/// Update the agent to the latest version
async fn update_agent() -> Result<()> {
    use std::process::Command;
    
    const GITHUB_RELEASE_URL: &str = "https://github.com/theakash04/Nubilus/releases/latest/download";
    
    let current_version = env!("CARGO_PKG_VERSION");
    info!("Current version: v{}", current_version);
    info!("Checking for updates...");

    // Detect OS and architecture
    let os = std::env::consts::OS;
    let arch = std::env::consts::ARCH;
    
    let (os_name, arch_name) = match (os, arch) {
        ("linux", "x86_64") => ("linux", "amd64"),
        ("linux", "aarch64") => ("linux", "arm64"),
        ("macos", "x86_64") => ("darwin", "amd64"),
        ("macos", "aarch64") => ("darwin", "arm64"),
        _ => {
            error!("Unsupported platform: {}-{}", os, arch);
            anyhow::bail!("Unsupported platform: {}-{}", os, arch);
        }
    };

    let binary_name = format!("nubilus-agent-{}-{}", os_name, arch_name);
    let download_url = format!("{}/{}", GITHUB_RELEASE_URL, binary_name);
    
    info!("Downloading {} ...", binary_name);

    // Download the new binary
    let client = reqwest::Client::new();
    let response = client
        .get(&download_url)
        .send()
        .await
        .context("Failed to download update")?;

    if !response.status().is_success() {
        error!("Download failed with status: {}", response.status());
        anyhow::bail!("Failed to download update: HTTP {}", response.status());
    }

    let bytes = response.bytes().await.context("Failed to read response body")?;
    info!("Downloaded {} bytes", bytes.len());

    // Get current executable path
    let current_exe = std::env::current_exe().context("Failed to get current executable path")?;
    info!("Current executable: {}", current_exe.display());

    // Create a temporary file for the new binary
    let temp_path = current_exe.with_extension("new");
    
    // Write new binary to temp file
    std::fs::write(&temp_path, &bytes)
        .context("Failed to write new binary")?;

    // Make it executable (Unix only)
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = std::fs::metadata(&temp_path)?.permissions();
        perms.set_mode(0o755);
        std::fs::set_permissions(&temp_path, perms)?;
    }

    // Delete old binary and install new one
    std::fs::remove_file(&current_exe)
        .context("Failed to remove old binary. Try running with sudo.")?;
    
    std::fs::rename(&temp_path, &current_exe)
        .context("Failed to install new binary")?;

    info!("✓ Update successful!");
    info!("");
    info!("The agent has been updated. Please restart the service:");
    info!("Restarting nubilus-agent service...");
    let _ = Command::new("systemctl")
        .args(["restart", "nubilus-agent"])
        .output();
    info!("");
    info!("Or if running manually, restart the agent.");

    Ok(())
}

/// Uninstall the agent from this system
fn uninstall_agent(keep_config: bool) -> Result<()> {
    use std::process::Command;

    info!("Uninstalling Nubilus Agent...");

    // Check if running as root
    if !nix_check_root() {
        error!("This command requires root privileges. Please run with sudo:");
        error!("  sudo nubilus-agent uninstall");
        anyhow::bail!("Root privileges required");
    }

    // 1. Stop the systemd service
    info!("Stopping systemd service...");
    let _ = Command::new("systemctl")
        .args(["stop", "nubilus-agent"])
        .output();
    
    let _ = Command::new("systemctl")
        .args(["disable", "nubilus-agent"])
        .output();

    // 2. Remove systemd service file
    let service_file = "/etc/systemd/system/nubilus-agent.service";
    if std::path::Path::new(service_file).exists() {
        info!("Removing systemd service file...");
        std::fs::remove_file(service_file).ok();
        let _ = Command::new("systemctl")
            .arg("daemon-reload")
            .output();
    }

    // 3. Remove configuration (unless --keep-config)
    if !keep_config {
        let config_dir = "/etc/nubilus";
        if std::path::Path::new(config_dir).exists() {
            info!("Removing configuration directory...");
            std::fs::remove_dir_all(config_dir).ok();
        }
    } else {
        info!("Keeping configuration files at /etc/nubilus");
    }

    // 4. Get current executable path and schedule removal
    let current_exe = std::env::current_exe()
        .unwrap_or_else(|_| std::path::PathBuf::from("/usr/local/bin/nubilus-agent"));
    
    info!("Removing binary: {}", current_exe.display());
    
    // We can't delete ourselves while running, so we use a trick:
    // Create a small script that will delete us after we exit
    let cleanup_script = "/tmp/nubilus-cleanup.sh";
    let script_content = format!(
        "#!/bin/bash\nsleep 1\nrm -f \"{}\"\nrm -f \"{}\"\n",
        current_exe.display(),
        cleanup_script
    );
    
    std::fs::write(cleanup_script, script_content).ok();
    
    // Make it executable and run it in background
    let _ = Command::new("chmod")
        .args(["+x", cleanup_script])
        .output();
    
    let _ = Command::new("bash")
        .args(["-c", &format!("{} &", cleanup_script)])
        .spawn();

    info!("");
    info!("✓ Nubilus Agent has been uninstalled!");
    if keep_config {
        info!("  Configuration preserved at /etc/nubilus");
    }
    info!("");
    info!("To reinstall, run:");
    info!("  curl -sSL https://github.com/theakash04/Nubilus/releases/latest/download/install.sh | sudo bash");

    Ok(())
}

/// Check if running as root (Unix only)
#[cfg(unix)]
fn nix_check_root() -> bool {
    unsafe { libc::geteuid() == 0 }
}

#[cfg(not(unix))]
fn nix_check_root() -> bool {
    true // Assume ok on non-Unix
}
