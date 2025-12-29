# GHGConnect v1.1 - Maritime Compliance Management System

A comprehensive multi-tenant platform for managing greenhouse gas emissions compliance across FuelEU Maritime, EU ETS, IMO Net Zero Framework, and UK ETS.

## 🚀 What's New in v1.1

### Multi-Tenant & Security
- **Multi-tenant architecture** with tenant/organization/fleet hierarchy
- **Role-Based Access Control (RBAC)** with 7 roles: Owner, Admin, Compliance, Data Engineer, Ops, Finance, Verifier
- **JWT authentication** with access/refresh tokens
- **MFA support** with TOTP (Google Authenticator, Authy)
- **Comprehensive audit logging** for all mutations
- **Tenant isolation** enforced at storage and API layers

### Enhanced Data Model
- **Normalized port database** with UN/LOCODE support (30+ major EU/UK/international ports)
- **Comprehensive fuel library** (16 fuel types including RFNBOs)
- **Voyage coverage classification** (intra-EU 100%, extra-EU 50%, UK domestic)
- **BDN (Bunker Delivery Notes)** tracking with actual LCV/WtT values
- **OPS (Onshore Power Supply)** session tracking
- **Voyage segments** for multi-leg journeys

### Regulatory Constants & Versioning
- **Time-travel queries** - get constants effective at any date
- **Immutable history** - all formula changes tracked
- **Framework-specific constants** for FuelEU, EU ETS, IMO, UK ETS
- **Source references** with regulation URLs

### Advanced Calculations
- **FuelEU Maritime** - WtT + TtW intensity, banking/borrowing, RFNBO incentives
- **EU ETS** - Phase-in schedule, voyage coverage, multi-GHG (2026+)
- **IMO GFI** - Attained vs target, two-tier pricing
- **UK ETS** - Multi-GHG from launch, UK coverage rules

### Data Validation
- **Hard validations** - IMO checksum, duplicate voyages, negative values
- **Soft validations** - Distance variance (Haversine), fuel-engine mismatch
- **Explainable errors** with fix hints
- **Batch validation** for imports

## 📋 Prerequisites

