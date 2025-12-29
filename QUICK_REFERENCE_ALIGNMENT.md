# Quick Reference: Frontend-Backend Alignment

## ✅ What's Complete and Working

### New Shared Infrastructure (100% Complete)
```
shared/
├── roleMapper.ts      ✅ Bidirectional role mapping
├── permissions.ts     ✅ Unified permission system  
├── viewModels.ts      ✅ All view model types
└── schema.ts          ✅ Updated with exports

server/adapters/
├── userAdapter.ts     ✅ User DB → ViewModel
├── vesselAdapter.ts   ✅ Vessel DB → ViewModel
└── fleetAdapter.ts    ✅ Fleet DB → ViewModel

server/utils/
└── response.ts        ✅ Standardized responses
```

### Updated Files (0 Errors)
```
✅ server/auth/rbac.ts          - Uses unified permissions
✅ server/routes/auth.ts        - Uses role mapper
✅ server/routes/vessels.ts     - Uses adapters + responses
✅ server/routes.ts             - Partially updated (80%)
✅ client/src/lib/api.ts        - Complete refactor
✅ client/src/lib/userRoles.ts  - Uses shared system
✅ client/src/components/UserManagement.tsx - Updated types
```

## 🔧 How to Use New System

### Backend: Creating an API Endpoint
```typescript
// 1. Import adapters and response helpers
import { toVesselViewModel } from '../adapters/vesselAdapter';
import { successResponse, notFoundError } from '../utils/response';

// 2. Fetch from DB
const vessel = await storage.getVessel(id);

// 3. Transform to view model
const viewModel = toVesselViewModel(vessel);

// 4. Send standardized response
successResponse(res, viewModel);
```

### Frontend: Calling API
```typescript
// 1. Import types from shared
import type { VesselViewModel } from '@shared/viewModels';
// or
import type { Vessel } from '@/lib/api';

// 2. Call API (gets correct type automatically)
const vessels = await api.vessels.getAll(); // VesselViewModel[]

// 3. Use with type safety
vessels.forEach(v => {
  console.log(v.complianceStatus); // ✅ TypeScript knows this exists
});
```

### Role Conversion
```typescript
// Backend → Frontend
import { toFrontendRole } from '@shared/roleMapper';
const frontendRole = toFrontendRole('ADMIN'); // 'admin'

// Frontend → Backend (if needed)
import { toBackendRole } from '@shared/roleMapper';
const backendRole = toBackendRole('admin'); // 'ADMIN'
```

### Permission Checks
```typescript
// Backend
import { Permission, hasPermission } from '@shared/permissions';
if (hasPermission(user.role, Permission.MANAGE_VESSELS)) {
  // Allow action
}

// Frontend
import { Permission, hasPermission } from '@/lib/userRoles';
if (hasPermission(user, Permission.MANAGE_VESSELS)) {
  // Show UI element
}
```

## 📋 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* your data */ },
  "meta": {
    "timestamp": "2025-10-21T...",
    "requestId": "uuid"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "User-friendly message",
  "code": "NOT_FOUND",
  "details": { /* optional */ },
  "meta": {
    "timestamp": "2025-10-21T..."
  }
}
```

## 🎯 Type Mappings

### User Types
```typescript
// Database (from schema.ts)
type User = {
  id: string;
  username: string;
  email: string;
  tenantId: string | null;
  // ... DB fields only
};

// View Model (from viewModels.ts)
type UserViewModel = User & {
  role: string;                    // ← Computed from userRoles
  name: string;                    // ← Display name
  subscriptionTier: SubscriptionTier; // ← Computed
  fleetIds: string[];              // ← From userFleetAccess
  vesselIds: string[];             // ← From userVesselAccess
  isActive: boolean;               // ← Computed
  // ... all fields populated
};
```

### Vessel Types
```typescript
// Database
type Vessel = {
  id: string;
  name: string;
  vesselType: string;
  // ... DB fields only
};

