#!/bin/bash
#
# Nubilus Agent Installer
# Usage: curl -sSL https://your-nubilus-server.com/install.sh | bash
#
# This script:
# 1. Detects your OS and architecture
# 2. Downloads the correct binary
# 3. Installs it to the appropriate directory
# 4. Creates the config directory
# 5. Sets up a system service (systemd on Linux, sc.exe on Windows)
#
# Supported environments:
# - Linux (bash)
# - macOS (bash/zsh)
# - Windows (Git Bash, MSYS2, Cygwin)
#

set -e

# ==================== Configuration ====================
RELEASE_BASE_URL="https://github.com/theakash04/Nubilus/releases/latest/download"
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
        Linux*)                 echo "linux" ;;
        Darwin*)                echo "darwin" ;;
        MINGW*|MSYS*|CYGWIN*)   echo "windows" ;;
        *)                      error "Unsupported operating system: $OS" ;;
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

# Convert Unix-style path to Windows-native path (for sc.exe, etc.)
to_win_path() {
    echo "$1" | sed 's|^/c/|C:\\|; s|^/C/|C:\\|; s|/|\\|g'
}

# ==================== Main Installation ====================
main() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║           Nubilus Agent Installer                     ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo ""

    # Detect platform
    OS=$(detect_os)
    ARCH=$(detect_arch)
    info "Detected platform: ${OS}-${ARCH}"

    # ── Set platform-specific variables ──
    if [ "$OS" = "windows" ]; then
        INSTALL_DIR="/c/Program Files/nubilus"
        CONFIG_DIR="/c/ProgramData/nubilus"
        BINARY_FILE="${BINARY_NAME}-${OS}-${ARCH}.exe"
        LOCAL_BINARY_NAME="${BINARY_NAME}.exe"
    else
        INSTALL_DIR="/usr/local/bin"
        CONFIG_DIR="/etc/nubilus"
        BINARY_FILE="${BINARY_NAME}-${OS}-${ARCH}"
        LOCAL_BINARY_NAME="${BINARY_NAME}"
    fi

    DOWNLOAD_URL="${RELEASE_BASE_URL}/${BINARY_FILE}"

    # ── Check for admin/root privileges ──
    if [ "$OS" = "windows" ]; then
        # On Git Bash, check if running as Administrator
        if ! net session &> /dev/null; then
            error "This script must be run as Administrator.\n       Right-click Git Bash → 'Run as administrator' and try again."
        fi
        SUDO=""
    else
        if [ "$EUID" -ne 0 ]; then
            warn "Not running as root. You may be prompted for sudo password."
            SUDO="sudo"
        else
            SUDO=""
        fi
    fi

    # Create temp directory
    TMP_DIR=$(mktemp -d)
    trap "rm -rf $TMP_DIR" EXIT

    # Download binary
    info "Downloading ${BINARY_FILE}..."
    if command -v curl &> /dev/null; then
        curl -fsSL "$DOWNLOAD_URL" -o "$TMP_DIR/$LOCAL_BINARY_NAME" || error "Failed to download binary from $DOWNLOAD_URL"
    elif command -v wget &> /dev/null; then
        wget -q "$DOWNLOAD_URL" -O "$TMP_DIR/$LOCAL_BINARY_NAME" || error "Failed to download binary from $DOWNLOAD_URL"
    else
        error "Neither curl nor wget found. Please install one of them."
    fi
    success "Downloaded successfully"

    # Make executable (no-op on Windows, but harmless)
    chmod +x "$TMP_DIR/$LOCAL_BINARY_NAME"

    # Install binary
    info "Installing to ${INSTALL_DIR}/${LOCAL_BINARY_NAME}..."
    $SUDO mkdir -p "$INSTALL_DIR"
    $SUDO mv "$TMP_DIR/$LOCAL_BINARY_NAME" "$INSTALL_DIR/$LOCAL_BINARY_NAME"
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

    # ── Platform-specific service setup ──
    if [ "$OS" = "windows" ]; then
        setup_windows_service
    elif [ "$OS" = "linux" ] && command -v systemctl &> /dev/null; then
        setup_systemd_service
    fi

    # Verify installation
    info "Verifying installation..."
    if "$INSTALL_DIR/$LOCAL_BINARY_NAME" --version &> /dev/null; then
        VERSION=$("$INSTALL_DIR/$LOCAL_BINARY_NAME" --version 2>&1 | head -n1)
        success "Installed: $VERSION"
    else
        error "Installation verification failed"
    fi

    # ── Add to PATH (Windows only) ──
    if [ "$OS" = "windows" ]; then
        WIN_INSTALL_DIR=$(to_win_path "$INSTALL_DIR")
        # Check if already in PATH
        if ! echo "$PATH" | grep -qi "program files/nubilus"; then
            info "Adding to system PATH..."
            powershell.exe -Command "[Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';${WIN_INSTALL_DIR}', 'Machine')" 2>/dev/null || warn "Could not add to PATH automatically. Please add '${WIN_INSTALL_DIR}' to your PATH manually."
            success "Added to system PATH (restart your terminal to use 'nubilus-agent' command)"
        fi
    fi

    # Print next steps
    print_next_steps
}

