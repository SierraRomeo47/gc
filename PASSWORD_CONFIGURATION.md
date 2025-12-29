# GHGConnect Password Configuration Guide

## Overview
This document lists **ALL** passwords used in the GHGConnect system and their locations. All passwords are configured to be consistent across the entire codebase.

---

## Master Password List

### 1. PostgreSQL Database
- **Password:** `ghgconnect_dev_password_2024`
- **User:** `ghgconnect_user`
- **Database:** `ghgconnect_db`
- **Connection String:** `postgresql://ghgconnect_user:ghgconnect_dev_password_2024@localhost:5432/ghgconnect_db`

**Where Used:**
- ✅ `docker-compose.yml` - Line 11 (`POSTGRES_PASSWORD`)
- ✅ `server/db.ts` - Line 6 (`DATABASE_URL`)
- ✅ `setup-database.bat` - Line 88 (documentation)
- ✅ `setup-database.sh` - Line 79 (documentation)

---

### 2. Redis Cache
- **Password:** `ghgconnect_redis_password_2024`
- **Port:** `6379`

**Where Used:**
- ✅ `docker-compose.yml` - Line 32 (`requirepass`)

---

### 3. PgAdmin (Database Management UI)
- **Email:** `admin@ghgconnect.local`
- **Password:** `admin123`
- **URL:** http://localhost:5050

**Where Used:**
- ✅ `docker-compose.yml` - Lines 51-52
- ✅ `setup-database.bat` - Lines 99-101 (documentation)
- ✅ `setup-database.sh` - Lines 91-93 (documentation)

---

### 4. Application Users (Demo/Test)
These are application-level users, NOT database users:

#### Admin User
- **Email:** `admin@ghgconnect.com`
- **Password:** `admin123`
- **Role:** Admin
- **Location:** `server/data/seedData.ts` (created during seeding)

#### Compliance Officer
- **Email:** `compliance@ghgconnect.com`
- **Password:** `admin123`
- **Role:** Compliance
- **Location:** `server/data/seedData.ts`

#### Fleet Manager
- **Email:** `fleetmanager@ghgconnect.com`
- **Password:** `admin123`
- **Role:** Fleet Manager
- **Location:** `server/data/seedData.ts`

#### Other Demo Users
- **Analyst:** `analyst@ghgconnect.com` / `admin123`
- **Commercial:** `commercial@ghgconnect.com` / `admin123`
- **Tech Super:** `techsuper@ghgconnect.com` / `admin123`

---

## Environment Variables

### Development (.env - LOCAL ONLY)
```bash
# Database Connection
DATABASE_URL=postgresql://ghgconnect_user:ghgconnect_dev_password_2024@localhost:5432/ghgconnect_db

# Session Secret
SESSION_SECRET=ghgconnect_dev_secret_change_in_production

# Redis Connection
REDIS_URL=redis://:ghgconnect_redis_password_2024@localhost:6379

# Environment
NODE_ENV=development
PORT=5000
```

### Production (.env.production)
```bash
# Database Connection (CHANGE THIS IN PRODUCTION!)
DATABASE_URL=postgresql://ghgconnect_user:CHANGE_THIS_IN_PRODUCTION@production-host:5432/ghgconnect_db

# Session Secret (CHANGE THIS IN PRODUCTION!)
SESSION_SECRET=CHANGE_THIS_TO_RANDOM_STRING_IN_PRODUCTION

# Redis Connection (CHANGE THIS IN PRODUCTION!)
REDIS_URL=redis://:CHANGE_THIS_IN_PRODUCTION@redis-host:6379

# Environment
NODE_ENV=production
PORT=5000
```

---

## Files with Hardcoded Configurations

### ✅ Correctly Configured

1. **`docker-compose.yml`** - Lines 10-12
   ```yaml
   POSTGRES_USER: ghgconnect_user
   POSTGRES_PASSWORD: ghgconnect_dev_password_2024
   POSTGRES_DB: ghgconnect_db
   ```

