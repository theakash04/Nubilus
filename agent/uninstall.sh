#!/bin/bash
#
# Nubilus Agent Uninstaller
# Usage: curl -sSL https://github.com/theakash04/Nubilus/releases/latest/download/uninstall.sh | sudo bash
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Check root
if [ "$EUID" -ne 0 ]; then
    error "Please run as root: sudo bash uninstall.sh"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║         Nubilus Agent Uninstaller                     ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Stop service
info "Stopping nubilus-agent service..."
systemctl stop nubilus-agent 2>/dev/null || true
systemctl disable nubilus-agent 2>/dev/null || true

# Remove service file
if [ -f /etc/systemd/system/nubilus-agent.service ]; then
    info "Removing systemd service..."
    rm -f /etc/systemd/system/nubilus-agent.service
    systemctl daemon-reload
fi

# Remove binary
if [ -f /usr/local/bin/nubilus-agent ]; then
    info "Removing binary..."
    rm -f /usr/local/bin/nubilus-agent
    rm -f /usr/local/bin/nubilus-agent.old 2>/dev/null || true
fi

# Ask about config
read -p "Remove configuration files? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -d /etc/nubilus ]; then
        info "Removing configuration..."
        rm -rf /etc/nubilus
    fi
else
    warn "Configuration preserved at /etc/nubilus"
fi

echo ""
info "✓ Nubilus Agent has been uninstalled!"
echo ""
echo "To reinstall, run:"
echo "  curl -sSL https://github.com/theakash04/Nubilus/releases/latest/download/install.sh | sudo bash"
echo ""
