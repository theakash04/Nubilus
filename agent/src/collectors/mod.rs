//! System metrics collectors
//! 
//! This module provides collectors for various system metrics including
//! CPU, memory, disk, and network statistics.

pub mod cpu;
pub mod disk;
pub mod memory;
pub mod network;

use crate::models::MetricsPayload;
use sysinfo::System;

/// Unified metrics collector that aggregates all system metrics
pub struct MetricsCollector {
    system: System,
}

impl MetricsCollector {
    /// Create a new metrics collector
    pub fn new() -> Self {
        let mut system = System::new_all();
        // Initial refresh to populate data
        system.refresh_all();
        Self { system }
    }

    /// Collect all metrics and return a unified payload
    pub fn collect(&mut self) -> MetricsPayload {
        // Refresh system info before collecting
        self.system.refresh_all();

        let cpu_metrics = cpu::collect(&self.system);
        let memory_metrics = memory::collect(&self.system);
        let disk_metrics = disk::collect(&self.system);
        let network_metrics = network::collect(&self.system);

        MetricsPayload {
            // CPU
            cpu_usage: cpu_metrics.usage,
            cpu_count: cpu_metrics.count,
            load_average_1m: cpu_metrics.load_average_1m,
            load_average_5m: cpu_metrics.load_average_5m,
            load_average_15m: cpu_metrics.load_average_15m,

            // Memory
            memory_usage: memory_metrics.usage,
            memory_total: memory_metrics.total,
            memory_used: memory_metrics.used,
            memory_available: memory_metrics.available,

            // Disk
            disk_usage: disk_metrics.usage,
            disk_total: disk_metrics.total,
            disk_used: disk_metrics.used,
            disk_read_bytes: disk_metrics.read_bytes,
            disk_write_bytes: disk_metrics.write_bytes,

            // Network
            network_in: network_metrics.bytes_in,
            network_out: network_metrics.bytes_out,
        }
    }
}

impl Default for MetricsCollector {
    fn default() -> Self {
        Self::new()
    }
}
