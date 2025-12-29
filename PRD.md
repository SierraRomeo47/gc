# Product Requirements Document (PRD)
## GHGConnect - Maritime Compliance Management System

---

## Document Information

**Product Name:** GHGConnect  
**Version:** 1.0.0  
**Last Updated:** October 19, 2025  
**Document Owner:** Development Team  
**Status:** Implementation Complete - Phase 1

---

## Executive Summary

GHGConnect is a comprehensive maritime compliance management system designed to help shipping companies manage and monitor compliance across multiple regulatory frameworks including FuelEU Maritime, EU ETS, IMO Net Zero Framework, and UK ETS. The platform provides real-time compliance tracking, penalty calculations, multi-framework analysis, and data integration capabilities for vessel fleet management.

---

## 1. Product Overview

### 1.1 Product Vision

To provide maritime operators with a unified platform for managing greenhouse gas emissions compliance across multiple international regulatory frameworks, enabling proactive decision-making and cost optimization through advanced analytics and automated calculations.

### 1.2 Business Objectives

- **Compliance Assurance:** Enable 100% compliance tracking across FuelEU Maritime, EU ETS, IMO, and UK ETS frameworks
- **Cost Optimization:** Reduce penalty exposure through proactive monitoring and planning tools
- **Operational Efficiency:** Streamline data management with automated imports and calculations
- **Regulatory Readiness:** Stay ahead of evolving maritime regulations with configurable framework support
- **Fleet-wide Visibility:** Provide comprehensive oversight of vessel performance and compliance status

### 1.3 Target Users

- **Fleet Managers:** Monitor compliance across vessel fleets
- **Compliance Officers:** Track regulatory requirements and submissions
- **Operations Managers:** Plan voyages and fuel consumption strategies
- **Financial Controllers:** Monitor penalty exposure and credit trading
- **Data Analysts:** Analyze trends and optimize fleet performance

---

## 2. System Architecture

### 2.1 Technology Stack

#### Frontend
- **Framework:** React 18.3.1 with TypeScript 5.6.3
- **Build Tool:** Vite 5.4.19
- **UI Framework:** Tailwind CSS 3.4.17 with custom components
- **Component Library:** Radix UI (comprehensive set of accessible components)
- **State Management:** TanStack React Query 5.60.5
- **Routing:** Wouter 3.3.5
- **Charts:** Recharts 2.15.2
- **Animations:** Framer Motion 11.13.1
- **Icons:** Lucide React 0.453.0
- **Form Management:** React Hook Form 7.55.0 with Zod validation

#### Backend
- **Runtime:** Node.js with Express 4.21.2
- **Language:** TypeScript (ESM modules)
- **Database ORM:** Drizzle ORM 0.39.1
- **Database:** PostgreSQL (via Neon serverless 0.10.4)
- **File Processing:** 
  - CSV: csv-parser 3.2.0
  - Excel: xlsx 0.18.5
  - File uploads: Multer 2.0.2
- **Session Management:** express-session 1.18.1
- **Authentication:** Passport.js 0.7.0 with local strategy

#### Development Tools
- **Package Manager:** npm
- **Build Tool:** esbuild 0.25.0 (production builds)
- **Dev Server:** tsx 4.20.6 (hot reload development)
- **Database Migrations:** Drizzle Kit 0.30.4
- **Code Quality:** TypeScript strict mode enabled

### 2.2 Project Structure

```
GHGConnect/
├── client/                          # Frontend application
│   ├── src/
│   │   ├── components/              # React components
│   │   │   ├── ui/                  # Reusable UI components (40+ components)
│   │   │   ├── CalculateAndPlanning.tsx
│   │   │   ├── ComplianceFrameworkCalculator.tsx
│   │   │   ├── ComplianceMeter.tsx
│   │   │   ├── CreditPoolingCard.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DataImportManager.tsx
│   │   │   ├── DynamicDashboardTiles.tsx
│   │   │   ├── EnhancedCompliancePage.tsx
│   │   │   ├── FrameworkSpecificTiles.tsx
│   │   │   ├── FrameworkVisualGraphs.tsx
│   │   │   ├── FuelConsumptionChart.tsx
│   │   │   ├── IntegratedFrameworkManager.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── PenaltyCalculator.tsx
│   │   │   ├── VesselCard.tsx
│   │   │   └── VoyageDataTable.tsx
│   │   ├── lib/
│   │   │   ├── queryClient.ts       # React Query configuration
│   │   │   ├── regulatoryConstants.ts # Compliance frameworks data
│   │   │   └── utils.ts             # Utility functions
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── pages/                   # Page components
│   │   ├── App.tsx                  # Main application component
│   │   └── main.tsx                 # Application entry point
│   └── index.html                   # HTML template
├── server/                          # Backend API
│   ├── index.ts                     # Express server setup
│   ├── routes.ts                    # API route handlers
│   ├── dataImportService.ts         # File import/export logic
│   ├── storage.ts                   # Database abstraction layer
│   ├── db.ts                        # Database connection
│   └── vite.ts                      # Vite integration for dev
├── shared/                          # Shared types and schemas
│   └── schema.ts                    # Database schema (Drizzle)
├── attached_assets/                 # Reference documentation (PDFs)
├── dist/                            # Production build output
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── vite.config.ts                   # Vite build configuration
├── drizzle.config.ts                # Database migration config
├── tailwind.config.ts               # Tailwind CSS configuration
├── postcss.config.js                # PostCSS configuration
├── components.json                  # shadcn/ui configuration
└── design_guidelines.md             # Design system documentation
```

