//! CPU metrics collector

use sysinfo::System;

/// CPU metrics data
pub struct CpuMetrics {
    /// Overall CPU usage percentage (0-100)
    pub usage: f64,
    /// Number of CPU cores
    pub count: i32,
    /// 1-minute load average (Unix only)
    pub load_average_1m: Option<f64>,
    /// 5-minute load average (Unix only)
    pub load_average_5m: Option<f64>,
    /// 15-minute load average (Unix only)
    pub load_average_15m: Option<f64>,
}

/// Collect CPU metrics from the system
pub fn collect(system: &System) -> CpuMetrics {
    let cpus = system.cpus();
    
    // Calculate average CPU usage across all cores
    let usage = if cpus.is_empty() {
        0.0
    } else {
        let total: f32 = cpus.iter().map(|cpu| cpu.cpu_usage()).sum();
        (total / cpus.len() as f32) as f64
    };

    let count = cpus.len() as i32;

    // Get load averages (Unix only)
    let load_avg = System::load_average();
    let (load_average_1m, load_average_5m, load_average_15m) = if cfg!(unix) {
        (
            Some(load_avg.one),
            Some(load_avg.five),
            Some(load_avg.fifteen),
        )
    } else {
        (None, None, None)
    };

    CpuMetrics {
        usage,
        count,
        load_average_1m,
        load_average_5m,
        load_average_15m,
    }
}
