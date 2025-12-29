@echo off
REM ===================================================================
REM GHGConnect Docker Startup Script
REM ===================================================================
REM This script runs the entire application stack in Docker containers
REM ===================================================================

echo.
echo ========================================
echo   GHGConnect Docker Stack
echo ========================================
echo.

REM Check if Docker is running
echo [STEP 1/4] Checking Docker status...
docker ps >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running
    echo [INFO] Please start Docker Desktop and wait for it to be ready
    echo [INFO] Then run this script again
    pause
    exit /b 1
)
echo [SUCCESS] Docker is running
echo.

REM Build and start all containers
echo [STEP 2/4] Building and starting Docker containers...
echo [INFO] This may take a few minutes on first run...
docker-compose up --build -d

if errorlevel 1 (
    echo [ERROR] Failed to start containers
    echo [INFO] Check the error messages above
    pause
    exit /b 1
)
echo [SUCCESS] All containers started
echo.

REM Wait for services to be healthy
echo [STEP 3/4] Waiting for services to be ready...
timeout /t 20 /nobreak >nul

REM Check container status
echo [STEP 4/4] Checking container health...
docker-compose ps

echo.
echo ========================================
echo   Docker Stack Status
echo ========================================
echo.

REM Show logs command
echo [INFO] To view logs, run:
echo    docker-compose logs -f backend
echo    docker-compose logs -f postgres
echo.

REM Show running containers
echo [INFO] Running containers:
docker ps --filter "name=ghgconnect" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo ========================================
echo   Application Ready! ✓
echo ========================================
echo.
echo [SUCCESS] GHGConnect is running in Docker
echo [INFO] Application: http://localhost:5000
echo [INFO] PgAdmin: http://localhost:5050
echo.
echo [INFO] To see live logs:
echo    docker-compose logs -f backend
echo.
echo [INFO] To stop all containers:
echo    docker-compose down
echo.
echo [INFO] To seed the database:
echo    docker-compose exec backend npm run db:seed
echo.
pause


