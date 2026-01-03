//! Configuration loading and management

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::path::Path;

/// Main configuration structure matching agent.toml
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub agent: AgentConfig,
    #[serde(default)]
    pub features: FeaturesConfig,
}

/// Server connection configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    /// Base URL of the Nubilus API (e.g., "https://api.nubilus.io")
    pub api_url: String,
    /// API key for authentication (e.g., "nub_xxxx")
    pub api_key: String,
}

/// Agent behavior configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    /// Friendly name for this server
    pub name: String,
    /// How often to send metrics (in seconds)
    #[serde(default = "default_metrics_interval")]
    pub metrics_interval_seconds: u64,
    /// How often to send heartbeats (in seconds)
    #[serde(default = "default_heartbeat_interval")]
    pub heartbeat_interval_seconds: u64,
}

/// Optional feature flags
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct FeaturesConfig {
    /// Whether to collect process information
    #[serde(default)]
    pub collect_processes: bool,
    /// Whether to perform HTTP health checks
    #[serde(default)]
    pub http_health_checks: bool,
}

fn default_metrics_interval() -> u64 {
    30
}

fn default_heartbeat_interval() -> u64 {
    30
}

impl Config {
    /// Load configuration from a TOML file
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self> {
        let path = path.as_ref();
        let content = std::fs::read_to_string(path)
            .with_context(|| format!("Failed to read config file: {}", path.display()))?;
        
        let config: Config = toml::from_str(&content)
            .with_context(|| format!("Failed to parse config file: {}", path.display()))?;
        
        config.validate()?;
        Ok(config)
    }

    /// Validate configuration values
    fn validate(&self) -> Result<()> {
        if self.server.api_url.is_empty() {
            anyhow::bail!("server.api_url cannot be empty");
        }
        if self.server.api_key.is_empty() {
            anyhow::bail!("server.api_key cannot be empty");
        }
        if !self.server.api_key.starts_with("nub_") {
            anyhow::bail!("server.api_key must start with 'nub_'");
        }
        if self.agent.name.is_empty() {
            anyhow::bail!("agent.name cannot be empty");
        }
        if self.agent.metrics_interval_seconds < 10 {
            anyhow::bail!("agent.metrics_interval_seconds must be at least 10");
        }
        if self.agent.heartbeat_interval_seconds < 10 {
            anyhow::bail!("agent.heartbeat_interval_seconds must be at least 10");
        }
        Ok(())
    }

    /// Generate a default configuration template
    pub fn template() -> String {
        let api_url = default_api_url();
        
        format!(r#"# Nubilus Agent Configuration
# Location: /etc/nubilus/agent.toml

[server]
# URL of your Nubilus backend API
api_url = "{}"
# Your organization's API key (from the dashboard)
api_key = "nub_your_api_key_here"

[agent]
# Friendly name for this server (shown in dashboard)
name = "my-server-01"
# How often to collect and send metrics (minimum: 10 seconds)
metrics_interval_seconds = 30
# How often to send heartbeat (minimum: 10 seconds)
heartbeat_interval_seconds = 30

[features]
# Include top process information in metrics
collect_processes = true
# Enable agent-side HTTP endpoint health checks
http_health_checks = false
"#, api_url)
    }
}

/// Default API URL - reads from API_URL env var at runtime, falls back to production URL
pub const DEFAULT_API_URL: &str = "https://nubilus.akashtwt.me/api";

/// Get default API URL from runtime environment or fallback to default
pub fn default_api_url() -> String {
    std::env::var("API_URL")
        .unwrap_or_else(|_| DEFAULT_API_URL.to_string())
}

/// Get the default config file path based on OS
pub fn default_config_path() -> &'static str {
    if cfg!(target_os = "windows") {
        "C:\\ProgramData\\nubilus\\agent.toml"
    } else {
        "/etc/nubilus/agent.toml"
    }
}
