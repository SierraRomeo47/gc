# 🚢 How to Run GHGConnect Locally

Quick guide to get the application running with a production-grade local database.

---

## 🎯 Choose Your Setup

### 🚀 Option 1: Production Setup (Recommended)
**PostgreSQL + Redis + Full Features**

```bash
# Windows
.\setup-local-db.bat

# Mac/Linux
chmod +x setup-local-db.sh
./setup-local-db.sh
```

**What you get:**
- ✅ PostgreSQL 16 database
- ✅ Redis caching
- ✅ PgAdmin web UI
- ✅ Connection pooling
- ✅ Performance indexes
- ✅ Audit logging
- ✅ Production-ready setup

**Access:**
- Application: http://localhost:5000
- PgAdmin: http://localhost:5050
- Database: localhost:5432

---

### ⚡ Option 2: Quick Start (In-Memory)
**Fast setup for testing**

```bash
cd GHGConnect
npm install
npm run db:seed
npm run dev
```

**What you get:**
- ✅ Quick startup
- ✅ No Docker required
- ✅ In-memory storage
- ⚠️ Data cleared on restart

**Access:**
- Application: http://localhost:5000

---

## 📋 Step-by-Step Instructions

### Production Setup (Detailed)

#### 1. Prerequisites
```bash
# Check Docker
docker --version

# Check Node.js
node --version

# Should see versions printed
```

#### 2. Start Database
```bash
# Navigate to project
cd GHGConnect

# Run setup script
.\setup-local-db.bat  # Windows
# OR
./setup-local-db.sh   # Mac/Linux
```

#### 3. Verify Services
```bash
# Check Docker containers
docker-compose ps

# Should see: postgres, redis, pgadmin (all Up)
```

#### 4. Check Health
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": {
    "healthy": true,
    "details": {
      "connected": true
    }
  }
}
```

#### 5. Login
- URL: http://localhost:5000
- Email: `admin@ghgconnect.com`
- Password: `admin123`

---

## 🗂️ What's Included

After setup, you have:

### 📊 Data
- **30 Ports** - EU, UK, and international
- **16 Fuel Types** - All major marine fuels
- **5 Vessels** - Diverse fleet
- **25 Voyages** - Last 90 days
- **100 Consumption Records** - Detailed fuel usage

### 🔐 Users
- **Admin** - admin@ghgconnect.com / admin123
- **Compliance** - compliance@ghgconnect.com / admin123

### 🛠️ Services
- **PostgreSQL** - Main database (port 5432)
- **Redis** - Caching (port 6379)
- **PgAdmin** - Database UI (port 5050)

---

## 🧪 Test the Application

### 1. Public API (No Login Required)

```bash
# System health
curl http://localhost:5000/api/health

# Port count
curl http://localhost:5000/api/public/stats

# All ports
curl http://localhost:5000/api/ports

# All fuels
curl http://localhost:5000/api/fuels
```

### 2. Protected API (Login Required)

```bash
# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ghgconnect.com","password":"admin123"}'

# Save the token from response, then:

# Get vessels
curl http://localhost:5000/api/v1/vessels \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get voyages
curl http://localhost:5000/api/voyages \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🎨 Features to Explore

### Dashboard
- Real-time compliance metrics
- Fleet-wide emissions
- Penalty risk assessment

### Vessels
- View 5 vessels
- Track specifications
- Monitor voyage history

### Voyages
- 25 pre-loaded voyages
- Route visualization
- Fuel consumption

### Compliance
- **FuelEU Maritime** calculator
- **EU ETS** calculator
- **IMO** calculator
- **UK ETS** calculator

### Data Management
- Import CSV/XLSX files
- Export in multiple formats
- Validation and error reporting

---

## 🛠️ Common Operations

### Stop Services
```bash
docker-compose stop
```

### Restart Services
```bash
docker-compose restart
```

### Stop and Remove Data
```bash
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# PostgreSQL only
docker-compose logs -f postgres
```

### Access Database
```bash
# Command line
docker exec -it ghgconnect_db psql -U ghgconnect_user -d ghgconnect_db

# Web UI
Open http://localhost:5050
```

### Reset Everything
```bash
# Stop and remove
docker-compose down -v

# Start fresh
.\setup-local-db.bat
```

---

## 🐛 Troubleshooting

### Problem: Port 5000 already in use

**Solution 1** - Use different port:
```bash
$env:PORT=3000  # PowerShell
npm run dev
```

**Solution 2** - Find and stop conflicting process:
```bash
netstat -ano | findstr :5000
```

### Problem: Docker containers won't start

**Check Docker Desktop is running:**
```bash
docker ps
```

**Restart Docker Desktop:**
- Windows: Right-click system tray → Restart
- Mac: Docker menu → Restart

### Problem: Can't connect to database

**Check services:**
```bash
docker-compose ps
```

**View logs:**
```bash
docker-compose logs postgres
```

**Restart database:**
```bash
docker-compose restart postgres
```

### Problem: No data after restart

**In-memory mode** (no Docker):
```bash
npm run db:seed
```

**PostgreSQL mode** (Docker):
```bash
# Data should persist, but if needed:
npm run db:seed
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **RUN_APPLICATION.md** (this file) | How to run the app |
| **QUICK_START.md** | 5-minute overview |
| **LOCAL_DATABASE_SETUP.md** | Database details |
| **PRODUCTION_SETUP_GUIDE.md** | Production-grade setup |
| **START_HERE.md** | API documentation |
| **SETUP_COMPLETE.md** | What was built |
| **FIXES_AND_IMPROVEMENTS.md** | Change log |

---

## 🎯 Quick Reference

### Starting Application

| Mode | Command | Database | Data Persistence |
|------|---------|----------|------------------|
| Production | `.\setup-local-db.bat` | PostgreSQL | ✅ Persistent |
| Development | `npm run dev` | In-memory | ❌ Cleared on restart |

### Accessing Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Application | http://localhost:5000 | admin@ghgconnect.com / admin123 |
| PgAdmin | http://localhost:5050 | admin@ghgconnect.local / admin123 |
| PostgreSQL | localhost:5432 | ghgconnect_user / ghgconnect_dev_password_2024 |

### API Endpoints

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `/api/health` | No | System health |
| `/api/public/stats` | No | Data counts |
| `/api/ports` | No | All ports |
| `/api/fuels` | No | All fuels |
| `/api/v1/vessels` | Yes | Vessels |
| `/api/voyages` | Yes | Voyages |

---

## ✨ Next Steps

1. ✅ **Application is running** ← You are here
2. 🔐 **Login** → http://localhost:5000
3. 📊 **Explore Dashboard** → View metrics
4. 🚢 **Check Vessels** → See the fleet
5. 🧮 **Run Calculations** → Test compliance
6. 📥 **Import Data** → Add your own data
7. 📤 **Export Reports** → Generate reports

---

## 🎉 You're Ready!

The application is fully set up and ready to use!

**For more help:**
- Quick reference: `QUICK_START.md`
- API docs: `START_HERE.md`
- Database info: `LOCAL_DATABASE_SETUP.md`
- Production setup: `PRODUCTION_SETUP_GUIDE.md`

---

**Happy shipping! ⚓**

**Last Updated**: October 20, 2025