### 2.3 Database Schema

#### Users Table
```typescript
users {
  id: varchar (UUID, primary key)
  username: text (unique, not null)
  password: text (not null)
}
```

**Note:** Current schema is minimal. Vessel, voyage, and compliance data is managed in-memory for demonstration purposes. Future phases will include complete relational schema.

---

## 3. Core Features

### 3.1 Dashboard & Overview

#### 3.1.1 Fleet Overview Dashboard
- **Real-time Fleet Statistics**
  - Total vessels count with status breakdown
  - Fleet average GHG intensity (gCO2e/MJ)
  - Total credit balance (positive/negative)
  - Compliance rate percentage
  
- **Compliance Framework Toggles**
  - FuelEU Maritime (enabled by default)
  - EU ETS
  - IMO Net Zero Framework
  - UK ETS
  - Real-time framework activation/deactivation
  - Active framework counter

- **Dynamic Dashboard Tiles**
  - Framework-specific KPI tiles
  - Customizable tile layout
  - Add/remove custom tiles
  - Real-time data updates

#### 3.1.2 Compliance Meters
- Circular progress indicators for:
  - Fleet performance vs. targets
  - Target progress tracking
  - Credit utilization rates
- Color-coded status (compliant/warning/non-compliant)
- Trend indicators (up/down/stable)
- Support for multiple units (gCO2e/MJ, %, €)

#### 3.1.3 Visual Analytics
- **Fuel Consumption Charts**
  - Time-series GHG intensity trends
  - Fuel consumption by month
  - Compliance credits tracking
  - Target comparison overlays
  
- **Credit Pooling Card**
  - Current balance display
  - Banked credits overview
  - Borrowed credits tracking
  - Available trading credits
  - Recent transaction history

### 3.2 Vessel Management

#### 3.2.1 Vessel Cards
Each vessel displays:
- Vessel name and IMO number
- Vessel type (Container Ship, Bulk Carrier, Oil Tanker, Gas Carrier, etc.)
- Flag state
- Gross tonnage (GT)
- Compliance status (compliant/warning/non-compliant)
- Current GHG intensity vs. target
- Fuel consumption (MT)
- Credit balance

#### 3.2.2 Vessel Data Model
```typescript
{
  id: string
  name: string
  imoNumber: string
  type: VesselType
  flag: string
  grossTonnage: number
  complianceStatus: 'compliant' | 'warning' | 'non-compliant'
  ghgIntensity: number
  targetIntensity: number
  fuelConsumption: number
  creditBalance: number
}
```

### 3.3 Multi-Framework Compliance

#### 3.3.1 FuelEU Maritime
- **Regulatory Constants**
  - Baseline: 91.16 gCO2e/MJ (2008 baseline)
  - Progressive targets: 2025 (2%), 2030 (6%), 2035 (14.5%), 2040 (31%), 2045 (62%), 2050 (80%)
  - Penalty rate: €2,400 per tonne CO2eq
  - Banking limit: 2% of previous year
  - Borrowing limit: 2% of current year

- **Calculation Formulas**
  - GHG Intensity: `f_wind × (WtT + TtW)`
  - Well-to-Tank (WtT): Lifecycle emissions from fuel production
  - Tank-to-Wake (TtW): Combustion emissions including fuel slip
  - Compliance Balance: `(Target - Actual) × Total_Energy`
  - Financial Penalty: `€58.50 × Non_Compliant_Energy_GJ + OPS_Penalty`
  - RFNBO Incentive: `0.5 × Actual_GHG_Intensity` (2025-2033)

- **Fuel Properties Database**
  - Heavy Fuel Oil (HFO): 91.16 gCO2e/MJ
  - Marine Gas Oil (MGO): 87.5 gCO2e/MJ
  - Liquefied Natural Gas (LNG): 82.5 gCO2e/MJ
  - Bio-LNG: 45.3 gCO2e/MJ
  - e-Methanol: 35.4 gCO2e/MJ
  - e-Ammonia: 28.7 gCO2e/MJ

#### 3.3.2 EU ETS (Emissions Trading System)
- **Phase-in Schedule**
  - 2024: 40% coverage
  - 2025: 70% coverage
  - 2026: 100% coverage
  - 2027: 100% coverage (full implementation)

