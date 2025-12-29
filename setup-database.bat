@echo off
REM ===================================================================
REM GHGConnect Database Setup Script
REM ===================================================================
REM This script sets up the PostgreSQL database using Docker Compose
REM ===================================================================

echo.
echo ========================================
echo   GHGConnect Database Setup
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or not in PATH
    echo [INFO] Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    echo [INFO] After installation, restart your terminal and run this script again
    pause
    exit /b 1
)

echo [SUCCESS] Docker is available
echo.

REM Check if Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running
    echo [INFO] Please start Docker Desktop and try again
    pause
    exit /b 1
)

echo [SUCCESS] Docker is running
echo.

REM Stop any existing containers
echo [INFO] Stopping any existing containers...
docker-compose down >nul 2>&1

REM Start the database
echo [INFO] Starting PostgreSQL database...
docker-compose up -d postgres

if errorlevel 1 (
    echo [ERROR] Failed to start PostgreSQL database
    pause
    exit /b 1
)

echo [SUCCESS] PostgreSQL database started
echo.

REM Wait for database to be ready
echo [INFO] Waiting for database to be ready...
timeout /t 10 /nobreak >nul

REM Check if database is accessible
echo [INFO] Testing database connection...
docker exec ghgconnect_db pg_isready -U ghgconnect_user -d ghgconnect_db >nul 2>&1
if errorlevel 1 (
    echo [WARN] Database might not be ready yet, waiting a bit more...
    timeout /t 15 /nobreak >nul
    docker exec ghgconnect_db pg_isready -U ghgconnect_user -d ghgconnect_db >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Database is not responding
        echo [INFO] Check Docker logs with: docker logs ghgconnect_db
        pause
        exit /b 1
    )
)

echo [SUCCESS] Database is ready and accepting connections
echo.

REM Show database status
echo [INFO] Database Status:
docker ps --filter "name=ghgconnect_db" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo [INFO] Database Connection Details:
echo    Host: localhost
echo    Port: 5432
echo    Database: ghgconnect_db
echo    User: ghgconnect_user
echo    Password: ghgconnect_dev_password_2024
echo.

echo ========================================
echo   Database Setup Complete! ✓
echo ========================================
echo.
echo [SUCCESS] PostgreSQL database is running and ready
echo [INFO] You can now start the application with: start-dev.bat
echo [INFO] Or manually with: npm run dev
echo.
echo [OPTIONAL] To access PgAdmin (database management UI):
echo    URL: http://localhost:5050
echo    Email: admin@ghgconnect.local
echo    Password: admin123
echo.
pause




