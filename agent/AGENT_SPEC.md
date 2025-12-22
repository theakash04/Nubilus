# Nubilus Agent - Rust Implementation Spec

A lightweight monitoring agent that runs on target servers and reports metrics to the Nubilus platform.

## Overview

The agent authenticates using an API key and periodically sends:
- System metrics (CPU, memory, disk, network)
- Process information
- HTTP health check results (optional)
- Heartbeats

---

## API Endpoints

Base URL: `https://your-nubilus-server.com/api`

### 1. Register Server
**First call on startup** - registers the server with the platform.

```
POST /api/ingest/register
X-API-Key: nub_your_api_key_here
Content-Type: application/json

{
  "name": "web-server-01",
  "hostname": "web-01.example.com",
  "ip_address": "10.0.0.1",
  "os_type": "Linux",
  "os_version": "Ubuntu 22.04",
  "agent_version": "0.1.0"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Server registered",
  "data": { "server_id": "uuid-here" }
}
```

---

### 2. Submit Metrics
**Called every 10-60 seconds** (configurable)

```
POST /api/ingest/metrics
X-API-Key: nub_your_api_key_here
Content-Type: application/json

{
  "cpu_usage": 45.5,
  "cpu_count": 8,
  "load_average_1m": 1.2,
  "load_average_5m": 1.0,
  "load_average_15m": 0.8,
  "memory_usage": 65.2,
  "memory_total": 17179869184,
  "memory_used": 11190558720,
  "memory_available": 5989310464,
  "disk_usage": 42.0,
  "disk_total": 107374182400,
  "disk_used": 45097156608,
  "disk_read_bytes": 1234567890,
  "disk_write_bytes": 987654321,
  "network_in": 5000000000,
  "network_out": 3000000000
}
```

---

### 3. Heartbeat
**Called every 30 seconds** - keeps server status "active"

```
POST /api/ingest/heartbeat
X-API-Key: nub_your_api_key_here
```

---

### 4. Submit Health Check (Optional)
For agent-side HTTP endpoint monitoring.

```
POST /api/ingest/health
X-API-Key: nub_your_api_key_here
Content-Type: application/json

{
  "endpoint_id": "uuid-of-endpoint",
  "status_code": 200,
  "response_time": 125.5,
  "is_up": true,
  "error_message": null,
  "checked_from": "us-east-1"
}
```

---

## Metrics Collection

### CPU
| Field | Type | Description |
|-------|------|-------------|
| `cpu_usage` | f64 | Overall CPU usage percentage (0-100) |
| `cpu_count` | i32 | Number of CPU cores |
| `load_average_1m` | f64 | 1-minute load average |
| `load_average_5m` | f64 | 5-minute load average |
| `load_average_15m` | f64 | 15-minute load average |

**Rust crates:** `sysinfo`, `sys-info`

### Memory
| Field | Type | Description |
|-------|------|-------------|
| `memory_usage` | f64 | Memory usage percentage (0-100) |
| `memory_total` | i64 | Total RAM in bytes |
| `memory_used` | i64 | Used RAM in bytes |
| `memory_available` | i64 | Available RAM in bytes |

### Disk
| Field | Type | Description |
|-------|------|-------------|
| `disk_usage` | f64 | Disk usage percentage (0-100) |
| `disk_total` | i64 | Total disk space in bytes |
| `disk_used` | i64 | Used disk space in bytes |
| `disk_read_bytes` | i64 | Cumulative bytes read |
| `disk_write_bytes` | i64 | Cumulative bytes written |

### Network
| Field | Type | Description |
|-------|------|-------------|
| `network_in` | i64 | Cumulative bytes received |
| `network_out` | i64 | Cumulative bytes sent |

---

## Recommended Rust Crates

| Crate | Purpose |
|-------|---------|
| `sysinfo` | CPU, memory, disk, processes |
| `reqwest` | HTTP client (async) |
| `tokio` | Async runtime |
| `serde` / `serde_json` | JSON serialization |
| `clap` | CLI argument parsing |
| `toml` | Config file parsing |
| `tracing` | Logging |

---

## Configuration File

```toml
# /etc/nubilus/agent.toml

[server]
api_url = "https://nubilus.example.com/api"
api_key = "nub_your_key_here"

[agent]
name = "web-server-01"
metrics_interval_seconds = 30
heartbeat_interval_seconds = 30

[features]
collect_processes = true
http_health_checks = false
```

---

## Agent Flow

```
┌─────────────────────────────────────────────────┐
│                   STARTUP                        │
├─────────────────────────────────────────────────┤
│ 1. Load config from /etc/nubilus/agent.toml     │
│ 2. Call POST /ingest/register                   │
│ 3. Start metric collection loop                 │
│ 4. Start heartbeat loop                         │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│              MAIN LOOP (parallel)               │
├─────────────────────────────────────────────────┤
│ Every 30s: POST /ingest/metrics                 │
│ Every 30s: POST /ingest/heartbeat               │
│ On error: Retry with exponential backoff        │
└─────────────────────────────────────────────────┘
```

---

## Error Handling

| HTTP Status | Action |
|-------------|--------|
| 200/201 | Success |
| 401 | API key invalid - stop agent, log error |
| 404 | Server not registered - call /register again |
| 429 | Rate limited - back off |
| 5xx | Server error - retry with backoff |

---

## Installation Script (Future)

```bash
# Install
curl -sSL https://nubilus.example.com/install.sh | bash

# Configure
nubilus-agent configure --api-key "nub_xxx"

# Start as service
sudo systemctl enable nubilus-agent
sudo systemctl start nubilus-agent
```

---

## Project Structure

```
nubilus-agent/
├── Cargo.toml
├── src/
│   ├── main.rs
│   ├── config.rs        # Config loading
│   ├── api.rs           # HTTP client
│   ├── collectors/
│   │   ├── mod.rs
│   │   ├── cpu.rs
│   │   ├── memory.rs
│   │   ├── disk.rs
│   │   └── network.rs
│   └── models.rs        # Request/response types
└── agent.example.toml
```