- **Voyage Coverage**
  - Intra-EU voyages: 100%
  - Extra-EU voyages: 50%

- **Pricing**
  - Current allowance price: €85 per EUA
  - Emission factor: 3.114 tCO2 per tonne fuel (HFO)
  - Surrender deadline: April 30 (annual)

- **Multi-GHG Expansion (2026+)**
  - CO2 emissions
  - CH4 (methane) × GWP 25
  - N2O (nitrous oxide) × GWP 298
  - Scope expansion: vessels ≥400 GT but <5000 GT

#### 3.3.3 IMO Net Zero Framework
- **Targets (2023 IMO Strategy)**
  - 2030: 20% reduction (minimum), 30% aspirational
  - 2040: 70% reduction (minimum), 80% aspirational
  - 2050: 96% reduction (net zero with 4% residual)

- **Compliance Metrics**
  - Attained GHG Fuel Intensity (GFI): `Σ(GHG_WtW × E) / ΣE`
  - Compliance Balance: `(Target_GFI - Attained_GFI) × Total_Energy`
  - Zero or Near-Zero (ZNZ) thresholds: 2028 (19 gCO2e/MJ), 2035 (14 gCO2e/MJ)

- **Two-Tier Pricing System**
  - Tier 1 base rate: €100 per tCO2eq
  - Tier 2 enhanced rate: €380 per tCO2eq
  - Compliance start: January 1, 2028
  - Registry opening: January 1, 2027

- **Surplus Management**
  - Validity period: 2 years
  - Transfer allowed between vessels
  - Maximum transfer price: €380 per tCO2eq
  - Banking allowed

#### 3.3.4 UK ETS
- **Launch Date:** July 1, 2026

- **Coverage**
  - UK domestic voyages: 100%
  - UK international voyages: 100% of port emissions
  - No phase-in period (immediate 100% coverage)

- **Pricing**
  - Current price range: £31-100 per allowance
  - Reserve price: £22
  - Market size estimate: 2M allowances
  - First surrender deadline: April 30, 2027

- **Multi-GHG from Launch**
  - CO2, CH4 (×25), N2O (×298)
  - Scope: vessels ≥5000 GT
  - Government vessels excluded

### 3.4 Calculate & Planning

#### 3.4.1 Integrated Calculator
- **Framework Selection**
  - Toggle individual frameworks for calculation
  - Multi-framework comparison view
  - Cumulative compliance cost analysis

- **Input Parameters**
  - Gross tonnage (GT)
  - Fuel consumption (MT)
  - Current GHG intensity (gCO2e/MJ)
  - Voyage type (intra-EU/extra-EU/UK domestic)
  - Compliance year (2025-2050)

- **Calculation Outputs**
  - FuelEU Maritime: Compliance balance, penalty amount, target intensity
  - EU ETS: Allowance requirements, cost estimates, coverage percentage
  - IMO: GFI gap, compliance balance, pricing tier
  - UK ETS: Allowance cost, emissions coverage
  - Total compliance cost across all frameworks

#### 3.4.2 Penalty Calculator
- Real-time penalty estimation
- Credit offset calculations
- Banking/borrowing scenario modeling
- Trading opportunity identification

#### 3.4.3 Planning Tools
- Fuel switching scenarios
- Route optimization analysis
- Credit pooling strategies
- Multi-year compliance roadmaps

### 3.5 Data Integration & Calculations

#### 3.5.1 File Import System
**Supported Formats:**
- **CSV:** Comma-separated values with automatic field mapping
- **XLSX:** Excel workbooks (reads first sheet)
- **SQL:** SQL dump files with schema extraction

**Import Process:**
1. File upload (max 10MB)
2. Automatic field detection
3. Maritime field mapping
4. Data validation
5. Import status tracking

**Automatic Field Mapping:**
- Vessel identification: IMO, MMSI, call sign, vessel name
- Specifications: gross tonnage, deadweight, vessel type, flag
- Fuel data: consumption, type, GHG intensity
- Voyage data: departure/arrival ports, date, distance
- Compliance: status, penalties, credits

#### 3.5.2 Calculation Formula Manager
**30+ Pre-configured Formulas:**

**FuelEU Maritime (6 formulas):**
1. GHG Intensity Calculation (Primary)
2. Well-to-Tank (WtT) Calculation
3. Tank-to-Wake (TtW) Calculation
4. Compliance Balance Calculation
5. Financial Penalty Calculation
6. RFNBO Incentive Calculation

**EU ETS (4 formulas):**
1. CO2 Emissions Calculation
2. ETS Allowance Calculation
3. Voyage Coverage Rules
4. Multi-GHG Calculation (2026+)

**IMO Net Zero (4 formulas):**
1. Attained GHG Fuel Intensity (GFI)
2. Compliance Balance Assessment
3. Two-Tier Pricing System
4. Surplus Unit Management

