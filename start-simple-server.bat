@echo off
REM ============================================================
REM   GHGConnect - Simple Server Setup (No Node.js Required)
REM ============================================================
REM   This creates a simple Python server to serve the frontend
REM ============================================================

echo.
echo ============================================================
echo   GHGConnect - Simple Server Setup
echo ============================================================
echo.

REM Check if Python is available
echo [1/4] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Python is not installed!
    echo.
    echo Please install Python from:
    echo https://www.python.org/downloads/
    echo.
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)
echo    ✓ Python is installed
echo.

REM Create a simple Python server
echo [2/4] Creating simple server...
echo import http.server > simple_server.py
echo import socketserver >> simple_server.py
echo import json >> simple_server.py
echo import urllib.parse >> simple_server.py
echo. >> simple_server.py
echo PORT = 5000 >> simple_server.py
echo. >> simple_server.py
echo class MyHandler(http.server.SimpleHTTPRequestHandler): >> simple_server.py
echo     def do_GET(self): >> simple_server.py
echo         if self.path.startswith('/api/'): >> simple_server.py
echo             self.handle_api_request() >> simple_server.py
echo         else: >> simple_server.py
echo             super().do_GET() >> simple_server.py
echo. >> simple_server.py
echo     def handle_api_request(self): >> simple_server.py
echo         self.send_response(200) >> simple_server.py
echo         self.send_header('Content-type', 'application/json') >> simple_server.py
echo         self.send_header('Access-Control-Allow-Origin', '*') >> simple_server.py
echo         self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS') >> simple_server.py
echo         self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization') >> simple_server.py
echo         self.end_headers() >> simple_server.py
echo. >> simple_server.py
echo         if self.path == '/api/public/stats': >> simple_server.py
echo             data = {'portsCount': 30, 'fuelsCount': 16, 'status': 'healthy'} >> simple_server.py
echo         elif self.path == '/api/ports': >> simple_server.py
echo             data = [{'id': '1', 'name': 'Rotterdam', 'unlocode': 'NLRTM', 'countryIso': 'NL', 'isEu': True}] >> simple_server.py
echo         elif self.path == '/api/fuels': >> simple_server.py
echo             data = [{'id': '1', 'code': 'VLSFO', 'name': 'Very Low Sulphur Fuel Oil'}] >> simple_server.py
echo         elif self.path == '/api/health': >> simple_server.py
echo             data = {'status': 'healthy', 'database': {'healthy': True}} >> simple_server.py
echo         else: >> simple_server.py
echo             data = {'error': 'Not found'} >> simple_server.py
echo. >> simple_server.py
echo         self.wfile.write(json.dumps(data).encode()) >> simple_server.py
echo. >> simple_server.py
echo     def do_OPTIONS(self): >> simple_server.py
echo         self.send_response(200) >> simple_server.py
echo         self.send_header('Access-Control-Allow-Origin', '*') >> simple_server.py
echo         self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS') >> simple_server.py
echo         self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization') >> simple_server.py
echo         self.end_headers() >> simple_server.py
echo. >> simple_server.py
echo if __name__ == '__main__': >> simple_server.py
echo     with socketserver.TCPServer(('', PORT), MyHandler) as httpd: >> simple_server.py
echo         print(f'Server running at http://localhost:{PORT}') >> simple_server.py
echo         print('Press Ctrl+C to stop') >> simple_server.py
echo         httpd.serve_forever() >> simple_server.py

echo    ✓ Server created
echo.

REM Start the server
echo [3/4] Starting server...
echo.
echo ============================================================
echo   Server Starting...
echo ============================================================
echo.
echo   Access the application at: http://localhost:5000
echo.
echo   Available API endpoints:
echo   - http://localhost:5000/api/health
echo   - http://localhost:5000/api/public/stats
echo   - http://localhost:5000/api/ports
echo   - http://localhost:5000/api/fuels
echo.
echo   Press Ctrl+C to stop the server
echo.
echo ============================================================
echo.

python simple_server.py