- Node.js 20.x or higher
- PostgreSQL database (Neon serverless recommended)
- Redis (for caching and job queue - Phase 6)
- Modern web browser

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GHGConnect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and secrets
   ```

4. **Push database schema**
   ```bash
   npm run db:push
   ```

5. **Seed reference data**
   ```bash
   npm run db:seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   # Or use the startup script (recommended):
   # Windows: .\start-dev.bat
   # Linux/Mac: ./start-dev.sh
   ```
   Server runs on http://localhost:5000

## 🔄 Hybrid System Architecture

GHGConnect uses a **hybrid architecture** where a single Express server handles both API and frontend:

- **Development Mode** (`npm run dev`):
  - Express server on port 5000
  - Vite middleware for hot-reloading
  - API endpoints at `/api/*`
  - Frontend served via Vite HMR

- **Production Mode** (`npm start`):
  - Express server on port 5000
  - Pre-built static files from `dist/public/`
  - API endpoints at `/api/*`

**Why This Works:**
- ✅ No CORS issues (same-origin)
- ✅ No proxy configuration needed
- ✅ Simplified deployment
- ✅ Hot-reloading in development

**Testing Communication:**
```bash
# Windows
.\test-communication.bat

# Linux/Mac
./test-communication.sh
```

📖 **For detailed information**, see [HYBRID_SYSTEM_GUIDE.md](HYBRID_SYSTEM_GUIDE.md)

## 🏗️ Architecture

### Technology Stack
- **Frontend:** React 18.3 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Node.js + Express + TypeScript (ESM)
- **Database:** PostgreSQL (Drizzle ORM)
- **Authentication:** JWT + bcrypt + speakeasy (MFA)
- **Security:** Helmet + CORS + Rate limiting

### Project Structure
```
GHGConnect/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # UI components
│       ├── lib/           # Utilities
│       └── pages/         # Page components
├── server/                # Backend API
│   ├── auth/             # Authentication & RBAC
│   ├── calculators/      # Framework calculators
│   ├── data/             # Reference data & constants
│   ├── routes/           # API endpoints
│   ├── scripts/          # Utility scripts
│   └── services/         # Business logic
└── shared/               # Shared types & schemas
```

## 🔐 Authentication

### Register a new account
```bash
POST /api/v1/auth/register
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "secure-password",
  "tenantName": "My Shipping Company"
}
```

### Login
```bash
POST /api/v1/auth/login
{
  "username": "admin",
  "password": "secure-password"
}

# Returns:
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": { ... }
}
```

### Setup MFA
```bash
# 1. Setup MFA
POST /api/v1/auth/mfa/setup
{
  "username": "admin",
  "password": "secure-password"
}

# Returns QR code and backup codes

# 2. Verify and enable
POST /api/v1/auth/mfa/verify
{
  "username": "admin",
  "password": "secure-password",
  "token": "123456"
}
```

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Authenticate
- `POST /api/v1/auth/refresh` - Refresh tokens
- `POST /api/v1/auth/mfa/setup` - Setup MFA
- `POST /api/v1/auth/mfa/verify` - Verify MFA token
- `POST /api/v1/auth/logout` - Logout

### Tenants & Organizations
- `GET /api/v1/tenants/current` - Get current tenant
- `PUT /api/v1/tenants/current` - Update tenant
- `GET /api/v1/organizations` - List organizations
- `POST /api/v1/organizations` - Create organization
- `POST /api/v1/fleets` - Create fleet
- `GET /api/v1/fleets/:id` - Get fleet details

### Vessels
- `GET /api/v1/vessels` - List vessels
- `GET /api/v1/vessels/:id` - Get vessel
- `POST /api/v1/vessels` - Create vessel
- `PUT /api/v1/vessels/:id` - Update vessel
- `GET /api/v1/vessels/:id/voyages` - Get vessel voyages

### Audit
- `GET /api/v1/audit` - Query audit logs
- `GET /api/v1/audit/entity/:type/:id` - Entity audit trail
- `GET /api/v1/audit/user/:userId` - User activity log

### Data Integration
- `POST /api/data-imports/upload` - Upload CSV/XLSX/SQL
- `GET /api/data-imports` - List imports
- `GET /api/calculation-formulas` - Get formulas
- `PUT /api/calculation-formulas/:id` - Update formula
- `GET /api/data-exports/:format` - Export data

## 🧮 Calculation Examples

### FuelEU Maritime
```typescript
import { calculateFuelEUCompliance } from './server/calculators/fueleuCalculator';

const result = await calculateFuelEUCompliance(
  vesselId,
  2025,
  consumptions, // Array of fuel consumption data
  fuelsMap,     // Map of fuel definitions
  1.0           // Wind factor
);

// Returns:
{
  attainedIntensity: 85.2,    // gCO2e/MJ
  targetIntensity: 89.34,      // 2% reduction from baseline
  complianceBalance: 12500,    // MJ (positive = surplus)
  penalty: 0,                  // EUR (0 if compliant)
  rfnboIncentive: 250.5,      // GJ of RFNBO fuels
  totalEnergyGJ: 3000
}
```

### EU ETS
```typescript
import { calculateEUETSCompliance } from './server/calculators/euETSCalculator';

const result = await calculateEUETSCompliance(
  voyageId,
  2025,
  0.5,          // Coverage: 50% for extra-EU
  consumptions,
  fuelsMap,
  85            // EUR per allowance
);

// Returns:
{
  co2Emissions: 1250.5,        // tonnes CO2
  totalEmissionsCO2eq: 1250.5, // tonnes CO2eq
  allowancesRequired: 437.7,   // EUA
  phaseInPercentage: 0.7,      // 70% in 2025
  estimatedCost: 37204.5       // EUR
}
```

## 🔒 Security Features

- **Password hashing** with bcrypt (12 rounds)
- **JWT tokens** with RS256 signing
- **Token rotation** on refresh
- **Rate limiting** (100 req/15min)
- **Helmet** security headers
- **CORS** allow-list
- **Tenant isolation** at all layers
- **Audit trails** for all mutations
- **MFA** with TOTP

## 👥 Role-Based Access Control

| Role | Permissions |
|------|------------|
| **Owner** | All permissions (full access) |
| **Admin** | Manage users, vessels, voyages, compliance, reports |
| **Compliance** | View/manage compliance, generate reports, run calculations |
| **Data Engineer** | Import/export data, manage voyages, run calculations |
| **Ops** | View/manage voyages, view compliance |
| **Finance** | View data, manage scenarios, generate reports |
| **Verifier (RO)** | Read-only access to all data and audit logs |

## 📈 Regulatory Frameworks

### FuelEU Maritime
- Baseline: 91.16 gCO2e/MJ (2008)
- Progressive targets: 2025 (2%), 2030 (6%), 2050 (80%)
- Penalty: EUR 2,400 per tonne CO2eq
- Banking/borrowing: 2% limits
- RFNBO incentive: 0.5× multiplier (2025-2033)

### EU ETS
- Phase-in: 2024 (40%), 2025 (70%), 2026+ (100%)
- Coverage: Intra-EU (100%), Extra-EU (50%)
- Multi-GHG from 2026 (CO2 + CH4×25 + N2O×298)
- Current price: ~EUR 85/allowance

### IMO Net Zero
- 2030: 20-30% reduction
- 2040: 70-80% reduction
- 2050: 96% reduction (net zero)
- Two-tier pricing: EUR 100 (Tier 1), EUR 380 (Tier 2)
- Starts: 2028

### UK ETS
- Launch: July 1, 2026
- Coverage: 100% UK domestic + port emissions
- Multi-GHG from launch
- Price: GBP 31-100 (reserve: GBP 22)

## 🧪 Testing

```bash
# Type checking
npm run check

# Unit tests (Phase 9)
npm run test:unit

# E2E tests (Phase 9)
npm run test:e2e
```

## 📦 Production Deployment

```bash
# 1. Set environment variables
export NODE_ENV=production
export DATABASE_URL=<production-db-url>
export JWT_SECRET=<strong-secret>
export REDIS_URL=<redis-url>

# 2. Build application
npm run build

# 3. Push schema
npm run db:push

# 4. Seed reference data
npm run db:seed

# 5. Start server
npm start
```

## 🗺️ Implementation Roadmap

- ✅ **Phase 1:** Multi-tenant RBAC & Auth
- ✅ **Phase 2:** Enhanced data model (ports, vessels, voyages, BDN, OPS)
- ✅ **Phase 3:** Regulatory constants & formula versioning
- ✅ **Phase 4:** Framework calculators & validation
- ⏳ **Phase 5:** Scenario planner & reporting (Next)
- ⏳ **Phase 6:** Job queue & caching
- ⏳ **Phase 7:** Frontend UI updates
- ⏳ **Phase 8:** Security hardening
- ⏳ **Phase 9:** Testing & documentation

## 📝 API Documentation

Full API documentation will be available at `/api/docs` once OpenAPI/Swagger is implemented (Phase 9).

## 🤝 Contributing

See implementation plan in `multi-tenant-ghg-connect-v1-1.plan.md`

## 📄 License

MIT

## 🆘 Support

For issues and questions, please refer to the PRD documents:
- `PRD.txt` - Original v1.0 specification
- `PRD-GHG Connect v1.txt` - v1.1 specification with gap analysis

---

**Built with ❤️ for maritime compliance professionals**