**UK ETS (4 formulas):**
1. UK Maritime CO2 Calculation
2. UK Carbon Allowance Requirements
3. Multi-GHG Calculation (2026+)
4. Cost Impact Analysis

**Formula Features:**
- Editable variables (except locked formulas)
- Framework categorization
- Detailed descriptions
- Regulatory source references
- Real-time validation

#### 3.5.3 Data Export System
**Export Formats:**
- CSV: Comma-separated values
- XLSX: Excel workbook format
- SQL: SQL INSERT statements

**Export Types:**
- Vessel data
- Fuel consumption records
- Compliance reports
- Calculation results

### 3.6 Voyage Data Management

#### 3.6.1 Voyage Data Table
**Columns:**
- Vessel name
- Departure port
- Arrival port
- Distance (nautical miles)
- Fuel type
- Fuel consumed (MT)
- GHG intensity (gCO2e/MJ)
- Compliance status
- Voyage type (intra-EU/extra-EU)
- Date

**Features:**
- Sortable columns
- Status filtering
- Search functionality
- Pagination
- Expandable detail views

---

## 4. User Interface & Design

### 4.1 Design System

#### 4.1.1 Color Palette
**Primary Colors:**
- Primary: `hsl(27, 57%, 45%)` - Maritime Blue #1B4F72
- Secondary: `hsl(201, 61%, 42%)` - Ocean Blue #2E86AB
- Background: `hsl(210, 17%, 98%)` - Light Grey #F8F9FA

**Functional Colors:**
- Accent: `hsl(332, 55%, 42%)` - Compliance Red #A23B72
- Success: `hsl(134, 61%, 41%)` - Green #28A745
- Text: `hsl(210, 29%, 24%)` - Navy #2C3E50
- Warning: Amber shades for warning states
- Destructive: Red shades for non-compliant states

#### 4.1.2 Typography
- **Primary Font:** Roboto (Google Fonts)
- **Secondary Font:** Open Sans (Google Fonts)
- **Font Weights:** 400 (regular), 500 (medium), 600 (semi-bold), 700 (bold)
- **Scale:** 2xl (titles), xl (headers), base (body), sm (captions)

#### 4.1.3 Spacing System
Tailwind utilities with consistent spacing units:
- Micro: `p-2` (8px)
- Standard: `p-4` (16px)
- Section: `p-8` (32px)
- Container: `p-12` (48px)
- Large: `p-16` (64px)
- Component: `p-20` (80px)

#### 4.1.4 Component Library
**40+ Shadcn/UI Components:**
- Accordion, Alert Dialog, Alert, Aspect Ratio, Avatar
- Badge, Breadcrumb, Button, Calendar, Card
- Carousel, Chart, Checkbox, Collapsible, Command
- Context Menu, Dialog, Drawer, Dropdown Menu
- Form, Hover Card, Input OTP, Input, Label
- Menubar, Navigation Menu, Pagination, Popover
- Progress, Radio Group, Resizable, Scroll Area
- Select, Separator, Sheet, Sidebar, Skeleton
- Slider, Switch, Table, Tabs, Textarea
- Toast, Toaster, Toggle Group, Toggle, Tooltip

### 4.2 Navigation

#### 4.2.1 Top Navigation Bar
- GHGConnect logo and branding
- Primary navigation tabs:
  - Dashboard (Home/Fleet Overview)
  - Vessels (Vessel Management)
  - Compliance (Multi-Framework Compliance)
  - Calculator (Calculate & Planning)
  - Data Integration (Import/Export)
  - Settings (Configuration)
- User profile/account menu
- Active tab highlighting

#### 4.2.2 Breadcrumb Navigation
- Contextual navigation path
- Quick navigation to parent sections
- Current page indication

### 4.3 Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Grid layouts adapt from 1 to 4 columns
- Touch-friendly controls on mobile
- Collapsible navigation on smaller screens

### 4.4 Accessibility
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators
- Screen reader compatibility
- High contrast mode support
- Minimum touch target sizes (44×44px)

---

## 5. API Endpoints

### 5.1 Data Import/Export

#### POST `/api/data-imports/upload`
Upload maritime data files for processing.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `file` (CSV, XLSX, or SQL file, max 10MB)

**Response:**
```json
{
  "id": "1758704345580",
  "filename": "vessel-data.csv",
  "type": "csv",
  "uploadDate": "2025-10-19T10:30:00Z",
  "recordCount": 125,
  "columns": ["imo", "vessel_name", "gross_tonnage", "fuel_consumption"],
  "mappedFields": {
    "imo": "imo",
    "vessel_name": "vessel_name",
    "gross_tonnage": "gross_tonnage"
  },
  "status": "imported"
}
```

#### GET `/api/data-imports`
Retrieve list of imported files.

**Response:**
```json
[
  {
    "id": "1758704345580",
    "filename": "vessel-data.csv",
    "type": "csv",
    "uploadDate": "2025-10-19T10:30:00Z",
    "recordCount": 125,
    "status": "imported"
  }
]
```

