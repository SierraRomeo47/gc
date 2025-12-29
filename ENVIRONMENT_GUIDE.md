# GHGConnect Environment Management Guide

## Overview

GHGConnect now has **complete separation** between development and production environments to prevent accidental data mixing and ensure data safety.

## Key Features ✨

- ✅ **Separate Databases**: Development and production use different databases
- ✅ **Different Ports**: No conflicts when running both environments
- ✅ **Easy Switching**: One command to switch between environments
- ✅ **Visual Indicators**: Always know which environment you're in
- ✅ **Safety Guards**: Protection against accidental production changes
- ✅ **Simultaneous Running**: Run both dev and prod at the same time

---

## Environment Configuration

### Development Environment

**Database Configuration:**
- Database Name: `ghgconnect_db_dev`
- PostgreSQL Port: `5432`
- Redis Port: `6379`
- Container Names: `ghgconnect_db_dev`, `ghgconnect_redis_dev`

**Application:**
- Mode: `development`
- Port: `5000`
- Hot-reloading: Enabled
- Debug logging: Enabled
- Test data: Available

### Production Environment

**Database Configuration:**
- Database Name: `ghgconnect_db_prod`
- PostgreSQL Port: `5433`
- Redis Port: `6380`
- Container Names: `ghgconnect_db_prod`, `ghgconnect_redis_prod`

**Application:**
- Mode: `production`
- Port: `5000`
- Hot-reloading: Disabled
- Debug logging: Disabled
- Strong passwords: Required

---

## Switching Between Environments

### Windows

```batch
# Switch to Development
.\switch-env.bat dev

# Switch to Production (requires confirmation)
.\switch-env.bat prod
```

### Linux/Mac

```bash
# Switch to Development
./switch-env.sh dev

# Switch to Production (requires confirmation)
./switch-env.sh prod
```

**What happens when you switch:**
1. The appropriate `.env` file is copied from the template
2. Environment variables are updated
3. Database connection string points to the correct database
4. Application configuration changes accordingly

---

## Starting the Application

### Development Mode

**Windows:**
```batch
.\start-dev.bat
```

**Linux/Mac:**
```bash
./start-dev.sh
```

**What it does:**
1. Switches to development environment
2. Installs dependencies if needed
3. Starts development server with hot-reloading
4. Connects to `ghgconnect_db_dev` on port 5432

### Production Mode

**Windows:**
```batch
.\start-prod.bat
```

**Linux/Mac:**
```bash
./start-prod.sh
```

**What it does:**
1. Switches to production environment (with confirmation)
2. Validates production configuration
3. Starts production server
4. Connects to `ghgconnect_db_prod` on port 5433

---

## Visual Indicators

### 1. Browser Tab Title

The browser tab title shows the current environment:
- `[DEV] GHGConnect` - Development
- `[PROD] GHGConnect` - Production
- `[TEST] GHGConnect` - Test (future)

### 2. On-Screen Banner

A prominent banner appears at the top of the application:
- **Green** - Development Mode (🔧 DEVELOPMENT MODE)
- **Red** - Production Mode (⚠️ PRODUCTION MODE)
- **Yellow** - Test Mode (🧪 TEST MODE)

The banner shows:
- Current environment mode
- Connected database name
- Warning messages for production

### 3. Console Output

Server startup displays clear environment information:
```
======================================================================
🚀 GHGConnect Server Starting
======================================================================
📦 ENVIRONMENT: DEVELOPMENT
🗄️  DATABASE: ghgconnect_db_dev
🔌 PORT: 5000
⏰ STARTED: 2025-10-21T...
======================================================================
```

---

## Safety Features

### Production Safety Guards

1. **Password Validation**
   - Weak passwords are rejected in production
   - Must use strong, unique passwords
   - Development passwords are blocked

2. **Confirmation Prompts**
   - Switching to production requires typing "YES"
   - Starting production requires typing "START"
   - Extra confirmation for destructive operations

3. **Visual Warnings**
   - Red banner in production mode
   - Console warnings on startup
   - Database name validation

4. **Audit Logging**
   - All production operations are logged
   - User actions are tracked
   - Changes are recorded

---

## Database Management

### Running Both Environments Simultaneously

You can run both development and production databases at the same time:

```bash
# Start development containers
docker-compose -f docker-compose.dev.yml up -d

# Start production containers (different ports)
docker-compose -f docker-compose.prod.yml up -d

# Check running containers
docker ps
```

### Database Ports

| Environment | PostgreSQL Port | Redis Port | PgAdmin Port |
|-------------|----------------|------------|--------------|
| Development | 5432           | 6379       | 5050         |
| Production  | 5433           | 6380       | N/A          |

### Accessing Databases

**Development Database:**
```bash
psql postgresql://ghgconnect_user:ghgconnect_dev_password_2024@localhost:5432/ghgconnect_db_dev
```

**Production Database:**
```bash
psql postgresql://ghgconnect_user:YOUR_STRONG_PASSWORD@localhost:5433/ghgconnect_db_prod
```

---

## Environment Files

### File Structure

```
GHGConnect/
├── env.development.template    # Development configuration
├── env.production.template     # Production configuration
├── .env                       # Active environment (gitignored)
├── docker-compose.dev.yml     # Development Docker config
├── docker-compose.prod.yml    # Production Docker config
├── switch-env.bat/sh          # Environment switcher
├── start-dev.bat/sh           # Development starter
└── start-prod.bat/sh          # Production starter
```

