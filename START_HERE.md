# GHGConnect - Getting Started

This guide will help you set up and run the GHGConnect application locally with synthetic data.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
cd GHGConnect
npm install
```

### 2. Seed the Database

The application uses in-memory storage, so you need to seed it with data when the server starts. The seed script will create:

- 30+ ports (EU, UK, and international)
- 16 fuel types
- 1 tenant organization
- 2 users (admin and compliance)
- 1 organization with 1 fleet
- 5 vessels
- 25 voyages with realistic routes
- 100 consumption records

Run the seed script:

```bash
npm run db:seed
```

### 3. Start the Development Server

```bash
npm run dev
```

The application will be available at: http://localhost:5000

## Login Credentials

After seeding, you can log in with these credentials:

- **Admin User**
  - Email: `admin@ghgconnect.com`
  - Password: `admin123`
  - Role: ADMIN (full access)

- **Compliance User**
  - Email: `compliance@ghgconnect.com`
  - Password: `admin123`
  - Role: COMPLIANCE (view and compliance operations)

## Available API Endpoints

### Public Endpoints (No Authentication Required)

- `GET /api/public/stats` - Get system statistics
- `GET /api/ports` - Get all ports
- `GET /api/ports/:id` - Get specific port
- `GET /api/fuels` - Get all fuel types
- `GET /api/fuels/:id` - Get specific fuel

### Protected Endpoints (Authentication Required)

#### Vessels
- `GET /api/v1/vessels` - Get all vessels for tenant
- `GET /api/v1/vessels/:id` - Get specific vessel
- `POST /api/v1/vessels` - Create new vessel
- `PUT /api/v1/vessels/:id` - Update vessel
- `GET /api/v1/vessels/:id/voyages` - Get voyages for vessel

#### Voyages
- `GET /api/voyages` - Get all voyages for tenant
- `GET /api/voyages/:id` - Get specific voyage

#### Consumptions
- `GET /api/voyages/:voyageId/consumptions` - Get consumptions for voyage

#### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/user` - Get current user

## Synthetic Data Overview

### Vessels
The seed creates 5 diverse vessels:

1. **MV Atlantic Pioneer** (IMO9876543) - Container Ship, Dutch flag
2. **MV Nordic Explorer** (IMO9876544) - Bulk Carrier, Norwegian flag
3. **MV Baltic Star** (IMO9876545) - Tanker, Danish flag
4. **MV Mediterranean Express** (IMO9876546) - Container Ship (LNG), Italian flag
5. **MV Thames Voyager** (IMO9876547) - Ro-Ro Cargo, British flag

### Voyages
Each vessel has 5 voyages over the last 90 days, covering:
- Intra-EU routes (Rotterdam, Hamburg, London, Le Havre, Valencia, Genoa, Piraeus)
- Extra-EU routes (New York, Singapore)

### Consumptions
Each voyage has 4 consumption records:
- Main engine consumption at sea (VLSFO or LNG)
- Auxiliary engine consumption at sea (MGO)
- Port consumption at berth (MGO)
- Maneuvering consumption (MGO)

## Testing the Application

### 1. Check System Health

```bash
curl http://localhost:5000/api/public/stats
```

Expected response:
```json
{
  "portsCount": 30,
  "fuelsCount": 16,
  "status": "healthy"
}
```

### 2. View All Ports

```bash
curl http://localhost:5000/api/ports
```

### 3. View All Fuels

```bash
curl http://localhost:5000/api/fuels
```

### 4. Login and Get Token

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ghgconnect.com","password":"admin123"}'
```

Save the token from the response and use it for authenticated requests:

```bash
curl http://localhost:5000/api/v1/vessels \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Frontend

The frontend React application is located in `client/` and includes:

- Dashboard with compliance metrics
- Vessel management
- Voyage tracking
- Fuel consumption monitoring
- Regulatory compliance calculators (FuelEU, EU-ETS, IMO, UK-ETS)

The frontend will automatically connect to the backend API when you run `npm run dev`.

## Troubleshooting

### Port Already in Use

If port 5000 is already in use, you can change it by setting the PORT environment variable:

```bash
PORT=3000 npm run dev
```

### No Data Showing

Make sure you've run the seed script:

```bash
npm run db:seed
```

### Authentication Issues

The application uses in-memory storage, so data is cleared when the server restarts. You'll need to:
1. Restart the server
2. Re-run the seed script
3. Login again

## Next Steps

- Explore the dashboard at http://localhost:5000
- Try creating new vessels and voyages through the UI
- Import data using CSV/XLSX files via the Data Import page
- Run compliance calculations for different frameworks
- Export reports in various formats

## Project Structure

```
GHGConnect/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   └── lib/         # Utilities
├── server/              # Express backend
│   ├── routes/          # API routes
│   ├── calculators/     # Compliance calculators
│   ├── data/            # Seed data
│   └── auth/            # Authentication
├── shared/              # Shared types/schemas
└── package.json
```

## Support

For issues or questions, refer to:
- PRD.md - Product Requirements Document
- IMPLEMENTATION_STATUS.md - Implementation details
- COMPLETED_WORK_SUMMARY.md - Feature summary

