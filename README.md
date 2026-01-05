# Nubilus

**Open-source infrastructure monitoring platform** — Monitor your servers in real-time.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Docs](https://img.shields.io/badge/Docs-nubilus--docs.akashtwt.me-green)](https://nubilus-docs.akashtwt.me)

## Overview

Nubilus is a self-hosted monitoring solution that helps you track the health and performance of your infrastructure.

- **Dashboard** — React-based web interface
- **Backend API** — Node.js/Express with PostgreSQL
- **Agent** — Lightweight Rust binary for collecting metrics

## Quick Start

```bash
# Clone the repo
git clone https://github.com/theakash04/Nubilus.git
cd Nubilus

# Start with Docker
docker-compose up -d
```

For detailed setup instructions, visit the **[Documentation](https://nubilus-docs.akashtwt.me)**

## Tech Stack

| Component | Technology                   |
| --------- | ---------------------------- |
| Agent     | Rust                         |
| Backend   | Node.js, Express, TypeScript |
| Frontend  | React, TypeScript, Vite      |
| Database  | PostgreSQL                   |

## Project Structure

```
Nubilus/
├── agent/       # Rust monitoring agent
├── backend/     # Node.js API server
├── frontend/    # React dashboard
└── docker-compose.yml
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](./LICENSE)
