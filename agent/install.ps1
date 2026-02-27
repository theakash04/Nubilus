# Nubilus Agent Installer for Windows
# Usage: irm https://github.com/theakash04/Nubilus/releases/latest/download/install.ps1 | iex
#
# This script:
# 1. Detects your architecture
# 2. Downloads the correct binary
# 3. Installs it to C:\Program Files\nubilus
# 4. Creates the config directory
# 5. Optionally registers as a Windows Service
#

#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

# ==================== Configuration ====================
$RELEASE_BASE_URL = "https://github.com/theakash04/Nubilus/releases/latest/download"
$INSTALL_DIR = "C:\Program Files\nubilus"
$CONFIG_DIR = "C:\ProgramData\nubilus"
$BINARY_NAME = "nubilus-agent"

# ==================== Helper Functions ====================
function Write-Info { param([string]$Message) Write-Host "[INFO] " -ForegroundColor Blue -NoNewline; Write-Host $Message }
function Write-Ok { param([string]$Message) Write-Host "[OK]   " -ForegroundColor Green -NoNewline; Write-Host $Message }
function Write-Warn { param([string]$Message) Write-Host "[WARN] " -ForegroundColor Yellow -NoNewline; Write-Host $Message }
function Write-Err { param([string]$Message) Write-Host "[ERROR] " -ForegroundColor Red -NoNewline; Write-Host $Message; exit 1 }

# ==================== Arch Detection ====================
function Get-AgentArch {
    $arch = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture
    switch ($arch) {
        "X64"   { return "amd64" }
        "Arm64" { return "arm64" }
        default { Write-Err "Unsupported architecture: $arch" }
    }
}

# ==================== Main Installation ====================
function Main {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "       Nubilus Agent Installer" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    # Check for admin privileges
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Err "This script must be run as Administrator. Right-click PowerShell and select 'Run as Administrator'."
    }

    # Detect architecture
    $ARCH = Get-AgentArch
    Write-Info "Detected platform: windows-$ARCH"

    $BINARY_FILE = "$BINARY_NAME-windows-$ARCH.exe"
    $DOWNLOAD_URL = "$RELEASE_BASE_URL/$BINARY_FILE"

    # Create directories
    Write-Info "Creating directories..."
    New-Item -ItemType Directory -Force -Path $INSTALL_DIR | Out-Null
    New-Item -ItemType Directory -Force -Path $CONFIG_DIR | Out-Null
    Write-Ok "Directories created"

    # Download binary
    Write-Info "Downloading $BINARY_FILE..."
    $DEST_PATH = Join-Path $INSTALL_DIR "$BINARY_NAME.exe"
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $DOWNLOAD_URL -OutFile $DEST_PATH -UseBasicParsing
        Write-Ok "Downloaded successfully"
    } catch {
        Write-Err "Failed to download binary from $DOWNLOAD_URL`n$($_.Exception.Message)"
    }

    # Create example config if it doesn't exist
    $CONFIG_FILE = Join-Path $CONFIG_DIR "agent.toml"
    if (-not (Test-Path $CONFIG_FILE)) {
        Write-Info "Creating example configuration..."
        @"
# Nubilus Agent Configuration
# Edit this file with your settings

[server]
# URL of your Nubilus backend API
api_url = "https://api.nubilus.io"
# Your organization's API key (get this from the dashboard)
api_key = "nub_YOUR_API_KEY_HERE"

[agent]
# Friendly name for this server (shown in dashboard)
name = "$($env:COMPUTERNAME)"
# How often to collect and send metrics (seconds)
metrics_interval_seconds = 30
# How often to send heartbeat (seconds)
heartbeat_interval_seconds = 30

[features]
# Include top process information
collect_processes = true
# Enable HTTP endpoint health checks
http_health_checks = false
"@ | Out-File -FilePath $CONFIG_FILE -Encoding UTF8
        Write-Ok "Example config created at $CONFIG_FILE"
    } else {
        Write-Warn "Config file already exists, skipping..."
    }

    # Add to PATH if not already there
    $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    if ($machinePath -notlike "*$INSTALL_DIR*") {
        Write-Info "Adding $INSTALL_DIR to system PATH..."
        [Environment]::SetEnvironmentVariable("Path", "$machinePath;$INSTALL_DIR", "Machine")
        Write-Ok "Added to PATH (restart terminal to take effect)"
    }

    # Register as Windows Service using sc.exe
    Write-Info "Registering Windows service..."
    $svcExists = sc.exe query "nubilus-agent" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Warn "Service already exists, stopping and removing..."
        sc.exe stop "nubilus-agent" 2>&1 | Out-Null
        Start-Sleep -Seconds 2
        sc.exe delete "nubilus-agent" 2>&1 | Out-Null
        Start-Sleep -Seconds 1
    }

    sc.exe create "nubilus-agent" `
        binPath= "`"$DEST_PATH`" run" `
        start= auto `
        DisplayName= "Nubilus Monitoring Agent" 2>&1 | Out-Null

    sc.exe description "nubilus-agent" "Lightweight server monitoring agent for the Nubilus platform" 2>&1 | Out-Null
    sc.exe failure "nubilus-agent" reset= 86400 actions= restart/10000/restart/30000/restart/60000 2>&1 | Out-Null

    Write-Ok "Windows service registered"

    # Verify installation
    Write-Info "Verifying installation..."
    try {
        $version = & $DEST_PATH --version 2>&1
        Write-Ok "Installed: $version"
    } catch {
        Write-Warn "Could not verify version (binary may require restart)"
    }

    # Print next steps
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "     Installation Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host ""
    Write-Host "  1. Edit the configuration file:" -ForegroundColor White
    Write-Host "     notepad $CONFIG_FILE" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  2. Set your API key (get it from your Nubilus dashboard)" -ForegroundColor White
    Write-Host ""
    Write-Host "  3. Start the agent:" -ForegroundColor White
    Write-Host "     sc.exe start nubilus-agent" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Or run manually:" -ForegroundColor White
    Write-Host "     nubilus-agent.exe run" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  4. Check service status:" -ForegroundColor White
    Write-Host "     sc.exe query nubilus-agent" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For help: nubilus-agent.exe --help" -ForegroundColor Yellow
    Write-Host ""
}

# Run main function
Main