#### GET `/api/calculation-formulas`
Get all calculation formulas.

**Response:**
```json
[
  {
    "id": "fueleu-ghg-intensity",
    "framework": "FuelEU Maritime",
    "type": "GHG Intensity Calculation (Primary)",
    "formula": "GHG_Intensity = f_wind × (WtT + TtW)",
    "variables": {
      "f_wind": 1.0,
      "reference_value": 91.16
    },
    "description": "Primary FuelEU GHG intensity calculation",
    "locked": false
  }
]
```

#### PUT `/api/calculation-formulas/:id`
Update a calculation formula.

**Request:**
```json
{
  "variables": {
    "f_wind": 0.95,
    "reference_value": 91.16
  }
}
```

**Response:**
```json
{
  "id": "fueleu-ghg-intensity",
  "framework": "FuelEU Maritime",
  "variables": {
    "f_wind": 0.95,
    "reference_value": 91.16
  }
}
```

#### GET `/api/data-exports/:format`
Export maritime data.

**Parameters:**
- `format`: `csv`, `xlsx`, or `sql`
- `type` (query): `vessel-data`, `fuel-consumption`, etc.

**Response:**
- Content-Type: `text/csv`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, or `application/sql`
- Content-Disposition: `attachment; filename="maritime-{type}.{format}"`
- Body: Exported data in requested format

---

## 6. Calculation Methodologies

### 6.1 FuelEU Maritime Calculations

#### 6.1.1 GHG Intensity Formula
```
GHG_Intensity = f_wind × (WtT + TtW)
```
Where:
- `f_wind`: Wind-assisted propulsion factor (default: 1.0)
- `WtT`: Well-to-Tank emissions (gCO2e/MJ)
- `TtW`: Tank-to-Wake emissions (gCO2e/MJ)

#### 6.1.2 Well-to-Tank (WtT) Emissions
```
WtT = Σ(M_i × CO2eq_WtT,i × LCV_i) / Σ(M_i × LCV_i × RWD_i + E_k)
```
Where:
- `M_i`: Mass of fuel i consumed
- `CO2eq_WtT,i`: WtT emission factor for fuel i
- `LCV_i`: Lower calorific value of fuel i
- `RWD_i`: Reduction factor
- `E_k`: Shore power energy

#### 6.1.3 Tank-to-Wake (TtW) Emissions
```
TtW = Σ(M_i,j × [(1-C_slip_j/100) × CO2eq_TtW,i,j + (C_slip_j/100) × CO2eq_TtW,slip,i,j])
```
Where:
- `C_slip_j`: Methane slip percentage for engine type j
- `CO2eq_TtW,i,j`: TtW emission factor

#### 6.1.4 Penalty Calculation
```
Penalty = €58.50 × Non_Compliant_Energy_GJ + OPS_Penalty
```
Or equivalently:
```
Penalty = €2,400 × Excess_Emissions_tCO2eq
```

### 6.2 EU ETS Calculations

#### 6.2.1 CO2 Emissions
```
CO2_Emissions = Fuel_Consumption × CO2_Emission_Factor
```

#### 6.2.2 Allowance Requirements
```
ETS_Allowances = CO2_Emissions × Coverage_Percentage × Phase_Rate × Voyage_Coverage
```
Where:
- `Coverage_Percentage`: 40% (2024), 70% (2025), 100% (2026+)
- `Voyage_Coverage`: 100% (intra-EU), 50% (extra-EU)

#### 6.2.3 Multi-GHG (2026+)
```
Total_Emissions = CO2 + (CH4 × 25) + (N2O × 298)
```

### 6.3 IMO Net Zero Calculations

#### 6.3.1 Attained GFI
```
GFI_attained = Σ(GHG_WtW,j × E_j) / ΣE_j
```

#### 6.3.2 Compliance Balance
```
Compliance_Balance = (Target_GFI - Attained_GFI) × Total_Energy
```

#### 6.3.3 Remedial Cost
```
Remedial_Cost = Deficit_tCO2eq × Tier_Rate
```
- Tier 1: €100/tCO2eq
- Tier 2: €380/tCO2eq

### 6.4 UK ETS Calculations

#### 6.4.1 UK ETS Emissions
```
CO2_Emissions = Fuel_Consumption × UK_Emission_Factor
```

#### 6.4.2 Allowance Cost
```
Annual_Cost = Emissions × Price_per_tonne × Coverage_Factor
```

---

## 7. Key Regulatory Constants

### 7.1 FuelEU Maritime Targets

