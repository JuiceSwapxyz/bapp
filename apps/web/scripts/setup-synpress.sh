#!/bin/bash
# Setup Synpress with MetaMask 13 support for E2E wallet tests
# Compatible with Yarn PnP - uses direct imports from built packages

set -e

SYNPRESS_DIR="/tmp/synpress-dev"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Setting up Synpress with MetaMask 13 support (Yarn PnP compatible)..."

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm
fi

# Clone or update Synpress
if [ -d "$SYNPRESS_DIR" ]; then
    echo "Synpress directory exists, updating..."
    cd "$SYNPRESS_DIR"
    git fetch origin
    git checkout patch-1 2>/dev/null || git checkout -b patch-1 origin/patch-1
    git pull origin patch-1
else
    echo "Cloning Synpress with MetaMask 13 support..."
    git clone -b patch-1 https://github.com/louis-md/synpress.git "$SYNPRESS_DIR"
    cd "$SYNPRESS_DIR"
fi

# Install dependencies and build
echo "Installing dependencies..."
pnpm install

echo "Building packages..."
pnpm run build

echo ""
echo "Synpress setup complete!"
echo "Built packages are at: $SYNPRESS_DIR"
echo ""
echo "To run MetaMask wallet tests:"
echo "  WALLET_SEED_PHRASE=\"your seed phrase\" WALLET_PASSWORD=\"your password\" yarn playwright:metamask"
