#!/bin/bash
# ============================================================
#   GHGConnect - Local Database Setup Script (Mac/Linux)
# ============================================================

set -e  # Exit on error

echo ""
echo "============================================================"
echo "  GHGConnect - Local Database Setup"
echo "============================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
echo "[1/8] Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR: Docker is not installed!${NC}"
    echo ""
    echo "Please install Docker from:"
    echo "https://www.docker.com/products/docker-desktop/"
    echo ""
    exit 1
fi
echo -e "${GREEN}   ✓ Docker is installed${NC}"
echo ""

# Check if Node.js is installed
echo "[2/8] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed!${NC}"
    echo ""
    echo "Please install Node.js from:"
    echo "https://nodejs.org/"
    echo ""
    exit 1
fi
echo -e "${GREEN}   ✓ Node.js is installed ($(node --version))${NC}"
echo ""

# Copy environment file
echo "[3/8] Setting up environment configuration..."
if [ ! -f .env ]; then
    if [ -f .env.local ]; then
        cp .env.local .env
        echo -e "${GREEN}   ✓ Created .env from .env.local${NC}"
    else
        echo -e "${YELLOW}   ⚠ WARNING: .env.local not found${NC}"
    fi
else
    echo -e "${GREEN}   ✓ .env already exists${NC}"
fi
echo ""

# Start Docker services
echo "[4/8] Starting Docker services..."
echo "   This may take a few minutes on first run..."
docker-compose up -d
echo ""

# Wait for database to be ready
echo "[5/8] Waiting for database to be ready..."
sleep 10

# Check if database is accessible
echo "   Testing database connection..."
for i in {1..30}; do
    if docker exec ghgconnect_db pg_isready -U ghgconnect_user -d ghgconnect_db &> /dev/null; then
        echo -e "${GREEN}   ✓ Database is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}   ✗ Database failed to start${NC}"
        echo ""
        echo "Check Docker logs:"
        echo "   docker-compose logs postgres"
        exit 1
    fi
    echo "   Waiting... ($i/30)"
    sleep 2
done
echo ""

# Install dependencies
echo "[6/8] Installing Node.js dependencies..."
npm install
echo ""

# Push database schema
echo "[7/8] Creating database schema..."
npm run db:push
echo ""

# Create indexes
echo "[8/8] Creating performance indexes..."
docker exec -i ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db < database/migrations/create_indexes.sql || {
    echo -e "${YELLOW}   ⚠ WARNING: Some indexes may not have been created${NC}"
    echo "   This is okay if running for the first time"
}
echo ""

echo "============================================================"
echo "  Database Setup Complete!"
echo "============================================================"
echo ""
echo "  Services Running:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis:      localhost:6379"
echo "  - PgAdmin:    http://localhost:5050"
echo ""
echo "  Database Credentials:"
echo "  - Host:     localhost"
echo "  - Port:     5432"
echo "  - Database: ghgconnect_db"
echo "  - User:     ghgconnect_user"
echo "  - Password: ghgconnect_dev_password_2024"
echo ""
echo "  PgAdmin Login:"
echo "  - URL:      http://localhost:5050"
echo "  - Email:    admin@ghgconnect.local"
echo "  - Password: admin123"
echo ""
echo "  Next Steps:"
echo "  1. Seed data:       npm run db:seed"
echo "  2. Start app:       npm run dev"
echo "  3. Access app:      http://localhost:5000"
echo ""
echo "============================================================"
echo ""

read -p "Would you like to seed the database now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Seeding database..."
    npm run db:seed
    echo ""
    echo "============================================================"
    echo "  All Done!"
    echo "============================================================"
    echo ""
    echo "  To start the application:"
    echo "  npm run dev"
    echo ""
else
    echo ""
    echo "Run 'npm run db:seed' when ready to seed data"
    echo ""
fi

