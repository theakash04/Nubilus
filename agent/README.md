# Nubilus Agent

A lightweight server monitoring agent written in Rust that reports system metrics to the Nubilus platform.

## Features

- **System Metrics**: CPU, memory, disk, and network statistics
- **Lightweight**: ~5MB static binary with minimal resource usage
- **Cross-Platform**: Linux (x86_64, ARM64), macOS, and Windows
- **Self-Updating**: Built-in update command
- **Secure**: TLS communication with API key authentication

## Installation

### Linux / macOS

```bash
curl -sSL https://github.com/theakash04/Nubilus/releases/latest/download/install.sh | sudo bash
```

### Windows (PowerShell as Administrator)

```powershell
# Download the installer script
curl.exe -L -o install.ps1 https://github.com/theakash04/Nubilus/releases/latest/download/install.ps1

# Run the installer
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

This will:

1. Download the correct binary to `C:\Program Files\nubilus\`
2. Create a config at `C:\ProgramData\nubilus\agent.toml`
3. Add the install directory to your system PATH

After installing, register and start the Windows service:

```powershell
# Register the service (use 'service' argument, not 'run')
sc.exe create nubilus-agent binPath= "\"C:\Program Files\nubilus\nubilus-agent.exe\" service" start= auto

# Start the service
sc.exe start nubilus-agent
```

### Manual Install

#### Linux / macOS

```bash
# Download binary (Linux x86_64 example)
curl -sSL https://github.com/theakash04/Nubilus/releases/latest/download/nubilus-agent-linux-amd64 \
  -o /usr/local/bin/nubilus-agent

chmod +x /usr/local/bin/nubilus-agent
```

#### Windows

Download `nubilus-agent-windows-amd64.exe` from the [latest release](https://github.com/theakash04/Nubilus/releases/latest) and place it in your desired directory (e.g. `C:\Program Files\nubilus\`).

### Configure

```bash
# Set your API key (get it from the Nubilus dashboard)
nubilus-agent configure --api-key "nub_your_key_here"

# Or manually edit the config file:
#   Linux/macOS: /etc/nubilus/agent.toml
#   Windows:     C:\ProgramData\nubilus\agent.toml
```

### Start as Service

#### Linux (systemd)

```bash
sudo systemctl enable --now nubilus-agent
```

#### Windows

```powershell
# If installed via install.ps1, the service is already registered
sc.exe start nubilus-agent

# To check status
sc.exe query nubilus-agent
```

> **Note**: The installer registers the agent with `nubilus-agent service` which
> implements the Windows Service Control Manager (SCM) protocol. For manual/console
> use, run `nubilus-agent run` instead.

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

### Linux / macOS

```bash
sudo nubilus-agent update
```

### Windows (Administrator)

```powershell
nubilus-agent.exe update
```

The agent will automatically restart the service after updating.

## Configuration

| Platform      | Config File Path                    |
| ------------- | ----------------------------------- |
| Linux / macOS | `/etc/nubilus/agent.toml`           |
| Windows       | `C:\ProgramData\nubilus\agent.toml` |

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

| Category    | Linux                                | macOS          | Windows             |
| ----------- | ------------------------------------ | -------------- | ------------------- |
| **CPU**     | Usage %, core count, load averages   | Same           | Usage %, core count |
| **Memory**  | Usage %, total/used/available        | Same           | Same                |
| **Disk**    | Usage %, space, read/write I/O bytes | Usage %, space | Usage %, space      |
| **Network** | Bytes received/transmitted           | Same           | Same                |

> **Note**: Load averages and disk I/O bytes are Linux-specific. On macOS and Windows, these fields will be `null` / `0`.

## Development

```bash
# Build from source
cd agent
cargo build --release

# Run tests
cargo test

# The binary is at target/release/nubilus-agent
# On Windows: target\release\nubilus-agent.exe
```

## License

MIT License
