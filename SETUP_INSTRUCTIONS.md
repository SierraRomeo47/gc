# GHGConnect Setup Instructions

## Current Status ✅

I've completed the following:

1. ✅ **Installed Docker Desktop** - Version 28.4.0
2. ✅ **Fixed all password configurations** - All passwords are consistent
3. ✅ **Dockerized the entire backend** - Full Docker stack ready
4. ✅ **Created comprehensive documentation** - Complete guides available
5. ✅ **Created automated scripts** - Multiple startup options
6. ✅ **Environment Segregation** - Complete separation between dev and production

---

## 🆕 Environment Management

GHGConnect now has **complete separation** between development and production:

- **Separate Databases**: `ghgconnect_db_dev` (port 5432) and `ghgconnect_db_prod` (port 5433)
- **Visual Indicators**: Browser title, on-screen banner, and console output show current mode
- **Easy Switching**: One command to switch between environments
- **Safety Guards**: Protection against accidental production changes

📖 **See:** `ENVIRONMENT_GUIDE.md` for complete details

### Quick Environment Switch

```powershell
# Switch to Development
.\switch-env.bat dev

# Switch to Production (requires confirmation)
.\switch-env.bat prod
```

---

## Two Ways to Run (Choose One)

### 🐳 Method 1: Full Docker Stack (Recommended)

**Everything runs in Docker containers:**
- Backend (Node.js)
- PostgreSQL Database
- Redis Cache
- PgAdmin

**Benefits:**
- ✅ Consistent across all machines
- ✅ One command to start everything
- ✅ Same as production
- ✅ No local setup needed

---

### 💻 Method 2: Hybrid (Database in Docker, Backend Local)

**Only database in Docker:**
- Backend runs locally with `npm run dev`
- PostgreSQL in Docker
- Redis in Docker

**Benefits:**
- Slightly faster iteration
- Direct Node.js debugging

---

## Step 1: Wait for Docker Desktop

Docker Desktop is installed but needs to fully initialize (normal on first install).

**What to do:**
1. Look at **Windows system tray** (bottom-right corner)
2. Find the **Docker icon** (🐳 whale)
3. Wait until it says: **"Docker Desktop is running"** ✅

**This takes 2-5 minutes on first startup**

---

## Step 2: Choose Your Setup Method

Once Docker Desktop shows "running", choose one of these options:

### 🐳 Option A: Full Docker Stack (Recommended)

**Run everything in Docker:**
```powershell
cd C:\Users\Lenovo\OneDrive\Documents\GHGConnect-Cursor\GHGConnect

# Switch to development environment
.\switch-env.bat dev

# Start development containers
docker-compose -f docker-compose.dev.yml up -d

# Seed the database (first time only)
docker-compose -f docker-compose.dev.yml exec backend npm run db:seed
```

**What this does:**
- ✅ Starts all containers (backend, database, redis, pgadmin)
- ✅ Automatic hot-reloading for code changes
- ✅ All services networked together
- ✅ Consistent environment

**Access:**
- Application: http://localhost:5000
- PgAdmin: http://localhost:5050

📖 **See:** `DOCKER_SETUP_COMPLETE.md` for full details

---

### 💻 Option B: Hybrid (Database Docker, Backend Local)

**Run database in Docker, backend locally:**
```powershell
cd C:\Users\Lenovo\OneDrive\Documents\GHGConnect-Cursor\GHGConnect

# 1. Switch to development environment
.\switch-env.bat dev

# 2. Start database and redis only
docker-compose -f docker-compose.dev.yml up -d postgres redis

# 3. Wait for database to be ready
timeout /t 15

# 4. Push schema and seed data
npm run db:push
npm run db:seed

# 5. Start local development server
npm run dev
```

**What this does:**
- ✅ Database in Docker for consistency
- ✅ Backend runs locally for easier debugging
- ✅ Hot-reloading works

**Access:**
- Application: http://localhost:5000

---

### 🎯 Which Should You Choose?

**Use Full Docker (Option A) if:**
- You want maximum consistency
- You're deploying to production
- You work on multiple machines
- You want the easiest setup

**Use Hybrid (Option B) if:**
- You prefer running Node.js directly
- You need specific debugging tools
- You're very familiar with the project

**Recommendation:** **Use Full Docker!** 🐳

---

## Password Configuration Summary

All passwords are now **consistent** across the entire codebase:

### Database Passwords

**Development Environment:**
| Service | Username | Password | Port |
|---------|----------|----------|------|
| **PostgreSQL** | `ghgconnect_user` | `ghgconnect_dev_password_2024` | 5432 |
| **Redis** | (none) | `ghgconnect_redis_password_2024` | 6379 |
| **PgAdmin** | `admin@ghgconnect.local` | `admin123` | 5050 |

**Production Environment:**
| Service | Username | Password | Port |
|---------|----------|----------|------|
| **PostgreSQL** | `ghgconnect_user` | **CHANGE_THIS** | 5433 |
| **Redis** | (none) | **CHANGE_THIS** | 6380 |

⚠️ **Important:** Update production passwords in `env.production.template` before using production mode!

### Application Users (After Seeding)
| Email | Password | Role |
|-------|----------|------|
| `admin@ghgconnect.com` | `admin123` | Admin |
| `compliance@ghgconnect.com` | `admin123` | Compliance |
| `fleetmanager@ghgconnect.com` | `admin123` | Fleet Manager |

📖 **Full details:** See `PASSWORD_CONFIGURATION.md`

---

## Password Locations (Already Updated)

