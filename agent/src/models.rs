//! Data models for API requests and responses

use serde::{Deserialize, Serialize};

/// Server registration request sent on agent startup
#[derive(Debug, Serialize)]
pub struct RegisterRequest {
    pub name: String,
    pub hostname: String,
    pub ip_address: Option<String>,
    pub os_type: String,
    pub os_version: String,
    pub agent_version: String,
}

/// Response from server registration
#[derive(Debug, Deserialize)]
pub struct RegisterResponse {
    pub success: bool,
    pub message: String,
    pub data: Option<RegisterData>,
}

#[derive(Debug, Deserialize)]
pub struct RegisterData {
    pub server_id: String,
}

/// Metrics payload sent periodically
#[derive(Debug, Serialize, Default)]
pub struct MetricsPayload {
    // CPU metrics
    pub cpu_usage: f64,
    pub cpu_count: i32,
    pub load_average_1m: Option<f64>,
    pub load_average_5m: Option<f64>,
    pub load_average_15m: Option<f64>,

    // Memory metrics
    pub memory_usage: f64,
    pub memory_total: i64,
    pub memory_used: i64,
    pub memory_available: i64,

    // Disk metrics
    pub disk_usage: f64,
    pub disk_total: i64,
    pub disk_used: i64,
    pub disk_read_bytes: i64,
    pub disk_write_bytes: i64,

    // Network metrics
    pub network_in: i64,
    pub network_out: i64,
}

/// Health check payload for endpoint monitoring
#[derive(Debug, Serialize)]
pub struct HealthCheckPayload {
    pub endpoint_id: String,
    pub status_code: Option<u16>,
    pub response_time: f64,
    pub is_up: bool,
    pub error_message: Option<String>,
    pub checked_from: String,
}

/// Generic API response (reserved for future use)
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct ApiResponse {
    pub success: bool,
    pub message: Option<String>,
}
