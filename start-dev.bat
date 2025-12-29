@echo off
REM ===================================================================
REM GHGConnect Development Server Startup Script
REM ===================================================================
REM This script ensures the application runs in development mode with
REM proper frontend-backend communication through Vite middleware
REM ===================================================================

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║     GHGConnect Development Server                              ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Switch to development environment
call switch-env.bat dev

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed
    echo.
)

REM Kill any existing processes on port 5000
echo [INFO] Checking for existing processes on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    echo [INFO] Stopping process %%a on port 5000...
    taskkill /F /PID %%a >nul 2>&1
)
echo [SUCCESS] Port 5000 is now available
echo.

REM Set environment to development
set NODE_ENV=development

echo [INFO] Starting server in DEVELOPMENT mode...
echo [INFO] The server will handle both API and frontend
echo [INFO] Vite middleware will be used for hot-reloading
echo [INFO] Server will be available at: http://localhost:5000
echo.
echo ========================================
echo   Press Ctrl+C to stop the server
echo ========================================
echo.

REM Start the development server
npm run dev



