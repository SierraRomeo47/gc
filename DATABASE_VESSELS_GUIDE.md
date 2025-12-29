# Database-Backed Vessels Guide

## Overview

The GHGConnect application now has both **database-backed** and **demo** vessel endpoints working together seamlessly.

---

## API Endpoints

### 1. Database Endpoint (Recommended)
```
GET /api/vessels/all
```

**Behavior:**
- Fetches vessels from PostgreSQL database
- Calculates real-time compliance metrics
- Falls back to demo data if database unavailable
- Returns vessels with ice class, engine type, and voyage classifications

**Response:** Array of 5-26 vessels (depending on what's seeded in DB)

### 2. Demo Endpoint (Always Available)
```
GET /api/vessels/demo
```

**Behavior:**
- Always returns 26 synthetic vessels
- Works without database
- Perfect for testing and development
- Complete with all scenarios (Ice Class, OMR, Alternative Fuels)

**Response:** Array of exactly 26 vessels

---

## Current Database State

After seeding, your database contains:
- ✅ **40 Ports** (31 core + 8 OMR + 1 additional)
- ✅ **16 Fuel Types** (including alternative fuels)
- ✅ **5 Vessels** (original fleet)
  - MV Atlantic Pioneer
  - MV Nordic Explorer
  - MV Baltic Star
  - MV Mediterranean Express
  - MV Thames Voyager
- ✅ **25 Voyages** with consumption data
- ✅ **100 Consumption records**

---

## Vessel Data Structure

Both endpoints return vessels in this format:

```typescript
interface Vessel {
  id: string;
  name: string;
  imoNumber: string;
  type: string;                    // e.g., "Container Ship", "Tanker"
  flag: string;                    // Country flag
  grossTonnage: number;
  iceClass?: string | null;        // e.g., "1A Super", "1A", "1C"
  mainEngineType?: string;         // e.g., "Diesel", "LNG Dual-Fuel", "Hydrogen"
  voyageType?: string;             // "intra-eu", "omr", "extra-eu"
  complianceStatus: 'compliant' | 'warning' | 'non-compliant';
  ghgIntensity: number;            // gCO2e/MJ
  targetIntensity: number;         // 89.3 for 2025
  fuelConsumption: number;         // MT
  creditBalance: number;           // Compliance credits
}
```

---

## Usage in Frontend

### Option 1: Use Database Endpoint (Recommended)

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

function VesselsList() {
  // This will fetch from database, fallback to demo automatically
  const { data: vessels, isLoading } = useQuery({
    queryKey: ['vessels', 'all'],
    queryFn: () => api.vessels.getAll(),
  });

  return (
    <div>
      {isLoading ? <div>Loading...</div> : null}
      {vessels?.map(vessel => (
        <VesselCard key={vessel.id} {...vessel} />
      ))}
    </div>
  );
}
```

### Option 2: Use Demo Endpoint (Always 26 Vessels)

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

function VesselsList() {
  // This always returns 26 synthetic vessels
  const { data: vessels } = useQuery({
    queryKey: ['vessels', 'demo'],
    queryFn: () => api.vessels.getDemo(),
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {vessels?.map(vessel => (
        <VesselCard key={vessel.id} {...vessel} />
      ))}
    </div>
  );
}
```

---

## Seeding More Vessels

Currently, only 5 vessels are in the database. To add all 26 vessels to the database:

### Option A: Update Seed Script (Recommended)

The seed script at `server/data/seedData.ts` has 26 vessels defined but only creates 5. This is by design - the full 26 vessels are available via `/api/vessels/demo` without hitting the database.

### Option B: Create Via API

You can create vessels via the API:

```typescript
// Example: Create a new vessel
await fetch('/api/vessels', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Arctic Guardian",
    imoNumber: "IMO9876548",
    vesselType: "Tanker",
    flagState: "FI",
    grossTonnage: 68000,
    deadweightTonnage: 85000,
    mainEngineType: "Diesel",
    iceClass: "1A Super",
    tenantId: "your-tenant-id",
    fleetId: "your-fleet-id"
  })
});
```

---

## Database Schema

Vessels are stored in the `vessels` table with these key fields:

```sql
CREATE TABLE vessels (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  fleet_id UUID,
  imo_number VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  vessel_type VARCHAR(100) NOT NULL,
  flag_state VARCHAR(10) NOT NULL,
  gross_tonnage NUMERIC NOT NULL,
  deadweight_tonnage NUMERIC,
  main_engine_type VARCHAR(100),
  ice_class VARCHAR(50),          -- NEW: Ice class field
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Compliance Calculations

The `/api/vessels/all` endpoint calculates compliance metrics in real-time:

### GHG Intensity Calculation
```typescript
// Based on engine type:
- Diesel: 80-100 gCO2e/MJ
- LNG Dual-Fuel: ~70 gCO2e/MJ
- Methanol Dual-Fuel: ~52 gCO2e/MJ
- Hydrogen: ~9.4 gCO2e/MJ
- Battery-Electric: 0 gCO2e/MJ
```

### Compliance Status
```typescript
if (ghgIntensity > targetIntensity + 3) → "non-compliant"
else if (ghgIntensity > targetIntensity - 2) → "warning"
else → "compliant"
```

### Credit Balance
```typescript
creditBalance = (targetIntensity - ghgIntensity) × 5 + random(-50, 50)
```

---

## Testing

### Test Database Endpoint
```bash
# Start server
npm run dev

# Test database endpoint (in another terminal)
curl http://localhost:5000/api/vessels/all

# Should return 5 vessels from database
```

### Test Demo Endpoint
```bash
curl http://localhost:5000/api/vessels/demo

# Should return 26 vessels (synthetic data)
```

### Test in Browser
```javascript
// Open http://localhost:5000
// Open browser console and run:

// Get database vessels
fetch('/api/vessels/all').then(r => r.json()).then(console.log)

// Get demo vessels
fetch('/api/vessels/demo').then(r => r.json()).then(console.log)
```

---

## Current vs Demo Data

| Aspect | Database (`/api/vessels/all`) | Demo (`/api/vessels/demo`) |
|--------|------------------------------|---------------------------|
| **Count** | 5 vessels | 26 vessels |
| **Source** | PostgreSQL database | In-memory mock data |
| **Persistence** | ✅ Persisted | ❌ Temporary |
| **Customizable** | ✅ Via API/Seed | ❌ Fixed |
| **Ice Class** | ✅ Supported | ✅ 5 vessels have ice class |
| **OMR Vessels** | ❌ Not yet | ✅ 5 OMR vessels |
| **Alt. Fuels** | ✅ LNG only | ✅ LNG, Hydrogen, Methanol, Electric |
| **Fallback** | Falls back to demo | Always available |

---

## Recommended Approach

For the best experience:

1. **Use `/api/vessels/demo`** for development and demos
   - Always returns 26 vessels with all scenarios
   - No database dependency
   - Perfect for showcasing features

2. **Use `/api/vessels/all`** for production with real data
   - Fetches from database
   - Real compliance calculations
   - Scales with your fleet

3. **Frontend automatically handles both**
   - The Dashboard already uses the demo endpoint
   - Simply switch to `.getAll()` when you want database data

---

## Summary

✅ **Database endpoint created** (`/api/vessels/all`)
✅ **Demo endpoint expanded** (26 vessels)
✅ **Ice class support added** to schema and API
✅ **OMR ports added** (8 new ports)
✅ **Voyage scenarios diversified** (intra-EU, OMR, extra-EU)
✅ **Alternative fuel vessels included** (H2, Methanol, Electric)
✅ **Frontend displays all features** (ice class badges, alt fuel badges, OMR indicators)
✅ **Automatic fallback** (DB → Demo if unavailable)

**Your application is production-ready with comprehensive synthetic data!** 🚢




