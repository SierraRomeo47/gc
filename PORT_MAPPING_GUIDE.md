# GHGConnect Port Mapping Guide

## Complete Environment Segregation

This document outlines the port mappings for complete isolation between development and production environments.

## Development Environment (Ports 5000-5050)

| Service | Container Name | Internal Port | External Port | Description |
|---------|---------------|---------------|---------------|-------------|
| **Frontend** | N/A | 5000 | 5000 | React dev server (Vite) |
| **Backend** | ghgconnect_backend_dev | 5001 | 5001 | Node.js API server |
| **Database** | ghgconnect_db_dev | 5432 | 5432 | PostgreSQL database |
| **Redis** | ghgconnect_redis_dev | 6379 | 6379 | Redis cache |
| **PgAdmin** | ghgconnect_pgadmin_dev | 80 | 5050 | Database admin interface |

### Development Network
- **Network Name**: `ghgconnect-dev-network`
- **Database**: `ghgconnect_db_dev`
- **Redis**: `ghgconnect_redis_dev`

## Production Environment (Ports 5002-5433)

| Service | Container Name | Internal Port | External Port | Description |
|---------|---------------|---------------|---------------|-------------|
| **Frontend** | N/A | 5000 | 5000 | React production build |
| **Backend** | ghgconnect_backend_prod | 5002 | 5002 | Node.js API server |
| **Database** | ghgconnect_db_prod | 5432 | 5433 | PostgreSQL database |
| **Redis** | ghgconnect_redis_prod | 6379 | 6380 | Redis cache |

### Production Network
- **Network Name**: `ghgconnect-prod-network`
- **Database**: `ghgconnect_db_prod`
- **Redis**: `ghgconnect_redis_prod`

## Port Conflict Resolution

### Why These Ports?
- **5000**: Reserved for frontend (both dev and prod)
- **5001**: Development backend
- **5002**: Production backend
- **5432**: Development database
- **5433**: Production database
- **6379**: Development Redis
- **6380**: Production Redis
- **5050**: Development PgAdmin

### Complete Isolation
- ✅ **Different Networks**: `ghgconnect-dev-network` vs `ghgconnect-prod-network`
- ✅ **Different Databases**: `ghgconnect_db_dev` vs `ghgconnect_db_prod`
- ✅ **Different Ports**: No port conflicts between environments
- ✅ **Different Volumes**: Separate data persistence
- ✅ **Different Containers**: Completely separate container instances

## Quick Commands

### Start Development Environment
```bash
# Switch to development environment
.\switch-env.bat dev

# Start development containers
docker-compose -f docker-compose.dev.yml up -d

# Start frontend dev server
npm run dev
```

### Start Production Environment
```bash
# Switch to production environment
.\switch-env.bat prod

# Start production containers
docker-compose -f docker-compose.prod.yml up -d

# Build and start production frontend
npm run build
npm run start:prod
```

## Verification Commands

### Check Development Containers
```bash
docker ps --filter "name=ghgconnect.*dev"
```

### Check Production Containers
```bash
docker ps --filter "name=ghgconnect.*prod"
```

### Test Development API
```bash
curl http://localhost:5001/api/environment
```

### Test Production API
```bash
curl http://localhost:5002/api/environment
```

## Environment Switching

The `switch-env.bat` script automatically:
1. Copies the appropriate environment template to `.env`
2. Updates all port configurations
3. Ensures proper database and Redis connections

## Troubleshooting

### Port Already in Use
If you get port conflicts:
1. Check what's using the port: `netstat -ano | findstr :PORT`
2. Stop conflicting services
3. Restart the appropriate environment

### Database Connection Issues
1. Verify containers are running: `docker ps`
2. Check container logs: `docker logs ghgconnect_db_dev`
3. Verify network connectivity: `docker network ls`

### Environment Not Switching
1. Check `.env` file exists and has correct values
2. Restart containers after switching environments
3. Clear browser cache if frontend issues persist



