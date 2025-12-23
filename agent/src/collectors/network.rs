//! Network metrics collector

use sysinfo::{Networks, System};

/// Network metrics data
pub struct NetworkMetrics {
    /// Cumulative bytes received
    pub bytes_in: i64,
    /// Cumulative bytes sent
    pub bytes_out: i64,
}

/// Collect network metrics from the system
pub fn collect(_system: &System) -> NetworkMetrics {
    let networks = Networks::new_with_refreshed_list();
    
    let mut bytes_in: u64 = 0;
    let mut bytes_out: u64 = 0;

    // Aggregate across all network interfaces
    for (_interface_name, data) in networks.list() {
        bytes_in += data.total_received();
        bytes_out += data.total_transmitted();
    }

    NetworkMetrics {
        bytes_in: bytes_in as i64,
        bytes_out: bytes_out as i64,
    }
}
