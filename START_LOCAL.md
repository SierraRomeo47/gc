# Start GHGConnect Locally - Quick Guide

## 🚀 Quick Start (30 seconds)

```bash
# Step 1: Start Docker stack (backend + database + redis)
docker-compose up -d

# Step 2: Wait for services to be healthy
docker-compose ps

# Step 3: Setup database schema
docker-compose exec backend npm run db:push

# Step 4: (Optional) Seed test data
docker-compose exec backend npm run db:seed
```

**Access at**: http://localhost:5000

---

## 📋 Step-by-Step Instructions

### Step 1: Prerequisites Check
```bash
# Check Docker is running
docker --version
docker-compose --version

# Check Node.js version (should be 18+)
node --version
```

### Step 2: Start Docker Services
```bash
cd GHGConnect
docker-compose up -d
```

**You should see**:
```
Creating ghgconnect_db ... done
Creating ghgconnect_redis ... done
Creating ghgconnect_backend ... done
Creating ghgconnect_pgadmin ... done
```

### Step 3: Verify Services are Running
```bash
docker-compose ps
```

**Expected output**:
```
NAME                     IMAGE                    STATUS
ghgconnect_backend       ghgconnect-backend       Up (healthy)
ghgconnect_db            postgres:16-alpine       Up (healthy)
ghgconnect_redis         redis:7-alpine          Up (healthy)
ghgconnect_pgadmin       dpage/pgadmin4:latest    Up
```

### Step 4: Setup Database Schema
```bash
docker-compose exec backend npm run db:push
```

### Step 5: (Optional) Seed Test Data
```bash
docker-compose exec backend npm run db:seed
```

### Step 6: Access the Application
Navigate to: **http://localhost:5000**

---

## 🎯 What's Working Now

### ✅ Services Running
1. **Backend**: http://localhost:5000 (Express + Vite hybrid)
2. **Database**: PostgreSQL on localhost:5432
3. **Redis**: localhost:6379 (for caching)
4. **PgAdmin**: http://localhost:5050 (database management UI)

### ✅ Features Available
1. **Authentication** - Properly secured (requires login)
2. **Error Handling** - User-friendly error messages
3. **Rate Limiting** - Protection against abuse (100 req/15min)
4. **Input Validation** - XSS and SQL injection prevented
5. **Caching** - Redis caching enabled
6. **Database** - PostgreSQL with proper schema

---

## 🔧 Troubleshooting

### Docker Services Not Starting
```bash
# Check Docker Desktop is running
# Restart Docker Desktop if needed

# Check for port conflicts
netstat -ano | findstr :5000
netstat -ano | findstr :5432
netstat -ano | findstr :6379
netstat -ano | findstr :5050

# Kill conflicting processes if needed
taskkill /PID <PID> /F
```

### Database Connection Issues
```bash
# Check database container logs
docker-compose logs postgres

# Restart database service
docker-compose restart postgres

# Check database health
docker-compose exec backend npm run db:check
```

### Backend Container Issues
```bash
# Check backend logs
docker-compose logs backend

# Restart backend service
docker-compose restart backend

# Rebuild backend container
docker-compose up -d --build backend
```

### Port Already in Use
```bash
# Find and kill processes using ports
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or stop all containers and restart
docker-compose down
docker-compose up -d
```

---

## 📊 Testing the Application

### 1. Check Health
Open: http://localhost:5000/api/health

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-21T...",
  "uptime": 123,
  "database": {
    "healthy": true,
    "details": {
      "connected": true,
      "totalConnections": 2,
      "idleConnections": 1,
      "waitingClients": 0
    }
  },
  "memory": {
    "used": 45,
    "total": 128,
    "unit": "MB"
  },
  "environment": "development"
}
```

### 2. Check API Endpoints
```bash
# Test public stats endpoint
curl http://localhost:5000/api/public/stats

# Test demo vessels
curl http://localhost:5000/api/vessels/demo
```

### 3. Check Frontend
1. Navigate to http://localhost:5000
2. You should see the GHGConnect dashboard
3. Check browser console for any errors
4. Try navigating different sections

### 4. Check Database Management
1. Navigate to http://localhost:5050
2. Login with: admin@ghgconnect.com / admin123
3. Add server: host=postgres, port=5432, user=ghgconnect_user, password=ghgconnect_dev_password_2024

---

## 🎮 Quick Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart backend

# Rebuild and start
docker-compose up -d --build

# Database operations
docker-compose exec backend npm run db:push
docker-compose exec backend npm run db:seed
docker-compose exec backend npm run db:check

# Access container shell
docker-compose exec backend sh
docker-compose exec postgres psql -U ghgconnect_user -d ghgconnect_db
```

---

## 🔍 Verifying Everything Works

### Checklist
- [ ] Docker services start without errors
- [ ] Can access http://localhost:5000
- [ ] Dashboard loads in browser
- [ ] No console errors in browser
- [ ] API calls work (check Network tab)
- [ ] Database health check returns 200
- [ ] PgAdmin accessible at http://localhost:5050
- [ ] Redis caching works

### Success Indicators
✅ All Docker containers show "Up (healthy)"
✅ Browser loads dashboard at http://localhost:5000
✅ Health endpoint returns 200 with database connected
✅ No red errors in console
✅ PgAdmin accessible and can connect to database

---

## 💡 Pro Tips

1. **Use Docker Compose** for consistent development environment
2. **Check Health Endpoint** regularly: http://localhost:5000/api/health
3. **Monitor Container Logs** with `docker-compose logs -f`
4. **Use PgAdmin** for database inspection and debugging
5. **Check Redis** for caching performance
6. **Restart Services** if you encounter issues: `docker-compose restart <service>`

---

## 🆘 Need Help?

### Common Issues

**Issue**: "Port already in use"
→ Kill conflicting processes or restart Docker Desktop

**Issue**: "Database connection failed"
→ Check PostgreSQL container is running: `docker-compose ps`

**Issue**: "Backend container not starting"
→ Check logs: `docker-compose logs backend`

**Issue**: "Changes not reflecting"
→ Restart backend: `docker-compose restart backend`

**Issue**: "PgAdmin can't connect"
→ Verify database credentials and container networking

### Getting More Help
- Check `docker-compose logs` for specific error messages
- Verify all containers are healthy: `docker-compose ps`
- Check health endpoint: http://localhost:5000/api/health
- Use PgAdmin to inspect database state

---

## 🎉 You're Ready!

Your simplified GHGConnect application is now running with:
- ✅ Single Docker Compose setup
- ✅ Backend + Database + Redis + PgAdmin
- ✅ No memory-only fallback (database required)
- ✅ Clean port configuration (5000 for app, 5432 for DB)
- ✅ Simplified development workflow

**Happy developing! 🚀**

