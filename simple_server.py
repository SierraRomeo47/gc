import http.server
import socketserver
import json
import urllib.parse
import os
import sys

PORT = 5000

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.join(os.path.dirname(__file__), 'dist', 'public'), **kwargs)
    
    def do_GET(self):
        if self.path.startswith('/api/'):
            self.handle_api_request()
        else:
            # Serve static files from client directory
            super().do_GET()
    
    def handle_api_request(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        
        # Mock data for API endpoints
        if self.path == '/api/public/stats':
            data = {
                'portsCount': 30, 
                'fuelsCount': 16, 
                'status': 'healthy'
            }
        elif self.path == '/api/health':
            data = {
                'status': 'healthy',
                'timestamp': '2025-01-20T10:00:00Z',
                'uptime': 3600,
                'database': {
                    'healthy': True,
                    'details': {
                        'connected': False,
                        'error': 'Running in memory-only mode (database not available)'
                    }
                },
                'memory': {
                    'used': 45,
                    'total': 128,
                    'unit': 'MB'
                },
                'environment': 'development',
                'mode': 'memory-only'
            }
        elif self.path == '/api/health/db':
            data = {
                'healthy': True,
                'details': {
                    'connected': False,
                    'error': 'Running in memory-only mode (database not available)'
                }
            }
        elif self.path == '/api/ports':
            data = [
                {'id': '1', 'name': 'Rotterdam', 'unlocode': 'NLRTM', 'countryIso': 'NL', 'isEu': True, 'isUk': False},
                {'id': '2', 'name': 'Hamburg', 'unlocode': 'DEHAM', 'countryIso': 'DE', 'isEu': True, 'isUk': False},
                {'id': '3', 'name': 'London Gateway', 'unlocode': 'GBLGP', 'countryIso': 'GB', 'isEu': False, 'isUk': True},
                {'id': '4', 'name': 'Antwerp', 'unlocode': 'BEANR', 'countryIso': 'BE', 'isEu': True, 'isUk': False},
                {'id': '5', 'name': 'Le Havre', 'unlocode': 'FRLEH', 'countryIso': 'FR', 'isEu': True, 'isUk': False}
            ]
        elif self.path == '/api/fuels':
            data = [
                {'id': '1', 'code': 'VLSFO', 'name': 'Very Low Sulphur Fuel Oil', 'lcvMjKg': '40.5', 'defaultTtwGco2eMj': '77.4'},
                {'id': '2', 'code': 'MGO', 'name': 'Marine Gas Oil', 'lcvMjKg': '42.7', 'defaultTtwGco2eMj': '74.1'},
                {'id': '3', 'code': 'HFO', 'name': 'Heavy Fuel Oil', 'lcvMjKg': '40.2', 'defaultTtwGco2eMj': '77.4'},
                {'id': '4', 'code': 'LNG', 'name': 'Liquefied Natural Gas', 'lcvMjKg': '48.0', 'defaultTtwGco2eMj': '56.9'},
                {'id': '5', 'code': 'METHANOL', 'name': 'Methanol', 'lcvMjKg': '19.9', 'defaultTtwGco2eMj': '68.9'}
            ]
        elif self.path == '/api/vessels' or self.path == '/api/v1/vessels':
            data = [
                {
                    'id': '1',
                    'name': 'MV Atlantic Pioneer',
                    'imoNumber': 'IMO9876543',
                    'vesselType': 'Container Ship',
                    'flagState': 'NL',
                    'grossTonnage': 50000,
                    'deadweightTonnage': 65000,
                    'mainEngineType': 'Diesel',
                    'complianceStatus': 'compliant',
                    'ghgIntensity': 82.4,
                    'targetIntensity': 89.3,
                    'fuelConsumption': 1250.5,
                    'creditBalance': 125.3
                },
                {
                    'id': '2',
                    'name': 'MV Nordic Explorer',
                    'imoNumber': 'IMO9876544',
                    'vesselType': 'Bulk Carrier',
                    'flagState': 'NO',
                    'grossTonnage': 45000,
                    'deadweightTonnage': 58000,
                    'mainEngineType': 'Diesel',
                    'complianceStatus': 'warning',
                    'ghgIntensity': 91.2,
                    'targetIntensity': 89.3,
                    'fuelConsumption': 980.2,
                    'creditBalance': -45.7
                },
                {
                    'id': '3',
                    'name': 'MV Baltic Star',
                    'imoNumber': 'IMO9876545',
                    'vesselType': 'Tanker',
                    'flagState': 'DK',
                    'grossTonnage': 55000,
                    'deadweightTonnage': 72000,
                    'mainEngineType': 'Diesel',
                    'complianceStatus': 'non-compliant',
                    'ghgIntensity': 98.6,
                    'targetIntensity': 89.3,
                    'fuelConsumption': 1850.8,
                    'creditBalance': -298.4
                },
                {
                    'id': '4',
                    'name': 'MV Mediterranean Express',
                    'imoNumber': 'IMO9876546',
                    'vesselType': 'Container Ship',
                    'flagState': 'IT',
                    'grossTonnage': 48000,
                    'deadweightTonnage': 62000,
                    'mainEngineType': 'LNG Dual-Fuel',
                    'complianceStatus': 'compliant',
                    'ghgIntensity': 78.2,
                    'targetIntensity': 89.3,
                    'fuelConsumption': 750.1,
                    'creditBalance': 215.8
                },
                {
                    'id': '5',
                    'name': 'MV Thames Voyager',
                    'imoNumber': 'IMO9876547',
                    'vesselType': 'Ro-Ro Cargo',
                    'flagState': 'GB',
                    'grossTonnage': 35000,
                    'deadweightTonnage': 42000,
                    'mainEngineType': 'Diesel',
                    'complianceStatus': 'compliant',
                    'ghgIntensity': 85.1,
                    'targetIntensity': 89.3,
                    'fuelConsumption': 920.3,
                    'creditBalance': 89.2
                }
            ]
        elif self.path == '/api/voyages':
            data = [
                {
                    'id': '1',
                    'vesselId': '1',
                    'vesselName': 'MV Atlantic Pioneer',
                    'voyageNumber': 'ATP-2024-0001',
                    'departurePort': 'Rotterdam',
                    'arrivalPort': 'Hamburg',
                    'departureAt': '2025-01-15T08:00:00Z',
                    'arrivalAt': '2025-01-15T14:00:00Z',
                    'distanceNm': 250,
                    'voyageType': 'INTRA_EU',
                    'coverageEuPct': 1.0,
                    'coverageUkPct': 0.0,
                    'status': 'COMPLETED',
                    'fuelConsumed': 125.5,
                    'ghgIntensity': 85.2,
                    'complianceStatus': 'compliant'
                },
                {
                    'id': '2',
                    'vesselId': '2',
                    'vesselName': 'MV Nordic Explorer',
                    'voyageNumber': 'NEX-2024-0001',
                    'departurePort': 'Oslo',
                    'arrivalPort': 'Copenhagen',
                    'departureAt': '2025-01-14T10:00:00Z',
                    'arrivalAt': '2025-01-14T16:00:00Z',
                    'distanceNm': 320,
                    'voyageType': 'INTRA_EU',
                    'coverageEuPct': 1.0,
                    'coverageUkPct': 0.0,
                    'status': 'COMPLETED',
                    'fuelConsumed': 180.3,
                    'ghgIntensity': 91.8,
                    'complianceStatus': 'warning'
                },
                {
                    'id': '3',
                    'vesselId': '3',
                    'vesselName': 'MV Baltic Star',
                    'voyageNumber': 'BLS-2024-0001',
                    'departurePort': 'Piraeus',
                    'arrivalPort': 'New York',
                    'departureAt': '2025-01-12T06:00:00Z',
                    'arrivalAt': '2025-01-20T18:00:00Z',
                    'distanceNm': 4850,
                    'voyageType': 'EXTRA_EU',
                    'coverageEuPct': 0.5,
                    'coverageUkPct': 0.0,
                    'status': 'COMPLETED',
                    'fuelConsumed': 1250.8,
                    'ghgIntensity': 98.6,
                    'complianceStatus': 'non-compliant'
                }
            ]
        else:
            data = {'error': 'Endpoint not found', 'path': self.path}
        
        self.wfile.write(json.dumps(data).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def do_POST(self):
        if self.path.startswith('/api/'):
            self.handle_api_request()
        else:
            super().do_POST()

if __name__ == '__main__':
    print("=" * 60)
    print("GHGConnect - Simple Server")
    print("=" * 60)
    print(f"Server running at http://localhost:{PORT}")
    print("")
    print("Available endpoints:")
    print(f"  Frontend: http://localhost:{PORT}")
    print(f"  Health:   http://localhost:{PORT}/api/health")
    print(f"  Stats:    http://localhost:{PORT}/api/public/stats")
    print(f"  Ports:    http://localhost:{PORT}/api/ports")
    print(f"  Fuels:    http://localhost:{PORT}/api/fuels")
    print(f"  Vessels:  http://localhost:{PORT}/api/vessels")
    print(f"  Voyages:  http://localhost:{PORT}/api/voyages")
    print("")
    print("Press Ctrl+C to stop")
    print("=" * 60)
    print("")
    
    try:
        with socketserver.TCPServer(('', PORT), MyHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    except OSError as e:
        if e.errno == 10048:  # Port already in use
            print(f"\nERROR: Port {PORT} is already in use!")
            print("Try running: netstat -ano | findstr :5000")
            print("Or change PORT in this script to a different number.")
        else:
            print(f"\nERROR: {e}")
        sys.exit(1)

