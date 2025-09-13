#!/bin/bash

# Discord MCP Server Setup Script
# This script helps set up the Discord MCP server with proper permissions and environment

set -e

echo "🚀 Discord MCP Server Setup"
echo "=========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  PM2 is not installed. Installing globally..."
    npm install -g pm2
    echo "✅ PM2 installed successfully"
else
    echo "✅ PM2 $(pm2 -v) detected"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p data
mkdir -p dist

# Set proper permissions for logs directory
chmod 755 logs
chmod 755 data

echo "✅ Directories created"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created from template"
    echo "⚠️  Please edit .env file with your Discord bot configuration"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "✅ Dependencies installed"

# Build the project
echo "🔨 Building project..."
npm run build

echo "✅ Project built successfully"

# Set up log rotation (if logrotate is available)
if command -v logrotate &> /dev/null; then
    echo "📋 Setting up log rotation..."
    cat > /tmp/discord-mcp-logrotate << EOF
/path/to/your/discord-MCP/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF
    echo "✅ Log rotation configuration created (manual setup required)"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your Discord bot token and configuration"
echo "2. Run 'npm run dev' for development or 'npm run pm2:start' for production"
echo "3. Check logs with 'npm run pm2:logs' if using PM2"
echo ""
echo "For more information, see README.md"
