# 🗄️ Local Database Setup Guide

This guide will help you set up a production-grade PostgreSQL database locally using Docker.

## 🎯 Overview

The setup includes:
- **PostgreSQL 16** - Main database with optimized configuration
- **Redis 7** - Caching and job queue (optional)
- **PgAdmin 4** - Database management UI (optional)
- **Automatic schema setup** - Extensions and security configurations
- **Performance indexes** - Optimized for maritime data queries
- **Connection pooling** - Scalable and efficient connections

---

## 📋 Prerequisites

### Required
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- **Node.js 18+** - Already installed
- **Git** - Already installed

### Optional
- **PostgreSQL Client Tools** - For command-line access
- **VS Code with PostgreSQL extension** - For database management

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Start Database Services

```bash
# Navigate to project directory
cd GHGConnect

# Start PostgreSQL, Redis, and PgAdmin
docker-compose up -d

# Check services are running
docker-compose ps
```

Expected output:
```
NAME                   STATUS          PORTS
ghgconnect_db          Up             0.0.0.0:5432->5432/tcp
ghgconnect_redis       Up             0.0.0.0:6379->6379/tcp
ghgconnect_pgadmin     Up             0.0.0.0:5050->80/tcp
```

### Step 2: Copy Environment File

```bash
# Copy the local environment configuration
cp .env.local .env
```

The `.env.local` file is pre-configured for Docker setup.

### Step 3: Push Database Schema

```bash
# Create all tables using Drizzle
npm run db:push
```

This will create all tables from `shared/schema.ts`.

### Step 4: Create Performance Indexes

```bash
# Apply performance optimizations
docker exec -i ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db < database/migrations/create_indexes.sql
```

### Step 5: Seed Data

```bash
# Populate with synthetic data
npm run db:seed
```

### Step 6: Start Application

```bash
# Start the development server
npm run dev
```

**Done!** Access the application at http://localhost:5000

---

## 🔍 Verify Setup

### Check Database Connection

```bash
docker exec -it ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db
```

Inside PostgreSQL:
```sql
-- Check database
\c ghgconnect_db

-- List tables
\dt

-- Check data
SELECT COUNT(*) FROM ports;
SELECT COUNT(*) FROM fuels;
SELECT COUNT(*) FROM vessels;

-- Exit
\q
```

### Check via PgAdmin

1. Open browser: http://localhost:5050
2. Login:
   - Email: `admin@ghgconnect.local`
   - Password: `admin123`
3. Add Server:
   - Name: `GHGConnect Local`
   - Host: `postgres` (Docker network name)
   - Port: `5432`
   - Database: `ghgconnect_db`
   - Username: `ghgconnect_user`
   - Password: `ghgconnect_dev_password_2024`

---

## 📁 Configuration Files

### docker-compose.yml
Defines all services:
- **postgres**: PostgreSQL 16 with persistent storage
- **redis**: Redis 7 for caching
- **pgadmin**: Web-based database management

### .env.local
Pre-configured environment variables:
```bash
DATABASE_URL=postgresql://ghgconnect_user:ghgconnect_dev_password_2024@localhost:5432/ghgconnect_db
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=ghgconnect_redis_password_2024
```

### database/init/
SQL scripts that run on first database creation:
- `01_extensions.sql` - PostgreSQL extensions (UUID, crypto, full-text search)
- `02_security.sql` - Roles and security policies
- `03_indexes.sql` - Documentation for performance indexes

---

## 🔧 Database Configuration

### Connection Pooling

The application uses optimized connection pooling (`server/db.ts`):

```typescript
{
  max: 20,                      // Maximum 20 connections
  min: 2,                       // Keep 2 connections ready
  idleTimeoutMillis: 30000,     // Close idle after 30s
  connectionTimeoutMillis: 10000, // 10s connection timeout
  query_timeout: 30000,         // 30s query timeout
}
```

### Performance Indexes

60+ indexes created for optimal query performance:
- User authentication (email, username)
- Vessel lookups (IMO, name)
- Voyage queries (date ranges, status)
- Audit logs (tenant, timestamp)
- Full-text search (vessel names, port names)

### Security Features

1. **Role-Based Access**:
   - `ghgconnect_app` - Full application access
   - `ghgconnect_readonly` - Read-only for reporting

2. **Audit Triggers**:
   - Automatic change tracking
   - Records all INSERT/UPDATE/DELETE operations

3. **SSL Support**:
   - Enabled in production
   - Configurable per environment

---

## 🛠️ Common Operations

### View Logs

```bash
# All services
docker-compose logs -f

# PostgreSQL only
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100
```

### Stop Services

```bash
# Stop all services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove volumes (deletes data!)
docker-compose down -v
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart PostgreSQL only
docker-compose restart postgres
```

### Backup Database

