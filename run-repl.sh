#!/bin/bash
# Script to run the Strands Agent REPL

# Check Node version
NODE_VERSION=$(node --version)
echo "Node version: $NODE_VERSION"

# Check if node version is 20 or higher
NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1 | sed 's/v//')
if [ "$NODE_MAJOR" -lt 20 ]; then
    echo "Error: Node.js 20 or higher is required. Current version: $NODE_VERSION"
    echo "Please install Node.js 20+ and try again."
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "Error: pnpm is not installed. Please install pnpm first:"
    echo "  npm install -g pnpm"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    pnpm install
fi

# Run the REPL
echo "Starting Strands Agent REPL..."
pnpm dev