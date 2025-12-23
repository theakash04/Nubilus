//! Memory metrics collector

use sysinfo::System;

/// Memory metrics data
pub struct MemoryMetrics {
    /// Memory usage percentage (0-100)
    pub usage: f64,
    /// Total RAM in bytes
    pub total: i64,
    /// Used RAM in bytes
    pub used: i64,
    /// Available RAM in bytes
    pub available: i64,
}

/// Collect memory metrics from the system
pub fn collect(system: &System) -> MemoryMetrics {
    let total = system.total_memory() as i64;
    let used = system.used_memory() as i64;
    let available = system.available_memory() as i64;

    let usage = if total > 0 {
        (used as f64 / total as f64) * 100.0
    } else {
        0.0
    };

    MemoryMetrics {
        usage,
        total,
        used,
        available,
    }
}
