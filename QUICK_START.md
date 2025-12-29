# 🚀 GHGConnect - Quick Start Guide

Welcome to GHGConnect! This guide will get you up and running in **5 minutes**.

## ⚡ Super Quick Start

### Windows Users
```cmd
cd GHGConnect
.\SETUP_AND_RUN.bat
```

That's it! The script does everything automatically.

### Mac/Linux Users
```bash
cd GHGConnect
npm install
npm run db:seed
npm run dev
```

### Access
- **URL**: http://localhost:5000
- **Login**: admin@ghgconnect.com / admin123

---

## 📖 Documentation Index

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **QUICK_START.md** (this file) | Get running in 5 minutes | START HERE |
| **START_HERE.md** | Comprehensive setup guide | After quick start |
| **SETUP_COMPLETE.md** | What was built and how it works | Understanding the system |
| **FIXES_AND_IMPROVEMENTS.md** | Complete change log | See what was fixed |
| **README.md** | Full project documentation | Deep dive |

---

## 🎯 What You Get

After running the setup, you'll have:

✅ **30 Ports** - EU, UK, and international locations
✅ **16 Fuels** - All major fuel types with emission factors
✅ **5 Vessels** - Diverse fleet with different vessel types
✅ **25 Voyages** - Realistic routes over last 90 days
✅ **100 Consumption Records** - Detailed fuel usage data
✅ **2 User Accounts** - Admin and Compliance users

---

## 🔑 Login Credentials

### Admin User (Full Access)
- **Email**: admin@ghgconnect.com
- **Password**: admin123

### Compliance User (View & Compliance)
- **Email**: compliance@ghgconnect.com
- **Password**: admin123

---

## ✅ Quick Test

After starting the server, test it works:

```bash
curl http://localhost:5000/api/public/stats
```

**Expected Response**:
```json
{
  "portsCount": 30,
  "fuelsCount": 16,
  "status": "healthy"
}
```

✅ If you see this, everything is working!

---

## 🗺️ What to Explore

1. **Dashboard** → Overview of fleet and compliance metrics
2. **Vessels** → View the 5 vessels in your fleet
3. **Voyages** → Browse 25 voyages with routes
4. **Compliance** → Run calculations for different frameworks
5. **Data Import** → Import your own CSV/XLSX files

---

## 🆘 Troubleshooting

### Problem: Port 5000 already in use
```bash
# Use a different port
PORT=3000 npm run dev
```

### Problem: No data showing
```bash
# Re-seed the database
npm run db:seed
```

### Problem: Can't login
- Check email: `admin@ghgconnect.com`
- Check password: `admin123` (case-sensitive)
- Clear browser cookies if needed

---

## 📚 Next Steps

1. ✅ **You've started the server** ← You are here
2. 📖 **Read START_HERE.md** ← Learn more details
3. 🔍 **Explore the UI** ← Try the features
4. 🧪 **Test the API** ← Use curl commands
5. 📊 **Import your data** ← Add your own vessels/voyages

---

## 🎨 Features Overview

### ✨ Core Features
- Multi-tenant architecture
- Role-based access control
- JWT authentication
- Audit logging

### 📊 Compliance Calculators
- **FuelEU Maritime** - GHG intensity tracking
- **EU ETS** - Emissions trading system
- **IMO Net Zero** - CII rating
- **UK ETS** - UK emissions tracking

### 💾 Data Management
- CSV/XLSX import
- Data validation
- Multi-format export
- Batch processing

---

## 🚢 Sample Data

### Vessels in Fleet
1. **MV Atlantic Pioneer** - Container Ship (NL)
2. **MV Nordic Explorer** - Bulk Carrier (NO)
3. **MV Baltic Star** - Tanker (DK)
4. **MV Mediterranean Express** - Container Ship/LNG (IT)
5. **MV Thames Voyager** - Ro-Ro Cargo (GB)

### Sample Routes
- Rotterdam → Hamburg → London
- Le Havre → Valencia → Genoa
- Rotterdam → New York (Extra-EU)
- Amsterdam → Singapore (Extra-EU)

---

## 🔗 Important Links

- **Application**: http://localhost:5000
- **API Health**: http://localhost:5000/api/public/stats
- **Ports API**: http://localhost:5000/api/ports
- **Fuels API**: http://localhost:5000/api/fuels

---

## 💪 You're Ready!

The application is now running with comprehensive synthetic data. 

**Start exploring**: http://localhost:5000

**Need help?** Check these files in order:
1. START_HERE.md (detailed guide)
2. SETUP_COMPLETE.md (technical details)
3. README.md (full documentation)

---

**Happy sailing! ⚓**