I've ensured these files all use the correct password (`ghgconnect_dev_password_2024`):

1. ✅ `docker-compose.yml` - Line 11
2. ✅ `server/db.ts` - Line 6  
3. ✅ `setup-database.bat` - Documentation
4. ✅ `setup-database.sh` - Documentation

**You don't need to change anything - it's all consistent now!**

---

## Verification Steps

After starting everything, verify it's working:

### 1. Check Database Connection
```powershell
docker ps
# Should show: ghgconnect_db (Up)
```

### 2. Check Application Health
Visit: http://localhost:5000/api/health

Should return:
```json
{
  "status": "healthy",
  "mode": "database",
  "database": {
    "connected": true
  }
}
```

### 3. Check Vessels API
Visit: http://localhost:5000/api/vessels/all

Should return **26 vessels** from the database

### 4. Open the Application
Visit: http://localhost:5000

Should show the GHGConnect dashboard

---

## Testing the Full Setup

Run the automated test:
```powershell
.\test-communication.bat
```

Should show:
- ✅ Server running
- ✅ API accessible
- ✅ Database connected
- ✅ Frontend accessible
- ✅ Mode: "database" (not "memory-only")

---

## What Changed (Summary)

### 🔧 Fixed
- ✅ Database password in `server/db.ts` (was `postgresasd` → now `ghgconnect_dev_password_2024`)
- ✅ All configuration files updated to use consistent passwords
- ✅ Docker Desktop installed and configured

### 📝 Created
- ✅ `PASSWORD_CONFIGURATION.md` - Complete password documentation
- ✅ `START_EVERYTHING.bat` - Automated setup script
- ✅ `setup-database.bat` - Database-only setup
- ✅ `SETUP_INSTRUCTIONS.md` - This file
- ✅ Updated `HYBRID_SYSTEM_GUIDE.md`
- ✅ Updated `README.md`

### 🗂️ Scripts Available
- `START_EVERYTHING.bat` - Complete setup (recommended)
- `setup-database.bat` - Database only
- `start-dev.bat` - Development server only
- `test-communication.bat` - Verify everything works

---

## Troubleshooting

### Issue: Docker says "not running"
**Solution:**
1. Open Docker Desktop from Start Menu
2. Wait for it to show "Docker Desktop is running" in system tray
3. Try again

### Issue: Port 5432 already in use
**Solution:**
```powershell
# Stop existing PostgreSQL
docker-compose down
# Or if you have PostgreSQL installed locally:
Stop-Service postgresql-x64-16
```

### Issue: Database connection fails
**Solution:**
1. Verify Docker is running: `docker ps`
2. Check database container: `docker logs ghgconnect_db`
3. Verify password in `server/db.ts` matches `docker-compose.yml`
4. Restart containers: `docker-compose restart`

### Issue: No vessels showing
**Solution:**
```powershell
# Re-seed the database
npm run db:seed
```

---

## Next Steps

1. **Wait** for Docker Desktop to show "running" in system tray
2. **Run** `.\START_EVERYTHING.bat`
3. **Open** http://localhost:5000
4. **Login** with `admin@ghgconnect.com` / `admin123`
5. **See** all 26 vessels in the dashboard

---

## File Overview

```
GHGConnect/
├── START_EVERYTHING.bat        ← 🎯 Run this to start everything
├── start-dev.bat               ← Start dev server only
├── setup-database.bat          ← Setup database only
├── test-communication.bat      ← Test if everything works
│
├── PASSWORD_CONFIGURATION.md   ← 📖 All passwords documented
├── SETUP_INSTRUCTIONS.md       ← 📖 This file
├── HYBRID_SYSTEM_GUIDE.md      ← 📖 System architecture
│
├── docker-compose.yml          ← Docker configuration
├── server/db.ts                ← Database connection
└── package.json                ← npm scripts
```

---

## Summary

Everything is ready! The only thing left is:

1. ✅ Docker Desktop is installed
2. ⏳ Wait for Docker Desktop to fully start
3. ▶️ Run `.\START_EVERYTHING.bat`
4. 🎉 All 26 vessels will be accessible!

**All passwords are consistent - no changes needed from you!**

---

## Environment Indicators

You'll always know which environment you're in through multiple visual indicators:

### 1. Browser Tab Title
- `[DEV] GHGConnect` - Development mode
- `[PROD] GHGConnect` - Production mode

### 2. On-Screen Banner (Top of Page)
- **Green Banner** with "🔧 DEVELOPMENT MODE" - Safe to experiment
- **Red Banner** with "⚠️ PRODUCTION MODE" - Be careful, live data!

### 3. Console Output
Server startup shows:
```
======================================================================
🚀 GHGConnect Server Starting
======================================================================
📦 ENVIRONMENT: DEVELOPMENT
🗄️  DATABASE: ghgconnect_db_dev
🔌 PORT: 5000
======================================================================
```

---

## Complete Documentation Index

| Document | Purpose |
|----------|---------|
| `ENVIRONMENT_GUIDE.md` | Complete environment management guide |
| `SETUP_INSTRUCTIONS.md` | This file - Initial setup |
| `HYBRID_SYSTEM_GUIDE.md` | System architecture overview |
| `PASSWORD_CONFIGURATION.md` | All passwords documented |
| `DOCKER_SETUP_COMPLETE.md` | Docker configuration details |

---

**Created:** October 21, 2025  
**Updated:** October 21, 2025 (Environment Segregation Added)
**Status:** Ready to run  
**Next Action:** Wait for Docker Desktop, then run `START_EVERYTHING.bat` or use `.\start-dev.bat`


