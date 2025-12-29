# GHGConnect Hybrid System Guide

## Overview

GHGConnect uses a **hybrid architecture** where a single Express server handles both the backend API and frontend delivery. This architecture simplifies deployment while maintaining development efficiency.

## Architecture

### Development Mode
In development mode, the Express server:
1. Runs on port **5000**
2. Serves API endpoints on `/api/*`
3. Uses **Vite middleware** for frontend hot-reloading
4. Provides HMR (Hot Module Replacement) for instant updates

### Production Mode
In production mode, the Express server:
1. Runs on port **5000**
2. Serves API endpoints on `/api/*`
3. Serves pre-built static files from `dist/public/`
4. No hot-reloading (uses optimized bundles)

## How It Works

### Request Flow (Development)
```
Browser Request → Express Server (Port 5000)
                    ├─ /api/* → Backend API Routes
                    └─ /* → Vite Middleware → React App
```

### Request Flow (Production)
```
Browser Request → Express Server (Port 5000)
                    ├─ /api/* → Backend API Routes
                    └─ /* → Static Files (dist/public/)
```

## Running the Application

### Development Mode (Recommended for Development)

**Windows:**
```bash
.\start-dev.bat
```

**Linux/Mac:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

**Manual:**
```bash
npm run dev
```

This command:
- Sets `NODE_ENV=development`
- Starts the Express server with `tsx` (TypeScript execution)
- Attaches Vite middleware for hot-reloading
- Opens the app at http://localhost:5000

### Production Mode

**Build the application:**
```bash
npm run build
```

**Start the production server:**
```bash
npm start
```

This command:
- Sets `NODE_ENV=production`
- Runs the compiled server from `dist/index.js`
- Serves static files from `dist/public/`

## Frontend-Backend Communication

### API Base URL
The frontend uses an **empty string** for the API base URL:
```typescript
const API_BASE = '';  // Same-origin requests
```

This means all API calls use relative paths like `/api/vessels`, which automatically resolve to the same server.

### Why This Works
1. **Same Origin**: Both frontend and backend are served from `http://localhost:5000`
2. **No CORS Issues**: Since it's same-origin, CORS is not a concern
3. **No Proxy Needed**: Vite doesn't need a proxy configuration

## Common Issues and Solutions

### Issue 1: "Cannot connect to backend"

**Symptoms:**
- API calls fail
- Console shows network errors
- Data doesn't load

**Cause:** Server is running in production mode instead of development mode.

**Solution:**
1. Stop the current server (Ctrl+C)
2. Run `.\start-dev.bat` (Windows) or `./start-dev.sh` (Linux/Mac)
3. Verify you see: `[express] serving on port 5000`

### Issue 2: "Port 5000 already in use"

**Symptoms:**
- Server fails to start
- Error: `EADDRINUSE`

**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /F /PID <PID>

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

Or use the startup scripts which handle this automatically.

### Issue 3: "Changes not reflecting"

**Symptoms:**
- Code changes don't appear in browser
- Need to manually refresh

**Cause:** Running in production mode or Vite middleware not loaded.

**Solution:**
1. Ensure you're running `npm run dev` (not `npm start`)
2. Check browser console for WebSocket connection
3. Look for `[vite]` messages in browser console

### Issue 4: "Static files outdated"

**Symptoms:**
- Old version of app showing in production
- Changes visible in dev but not production

**Solution:**
```bash
npm run build  # Rebuild static files
npm start      # Restart production server
```

## Server Mode Detection

The server determines its mode using:
```typescript
if (app.get("env") === "development") {
  await setupVite(app, server);  // Development: Vite middleware
} else {
  serveStatic(app);              // Production: Static files
}
```

The `app.get("env")` checks `process.env.NODE_ENV`:
- If `NODE_ENV=development` → Vite middleware
- Otherwise → Static files

## Verification Steps

### Verify Development Mode is Active
1. Start the server with `npm run dev`
2. Check console output for:
   - `[express] serving on port 5000`
   - Vite-related messages
3. Open http://localhost:5000
4. Open browser DevTools → Console
5. Look for `[vite]` messages indicating HMR is active

### Verify API Communication
1. Open http://localhost:5000/api/health
2. Should return JSON with server health status
3. Check browser Network tab for successful API calls

## Environment Variables

The hybrid system respects these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Server mode (development/production) |
| `PORT` | `5000` | Server port |
| `DATABASE_URL` | - | PostgreSQL connection string |
| `CORS_ORIGIN` | `http://localhost:5000` | Allowed CORS origins |

## Best Practices

### Development
1. ✅ **Always use** `npm run dev` or `start-dev.bat`
2. ✅ Keep one terminal window open for server logs
3. ✅ Use browser DevTools to monitor API calls
4. ✅ Check for `[vite]` HMR messages

### Production
1. ✅ Run `npm run build` before deploying
2. ✅ Test production build locally with `npm start`
3. ✅ Verify static files are up-to-date
4. ✅ Use environment variables for configuration

### Common Mistakes
1. ❌ Running `npm start` during development
2. ❌ Forgetting to rebuild after changes
3. ❌ Serving outdated static files
4. ❌ Not setting `NODE_ENV` correctly

## Troubleshooting Checklist

- [ ] Is the server running? (Check http://localhost:5000/api/health)
- [ ] Is it in development mode? (Check for Vite logs)
- [ ] Is the port available? (No other process using 5000)
- [ ] Are dependencies installed? (`node_modules` exists)
- [ ] Is `NODE_ENV` set correctly?
- [ ] Can the browser reach the API? (Check Network tab)

## Additional Resources

- [Express Documentation](https://expressjs.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Vite SSR Guide](https://vitejs.dev/guide/ssr.html)

## Support

If you encounter issues not covered here:
1. Check server logs for errors
2. Check browser console for errors
3. Verify environment variables
4. Restart the server with the startup scripts
5. Clear browser cache and try again

---

**Last Updated:** October 2025
**Version:** 1.0.0




