# 🚀 Quick Test Guide - Frontend-Backend Integration

## ✅ Everything is Connected and Ready!

The frontend and backend are now properly linked. Here's how to verify:

---

## Option 1: Quick Visual Test (Recommended)

### Step 1: Start the Server
```bash
cd GHGConnect
npm run dev
```

Wait for:
```
✓ Vite dev server running
✓ Database connection (or memory-only mode)
✓ serving on port 5000
```

### Step 2: Open the Test Page
Open your browser to:
```
http://localhost:5000/test-api.html
```

### Step 3: Click Buttons to Test
Click any button to test an API endpoint:
- ✅ **System Health** - Should show server status
- ✅ **Get Demo Vessels** - Should show 4 vessels
- ✅ **Get All Ports** - Should show 32+ ports
- ✅ **Get All Fuels** - Should show 16 fuel types
- ✅ **Get Imported Files** - Should show 3 sample files
- ✅ **Get Calculation Formulas** - Should show 20+ formulas

**If all buttons work and show data, your integration is perfect! 🎉**

---

## Option 2: Test via React App

### Step 1: Start the Server
```bash
cd GHGConnect
npm run dev
```

### Step 2: Open the Application
```
http://localhost:5000
```

### Step 3: Navigate to Data Integration Tab
Click on **"Data Integration"** in the navigation menu.

### You Should See:
✅ **Imported Files Tab**
- 3 pre-loaded sample files
- Each showing filename, record count, status

✅ **Edit Formulas Tab**
- 20+ calculation formulas
- For FuelEU, EU ETS, IMO, UK ETS frameworks
- Edit/Save functionality

✅ **Import Data Tab**
- File upload interface
- Support for CSV, XLSX, SQL files

✅ **Export Data Tab**
- Export buttons for different data types
- Multiple format options

**If you see all this data, your backend is serving data correctly! 🎉**

---

## Option 3: Browser Console Test

### Step 1: Open Browser Console
Open `http://localhost:5000` and press `F12` to open DevTools.

### Step 2: Run Test Commands
Paste these commands one by one:

```javascript
// Test 1: Health Check
fetch('/api/health').then(r => r.json()).then(console.log)
// Should show: status, uptime, database info, memory usage

// Test 2: Demo Vessels
fetch('/api/vessels/demo').then(r => r.json()).then(console.log)
// Should show: Array of 4 vessels with details

// Test 3: All Ports
fetch('/api/ports').then(r => r.json()).then(console.log)
// Should show: Array of 32+ ports

// Test 4: All Fuels
fetch('/api/fuels').then(r => r.json()).then(console.log)
// Should show: Array of 16 fuel types

// Test 5: Imported Files
fetch('/api/data-imports').then(r => r.json()).then(console.log)
// Should show: Array of 3 imported files

// Test 6: Calculation Formulas
fetch('/api/calculation-formulas').then(r => r.json()).then(console.log)
// Should show: Array of 20+ formulas
```

**If all commands return data (not errors), everything is working! 🎉**

---

## Expected Results

### ✅ System Health Response
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T...",
  "uptime": 123.456,
  "database": {
    "healthy": true,
    "details": {
      "connected": true,
      "...": "..."
    }
  },
  "mode": "database" // or "memory-only"
}
```

### ✅ Demo Vessels Response
```json
[
  {
    "id": "1",
    "name": "Atlantic Pioneer",
    "imoNumber": "9876543",
    "type": "Container Ship",
    "flag": "Germany",
    "complianceStatus": "compliant",
    "ghgIntensity": 82.4,
    "...": "..."
  },
  // ... 3 more vessels
]
```

### ✅ Ports Response
```json
[
  {
    "id": "uuid...",
    "unlocode": "NLRTM",
    "name": "Rotterdam",
    "countryIso": "NL",
    "isEu": true,
    "...": "..."
  },
  // ... 30+ more ports
]
```

### ✅ Imported Files Response
```json
[
  {
    "id": "sample-1",
    "filename": "vessel_fleet_Q1_2025.csv",
    "type": "csv",
    "uploadDate": "2025-01-15",
    "recordCount": 1247,
    "columns": ["imo_number", "vessel_name", "..."],
    "status": "imported"
  },
  // ... 2 more files
]
```

### ✅ Calculation Formulas Response
```json
[
  {
    "id": "fueleu-ghg-intensity",
    "framework": "FuelEU Maritime",
    "type": "GHG Intensity Calculation (Primary)",
    "formula": "GHG_Intensity = f_wind × (WtT + TtW)",
    "variables": {
      "f_wind": 1.0,
      "reference_value": 91.16,
      "...": "..."
    },
    "description": "Primary FuelEU GHG intensity calculation...",
    "locked": false
  },
  // ... 20+ more formulas
]
```

---

## Troubleshooting

### ❌ "Failed to fetch" errors
**Problem**: Server not running or wrong port

**Solution**:
1. Make sure server is running: `npm run dev`
2. Check you're on port 5000: `http://localhost:5000`
3. Look for server logs in terminal

### ❌ Empty arrays returned `[]`
**Problem**: Sample data not initialized

**Solution**:
1. Stop the server (Ctrl+C)
2. Delete any database state (if exists)
3. Restart: `npm run dev`
4. Server should log "Seeding initial data..."

### ❌ CORS errors in console
**Problem**: Accessing from wrong origin

**Solution**:
- Use `http://localhost:5000` (not a different port)
- Don't use `http://127.0.0.1` or IP address

### ❌ Database connection warnings
**Problem**: PostgreSQL not running

**Solution**:
- **This is normal!** App works without database
- Uses in-memory storage as fallback
- Look for: "Running in memory-only mode"

---

## What's Next?

Once you verify everything works:

### 1. Use Real Data in Components

Replace mock data with API calls using React Query:

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const { data: vessels } = useQuery({
  queryKey: ['vessels', 'demo'],
  queryFn: () => api.vessels.getDemo(),
});
```

### 2. Read the Full Documentation

- **`FRONTEND_BACKEND_CONNECTION.md`** - Detailed integration guide
- **`INTEGRATION_COMPLETE.md`** - Complete summary of changes
- Both files have examples and best practices

### 3. Explore the API Client

Check out `/client/src/lib/api.ts` for:
- All available API methods
- TypeScript types
- Usage examples

---

## Success Checklist

- [ ] Server starts without errors
- [ ] Test page (`test-api.html`) loads
- [ ] All test buttons return data
- [ ] React app Data Integration tab shows data
- [ ] Browser console commands work
- [ ] No CORS or network errors

**If all checked, your integration is COMPLETE! 🎉**

---

## Quick Commands Reference

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run database migrations (if using PostgreSQL)
npm run db:migrate

# Seed database (if using PostgreSQL)
npm run db:seed
```

---

## Test URLs

- **Main App**: http://localhost:5000
- **Test Page**: http://localhost:5000/test-api.html
- **Health Check**: http://localhost:5000/api/health
- **Vessels API**: http://localhost:5000/api/vessels/demo
- **Ports API**: http://localhost:5000/api/ports
- **Fuels API**: http://localhost:5000/api/fuels

---

**Need Help?**
Check the full documentation in:
- `FRONTEND_BACKEND_CONNECTION.md`
- `INTEGRATION_COMPLETE.md`

**Ready to code?**
The API client is at `client/src/lib/api.ts` - import and use! 🚀




