@echo off
REM GHGConnect Setup and Run Script
REM This script will install dependencies, seed data, and start the server

echo ============================================================
echo   GHGConnect - Maritime Compliance Management System
echo ============================================================
echo.

echo [1/4] Checking Node.js installation...
node --version
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo.

echo [2/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)
echo.

echo [3/4] Seeding database with synthetic data...
call npm run db:seed
if errorlevel 1 (
    echo ERROR: Failed to seed database!
    pause
    exit /b 1
)
echo.

echo ============================================================
echo   Database seeded successfully!
echo ============================================================
echo.
echo   Login Credentials:
echo   - Admin: admin@ghgconnect.com / admin123
echo   - Compliance: compliance@ghgconnect.com / admin123
echo.
echo   Data Created:
echo   - 30+ Ports (EU, UK, and International)
echo   - 16 Fuel Types
echo   - 5 Vessels
echo   - 25 Voyages
echo   - 100 Consumption Records
echo.
echo ============================================================
echo.

echo [4/4] Starting development server...
echo.
echo   Server will be available at: http://localhost:5000
echo.
echo   Press Ctrl+C to stop the server
echo.
call npm run dev