| Year | Reduction | Target Intensity (gCO2e/MJ) |
|------|-----------|----------------------------|
| 2025 | 2%        | 89.34                      |
| 2026 | 6%        | 85.69                      |
| 2027 | 6%        | 85.69                      |
| 2028 | 8%        | 83.87                      |
| 2029 | 10%       | 82.04                      |
| 2030 | 6%        | 85.69                      |
| 2035 | 14.5%     | 77.94                      |
| 2040 | 31%       | 62.90                      |
| 2045 | 62%       | 34.64                      |
| 2050 | 80%       | 18.23                      |

### 7.2 Fuel Emission Factors

| Fuel Type   | CO2 Factor (tCO2/t) | LCV (MJ/kg) | GHG Intensity (gCO2e/MJ) |
|-------------|---------------------|-------------|--------------------------|
| HFO         | 3.114               | 40.2        | 91.16                    |
| MGO         | 3.206               | 42.7        | 87.5                     |
| LNG         | 2.750               | 48.0        | 82.5                     |
| Bio-LNG     | 2.750               | 48.0        | 45.3                     |
| e-Methanol  | 1.375               | 19.9        | 35.4                     |
| e-Ammonia   | 0.000               | 18.6        | 28.7                     |

### 7.3 Global Warming Potentials (GWP)

| Gas | 100-Year GWP |
|-----|--------------|
| CO2 | 1            |
| CH4 | 25           |
| N2O | 298          |

---

## 8. Development Setup

### 8.1 Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher
- PostgreSQL database (Neon serverless recommended)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### 8.2 Environment Variables
```bash
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=development
PORT=5000
```

### 8.3 Installation Steps

1. **Clone Repository**
```bash
git clone <repository-url>
cd GHGConnect
```

2. **Install Dependencies**
```bash
npm install
```

3. **Database Setup**
```bash
npm run db:push
```

4. **Start Development Server**
```bash
npm run dev
```
Server runs on http://localhost:5000

5. **Build for Production**
```bash
npm run build
npm start
```

### 8.4 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| dev | `npm run dev` | Start development server with hot reload |
| build | `npm run build` | Build production bundle |
| start | `npm start` | Start production server |
| check | `npm run check` | TypeScript type checking |
| db:push | `npm run db:push` | Push database schema changes |

---

## 9. Dependencies Summary

### 9.1 Core Dependencies (Selected)

**Frontend:**
- `react` 18.3.1 - UI framework
- `@tanstack/react-query` 5.60.5 - Data fetching
- `recharts` 2.15.2 - Charts
- `wouter` 3.3.5 - Routing
- `zod` 3.24.2 - Schema validation
- `react-hook-form` 7.55.0 - Form management

**Backend:**
- `express` 4.21.2 - Web server
- `drizzle-orm` 0.39.1 - Database ORM
- `@neondatabase/serverless` 0.10.4 - PostgreSQL
- `multer` 2.0.2 - File uploads
- `csv-parser` 3.2.0 - CSV processing
- `xlsx` 0.18.5 - Excel processing

**UI Components:**
- 20+ `@radix-ui/*` packages - Accessible components
- `tailwindcss` 3.4.17 - Styling
- `framer-motion` 11.13.1 - Animations
- `lucide-react` 0.453.0 - Icons

### 9.2 Development Dependencies (Selected)
- `typescript` 5.6.3 - Type safety
- `vite` 5.4.19 - Build tool
- `esbuild` 0.25.0 - Production bundler
- `tsx` 4.20.6 - TypeScript runner
- `drizzle-kit` 0.30.4 - Database migrations
- `tailwindcss` 3.4.17 - CSS framework

---

## 10. Reference Documentation

### 10.1 Regulatory Sources
The following official documents are included in `attached_assets/`:

1. **FuelEU Maritime:**
   - FuelEU Regulation: `CELEX_32023R1805_EN_TXT`
   - DNV Calculation Methodologies: `ESSF_SAPS_WS1-FuelEU_calculation_methodologies-DNV`
   - Monitoring Plan Template: `Fuel EU - MP template`
   - Penalty Calculator: `FEM Prototype Penalty Calculator 3.1`

2. **EU Regulatory Framework:**
   - Renewable Energy Directive: `CELEX_32018L2001_EN_TXT`
   - ReFuelEU Aviation: `CELEX_32023R1804_EN_TXT`
   - Emission Allowance Regulation: `CELEX_32023R1805_EN_TXT`

3. **Additional Resources:**
   - European Parliament Research: `EPRS_BRI(2021)698808_EN`
   - Passenger Ship Guidelines: `OJ_L_202302895_EN_TXT`
   - Maritime Policy: `policy_transport_shipping_gd1_maritime_en`
   - DNV General Guidelines: `2023-08-29 - FEM - general DNV`

### 10.2 Design Reference
- **Design Guidelines:** `design_guidelines.md`
- **Inspiration:** ship-watch.com (professional maritime data presentation)
- **Component Documentation:** Shadcn/UI (ui.shadcn.com)

---

## 11. Compliance Features Matrix

