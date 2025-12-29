# Environment Management - Quick Reference Card

## 🚀 Quick Commands

### Switch Environment

| Action | Windows | Linux/Mac |
|--------|---------|-----------|
| **Switch to Dev** | `.\switch-env.bat dev` | `./switch-env.sh dev` |
| **Switch to Prod** | `.\switch-env.bat prod` | `./switch-env.sh prod` |

### Start Application

| Action | Windows | Linux/Mac |
|--------|---------|-----------|
| **Start Dev** | `.\start-dev.bat` | `./start-dev.sh` |
| **Start Prod** | `.\start-prod.bat` | `./start-prod.sh` |

### Docker Commands

```bash
# Development
docker-compose -f docker-compose.dev.yml up -d      # Start
docker-compose -f docker-compose.dev.yml down       # Stop
docker-compose -f docker-compose.dev.yml logs -f    # View logs

# Production
docker-compose -f docker-compose.prod.yml up -d     # Start
docker-compose -f docker-compose.prod.yml down      # Stop
docker-compose -f docker-compose.prod.yml logs -f   # View logs
```

---

## 📊 Environment Configuration

| Setting | Development | Production |
|---------|-------------|------------|
| **Database** | `ghgconnect_db_dev` | `ghgconnect_db_prod` |
| **PostgreSQL Port** | 5432 | 5433 |
| **Redis Port** | 6379 | 6380 |
| **App Port** | 5000 | 5000 |
| **Password** | Simple (dev) | Strong required |

---

## 🎨 Visual Indicators

### How to Know Your Current Environment

1. **Browser Tab Title**
   - `[DEV] GHGConnect` = Development
   - `[PROD] GHGConnect` = Production

2. **On-Screen Banner**
   - 🟢 Green = Development
   - 🔴 Red = Production

3. **Console Output**
   - Shows environment on startup

4. **Check API**
   ```bash
   curl http://localhost:5000/api/environment
   ```

---

## 🔒 Safety Reminders

### Before Using Production

- [ ] Update passwords in `env.production.template`
- [ ] Review all configuration settings
- [ ] Test backup/restore procedures
- [ ] Verify monitoring is enabled
- [ ] Double-check database name

### Production Safety Features

- ✅ Confirmation prompts required
- ✅ Weak passwords rejected
- ✅ Red banner always visible
- ✅ Console warnings on startup

---

## 🗄️ Database Access

### Development Database

```bash
# Command line
psql postgresql://ghgconnect_user:ghgconnect_dev_password_2024@localhost:5432/ghgconnect_db_dev

# PgAdmin
URL: http://localhost:5050
Email: admin@ghgconnect.local
Password: admin123
```

### Production Database

```bash
# Command line
psql postgresql://ghgconnect_user:YOUR_PASSWORD@localhost:5433/ghgconnect_db_prod

# Direct connection only (no PgAdmin in production)
```

---

## ⚡ NPM Scripts

```bash
# Development
npm run dev              # Start dev server
npm run db:push:dev      # Push schema to dev
npm run db:seed:dev      # Seed dev database

# Production
npm run start            # Start prod server
npm run db:push:prod     # Push schema to prod
npm run db:seed:prod     # Seed prod database

# Environment switching
npm run env:dev          # Switch to development
npm run env:prod         # Switch to production
```

---

## 🆘 Troubleshooting

### Issue: Wrong Environment

```bash
# Check current environment
.\switch-env.bat         # Shows help and options

# Force switch to dev
.\switch-env.bat dev
```

### Issue: Port Already in Use

```bash
# Stop all containers
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.prod.yml down

# Check what's running
docker ps
```

### Issue: Database Not Found

```bash
# Recreate database
docker-compose -f docker-compose.dev.yml up -d
npm run db:push:dev
npm run db:seed:dev
```

---

## 📚 Documentation Links

| Document | Purpose |
|----------|---------|
| `ENVIRONMENT_GUIDE.md` | Complete guide (READ THIS FIRST) |
| `SETUP_INSTRUCTIONS.md` | Initial setup |
| `ENVIRONMENT_QUICK_REFERENCE.md` | This document |

---

## 🎯 Common Workflows

### First Time Setup (Development)

```powershell
1. .\switch-env.bat dev
2. docker-compose -f docker-compose.dev.yml up -d
3. npm run db:push:dev
4. npm run db:seed:dev
5. npm run dev
```

### First Time Setup (Production)

```powershell
1. Edit env.production.template (UPDATE PASSWORDS!)
2. .\switch-env.bat prod
3. docker-compose -f docker-compose.prod.yml up -d
4. npm run db:push:prod
5. npm run db:seed:prod
6. npm run start
```

### Daily Development

```powershell
1. .\start-dev.bat
   (Everything else is automatic)
```

### Switch from Dev to Prod

```powershell
1. Stop dev: docker-compose -f docker-compose.dev.yml down
2. Switch: .\switch-env.bat prod
3. Start prod: .\start-prod.bat
```

---

## ⚠️ Critical Rules

1. **NEVER** use development passwords in production
2. **ALWAYS** check the banner color before making changes
3. **CONFIRM** database name before running migrations
4. **BACKUP** production before major changes
5. **TEST** in development first

---

## 🎬 Quick Start (Most Common)

**Just want to develop?**

```powershell
.\start-dev.bat
```

**Need to switch environment?**

```powershell
.\switch-env.bat dev    # or prod
```

**Check where I am?**

Look at the browser tab or banner color!

---

**Print this page and keep it handy! 📄**

---

*Last Updated: October 21, 2025*




