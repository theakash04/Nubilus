//! Disk metrics collector

use sysinfo::{Disks, System};

/// Disk metrics data
#[derive(Debug)]
pub struct DiskMetrics {
    /// Disk usage percentage (0-100)
    pub usage: f64,
    /// Total disk space in bytes
    pub total: i64,
    /// Used disk space in bytes
    pub used: i64,
    /// Cumulative bytes read
    pub read_bytes: i64,
    /// Cumulative bytes written
    pub write_bytes: i64,
}

/// Collect disk metrics from the system
pub fn collect(_system: &System) -> DiskMetrics {
    let disks = Disks::new_with_refreshed_list();
    
    let mut total: u64 = 0;
    let mut available: u64 = 0;

    // Only report the root (/) partition - this gives the most accurate
    // representation of available disk space for most use cases
    for disk in disks.list() {
        if disk.mount_point() == std::path::Path::new("/") {
            total = disk.total_space();
            available = disk.available_space();
            break;
        }
    }

    let used = total.saturating_sub(available);
    
    let usage = if total > 0 {
        (used as f64 / total as f64) * 100.0
    } else {
        0.0
    };

    // Get disk I/O stats from /proc/diskstats on Linux
    let (read_bytes, write_bytes) = read_disk_io_stats();
    
    DiskMetrics {
        usage,
        total: total as i64,
        used: used as i64,
        read_bytes,
        write_bytes,
    }
}

/// Read disk I/O statistics from /proc/diskstats (Linux only)
/// 
/// /proc/diskstats format (fields are space-separated):
/// 1. major number
/// 2. minor number
/// 3. device name
/// 4. reads completed successfully
/// 5. reads merged
/// 6. sectors read           
/// 7. time spent reading (ms)
/// 8. writes completed
/// 9. writes merged
/// 10. sectors written       
/// 11. time spent writing (ms)
/// ... (more fields in newer kernels)
///
/// Each sector is 512 bytes.
#[cfg(target_os = "linux")]
fn read_disk_io_stats() -> (i64, i64) {
    use std::fs;
    
    const SECTOR_SIZE: u64 = 512;
    
    let content = match fs::read_to_string("/proc/diskstats") {
        Ok(c) => c,
        Err(_) => return (0, 0),
    };
    
    let mut total_read_sectors: u64 = 0;
    let mut total_write_sectors: u64 = 0;
    
    for line in content.lines() {
        let fields: Vec<&str> = line.split_whitespace().collect();
        
        // Need at least 10 fields (up to sectors written)
        if fields.len() < 10 {
            continue;
        }
        
        let device_name = fields[2];
        
        // Only count main disk devices, not partitions
        // - nvme0n1 (not nvme0n1p1, nvme0n1p2)
        // - sda (not sda1, sda2)
        // - vda (not vda1, vda2)
        // Skip loop, ram, dm- devices
        let is_main_disk = (device_name.starts_with("nvme") && !device_name.contains('p'))
            || (device_name.starts_with("sd") && device_name.len() == 3)
            || (device_name.starts_with("vd") && device_name.len() == 3)
            || (device_name.starts_with("xvd") && device_name.len() == 4)
            || (device_name.starts_with("hd") && device_name.len() == 3);
        
        if !is_main_disk {
            continue;
        }
        
        // Field 6 (index 5): sectors read
        // Field 10 (index 9): sectors written
        if let (Ok(sectors_read), Ok(sectors_written)) = 
            (fields[5].parse::<u64>(), fields[9].parse::<u64>()) 
        {
            total_read_sectors += sectors_read;
            total_write_sectors += sectors_written;
        }
    }
    
    (
        (total_read_sectors * SECTOR_SIZE) as i64,
        (total_write_sectors * SECTOR_SIZE) as i64,
    )
}

/// Fallback for non-Linux systems
#[cfg(not(target_os = "linux"))]
fn read_disk_io_stats() -> (i64, i64) {
    // Not supported on macOS/Windows via this method
    (0, 0)
}
