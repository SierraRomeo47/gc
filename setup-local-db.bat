@echo off
REM ============================================================
REM   GHGConnect - Local Database Setup Script
REM ============================================================
REM   This script sets up PostgreSQL database using Docker
REM ============================================================

echo.
echo ============================================================
echo   GHGConnect - Local Database Setup
echo ============================================================
echo.

REM Check if Docker is running
echo [1/8] Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Docker is not installed or not running!
    echo.
    echo Please install Docker Desktop from:
    echo https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)
echo    ✓ Docker is installed
echo.

REM Check if Node.js is installed
echo [2/8] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo    ✓ Node.js is installed
echo.

REM Copy environment file
echo [3/8] Setting up environment configuration...
if not exist .env (
    if exist .env.local (
        copy .env.local .env >nul
        echo    ✓ Created .env from .env.local
    ) else (
        echo    ✗ WARNING: .env.local not found
    )
) else (
    echo    ✓ .env already exists
)
echo.

REM Start Docker services
echo [4/8] Starting Docker services...
echo    This may take a few minutes on first run...
docker-compose up -d
if errorlevel 1 (
    echo.
    echo ERROR: Failed to start Docker services!
    echo.
    echo Try running: docker-compose up
    echo.
    pause
    exit /b 1
)
echo.

REM Wait for database to be ready
echo [5/8] Waiting for database to be ready...
timeout /t 10 /nobreak >nul
echo    ✓ Database should be ready
echo.

REM Install dependencies
echo [6/8] Installing Node.js dependencies...
call npm install
if errorlevel 1 (
    echo.
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)
echo.

REM Push database schema
echo [7/8] Creating database schema...
call npm run db:push
if errorlevel 1 (
    echo.
    echo ERROR: Failed to create schema!
    echo.
    echo Check if PostgreSQL is running:
    echo    docker-compose ps
    echo.
    pause
    exit /b 1
)
echo.

REM Create indexes
echo [8/8] Creating performance indexes...
docker exec -i ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db < database/migrations/create_indexes.sql
if errorlevel 1 (
    echo    ⚠ WARNING: Some indexes may not have been created
    echo    This is okay if running for the first time
) else (
    echo    ✓ Indexes created
)
echo.

echo ============================================================
echo   Database Setup Complete!
echo ============================================================
echo.
echo   Services Running:
echo   - PostgreSQL: localhost:5432
echo   - Redis:      localhost:6379
echo   - PgAdmin:    http://localhost:5050
echo.
echo   Database Credentials:
echo   - Host:     localhost
echo   - Port:     5432
echo   - Database: ghgconnect_db
echo   - User:     ghgconnect_user
echo   - Password: ghgconnect_dev_password_2024
echo.
echo   PgAdmin Login:
echo   - URL:      http://localhost:5050
echo   - Email:    admin@ghgconnect.local
echo   - Password: admin123
echo.
echo   Next Steps:
echo   1. Seed data:       npm run db:seed
echo   2. Start app:       npm run dev
echo   3. Access app:      http://localhost:5000
echo.
echo ============================================================
echo.

choice /C YN /M "Would you like to seed the database now"
if errorlevel 2 (
    echo.
    echo Run 'npm run db:seed' when ready to seed data
    echo.
    pause
    exit /b 0
)

echo.
echo Seeding database...
call npm run db:seed
echo.
echo ============================================================
echo   All Done!
echo ============================================================
echo.
echo   To start the application:
echo   npm run dev
echo.
pause

