@echo off
REM ===================================================================
REM GHGConnect Local Development Startup Script (Windows)
REM ===================================================================

echo.
echo ======================================================================
echo  Starting GHGConnect Maritime Compliance System
echo ======================================================================
echo.

REM Check if node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

REM Show Node version
echo Checking Node.js version...
node --version
echo.

REM Check if in correct directory
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Please run this script from the GHGConnect directory.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
    echo.
)

REM Check if .env exists, if not create from template
if not exist ".env" (
    echo .env file not found. Creating from template...
    if exist "env.development.template" (
        copy env.development.template .env >nul
        echo Created .env from env.development.template
        echo.
        echo NOTE: Application will run in MEMORY-ONLY mode.
        echo      To use PostgreSQL, edit .env and set DATABASE_URL
        echo.
    ) else (
        echo WARNING: env.development.template not found!
        echo Application will run in memory-only mode.
        echo.
    )
)

REM Display configuration
echo ======================================================================
echo  Configuration
echo ======================================================================
echo  Mode: Development (Memory-only if DATABASE_URL not set)
echo  Port: 5000
echo  URL:  http://localhost:5000
echo ======================================================================
echo.

REM Start the server
echo Starting development server...
echo Press Ctrl+C to stop the server
echo.

call npm run dev

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ======================================================================
    echo  Server stopped with error
    echo ======================================================================
    pause
    exit /b %ERRORLEVEL%
)