2. **`server/db.ts`** - Line 6
   ```typescript
   const DATABASE_URL = "postgresql://ghgconnect_user:ghgconnect_dev_password_2024@localhost:5432/ghgconnect_db";
   ```

3. **`setup-database.bat`** - Lines 86-88
4. **`setup-database.sh`** - Lines 77-79

---

## How to Change Passwords

### For Development

1. **PostgreSQL Password:**
   - Update in `docker-compose.yml` (line 11)
   - Update in `server/db.ts` (line 6)
   - Update in documentation files if needed

2. **Redis Password:**
   - Update in `docker-compose.yml` (line 32)
   - Update in your `.env` file (if you create one)

3. **PgAdmin Password:**
   - Update in `docker-compose.yml` (line 52)

### For Production

1. **NEVER use these development passwords in production**
2. Generate strong random passwords:
   ```bash
   # Generate strong passwords (PowerShell)
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
   
   # Generate strong passwords (Linux/Mac)
   openssl rand -base64 32
   ```

3. Set environment variables in your production environment:
   ```bash
   export DATABASE_URL="postgresql://user:STRONG_PASSWORD@host:5432/db"
   export SESSION_SECRET="STRONG_RANDOM_STRING"
   export REDIS_URL="redis://:STRONG_PASSWORD@host:6379"
   ```

4. Never commit `.env.production` to version control

---

## Security Best Practices

### ✅ DO
- Use environment variables for production passwords
- Generate strong random passwords
- Rotate passwords regularly
- Use different passwords for each service
- Keep passwords in secure password managers

### ❌ DON'T
- Commit passwords to Git
- Share passwords in plain text
- Reuse passwords across environments
- Use simple or default passwords in production
- Hardcode production passwords in source code

---

## Troubleshooting

### "Password authentication failed"
**Cause:** Password mismatch between configuration files

**Solution:**
1. Check `docker-compose.yml` (line 11) - This is the SOURCE OF TRUTH
2. Verify `server/db.ts` (line 6) matches
3. If using `.env`, verify `DATABASE_URL` matches
4. Restart Docker containers: `docker-compose restart`

### "Could not connect to database"
**Cause:** Database not running or wrong password

**Solution:**
1. Start database: `docker-compose up -d postgres`
2. Check database is running: `docker ps`
3. Test connection:
   ```bash
   docker exec ghgconnect_db pg_isready -U ghgconnect_user -d ghgconnect_db
   ```

### "Redis connection refused"
**Cause:** Redis not running or wrong password

**Solution:**
1. Start Redis: `docker-compose up -d redis`
2. Test connection:
   ```bash
   docker exec ghgconnect_redis redis-cli -a ghgconnect_redis_password_2024 ping
   ```

---

## Quick Reference Table

| Service | Username/Email | Password | Port | File Location |
|---------|---------------|----------|------|---------------|
| **PostgreSQL** | `ghgconnect_user` | `ghgconnect_dev_password_2024` | 5432 | `docker-compose.yml`, `server/db.ts` |
| **Redis** | (none) | `ghgconnect_redis_password_2024` | 6379 | `docker-compose.yml` |
| **PgAdmin** | `admin@ghgconnect.local` | `admin123` | 5050 | `docker-compose.yml` |
| **App Admin** | `admin@ghgconnect.com` | `admin123` | - | `server/data/seedData.ts` |
| **App Users** | `<role>@ghgconnect.com` | `admin123` | - | `server/data/seedData.ts` |

---

## After Password Changes

1. **Stop all services:**
   ```bash
   docker-compose down
   ```

2. **Remove old volumes (if needed):**
   ```bash
   docker-compose down -v
   ```

3. **Start services:**
   ```bash
   docker-compose up -d
   ```

4. **Restart application:**
   ```bash
   npm run dev
   ```

---

**Last Updated:** October 21, 2025  
**Version:** 1.0.0  
**Status:** All passwords consistent and documented ✅



