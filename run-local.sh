#!/bin/bash
# ===================================================================
# GHGConnect Local Development Startup Script (Linux/macOS)
# ===================================================================

set -e  # Exit on error

echo ""
echo "======================================================================"
echo " Starting GHGConnect Maritime Compliance System"
echo "======================================================================"
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed!"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

# Show Node version
echo "✓ Checking Node.js version..."
node --version
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json not found!"
    echo "Please run this script from the GHGConnect directory."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ ERROR: Failed to install dependencies!"
        exit 1
    fi
    echo ""
fi

# Check if .env exists, if not create from template
if [ ! -f ".env" ]; then
    echo "⚙️  .env file not found. Creating from template..."
    if [ -f "env.development.template" ]; then
        cp env.development.template .env
        echo "✓ Created .env from env.development.template"
        echo ""
        echo "ℹ️  NOTE: Application will run in MEMORY-ONLY mode."
        echo "         To use PostgreSQL, edit .env and set DATABASE_URL"
        echo ""
    else
        echo "⚠️  WARNING: env.development.template not found!"
        echo "   Application will run in memory-only mode."
        echo ""
    fi
fi

# Display configuration
echo "======================================================================"
echo " Configuration"
echo "======================================================================"
echo " Mode: Development (Memory-only if DATABASE_URL not set)"
echo " Port: 5000"
echo " URL:  http://localhost:5000"
echo "======================================================================"
echo ""

# Start the server
echo "🚀 Starting development server..."
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev

if [ $? -ne 0 ]; then
    echo ""
    echo "======================================================================"
    echo " ❌ Server stopped with error"
    echo "======================================================================"
    exit 1
fi

