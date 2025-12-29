#!/bin/bash
###################################################################
# GHGConnect Development Server Startup Script
###################################################################
# This script ensures the application runs in development mode with
# proper frontend-backend communication through Vite middleware
###################################################################

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     GHGConnect Development Server                              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Switch to development environment
./switch-env.sh dev

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install dependencies"
        exit 1
    fi
    echo "[SUCCESS] Dependencies installed"
    echo ""
fi

# Kill any existing processes on port 5000
echo "[INFO] Checking for existing processes on port 5000..."
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
echo "[SUCCESS] Port 5000 is now available"
echo ""

# Set environment to development
export NODE_ENV=development

echo "[INFO] Starting server in DEVELOPMENT mode..."
echo "[INFO] The server will handle both API and frontend"
echo "[INFO] Vite middleware will be used for hot-reloading"
echo "[INFO] Server will be available at: http://localhost:5000"
echo ""
echo "========================================"
echo "   Press Ctrl+C to stop the server"
echo "========================================"
echo ""

# Start the development server
npm run dev



