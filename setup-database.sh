#!/bin/bash
###################################################################
# GHGConnect Database Setup Script
###################################################################
# This script sets up the PostgreSQL database using Docker Compose
###################################################################

echo ""
echo "========================================"
echo "   GHGConnect Database Setup"
echo "========================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed"
    echo "[INFO] Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "[SUCCESS] Docker is available"
echo ""

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "[ERROR] Docker is not running"
    echo "[INFO] Please start Docker and try again"
    exit 1
fi

echo "[SUCCESS] Docker is running"
echo ""

# Stop any existing containers
echo "[INFO] Stopping any existing containers..."
docker-compose down &> /dev/null

# Start the database
echo "[INFO] Starting PostgreSQL database..."
docker-compose up -d postgres

if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to start PostgreSQL database"
    exit 1
fi

echo "[SUCCESS] PostgreSQL database started"
echo ""

# Wait for database to be ready
echo "[INFO] Waiting for database to be ready..."
sleep 10

# Check if database is accessible
echo "[INFO] Testing database connection..."
if ! docker exec ghgconnect_db pg_isready -U ghgconnect_user -d ghgconnect_db &> /dev/null; then
    echo "[WARN] Database might not be ready yet, waiting a bit more..."
    sleep 15
    if ! docker exec ghgconnect_db pg_isready -U ghgconnect_user -d ghgconnect_db &> /dev/null; then
        echo "[ERROR] Database is not responding"
        echo "[INFO] Check Docker logs with: docker logs ghgconnect_db"
        exit 1
    fi
fi

echo "[SUCCESS] Database is ready and accepting connections"
echo ""

# Show database status
echo "[INFO] Database Status:"
docker ps --filter "name=ghgconnect_db" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "[INFO] Database Connection Details:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: ghgconnect_db"
echo "   User: ghgconnect_user"
echo "   Password: ghgconnect_dev_password_2024"
echo ""

echo "========================================"
echo "   Database Setup Complete! ✓"
echo "========================================"
echo ""
echo "[SUCCESS] PostgreSQL database is running and ready"
echo "[INFO] You can now start the application with: ./start-dev.sh"
echo "[INFO] Or manually with: npm run dev"
echo ""
echo "[OPTIONAL] To access PgAdmin (database management UI):"
echo "   URL: http://localhost:5050"
echo "   Email: admin@ghgconnect.local"
echo "   Password: admin123"
echo ""




