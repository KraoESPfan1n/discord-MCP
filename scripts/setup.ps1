# Discord MCP Server Setup Script (Windows PowerShell)
# This script helps set up the Discord MCP server with proper permissions and environment

Write-Host "🚀 Discord MCP Server Setup" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check Node.js version
$versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($versionNumber -lt 18) {
    Write-Host "❌ Node.js version 18+ is required. Current version: $nodeVersion" -ForegroundColor Red
    exit 1
}

# Check if PM2 is installed
try {
    $pm2Version = pm2 -v
    Write-Host "✅ PM2 $pm2Version detected" -ForegroundColor Green
} catch {
    Write-Host "⚠️  PM2 is not installed. Installing globally..." -ForegroundColor Yellow
    npm install -g pm2
    Write-Host "✅ PM2 installed successfully" -ForegroundColor Green
}

# Create necessary directories
Write-Host "📁 Creating directories..." -ForegroundColor Blue
New-Item -ItemType Directory -Force -Path "logs" | Out-Null
New-Item -ItemType Directory -Force -Path "data" | Out-Null
New-Item -ItemType Directory -Force -Path "dist" | Out-Null
Write-Host "✅ Directories created" -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Blue
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created from template" -ForegroundColor Green
    Write-Host "⚠️  Please edit .env file with your Discord bot configuration" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
npm install
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Build the project
Write-Host "🔨 Building project..." -ForegroundColor Blue
npm run build
Write-Host "✅ Project built successfully" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file with your Discord bot token and configuration"
Write-Host "2. Run 'npm run dev' for development or 'npm run pm2:start' for production"
Write-Host "3. Check logs with 'npm run pm2:logs' if using PM2"
Write-Host ""
Write-Host "For more information, see README.md" -ForegroundColor Cyan