| Feature | FuelEU Maritime | EU ETS | IMO Net Zero | UK ETS |
|---------|----------------|--------|--------------|--------|
| **Status** | ✅ Active | ✅ Active | ✅ Active | ✅ Ready |
| **Penalty Calculations** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Target Tracking** | ✅ 2025-2050 | ✅ Phase-in | ✅ 2028-2050 | ✅ 2026+ |
| **Banking/Borrowing** | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| **Multi-GHG** | ✅ Yes | ✅ 2026+ | ✅ Yes | ✅ Yes |
| **Voyage Coverage** | ✅ All | ✅ Partial | ✅ Global | ✅ UK Only |
| **RFNBO Incentives** | ✅ Yes | ❌ No | ⚠️ Future | ❌ No |
| **Credit Trading** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Formula Customization** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Real-time Monitoring** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 12. Data Models

### 12.1 Vessel Data Model
```typescript
interface Vessel {
  id: string
  name: string
  imoNumber: string
  type: 'Container Ship' | 'Bulk Carrier' | 'Oil Tanker' | 'Gas Carrier' | 'Ro-Ro' | 'Cruise Ship'
  flag: string
  grossTonnage: number
  complianceStatus: 'compliant' | 'warning' | 'non-compliant'
  ghgIntensity: number
  targetIntensity: number
  fuelConsumption: number
  creditBalance: number
}
```

### 12.2 Voyage Data Model
```typescript
interface Voyage {
  id: string
  vessel: string
  departure: string
  arrival: string
  distance: number
  fuelType: string
  fuelConsumed: number
  ghgIntensity: number
  complianceStatus: 'compliant' | 'warning' | 'non-compliant'
  voyageType: 'intra-eu' | 'extra-eu' | 'uk-domestic'
  date: string
}
```

### 12.3 Compliance Framework Model
```typescript
interface ComplianceFramework {
  fuelEUMaritime: boolean
  euETS: boolean
  imoNetZero: boolean
  ukETS: boolean
}
```

### 12.4 Calculation Formula Model
```typescript
interface CalculationFormula {
  id: string
  framework: string
  type: string
  formula: string
  variables: Record<string, number | string>
  description: string
  locked?: boolean
}
```

### 12.5 Import Record Model
```typescript
interface ImportedDataRecord {
  id: string
  filename: string
  type: 'csv' | 'xlsx' | 'sql'
  uploadDate: string
  recordCount: number
  columns: string[]
  mappedFields: Record<string, string>
  status: 'processing' | 'mapped' | 'imported' | 'error'
  data?: any[]
}
```

---

## 13. Future Enhancements

### 13.1 Phase 2 Features (Planned)
- [ ] Real database integration for vessel and voyage data
- [ ] User authentication and role-based access control
- [ ] Multi-company/fleet support with data isolation
- [ ] Advanced reporting and PDF generation
- [ ] Email notifications for compliance alerts
- [ ] Historical data trending (3-5 year analysis)
- [ ] Predictive analytics and ML-based forecasting
- [ ] Mobile application (iOS/Android)
- [ ] API integrations with ship tracking systems
- [ ] Automated data sync with port authorities

### 13.2 Phase 3 Features (Roadmap)
- [ ] Blockchain integration for carbon credit trading
- [ ] Real-time vessel position tracking (AIS integration)
- [ ] Weather routing optimization
- [ ] Fuel optimization recommendations
- [ ] Alternative fuel ROI calculator
- [ ] Fleet benchmark comparisons
- [ ] Regulatory update notifications
- [ ] Third-party verifier integration
- [ ] Custom dashboard builder
- [ ] Advanced data analytics with AI insights

