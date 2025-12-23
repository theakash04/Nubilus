# Nubilus Agent

A lightweight server monitoring agent written in Rust that reports system metrics to the Nubilus platform.

## Features

- **System Metrics Collection**: CPU, memory, disk, and network statistics
- **Lightweight**: ~5MB binary, minimal resource usage
- **Cross-Platform**: Runs on Linux, macOS, and Windows
- **No Dependencies**: Single statically-linked binary
- **Configurable Intervals**: Customize metrics and heartbeat frequency
- **Secure**: TLS communication with API key authentication
- **Resilient**: Automatic retry with exponential backoff on failures

## Quick Start

### For End Users (Pre-compiled Binary)

```bash
# Download and install
curl -sSL https://your-nubilus-server.com/install.sh | bash

# Configure with your API key
nubilus-agent configure --api-key "nub_your_key_here"

# Start as a service
sudo systemctl enable --now nubilus-agent
```

### For Developers (Build from Source)

```bash
# Clone the repository
cd agent

# Build release binary
cargo build --release

# The binary is at target/release/nubilus-agent
```

## Usage

```
nubilus-agent [OPTIONS] [COMMAND]

Commands:
  run        Run the agent (default)
  init       Generate a configuration file template
  configure  Configure the agent interactively
  test       Test the connection to the Nubilus backend
  metrics    Show current system metrics (one-shot)
  help       Print this message or the help of the given subcommand(s)

Options:
  -c, --config <CONFIG>  Path to configuration file [default: /etc/nubilus/agent.toml]
  -v, --verbose          Enable verbose logging
  -h, --help             Print help
  -V, --version          Print version
```

### Generate Config Template

```bash
nubilus-agent init --output agent.toml
```

### Test Connection

```bash
nubilus-agent test --config agent.toml
```

### Show System Metrics

```bash
nubilus-agent metrics
```

Example output:
```
=== System Metrics ===

CPU:
  Usage:    44.4%
  Cores:    4
  Load Avg: 1.58 / 2.56 / 1.92

Memory:
  Usage:     40.9%
  Total:     15.37 GB
  Used:      6.29 GB
  Available: 9.07 GB

Disk:
  Usage: 66.4%
  Total: 334.19 GB
  Used:  222.05 GB

Network:
  Received:    120.87 MB
  Transmitted: 36.99 MB
```

## Configuration

Configuration is stored in TOML format at `/etc/nubilus/agent.toml`:

```toml
[server]
api_url = "https://api.nubilus.io"
api_key = "nub_your_api_key_here"

[agent]
name = "web-server-01"
metrics_interval_seconds = 30
heartbeat_interval_seconds = 30

[features]
collect_processes = true
http_health_checks = false
```

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `server.api_url` | Nubilus backend URL | Required |
| `server.api_key` | Organization API key (starts with `nub_`) | Required |
| `agent.name` | Display name for this server | Required |
| `agent.metrics_interval_seconds` | Metrics collection interval | 30 |
| `agent.heartbeat_interval_seconds` | Heartbeat interval | 30 |
| `features.collect_processes` | Include process information | true |
| `features.http_health_checks` | Enable endpoint health checks | false |

## Systemd Service

Create `/etc/systemd/system/nubilus-agent.service`:

```ini
[Unit]
Description=Nubilus Monitoring Agent
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/nubilus-agent run
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable nubilus-agent
sudo systemctl start nubilus-agent
```

## Metrics Collected

| Category | Metric | Description |
|----------|--------|-------------|
| **CPU** | `cpu_usage` | Overall CPU usage % |
| | `cpu_count` | Number of CPU cores |
| | `load_average_*` | 1/5/15 min load averages |
| **Memory** | `memory_usage` | Memory usage % |
| | `memory_total/used/available` | RAM in bytes |
| **Disk** | `disk_usage` | Disk usage % |
| | `disk_total/used` | Disk space in bytes |
| | `disk_read/write_bytes` | I/O counters |
| **Network** | `network_in/out` | Bytes transferred |

## API Endpoints

The agent communicates with these backend endpoints:

| Endpoint | Purpose | Frequency |
|----------|---------|-----------|
| `POST /api/ingest/register` | Register server | On startup |
| `POST /api/ingest/metrics` | Submit metrics | Every 30s (configurable) |
| `POST /api/ingest/heartbeat` | Keep-alive signal | Every 30s (configurable) |

## Error Handling

| HTTP Status | Action |
|-------------|--------|
| 200/201 | Success |
| 401 | Invalid API key - stop agent |
| 404 | Server not registered - re-register |
| 429 | Rate limited - back off |
| 5xx | Server error - retry with exponential backoff |

## Development

### Project Structure

```
agent/
├── Cargo.toml
├── agent.example.toml
├── src/
│   ├── main.rs           # CLI and main loop
│   ├── config.rs         # Configuration loading
│   ├── api.rs            # HTTP client
│   ├── models.rs         # Data structures
│   └── collectors/
│       ├── mod.rs        # Unified collector
│       ├── cpu.rs        # CPU metrics
│       ├── memory.rs     # Memory metrics
│       ├── disk.rs       # Disk metrics
│       └── network.rs    # Network metrics
```

### Building

```bash
# Development build
cargo build

# Release build (optimized, stripped)
cargo build --release

# Run tests
cargo test

# Check for issues
cargo clippy
```

### Cross-Compilation

```bash
# Install cross-compilation tool
cargo install cross

# Build for different targets
cross build --release --target x86_64-unknown-linux-musl
cross build --release --target aarch64-unknown-linux-musl
cross build --release --target x86_64-apple-darwin
```

## License

MIT License - See LICENSE file for details.
