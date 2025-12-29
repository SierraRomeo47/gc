@echo off
REM Enhanced Database Rebuild Script for GHGConnect (Windows)
REM This script rebuilds the database with the enhanced schema including triggers and system admin role

echo ============================================================
echo GHGConnect Enhanced Database Rebuild
echo ============================================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker is running

REM Check if the database container exists
docker ps -a --format "table {{.Names}}" | findstr "ghgconnect_db" >nul
if %errorlevel% neq 0 (
    echo ❌ Database container 'ghgconnect_db' not found. Please run docker-compose up -d first.
    pause
    exit /b 1
)

echo ✅ Database container found

REM Stop the application if running
echo 🛑 Stopping application...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 >nul

REM Rebuild the database
echo 🗄️  Rebuilding database with enhanced schema...

REM Drop and recreate the database
docker exec ghgconnect_db psql -U ghgconnect_user -d postgres -c "DROP DATABASE IF EXISTS ghgconnect_db;"
docker exec ghgconnect_db psql -U ghgconnect_user -d postgres -c "CREATE DATABASE ghgconnect_db;"

REM Apply the enhanced schema
docker exec -i ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db < database\enhanced_database_schema.sql

echo ✅ Database rebuilt successfully

REM Verify the database
echo 🔍 Verifying database structure...

REM Check tables
for /f %%i in ('docker exec ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"') do set TABLE_COUNT=%%i
echo 📊 Tables created: %TABLE_COUNT%

REM Check triggers
for /f %%i in ('docker exec ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db -t -c "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public';"') do set TRIGGER_COUNT=%%i
echo ⚡ Triggers created: %TRIGGER_COUNT%

REM Check functions
for /f %%i in ('docker exec ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public';"') do set FUNCTION_COUNT=%%i
echo 🔧 Functions created: %FUNCTION_COUNT%

REM Check data
for /f %%i in ('docker exec ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db -t -c "SELECT COUNT(*) FROM vessels;"') do set VESSEL_COUNT=%%i
echo 🚢 Vessels: %VESSEL_COUNT%

for /f %%i in ('docker exec ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db -t -c "SELECT COUNT(*) FROM fleets;"') do set FLEET_COUNT=%%i
echo 🏢 Fleets: %FLEET_COUNT%

for /f %%i in ('docker exec ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db -t -c "SELECT COUNT(*) FROM organizations;"') do set ORG_COUNT=%%i
echo 🏛️  Organizations: %ORG_COUNT%

for /f %%i in ('docker exec ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db -t -c "SELECT COUNT(*) FROM users;"') do set USER_COUNT=%%i
echo 👤 Users: %USER_COUNT%

echo.
echo ============================================================
echo ✅ Enhanced Database Rebuild Complete!
echo ============================================================
echo System Admin User: admin@ghgconnect.com
echo Default Tenant ID: dfa5de92-6ab2-47d4-b19c-87c01b692c94
echo Database: PostgreSQL with triggers and audit logging
echo ============================================================
echo.
echo 🚀 You can now start the application with: npm run dev
pause

