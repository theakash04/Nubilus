#!/bin/bash
#
# Nubilus Agent Installer
# Usage: curl -sSL https://your-nubilus-server.com/install.sh | bash
#
# This script:
# 1. Detects your OS and architecture
# 2. Downloads the correct binary
# 3. Installs it to /usr/local/bin
# 4. Creates the config directory
# 5. Sets up systemd service (Linux only)
#

set -e

# ==================== Configuration ====================
# GitHub releases URL - binaries are downloaded from here
RELEASE_BASE_URL="https://github.com/theakash04/Nubilus/releases/latest/download"
INSTALL_DIR="/usr/local/bin"
CONFIG_DIR="/etc/nubilus"
BINARY_NAME="nubilus-agent"

# ==================== Colors ====================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==================== Helper Functions ====================
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# ==================== OS/Arch Detection ====================
detect_os() {
    OS="$(uname -s)"
    case "$OS" in
        Linux*)     echo "linux" ;;
        Darwin*)    echo "darwin" ;;
        MINGW*|MSYS*|CYGWIN*)  echo "windows" ;;
        *)          error "Unsupported operating system: $OS" ;;
    esac
}

detect_arch() {
    ARCH="$(uname -m)"
    case "$ARCH" in
        x86_64|amd64)   echo "amd64" ;;
        aarch64|arm64)  echo "arm64" ;;
        armv7l)         echo "armv7" ;;
        *)              error "Unsupported architecture: $ARCH" ;;
    esac
}

# ==================== Main Installation ====================
main() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║           Nubilus Agent Installer                     ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo ""

    # Check for root/sudo
    if [ "$EUID" -ne 0 ]; then
        warn "Not running as root. You may be prompted for sudo password."
        SUDO="sudo"
    else
        SUDO=""
    fi

    # Detect platform
    OS=$(detect_os)
    ARCH=$(detect_arch)
    info "Detected platform: ${OS}-${ARCH}"

    # Determine binary name
    if [ "$OS" = "windows" ]; then
        BINARY_FILE="${BINARY_NAME}-${OS}-${ARCH}.exe"
    else
        BINARY_FILE="${BINARY_NAME}-${OS}-${ARCH}"
    fi

    DOWNLOAD_URL="${RELEASE_BASE_URL}/${BINARY_FILE}"
    
    # Create temp directory
    TMP_DIR=$(mktemp -d)
    trap "rm -rf $TMP_DIR" EXIT

    # Download binary
    info "Downloading ${BINARY_FILE}..."
    if command -v curl &> /dev/null; then
        curl -fsSL "$DOWNLOAD_URL" -o "$TMP_DIR/$BINARY_NAME" || error "Failed to download binary from $DOWNLOAD_URL"
    elif command -v wget &> /dev/null; then
        wget -q "$DOWNLOAD_URL" -O "$TMP_DIR/$BINARY_NAME" || error "Failed to download binary from $DOWNLOAD_URL"
    else
        error "Neither curl nor wget found. Please install one of them."
    fi
    success "Downloaded successfully"

    # Make executable
    chmod +x "$TMP_DIR/$BINARY_NAME"

    # Install binary
    info "Installing to ${INSTALL_DIR}/${BINARY_NAME}..."
    $SUDO mkdir -p "$INSTALL_DIR"
    $SUDO mv "$TMP_DIR/$BINARY_NAME" "$INSTALL_DIR/$BINARY_NAME"
    success "Binary installed"

    # Create config directory
    info "Creating config directory at ${CONFIG_DIR}..."
    $SUDO mkdir -p "$CONFIG_DIR"
    success "Config directory created"

    # Create example config if it doesn't exist
    if [ ! -f "$CONFIG_DIR/agent.toml" ]; then
        info "Creating example configuration..."
        $SUDO tee "$CONFIG_DIR/agent.toml" > /dev/null << 'EOF'
# Nubilus Agent Configuration
# Edit this file with your settings

[server]
# URL of your Nubilus backend API
api_url = "https://api.nubilus.io"
# Your organization's API key (get this from the dashboard)
api_key = "nub_YOUR_API_KEY_HERE"

[agent]
# Friendly name for this server (shown in dashboard)
name = "my-server"
# How often to collect and send metrics (seconds)
metrics_interval_seconds = 30
# How often to send heartbeat (seconds)
heartbeat_interval_seconds = 30

[features]
# Include top process information
collect_processes = true
# Enable HTTP endpoint health checks
http_health_checks = false
EOF
        success "Example config created at ${CONFIG_DIR}/agent.toml"
    else
        warn "Config file already exists, skipping..."
    fi

    # Set up systemd service (Linux only)
    if [ "$OS" = "linux" ] && command -v systemctl &> /dev/null; then
        info "Setting up systemd service..."
        $SUDO tee /etc/systemd/system/nubilus-agent.service > /dev/null << EOF
[Unit]
Description=Nubilus Monitoring Agent
Documentation=https://github.com/theakash04/Nubilus
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=${INSTALL_DIR}/${BINARY_NAME} run
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadOnlyPaths=/
ReadWritePaths=${CONFIG_DIR}

[Install]
WantedBy=multi-user.target
EOF
        $SUDO systemctl daemon-reload
        success "Systemd service installed"
    fi

    # Verify installation
    info "Verifying installation..."
    if "$INSTALL_DIR/$BINARY_NAME" --version &> /dev/null; then
        VERSION=$("$INSTALL_DIR/$BINARY_NAME" --version 2>&1 | head -n1)
        success "Installed: $VERSION"
    else
        error "Installation verification failed"
    fi

    # Print next steps
    echo ""
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║           Installation Complete! 🎉                   ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo ""
    echo "Next steps:"
    echo ""
    echo "  1. Edit the configuration file:"
    echo "     ${YELLOW}sudo nano ${CONFIG_DIR}/agent.toml${NC}"
    echo ""
    echo "  2. Set your API key (get it from your Nubilus dashboard)"
    echo ""
    echo "  3. Start the agent:"
    if [ "$OS" = "linux" ] && command -v systemctl &> /dev/null; then
        echo "     ${YELLOW}sudo systemctl enable --now nubilus-agent${NC}"
        echo ""
        echo "  Or run manually:"
        echo "     ${YELLOW}nubilus-agent run${NC}"
    else
        echo "     ${YELLOW}nubilus-agent run${NC}"
    fi
    echo ""
    echo "  4. Check logs (Linux with systemd):"
    echo "     ${YELLOW}journalctl -u nubilus-agent -f${NC}"
    echo ""
    echo "For help: ${YELLOW}nubilus-agent --help${NC}"
    echo ""
}

# Run main function
main "$@"