### Environment Variables

**Key Variables:**

| Variable | Development | Production |
|----------|-------------|------------|
| `NODE_ENV` | development | production |
| `POSTGRES_DB` | ghgconnect_db_dev | ghgconnect_db_prod |
| `POSTGRES_PORT` | 5432 | 5433 |
| `REDIS_PORT` | 6379 | 6380 |
| `POSTGRES_PASSWORD` | ghgconnect_dev_password_2024 | STRONG_PASSWORD_REQUIRED |

---

## Best Practices

### Development

1. **Use Development Mode for:**
   - Feature development
   - Testing new code
   - Experimenting with data
   - Learning the system

2. **Development Tips:**
   - Hot-reloading is enabled
   - Debug logs are verbose
   - Can use demo/test data
   - Safe to reset database

### Production

1. **Use Production Mode for:**
   - Live deployment
   - Real customer data
   - Production operations
   - Critical business functions

2. **Production Checklist:**
   - [ ] Update all passwords in `.env.production.template`
   - [ ] Verify database backups are configured
   - [ ] Test restore procedures
   - [ ] Enable monitoring and alerts
   - [ ] Review access controls
   - [ ] Document deployment procedures

---

## Security Recommendations

### Password Management

**Development:**
- Simple passwords are acceptable
- Shared among team members
- Stored in template files

**Production:**
- Generate strong passwords: `openssl rand -base64 32`
- Store in secure secret management system
- Never commit to version control
- Rotate regularly (every 90 days)
- Use different passwords for each service

### Access Control

**Development:**
- Team members have full access
- Can create/modify/delete data
- Useful for testing RBAC

**Production:**
- Strict role-based access control
- Audit logging enabled
- Regular access reviews
- Principle of least privilege

---

## Troubleshooting

### Issue: Wrong Environment Connected

**Symptoms:**
- Banner shows unexpected environment
- Database name doesn't match expected

**Solution:**
```batch
# Windows
.\switch-env.bat dev

# Linux/Mac
./switch-env.sh dev
```

### Issue: Port Already in Use

**Symptoms:**
- "Port 5432 already in use" error

**Solution:**
```bash
# Check what's using the port
docker ps

# Stop specific environment
docker-compose -f docker-compose.dev.yml down
```

### Issue: Database Not Found

**Symptoms:**
- "database does not exist" error

**Solution:**
```bash
# Create the database
docker-compose -f docker-compose.dev.yml up -d
npm run db:push
npm run db:seed
```

### Issue: Production Password Rejected

**Symptoms:**
- "Weak password detected" error in production

**Solution:**
1. Edit `.env.production.template`
2. Generate strong password: `openssl rand -base64 32`
3. Update `POSTGRES_PASSWORD` with new password
4. Update `REDIS_PASSWORD` with new password
5. Run `.\switch-env.bat prod`

---

## Migration Guide

### From Old Setup to New Environment System

If you were using the old single-environment setup:

1. **Backup Your Data:**
   ```bash
   pg_dump -h localhost -p 5432 -U ghgconnect_user ghgconnect_db > backup.sql
   ```

2. **Switch to Development:**
   ```batch
   .\switch-env.bat dev
   ```

3. **Start New Development Environment:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

4. **Restore Data (if needed):**
   ```bash
   psql postgresql://ghgconnect_user:ghgconnect_dev_password_2024@localhost:5432/ghgconnect_db_dev < backup.sql
   ```

---

## FAQ

**Q: Can I run both dev and prod at the same time?**
A: Yes! They use different ports and database names.

**Q: How do I know which environment I'm in?**
A: Check the browser tab title, on-screen banner, or console output.

**Q: What happens if I accidentally connect to production?**
A: Safety guards will show warnings. The red banner is prominent. Always double-check!

**Q: How do I backup production data?**
A: Use `pg_dump` or set up automated backups:
```bash
pg_dump -h localhost -p 5433 -U ghgconnect_user ghgconnect_db_prod > prod_backup_$(date +%Y%m%d).sql
```

**Q: Can I add a test/staging environment?**
A: Yes! Copy the pattern:
1. Create `env.test.template`
2. Create `docker-compose.test.yml`
3. Use port 5434 for test database
4. Update `switch-env` scripts

---

## Quick Reference

### Common Commands

| Action | Windows | Linux/Mac |
|--------|---------|-----------|
| Switch to Dev | `.\switch-env.bat dev` | `./switch-env.sh dev` |
| Switch to Prod | `.\switch-env.bat prod` | `./switch-env.sh prod` |
| Start Dev | `.\start-dev.bat` | `./start-dev.sh` |
| Start Prod | `.\start-prod.bat` | `./start-prod.sh` |
| Check Environment | Check banner or console | Check banner or console |

### Port Reference

| Service | Dev Port | Prod Port |
|---------|----------|-----------|
| PostgreSQL | 5432 | 5433 |
| Redis | 6379 | 6380 |
| Application | 5000 | 5000 |
| PgAdmin | 5050 | N/A |

---

## Support

If you encounter issues:

1. Check this guide first
2. Review console output for errors
3. Verify environment with `cat .env` (Linux/Mac) or `type .env` (Windows)
4. Check Docker containers: `docker ps`
5. Review logs: `docker logs ghgconnect_db_dev` or `docker logs ghgconnect_db_prod`

---

**Last Updated:** October 21, 2025
**Version:** 1.0.0