### 13.3 Integration Opportunities
- Ship performance monitoring systems
- Fuel suppliers and bunkering platforms
- Port management systems
- Classification societies (DNV, Lloyd's, ABS)
- Carbon credit trading platforms
- Weather routing services
- Vessel tracking platforms (MarineTraffic, VesselFinder)

---

## 14. Testing Strategy

### 14.1 Current Testing Approach
- Manual testing of all core features
- Browser compatibility testing
- Responsive design testing
- API endpoint testing with Postman/curl

### 14.2 Recommended Testing Implementation
- **Unit Tests:** Jest/Vitest for utility functions
- **Component Tests:** React Testing Library
- **Integration Tests:** API endpoint testing
- **E2E Tests:** Playwright/Cypress for user workflows
- **Performance Tests:** Lighthouse CI
- **Security Tests:** OWASP dependency checks

---

## 15. Security Considerations

### 15.1 Current Implementation
- Express.js security middleware
- File upload size limits (10MB)
- Input validation with Zod schemas
- TypeScript type safety
- PostgreSQL parameterized queries (Drizzle ORM)

### 15.2 Recommended Enhancements
- [ ] Rate limiting on API endpoints
- [ ] CORS configuration
- [ ] Helmet.js security headers
- [ ] JWT authentication
- [ ] Password hashing (bcrypt/argon2)
- [ ] SQL injection prevention audits
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Regular dependency updates
- [ ] Security scanning (Snyk, npm audit)

---

## 16. Performance Optimization

### 16.1 Current Optimizations
- Vite for fast builds and HMR
- React Query for efficient data caching
- Lazy loading of components
- Tailwind CSS purging unused styles
- Code splitting with dynamic imports
- PostgreSQL indexing

### 16.2 Future Optimizations
- [ ] Service worker for offline support
- [ ] CDN for static assets
- [ ] Database query optimization
- [ ] Redis caching layer
- [ ] Image optimization and lazy loading
- [ ] Compression (gzip/brotli)
- [ ] Virtual scrolling for large tables
- [ ] Web Workers for calculations

---

## 17. Deployment

### 17.1 Production Deployment Steps

1. **Environment Setup**
```bash
export NODE_ENV=production
export DATABASE_URL=<production-database-url>
export PORT=5000
```

2. **Build Application**
```bash
npm run build
```

3. **Database Migration**
```bash
npm run db:push
```

4. **Start Production Server**
```bash
npm start
```

### 17.2 Hosting Recommendations
- **Application:** Replit, Vercel, Railway, Render, DigitalOcean
- **Database:** Neon (serverless PostgreSQL), Supabase, AWS RDS
- **Static Assets:** Cloudflare CDN, AWS S3 + CloudFront
- **Monitoring:** Sentry (error tracking), LogRocket (session replay)

---

## 18. Compliance & Regulatory Updates

### 18.1 Update Monitoring
Regular monitoring of:
- European Commission maritime transport updates
- IMO MEPC (Marine Environment Protection Committee) decisions
- UK Department for Transport announcements
- DNV, Lloyd's Register, and classification society guidelines

### 18.2 Formula Update Process
1. Regulatory change identified
2. Impact assessment on existing formulas
3. Formula updates in `regulatoryConstants.ts`
4. Update calculation formulas in DataImportService
5. Documentation updates
6. User notification of changes
7. Backward compatibility considerations

---

## 19. Support & Maintenance

### 19.1 Documentation
- **Technical Docs:** This PRD document
- **Design Guidelines:** `design_guidelines.md`
- **API Documentation:** Section 5 of this document
- **User Guide:** To be created in Phase 2

### 19.2 Maintenance Schedule
- **Weekly:** Dependency updates (non-breaking)
- **Monthly:** Security audits and patches
- **Quarterly:** Regulatory compliance review
- **Annually:** Major version upgrades

---

## 20. Success Metrics

### 20.1 Technical Metrics
- **Performance:** Page load time < 2 seconds
- **Availability:** 99.9% uptime
- **Error Rate:** < 0.1% of requests
- **API Response Time:** < 500ms (p95)

### 20.2 Business Metrics
- **User Adoption:** Active vessels tracked
- **Compliance Rate:** % of fleet in compliance
- **Cost Savings:** Penalty avoidance through proactive monitoring
- **Data Accuracy:** Import success rate > 98%

### 20.3 User Experience Metrics
- **Time to Compliance Check:** < 30 seconds
- **Data Import Time:** < 5 minutes for 10,000 records
- **User Satisfaction:** NPS score > 8/10

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **GHG** | Greenhouse Gas |
| **GFI** | GHG Fuel Intensity |
| **WtW** | Well-to-Wake (full lifecycle emissions) |
| **WtT** | Well-to-Tank (production phase emissions) |
| **TtW** | Tank-to-Wake (combustion phase emissions) |
| **LCV** | Lower Calorific Value |
| **IMO** | International Maritime Organization |
| **ETS** | Emissions Trading System |
| **EUA** | EU Allowance (carbon credit unit) |
| **GT** | Gross Tonnage |
| **DWT** | Deadweight Tonnage |
| **IMO Number** | International Maritime Organization unique ship identifier |
| **RFNBO** | Renewable Fuels of Non-Biological Origin |
| **OPS** | Onshore Power Supply |
| **MEPC** | Marine Environment Protection Committee |
| **GWP** | Global Warming Potential |
| **HFO** | Heavy Fuel Oil |
| **MGO** | Marine Gas Oil |
| **LNG** | Liquefied Natural Gas |
| **VLSFO** | Very Low Sulphur Fuel Oil |

---

## Appendix B: Changelog

### Version 1.0.0 - October 19, 2025
- **Initial Release**
- Complete multi-framework compliance system
- FuelEU Maritime, EU ETS, IMO Net Zero, UK ETS support
- 30+ calculation formulas
- Data import/export functionality
- Dashboard with real-time monitoring
- Vessel and voyage management
- Penalty calculator
- 40+ UI components
- Responsive design system
- PostgreSQL database integration
- RESTful API implementation

---

## Document Approval

**Prepared By:** Development Team  
**Date:** October 19, 2025  
**Version:** 1.0.0  
**Status:** Approved for Phase 1 Implementation

---

**End of Document**


