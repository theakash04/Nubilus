# Nubilus

**Open-source infrastructure monitoring platform** - Monitor your servers, endpoints, and databases in real-time.

## Overview

Nubilus is a self-hosted monitoring solution that helps you track the health and performance of your infrastructure. It consists of:

- **Dashboard** - React-based web interface for visualization
- **Backend API** - Node.js/Express REST API with PostgreSQL
- **Agent** - Lightweight Rust binary for collecting server metrics

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Your Servers  │     │  Nubilus API    │     │   Dashboard     │
│                 │     │                 │     │                 │
│  ┌───────────┐  │     │  ┌───────────┐  │     │  ┌───────────┐  │
│  │  Agent    │──┼────►│  │  Backend  │──┼────►│  │  Frontend │  │
│  │  (Rust)   │  │     │  │  (Node)   │  │     │  │  (React)  │  │
│  └───────────┘  │     │  └───────────┘  │     │  └───────────┘  │
│                 │     │        │        │     │                 │
└─────────────────┘     │        ▼        │     └─────────────────┘
                        │   PostgreSQL    │
                        └─────────────────┘
```

## Quick Start

### 1. Deploy the Backend

```bash
cd backend
npm install
cp .env.example .env  # Configure your database
npm run dev
```

### 2. Deploy the Dashboard

```bash
cd frontend
npm install
npm run dev
```

### 3. Install the Agent on Your Servers

```bash
curl -sSL https://github.com/theakash04/Nubilus/releases/latest/download/install.sh | sudo bash
nubilus-agent configure --api-key "nub_your_key_here"
sudo systemctl enable --now nubilus-agent
```

## Features

### Server Monitoring
- CPU, memory, disk, and network metrics
- Real-time status and heartbeat tracking
- Historical data and trends

### Endpoint Monitoring
- HTTP/HTTPS health checks
- Response time tracking
- Uptime percentage

### Alerts
- Threshold-based alerting
- Webhook notifications
- Email alerts (coming soon)

## Project Structure

```
Nubilus/
├── agent/          # Rust monitoring agent
├── backend/        # Node.js API server
├── frontend/       # React dashboard
└── docker-compose.yml
```

## Tech Stack

| Component | Technology                            |
|-----------|---------------------------------------|
| Agent     | Rust, tokio, sysinfo                  |
| Backend   | Node.js, Express, TypeScript          |
| Frontend  | React, TypeScript, Vite               |
| Database  | PostgreSQL (timescaleDb)              |
| Auth      | JWT, bcrypt                           |

## Documentation

- [Agent Documentation](./agent/README.md)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - See [LICENSE](./LICENSE) for details.
