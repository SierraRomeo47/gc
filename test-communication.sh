#!/bin/bash
###################################################################
# GHGConnect Frontend-Backend Communication Test
###################################################################

echo ""
echo "========================================"
echo "   Testing Frontend-Backend Communication"
echo "========================================"
echo ""

echo "[TEST 1] Checking if server is running on port 5000..."
if ! curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "[FAIL] Server is not running on port 5000"
    echo "[INFO] Please start the server with: ./start-dev.sh"
    exit 1
fi
echo "[PASS] Server is running"
echo ""

echo "[TEST 2] Checking API health endpoint..."
HEALTH=$(curl -s http://localhost:5000/api/health)
if [ $? -ne 0 ]; then
    echo "[FAIL] Could not reach health endpoint"
    exit 1
fi
echo "[PASS] Health endpoint is accessible"
echo "$HEALTH" | jq . 2>/dev/null || echo "$HEALTH"
echo ""

echo "[TEST 3] Checking vessels API endpoint..."
VESSELS=$(curl -s http://localhost:5000/api/vessels/demo)
if [ $? -ne 0 ]; then
    echo "[FAIL] Could not reach vessels endpoint"
    exit 1
fi
echo "[PASS] Vessels endpoint is accessible"
VESSEL_COUNT=$(echo "$VESSELS" | jq '. | length' 2>/dev/null)
if [ ! -z "$VESSEL_COUNT" ]; then
    echo "[INFO] Retrieved $VESSEL_COUNT vessels successfully"
fi
echo ""

echo "[TEST 4] Checking frontend accessibility..."
if ! curl -s http://localhost:5000 > /dev/null 2>&1; then
    echo "[FAIL] Could not reach frontend"
    exit 1
fi
echo "[PASS] Frontend is accessible"
echo ""

echo "[TEST 5] Checking server mode..."
MODE=$(echo "$HEALTH" | jq -r '.mode' 2>/dev/null)
if [ ! -z "$MODE" ]; then
    echo "[INFO] Server mode: $MODE"
    if [ "$MODE" = "database" ]; then
        echo "[INFO] Running with database connection"
    elif [ "$MODE" = "memory-only" ]; then
        echo "[INFO] Running in memory-only mode"
    fi
else
    echo "[WARN] Could not determine server mode"
fi
echo ""

echo "========================================"
echo "   All Communication Tests Passed! ✓"
echo "========================================"
echo ""
echo "[SUCCESS] Frontend and backend are communicating correctly"
echo "[INFO] You can access the application at: http://localhost:5000"
echo ""




