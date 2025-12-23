# Nubilus Agent

A lightweight server monitoring agent written in Rust that reports system metrics to the Nubilus platform.

## Features

- **System Metrics**: CPU, memory, disk, and network statistics
- **Lightweight**: ~5MB static binary with minimal resource usage
- **Cross-Platform**: Linux (x86_64, ARM64) and macOS
- **Self-Updating**: Built-in update command
- **Secure**: TLS communication with API key authentication

## Installation

### One-Line Install (Linux/macOS)

```bash
curl -sSL https://github.com/theakash04/Nubilus/releases/latest/download/install.sh | sudo bash
```

### Manual Install

```bash
# Download binary (Linux x86_64 example)
curl -sSL https://github.com/theakash04/Nubilus/releases/latest/download/nubilus-agent-linux-amd64 \
  -o /usr/local/bin/nubilus-agent

chmod +x /usr/local/bin/nubilus-agent
```

### Configure

```bash
# Set your API key (get it from the Nubilus dashboard)
nubilus-agent configure --api-key "nub_your_key_here"

# Or manually edit /etc/nubilus/agent.toml
```

### Start as Service

```bash
sudo systemctl enable --now nubilus-agent
```

## Commands

| Command                   | Description                 |
| ------------------------- | --------------------------- |
| `nubilus-agent run`       | Run the agent (default)     |
| `nubilus-agent metrics`   | Show current system metrics |
| `nubilus-agent test`      | Test connection to backend  |
| `nubilus-agent update`    | Update to latest version    |
| `nubilus-agent uninstall` | Uninstall the agent         |
| `nubilus-agent configure` | Configure the agent         |
| `nubilus-agent init`      | Generate config template    |

## Update Agent

```bash
# Self-update to latest version
sudo nubilus-agent update

# Restart the service
sudo systemctl restart nubilus-agent
```

## Configuration

Config file: `/etc/nubilus/agent.toml`

```toml
[server]
api_url = "https://nubilus.akashtwt.me/api"
api_key = "nub_your_api_key_here"

[agent]
name = "my-server"
metrics_interval_seconds = 30
heartbeat_interval_seconds = 30
```

## Metrics Collected

| Category    | Metrics                            |
| ----------- | ---------------------------------- |
| **CPU**     | Usage %, core count, load averages |
| **Memory**  | Usage %, total/used/available      |
| **Disk**    | Usage %, space, read/write bytes   |
| **Network** | Bytes received/transmitted         |

## Development

```bash
# Build from source
cd agent
cargo build --release

# Run tests
cargo test

# The binary is at target/release/nubilus-agent
```

## License

MIT License
