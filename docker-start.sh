#!/bin/bash
###################################################################
# GHGConnect Docker Startup Script
###################################################################
# This script runs the entire application stack in Docker containers
###################################################################

echo ""
echo "========================================"
echo "   GHGConnect Docker Stack"
echo "========================================"
echo ""

# Check if Docker is running
echo "[STEP 1/4] Checking Docker status..."
if ! docker ps &> /dev/null; then
    echo "[ERROR] Docker is not running"
    echo "[INFO] Please start Docker and wait for it to be ready"
    echo "[INFO] Then run this script again"
    exit 1
fi
echo "[SUCCESS] Docker is running"
echo ""

# Build and start all containers
echo "[STEP 2/4] Building and starting Docker containers..."
echo "[INFO] This may take a few minutes on first run..."
docker-compose up --build -d

if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to start containers"
    echo "[INFO] Check the error messages above"
    exit 1
fi
echo "[SUCCESS] All containers started"
echo ""

# Wait for services to be healthy
echo "[STEP 3/4] Waiting for services to be ready..."
sleep 20

# Check container status
echo "[STEP 4/4] Checking container health..."
docker-compose ps

echo ""
echo "========================================"
echo "   Docker Stack Status"
echo "========================================"
echo ""

# Show logs command
echo "[INFO] To view logs, run:"
echo "   docker-compose logs -f backend"
echo "   docker-compose logs -f postgres"
echo ""

# Show running containers
echo "[INFO] Running containers:"
docker ps --filter "name=ghgconnect" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "========================================"
echo "   Application Ready! ✓"
echo "========================================"
echo ""
echo "[SUCCESS] GHGConnect is running in Docker"
echo "[INFO] Application: http://localhost:5000"
echo "[INFO] PgAdmin: http://localhost:5050"
echo ""
echo "[INFO] To see live logs:"
echo "   docker-compose logs -f backend"
echo ""
echo "[INFO] To stop all containers:"
echo "   docker-compose down"
echo ""
echo "[INFO] To seed the database:"
echo "   docker-compose exec backend npm run db:seed"
echo ""