# ==================== Windows Service Setup ====================
setup_windows_service() {
    info "Setting up Windows Service..."
    WIN_BINARY=$(to_win_path "$INSTALL_DIR/$LOCAL_BINARY_NAME")

    # Stop and delete existing service if present
    sc.exe query nubilus-agent &> /dev/null && {
        info "Stopping existing service..."
        sc.exe stop nubilus-agent &> /dev/null || true
        sleep 2
        sc.exe delete nubilus-agent &> /dev/null || true
        sleep 1
    }

    # Create the service
    sc.exe create nubilus-agent \
        binPath= "\"${WIN_BINARY}\" service" \
        start= auto \
        DisplayName= "Nubilus Monitoring Agent" &> /dev/null \
        || error "Failed to create Windows Service"

    # Set description
    sc.exe description nubilus-agent "Nubilus server monitoring agent - collects and reports system metrics" &> /dev/null || true

    # Configure restart on failure (restart after 10s, 30s, 60s)
    sc.exe failure nubilus-agent reset= 86400 actions= restart/10000/restart/30000/restart/60000 &> /dev/null || true

    success "Windows Service 'nubilus-agent' installed (auto-start, restart on failure)"
}

# ==================== Systemd Service Setup ====================
setup_systemd_service() {
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
}

# ==================== Next Steps ====================
print_next_steps() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║           Installation Complete! 🎉                   ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo ""
    echo "Next steps:"
    echo ""
    echo "  1. Edit the configuration file:"

    if [ "$OS" = "windows" ]; then
        WIN_CONFIG=$(to_win_path "$CONFIG_DIR/agent.toml")
        echo -e "     ${YELLOW}notepad \"${WIN_CONFIG}\"${NC}"
    else
        echo -e "     ${YELLOW}sudo nano ${CONFIG_DIR}/agent.toml${NC}"
    fi

    echo ""
    echo "  2. Set your API key (get it from your Nubilus dashboard)"
    echo ""
    echo "  3. Start the agent:"

    if [ "$OS" = "windows" ]; then
        echo -e "     ${YELLOW}sc.exe start nubilus-agent${NC}"
        echo ""
        echo "  Or run manually:"
        echo -e "     ${YELLOW}nubilus-agent.exe run${NC}"
        echo ""
        echo "  4. Check service status:"
        echo -e "     ${YELLOW}sc.exe query nubilus-agent${NC}"
    elif [ "$OS" = "linux" ] && command -v systemctl &> /dev/null; then
        echo -e "     ${YELLOW}sudo systemctl enable --now nubilus-agent${NC}"
        echo ""
        echo "  Or run manually:"
        echo -e "     ${YELLOW}nubilus-agent run${NC}"
        echo ""
        echo "  4. Check logs:"
        echo -e "     ${YELLOW}journalctl -u nubilus-agent -f${NC}"
    else
        echo -e "     ${YELLOW}nubilus-agent run${NC}"
    fi

    echo ""
    echo -e "For help: ${YELLOW}nubilus-agent --help${NC}"
    echo ""
}

# Run main function
main "$@"

