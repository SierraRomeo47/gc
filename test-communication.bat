@echo off
REM ===================================================================
REM GHGConnect Frontend-Backend Communication Test
REM ===================================================================

echo.
echo ========================================
echo   Testing Frontend-Backend Communication
echo ========================================
echo.

echo [TEST 1] Checking if server is running on port 5000...
curl -s http://localhost:5000/api/health >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Server is not running on port 5000
    echo [INFO] Please start the server with: start-dev.bat
    pause
    exit /b 1
)
echo [PASS] Server is running
echo.

echo [TEST 2] Checking API health endpoint...
curl -s -o test_health.json http://localhost:5000/api/health
if errorlevel 1 (
    echo [FAIL] Could not reach health endpoint
    pause
    exit /b 1
)
echo [PASS] Health endpoint is accessible
type test_health.json
echo.
echo.

echo [TEST 3] Checking vessels API endpoint...
curl -s -o test_vessels.json http://localhost:5000/api/vessels/demo
if errorlevel 1 (
    echo [FAIL] Could not reach vessels endpoint
    del test_health.json 2>nul
    pause
    exit /b 1
)
echo [PASS] Vessels endpoint is accessible
echo [INFO] Retrieved vessel data successfully
echo.

echo [TEST 4] Checking frontend accessibility...
curl -s -o test_frontend.html http://localhost:5000
if errorlevel 1 (
    echo [FAIL] Could not reach frontend
    del test_health.json test_vessels.json 2>nul
    pause
    exit /b 1
)
echo [PASS] Frontend is accessible
echo.

echo [TEST 5] Checking server mode...
findstr /C:"\"mode\":" test_health.json >nul
if errorlevel 1 (
    echo [WARN] Could not determine server mode
) else (
    for /f "tokens=2 delims=:" %%a in ('findstr /C:"mode" test_health.json') do (
        echo [INFO] Server mode: %%a
        echo %%a | findstr /C:"database" >nul
        if not errorlevel 1 (
            echo [INFO] Running with database connection
        )
        echo %%a | findstr /C:"memory-only" >nul
        if not errorlevel 1 (
            echo [INFO] Running in memory-only mode
        )
    )
)
echo.

REM Cleanup
del test_health.json test_vessels.json test_frontend.html 2>nul

echo ========================================
echo   All Communication Tests Passed! ✓
echo ========================================
echo.
echo [SUCCESS] Frontend and backend are communicating correctly
echo [INFO] You can access the application at: http://localhost:5000
echo.
pause