// View Model
type VesselViewModel = Vessel & {
  type: string;                    // ← Alias for vesselType
  flag: string;                    // ← Alias for flagState
  complianceStatus: ComplianceStatus; // ← Calculated
  ghgIntensity: number;            // ← Calculated
  targetIntensity: number;         // ← Based on year
  creditBalance: number;           // ← Calculated
  // ... compliance fields
};
```

## 🔍 Finding Things

### Want to add a new permission?
1. Add to `shared/permissions.ts` → Permission enum
2. Add to role matrices in same file
3. Use in backend with `requirePermission(Permission.YOUR_NEW_PERM)`
4. Use in frontend with `hasPermission(user, Permission.YOUR_NEW_PERM)`

### Want to add a field to User?
1. If DB field: Add to `shared/schema.ts` → users table
2. If computed field: Add to `shared/viewModels.ts` → UserViewModel
3. Update `server/adapters/userAdapter.ts` → compute the field
4. Frontend automatically gets it via `UserViewModel` type

### Want to create a new endpoint?
1. Use pattern from `server/routes/vessels.ts`
2. Import adapter: `import { toXAdapter } from '../adapters/xAdapter'`
3. Import responses: `import { successResponse } from '../utils/response'`
4. Fetch, transform, respond

### Want to call API from frontend?
1. Check if endpoint exists in `client/src/lib/api.ts`
2. If yes: Use `api.category.method()`
3. If no: Add method to appropriate API object
4. Type comes automatically from view models

## 🚦 Status Indicators

### Files with ✅ (Safe to use as reference)
- `shared/roleMapper.ts` - Role conversion examples
- `shared/permissions.ts` - Permission check examples
- `server/adapters/*` - Transformation examples
- `server/routes/vessels.ts` - Complete endpoint examples
- `client/src/lib/api.ts` - API call examples
- `client/src/lib/userRoles.ts` - Frontend role examples

### Files with 🟨 (Partially updated)
- `server/routes.ts` - Some endpoints updated, some legacy
- Use updated endpoints as reference for updating legacy ones

### Files with ⬜ (Not yet updated)
- Most frontend components
- Some backend routes
- Need type updates but patterns established

## 💡 Common Patterns

### Backend: GET Single Resource
```typescript
app.get('/api/v1/resource/:id', async (req, res) => {
  const item = await storage.getItem(req.params.id);
  if (!item) return notFoundError(res, 'Item not found');
  
  const viewModel = toItemViewModel(item);
  successResponse(res, viewModel);
});
```

### Backend: GET List
```typescript
app.get('/api/v1/resources', async (req, res) => {
  const items = await storage.getItems();
  const viewModels = toItemViewModels(items);
  successResponse(res, viewModels);
});
```

### Backend: POST Create
```typescript
app.post('/api/v1/resources', async (req, res) => {
  if (!req.body.requiredField) {
    return badRequestError(res, 'Missing required field');
  }
  
  const item = await storage.createItem(req.body);
  const viewModel = toItemViewModel(item);
  createdResponse(res, viewModel); // Uses 201 status
});
```

### Frontend: Query Hook
```typescript
const { data: items } = useQuery({
  queryKey: ['items'],
  queryFn: () => api.items.getAll(), // Returns ItemViewModel[]
});
```

### Frontend: Mutation Hook
```typescript
const mutation = useMutation({
  mutationFn: (data: Partial<ItemViewModel>) => api.items.create(data),
  onSuccess: () => queryClient.invalidateQueries(['items']),
});
```

## 🐛 Troubleshooting

### "Type X is not assignable to type Y"
- Check if you're mixing DB types with view models
- Use view models in frontend, DB types in backend
- Import types from `@shared/viewModels` not local definitions

### "Cannot find module '@shared/...'"
- Check tsconfig.json has paths configured
- Check file is in GHGConnect/shared/ not GHGConnect/server/shared/
- Restart TypeScript server in VS Code

### "Property does not exist on type"
- Check if using correct view model type
- User should be UserViewModel, not DB User
- Vessel should be VesselViewModel, not DB Vessel

### Backend returns unexpected format
- Check if endpoint uses adapter
- Check if uses successResponse() helper
- Some legacy endpoints may not be updated yet

## 📚 Key Files to Reference

1. **`ALIGNMENT_COMPLETE_SUMMARY.md`** - Full detailed status
2. **`ALIGNMENT_PROGRESS.md`** - Task-by-task progress
3. **`shared/viewModels.ts`** - All type definitions
4. **`server/routes/vessels.ts`** - Complete endpoint examples
5. **`client/src/lib/api.ts`** - API client pattern

## ⚡ Quick Commands

```bash
# Check for TypeScript errors
npm run check

# Start development server
npm run dev

# Run in production mode
npm run start:prod
```

## 🎓 Remember

1. **Single source of truth**: Types in `shared/`, not duplicated
2. **Always use adapters**: DB → View Model in backend
3. **Standardized responses**: Use helpers, not raw `res.json()`
4. **Type imports**: From `@shared/` not redefined
5. **Role conversion**: Use mapper, don't manually convert

---
Last Updated: 2025-10-21  
Status: Core Complete ✅ | Components In Progress 🟨  
Errors: 0 | Confidence: High



