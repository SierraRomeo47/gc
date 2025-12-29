# Frontend-Backend Connection Guide

This document explains how the GHGConnect frontend and backend are properly connected and how to use the API.

## Overview

The application is set up as a **full-stack monolith** where:
- **Backend**: Express.js server running on port 5000 (serves both API and frontend)
- **Frontend**: React + Vite application served by the same Express server
- **Development Mode**: Vite dev server with hot reload, proxying API requests to Express
- **Production Mode**: Express serves the built static files

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Port 5000)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
          ┌───────────────────────────────────────┐
          │         Express Server (5000)          │
          │  - Serves API endpoints (/api/*)      │
          │  - Serves frontend (Vite dev/static)  │
          └───────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
          ┌──────────────┐    ┌──────────────────┐
          │   Database   │    │  React Frontend  │
          │  PostgreSQL  │    │  (Vite/React)   │
          │ (or Memory)  │    │                  │
          └──────────────┘    └──────────────────┘
```

## API Client

A type-safe API client is available at `/client/src/lib/api.ts`. It provides:

### Available APIs

```typescript
import { api } from '@/lib/api';

// Vessels API
const vessels = await api.vessels.getDemo();

// Ports API
const ports = await api.ports.getAll();
const port = await api.ports.getById('port-id');

// Fuels API
const fuels = await api.fuels.getAll();
const fuel = await api.fuels.getById('fuel-id');

// Data Import API
const files = await api.dataImport.getFiles();
const formulas = await api.dataImport.getFormulas();
await api.dataImport.uploadFile(file);
await api.dataImport.updateFormula(id, formula);
const blob = await api.dataImport.exportData('csv', 'vessel-data');

// Health API
const health = await api.health.check();
const dbHealth = await api.health.checkDatabase();

// Public Stats API
const stats = await api.stats.getPublic();
```

## Using React Query (Recommended)

The application uses **TanStack React Query** for data fetching. Here's how to use it:

### Example: Fetching Vessels

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

function VesselsList() {
  const { data: vessels, isLoading, error } = useQuery({
    queryKey: ['vessels', 'demo'],
    queryFn: () => api.vessels.getDemo(),
  });

  if (isLoading) return <div>Loading vessels...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {vessels?.map(vessel => (
        <div key={vessel.id}>
          <h3>{vessel.name}</h3>
          <p>IMO: {vessel.imoNumber}</p>
          <p>GHG Intensity: {vessel.ghgIntensity}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example: Fetching Data Import Files

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

function ImportedFilesList() {
  const { data: files, isLoading } = useQuery({
    queryKey: ['data-imports'],
    queryFn: () => api.dataImport.getFiles(),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {files?.map(file => (
        <div key={file.id}>
          <h4>{file.filename}</h4>
          <p>Records: {file.recordCount}</p>
          <p>Status: {file.status}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example: Uploading Files with Mutations

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

function FileUploader() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.dataImport.uploadFile(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-imports'] });
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  return (
    <input 
      type="file" 
      onChange={handleFileChange}
      disabled={uploadMutation.isPending}
    />
  );
}
```

## Available Endpoints

### Public Endpoints (No Authentication Required in Development)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/vessels/demo` | Get demo vessels |
| `GET` | `/api/ports` | Get all ports |
| `GET` | `/api/ports/:id` | Get specific port |
| `GET` | `/api/fuels` | Get all fuel types |
| `GET` | `/api/fuels/:id` | Get specific fuel |
| `GET` | `/api/data-imports` | Get imported files |
| `GET` | `/api/calculation-formulas` | Get calculation formulas |
| `POST` | `/api/data-imports/upload` | Upload a file |
| `PUT` | `/api/calculation-formulas/:id` | Update a formula |
| `GET` | `/api/data-exports/:format` | Export data (csv/xlsx/sql) |
| `GET` | `/api/health` | System health check |
| `GET` | `/api/health/db` | Database health check |
| `GET` | `/api/public/stats` | Public statistics |

### Protected Endpoints (Require Authentication in Production)

All the above endpoints **require authentication in production** but are open in development mode for easier testing.

In production, you'll need to:
1. Login via `/api/auth/login`
2. Include the authentication token in requests
3. Have appropriate permissions for the operation

## Testing the Connection

### 1. Start the Development Server

```bash
npm run dev
```

This starts both the Express backend and Vite frontend on port 5000.

### 2. Test API Endpoints

Open the browser console and test the API:

```javascript
// Test health check
fetch('/api/health').then(r => r.json()).then(console.log)

// Test ports
fetch('/api/ports').then(r => r.json()).then(console.log)

// Test fuels
fetch('/api/fuels').then(r => r.json()).then(console.log)

// Test vessels
fetch('/api/vessels/demo').then(r => r.json()).then(console.log)

// Test data imports
fetch('/api/data-imports').then(r => r.json()).then(console.log)

// Test calculation formulas
fetch('/api/calculation-formulas').then(r => r.json()).then(console.log)
```

### 3. Navigate to Data Integration Tab

1. Open the application: `http://localhost:5000`
2. Click on **"Data Integration"** tab in the navigation
3. You should see:
   - 3 sample imported files
   - Multiple calculation formulas for different frameworks
   - File upload functionality
   - Export functionality

### 4. Verify Data Loading

The Data Integration page should display:

✅ **Imported Files Tab**: Shows 3 pre-loaded sample files
- `vessel_fleet_Q1_2025.csv` (1,247 records)
- `fuel_consumption_jan_2025.xlsx` (3,456 records)
- `compliance_reports_2024.xlsx` (892 records)

✅ **Edit Formulas Tab**: Shows comprehensive calculation formulas for:
- FuelEU Maritime (7 formulas)
- EU ETS (4 formulas)
- IMO Net Zero Framework (4 formulas)
- UK ETS (4 formulas)

## Development vs Production

### Development Mode
- **No authentication required** for most endpoints
- **Vite dev server** with hot module replacement
- **CORS** configured for localhost
- **Mock data** pre-loaded on startup
- **Console logging** enabled

### Production Mode
- **Authentication required** for all protected endpoints
- **Static files** served by Express
- **Stricter CORS** policies
- **Database required** for persistence
- **Minimal logging**

## Environment Variables

The backend uses these environment variables:

```env
NODE_ENV=development  # or 'production'
PORT=5000
DATABASE_URL=postgresql://ghgconnect_user:postgresasd@localhost:5432/ghgconnect_db
CORS_ORIGIN=http://localhost:5000
```

## Database Connection

The application uses a **hybrid storage system**:

1. **Tries PostgreSQL first** if available
2. **Falls back to in-memory storage** if database is unavailable
3. **Auto-seeds reference data** (ports, fuels) on startup

To check database status:

```javascript
fetch('/api/health/db').then(r => r.json()).then(console.log)
```

## Troubleshooting

### "Failed to fetch" errors

1. Check that the server is running: `npm run dev`
2. Verify the port is 5000: `http://localhost:5000`
3. Check browser console for CORS errors
4. Ensure no other service is using port 5000

### "No data displayed"

1. Open browser DevTools → Network tab
2. Check API calls are succeeding (200 status)
3. Verify response data structure
4. Check console for errors

### Database not connecting

This is normal! The app works without a database using in-memory storage.

To use PostgreSQL:
1. Start the database: `docker-compose up -d` (if using Docker)
2. Or set up PostgreSQL locally
3. Verify connection: `http://localhost:5000/api/health/db`

## Next Steps

### To fetch real data in the Dashboard:

1. Update `Dashboard.tsx` to use `useQuery` hooks
2. Replace mock data with API calls
3. Handle loading and error states

Example:

```typescript
// Instead of mockVessels constant:
const { data: vessels, isLoading } = useQuery({
  queryKey: ['vessels', 'demo'],
  queryFn: () => api.vessels.getDemo(),
});

// Use in render:
{isLoading ? (
  <div>Loading...</div>
) : (
  vessels?.map(vessel => <VesselCard key={vessel.id} {...vessel} />)
)}
```

### To add authentication:

1. Implement login flow using `/api/auth/login`
2. Store JWT token in localStorage or cookies
3. Add Authorization header to API requests
4. Handle token expiration and refresh

## Summary

✅ **Backend and frontend are properly connected**
✅ **API client is type-safe and ready to use**
✅ **Development mode allows easy testing without auth**
✅ **Sample data is pre-loaded and accessible**
✅ **React Query integration is set up**
✅ **All endpoints are documented and tested**

The application is ready for development and testing!




