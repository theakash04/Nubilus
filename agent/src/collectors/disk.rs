//! Disk metrics collector

use sysinfo::{Disks, System};

/// Disk metrics data
pub struct DiskMetrics {
    /// Disk usage percentage (0-100)
    pub usage: f64,
    /// Total disk space in bytes
    pub total: i64,
    /// Used disk space in bytes
    pub used: i64,
    /// Cumulative bytes read (placeholder - requires procfs on Linux)
    pub read_bytes: i64,
    /// Cumulative bytes written (placeholder - requires procfs on Linux)
    pub write_bytes: i64,
}

/// Collect disk metrics from the system
pub fn collect(_system: &System) -> DiskMetrics {
    let disks = Disks::new_with_refreshed_list();
    
    let mut total: u64 = 0;
    let mut available: u64 = 0;

    // Aggregate all mounted disks
    for disk in disks.list() {
        total += disk.total_space();
        available += disk.available_space();
    }

    let used = total.saturating_sub(available);
    
    let usage = if total > 0 {
        (used as f64 / total as f64) * 100.0
    } else {
        0.0
    };

    // Note: Disk I/O bytes require reading from /proc/diskstats on Linux
    // or using platform-specific APIs. For now, we return 0.
    // This can be enhanced with the `procfs` crate on Linux.
    
    DiskMetrics {
        usage,
        total: total as i64,
        used: used as i64,
        read_bytes: 0, // TODO: Implement with procfs
        write_bytes: 0, // TODO: Implement with procfs
    }
}
