#!/bin/bash
# ============================================================
#   GHGConnect - Simple Server Setup (No Node.js Required)
# ============================================================

set -e  # Exit on error

echo ""
echo "============================================================"
echo "  GHGConnect - Simple Server Setup"
echo "============================================================"
echo ""

# Check if Python is available
echo "[1/4] Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "ERROR: Python is not installed!"
        echo ""
        echo "Please install Python from:"
        echo "https://www.python.org/downloads/"
        echo ""
        exit 1
    else
        PYTHON_CMD="python"
    fi
else
    PYTHON_CMD="python3"
fi
echo "✓ Python is installed"
echo ""

# Create a simple Python server
echo "[2/4] Creating simple server..."
cat > simple_server.py << 'EOF'
import http.server
import socketserver
import json
import urllib.parse

PORT = 5000

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/'):
            self.handle_api_request()
        else:
            super().do_GET()
    
    def handle_api_request(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        
        if self.path == '/api/public/stats':
            data = {'portsCount': 30, 'fuelsCount': 16, 'status': 'healthy'}
        elif self.path == '/api/ports':
            data = [{'id': '1', 'name': 'Rotterdam', 'unlocode': 'NLRTM', 'countryIso': 'NL', 'isEu': True}]
        elif self.path == '/api/fuels':
            data = [{'id': '1', 'code': 'VLSFO', 'name': 'Very Low Sulphur Fuel Oil'}]
        elif self.path == '/api/health':
            data = {'status': 'healthy', 'database': {'healthy': True}}
        else:
            data = {'error': 'Not found'}
        
        self.wfile.write(json.dumps(data).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

if __name__ == '__main__':
    with socketserver.TCPServer(('', PORT), MyHandler) as httpd:
        print(f'Server running at http://localhost:{PORT}')
        print('Press Ctrl+C to stop')
        httpd.serve_forever()
EOF

echo "✓ Server created"
echo ""

# Start the server
echo "[3/4] Starting server..."
echo ""
echo "============================================================"
echo "  Server Starting..."
echo "============================================================"
echo ""
echo "  Access the application at: http://localhost:5000"
echo ""
echo "  Available API endpoints:"
echo "  - http://localhost:5000/api/health"
echo "  - http://localhost:5000/api/public/stats"
echo "  - http://localhost:5000/api/ports"
echo "  - http://localhost:5000/api/fuels"
echo ""
echo "  Press Ctrl+C to stop the server"
echo ""
echo "============================================================"
echo ""

$PYTHON_CMD simple_server.py

