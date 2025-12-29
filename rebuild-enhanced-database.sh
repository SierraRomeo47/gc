#!/bin/bash
# Enhanced Database Rebuild Script for GHGConnect
# This script rebuilds the database with the enhanced schema including triggers and system admin role

set -e

echo "============================================================"
echo "GHGConnect Enhanced Database Rebuild"
echo "============================================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker is running"

# Check if the database container exists
if ! docker ps -a --format "table {{.Names}}" | grep -q "ghgconnect_db"; then
    echo "❌ Database container 'ghgconnect_db' not found. Please run docker-compose up -d first."
    exit 1
fi

echo "✅ Database container found"

# Stop the application if running
echo "🛑 Stopping application..."
pkill -f "npm run dev" || true
pkill -f "tsx server/index.ts" || true
sleep 2

# Rebuild the database
echo "🗄️  Rebuilding database with enhanced schema..."

# Drop and recreate the database
docker exec ghgconnect_db psql -U ghgconnect_user -d postgres -c "DROP DATABASE IF EXISTS ghgconnect_db;"
docker exec ghgconnect_db psql -U ghgconnect_user -d postgres -c "CREATE DATABASE ghgconnect_db;"

# Apply the enhanced schema
docker exec -i ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db < database/enhanced_database_schema.sql

echo "✅ Database rebuilt successfully"

# Verify the database
echo "🔍 Verifying database structure..."

# Check tables
TABLE_COUNT=$(docker exec ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "📊 Tables created: $TABLE_COUNT"

# Check triggers
TRIGGER_COUNT=$(docker exec ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db -t -c "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public';")
echo "⚡ Triggers created: $TRIGGER_COUNT"

# Check functions
FUNCTION_COUNT=$(docker exec ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public';")
echo "🔧 Functions created: $FUNCTION_COUNT"

# Check data
VESSEL_COUNT=$(docker exec ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db -t -c "SELECT COUNT(*) FROM vessels;")
echo "🚢 Vessels: $VESSEL_COUNT"

FLEET_COUNT=$(docker exec ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db -t -c "SELECT COUNT(*) FROM fleets;")
echo "🏢 Fleets: $FLEET_COUNT"

ORG_COUNT=$(docker exec ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db -t -c "SELECT COUNT(*) FROM organizations;")
echo "🏛️  Organizations: $ORG_COUNT"

USER_COUNT=$(docker exec ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db -t -c "SELECT COUNT(*) FROM users;")
echo "👤 Users: $USER_COUNT"

echo ""
echo "============================================================"
echo "✅ Enhanced Database Rebuild Complete!"
echo "============================================================"
echo "System Admin User: admin@ghgconnect.com"
echo "Default Tenant ID: dfa5de92-6ab2-47d4-b19c-87c01b692c94"
echo "Database: PostgreSQL with triggers and audit logging"
echo "============================================================"
echo ""
echo "🚀 You can now start the application with: npm run dev"

