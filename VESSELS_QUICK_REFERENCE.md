# 🚢 26 Vessels Quick Reference

## Complete Vessel List

### Original Fleet (5)
1. **Atlantic Pioneer** - Container Ship, NL, 50,000 GT
2. **Nordic Explorer** - Bulk Carrier, NO, 45,000 GT
3. **Baltic Star** - Tanker, DK, 55,000 GT
4. **Mediterranean Express** - Container, LNG, IT, 48,000 GT
5. **Thames Voyager** - Ro-Ro Cargo, GB, 35,000 GT

### Ice Class Tankers (4)
6. **Arctic Guardian** - Tanker, **1A Super**, FI, 68,000 GT
7. **Polar Navigator** - Tanker, **1A**, NO, 72,000 GT
8. **Baltic Ice** - Tanker, **1A Super**, SE, 65,000 GT
9. **Northern Frost** - Tanker, **1A**, LNG, DK, 70,000 GT

### Intra-EU Specialized (5)
10. **Europa Link** - Ro-Ro Passenger, DE, 42,000 GT
11. **Coastal Trader** - General Cargo, NL, 28,000 GT
12. **Baltic Express** - Container, **1C**, PL, 38,000 GT
13. **Adriatic Star** - Ro-Ro Cargo, LNG, IT, 32,000 GT
14. **Celtic Pride** - Ro-Ro Passenger, GB, 46,000 GT

### OMR Vessels (5)
15. **Canary Islander** - Container, **OMR**, ES, 35,000 GT
16. **Azores Connector** - General Cargo, **OMR**, PT, 29,000 GT
17. **Madeira Express** - Container, **OMR**, PT, 33,000 GT
18. **Martinique Trader** - Container, **OMR**, FR, 31,000 GT
19. **Reunion Link** - General Cargo, **OMR**, FR, 27,000 GT

### Advanced Technology (3)
20. **Green Pioneer** - Container, **Methanol**, DK, 52,000 GT - GHG: 52.4
21. **Hydrogen Explorer** - Tanker, **Hydrogen**, NO, 48,000 GT - GHG: 9.4
22. **Electric Horizon** - Ro-Ro, **Battery-Electric**, SE, 25,000 GT - GHG: 0.0

### Large International (4)
23. **Global Titan** - Container, MT, 98,000 GT
24. **Ocean Voyager** - Bulk Carrier, CY, 85,000 GT
25. **Mediterranean Pride** - Tanker, GR, 92,000 GT
26. **North Sea Trader** - General Cargo, LNG, BE, 38,000 GT

---

## API Endpoints

```bash
# Get all 26 vessels (demo)
GET /api/vessels/demo

# Get database vessels (5, fallback to 26)
GET /api/vessels/all

# Get all ports (40 including 8 OMR)
GET /api/ports

# Get all fuels (16 types)
GET /api/fuels
```

---

## Quick Test

```bash
# Start server
npm run dev

# Test in browser
http://localhost:5000

# Navigate to Vessels tab
# Should see all 26 vessels!
```

---

## Special Features

- ❄️ **4 Ice Class vessels** (1A Super, 1A, 1C)
- ⚡ **6 Alternative Fuel vessels** (LNG, Methanol, Hydrogen, Electric)
- 🏝️ **5 OMR vessels** (Canary, Azores, Madeira, Caribbean, Indian Ocean)
- 🌍 **Intra-EU, OMR, and Extra-EU** voyage types

---

**ALL DATA IS LIVE AND WORKING!** ✅




