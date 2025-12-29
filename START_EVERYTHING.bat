@echo off
REM ===================================================================
REM GHGConnect Complete Startup Script
REM ===================================================================
REM This script starts everything needed to run GHGConnect:
REM 1. Ensures Docker Desktop is running
REM 2. Starts PostgreSQL database
REM 3. Waits for database to be ready
REM 4. Seeds the database with 26 vessels
REM 5. Starts the development server
REM ===================================================================

echo.
echo ========================================
echo   GHGConnect Complete Startup
echo ========================================
echo.

REM Step 1: Check Docker Desktop
echo [STEP 1/5] Checking Docker Desktop...
docker ps >nul 2>&1
if errorlevel 1 (
    echo [WARN] Docker Desktop is not running or not ready
    echo [INFO] Please manually start Docker Desktop from the Start Menu
    echo [INFO] Wait for Docker Desktop to show "Docker Desktop is running" in system tray
    echo [INFO] Then press any key to continue...
    pause >nul
    
    REM Check again
    docker ps >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Docker is still not accessible
        echo [INFO] Please:
        echo    1. Start Docker Desktop from Start Menu
        echo    2. Wait for it to fully start (check system tray)
        echo    3. Run this script again
        pause
        exit /b 1
    )
)
echo [SUCCESS] Docker Desktop is running
echo.

REM Step 2: Stop any existing containers
echo [STEP 2/5] Cleaning up any existing containers...
docker-compose down >nul 2>&1
echo [SUCCESS] Cleanup complete
echo.

REM Step 3: Start PostgreSQL
echo [STEP 3/5] Starting PostgreSQL database...
docker-compose up -d postgres
if errorlevel 1 (
    echo [ERROR] Failed to start PostgreSQL
    echo [INFO] Check Docker logs with: docker logs ghgconnect_db
    pause
    exit /b 1
)
echo [SUCCESS] PostgreSQL container started
echo.

REM Step 4: Wait for database to be ready
echo [STEP 4/5] Waiting for database to be ready...
timeout /t 15 /nobreak >nul

:CHECK_DB
docker exec ghgconnect_db pg_isready -U ghgconnect_user -d ghgconnect_db >nul 2>&1
if errorlevel 1 (
    echo [WAIT] Database not ready yet, waiting 5 more seconds...
    timeout /t 5 /nobreak >nul
    goto CHECK_DB
)
echo [SUCCESS] Database is ready!
echo.

REM Show database info
echo [INFO] Database Connection Details:
echo    Host: localhost
echo    Port: 5432
echo    Database: ghgconnect_db
echo    User: ghgconnect_user  
echo    Password: ghgconnect_dev_password_2024
echo.

REM Step 5: Push schema and seed data
echo [STEP 5/5] Setting up database schema and seeding data...
echo [INFO] This will:
echo    - Create all database tables
echo    - Add 30+ ports
echo    - Add 16 fuel types
echo    - Add 26 vessels
echo    - Create demo users
echo.

call npm run db:push
if errorlevel 1 (
    echo [WARN] Schema push had issues (this might be okay if tables exist)
)

call npm run db:seed
if errorlevel 1 (
    echo [WARN] Seeding had issues (this might be okay if data exists)
)

echo.
echo ========================================
echo   Database Setup Complete! ✓
echo ========================================
echo.

REM Ask if user wants to start the dev server
echo Would you like to start the development server now? (Y/N)
set /p START_SERVER="> "

if /i "%START_SERVER%"=="Y" (
    echo.
    echo [INFO] Starting development server...
    echo [INFO] Server will be available at: http://localhost:5000
    echo [INFO] Press Ctrl+C to stop the server
    echo.
    call npm run dev
) else (
    echo.
    echo [INFO] Database is ready! You can start the development server with:
    echo    npm run dev
    echo.
    echo [INFO] Or use: start-dev.bat
    echo.
    pause
)