```bash
# Create backup
docker exec ghgconnect_db pg_dump -U ghgconnect_user -d ghgconnect_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup with compression
docker exec ghgconnect_db pg_dump -U ghgconnect_user -d ghgconnect_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore Database

```bash
# From SQL file
docker exec -i ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db < backup.sql

# From compressed file
gunzip -c backup.sql.gz | docker exec -i ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db
```

### Reset Database

```bash
# Drop and recreate
docker-compose down -v
docker-compose up -d
npm run db:push
npm run db:seed
```

---

## 📊 Database Schema

### Core Tables
- `tenants` - Multi-tenant organizations
- `users` - User accounts
- `user_roles` - RBAC permissions
- `audit_logs` - Change tracking

### Maritime Data
- `ports` (30+ entries) - Global port directory
- `fuels` (16 entries) - Fuel types and emission factors
- `vessels` - Fleet management
- `voyages` - Journey records
- `consumptions` - Fuel usage data
- `bdns` - Bunker delivery notes
- `ops_sessions` - Shore power usage

### Regulatory
- `regulatory_constants` - Framework parameters
- `calculation_formulas` - Compliance calculations
- `calc_runs` - Calculation history
- `scenarios` - What-if analysis

---

## 🔍 Monitoring & Health Checks

### Database Health Endpoint

```bash
curl http://localhost:5000/api/health/db
```

Response:
```json
{
  "healthy": true,
  "details": {
    "connected": true,
    "totalConnections": 5,
    "idleConnections": 3,
    "waitingClients": 0
  }
}
```

### Connection Stats

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Connections by state
SELECT state, count(*) 
FROM pg_stat_activity 
GROUP BY state;

-- Long-running queries
SELECT pid, now() - query_start AS duration, query 
FROM pg_stat_activity 
WHERE state = 'active' 
AND now() - query_start > interval '1 minute';
```

### Database Size

```sql
-- Database size
SELECT pg_size_pretty(pg_database_size('ghgconnect_db'));

-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## ⚡ Performance Tuning

### Query Analysis

```sql
-- Enable query statistics
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Top 10 slowest queries
SELECT 
  round(total_exec_time::numeric, 2) AS total_time,
  calls,
  round(mean_exec_time::numeric, 2) AS avg_time,
  query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

### Index Usage

```sql
-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Unused indexes
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE '%_pkey';
```

### Vacuum & Analyze

```bash
# From command line
docker exec ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db -c "VACUUM ANALYZE;"

# Inside PostgreSQL
VACUUM VERBOSE ANALYZE;
```

---

## 🐛 Troubleshooting

### Problem: Docker containers won't start

**Check Docker Desktop is running:**
```bash
docker --version
docker ps
```

**Check port conflicts:**
```bash
# Windows
netstat -ano | findstr :5432

# Mac/Linux
lsof -i :5432
```

### Problem: Can't connect to database

**Verify container is running:**
```bash
docker-compose ps postgres
```

**Check logs:**
```bash
docker-compose logs postgres
```

**Test connection:**
```bash
docker exec -it ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db -c "SELECT 1;"
```

### Problem: Schema not created

**Manually push schema:**
```bash
npm run db:push
```

**Check Drizzle config:**
```bash
cat drizzle.config.ts
```

### Problem: Indexes not created

**Run migration:**
```bash
docker exec -i ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db < database/migrations/create_indexes.sql
```

### Problem: Out of memory

**Increase Docker resources:**
1. Open Docker Desktop
2. Settings → Resources
3. Increase Memory to 4GB+
4. Apply & Restart

---

## 🔒 Security Checklist

✅ **Development**
- [x] Use strong passwords (configured in docker-compose.yml)
- [x] Enable connection pooling
- [x] Use prepared statements (Drizzle ORM)
- [x] Implement audit logging
- [x] Use environment variables

✅ **Production**
- [ ] Change all default passwords
- [ ] Enable SSL connections
- [ ] Use secrets management (AWS Secrets Manager, Vault)
- [ ] Configure firewall rules
- [ ] Enable database encryption at rest
- [ ] Set up automated backups
- [ ] Configure read replicas for scalability
- [ ] Implement connection limits
- [ ] Monitor database performance
- [ ] Regular security updates

---

## 📚 Additional Resources

- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Docker Compose**: https://docs.docker.com/compose/
- **Drizzle ORM**: https://orm.drizzle.team/
- **PgAdmin**: https://www.pgadmin.org/docs/

---

## 🎉 Next Steps

1. ✅ **Database is running** ← You are here
2. 📊 **Explore data in PgAdmin** → http://localhost:5050
3. 🧪 **Test API endpoints** → See START_HERE.md
4. 📈 **Monitor performance** → Check query stats
5. 🔒 **Review security** → Follow checklist above

---

**For support, see QUICK_START.md or START_HERE.md**

**Last Updated**: October 20, 2025

