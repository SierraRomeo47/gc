# GHGConnect - Database Connection Guide

This guide explains how to connect GHGConnect to your local PostgreSQL database.

## Overview

GHGConnect uses a **hybrid storage system** that intelligently routes between PostgreSQL database and in-memory storage:

- **Persistent data** (users, tenants, vessels, voyages) → PostgreSQL Database
- **Reference data** (ports, fuels) → PostgreSQL Database  
- **Fallback** → If database is unavailable, uses in-memory storage automatically

## Prerequisites

- PostgreSQL 12 or higher installed locally
- Node.js 18+ and npm
- Database credentials (username and password)

## Quick Start

### 1. Create Environment Configuration

Create a `.env` file in the `GHGConnect` directory:

```bash
# GHGConnect Environment Configuration

# Database Connection (update with your credentials)
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/ghgconnect_db

# Server Configuration
NODE_ENV=development
PORT=5000

# CORS Configuration
CORS_ORIGIN=http://localhost:5000,http://localhost:5173

# Session Secret
SESSION_SECRET=your_secret_key_here
```

**Important:** Replace `your_password` with your actual PostgreSQL password.

### 2. Create Database

Create the PostgreSQL database (if it doesn't exist):

```bash
# Using psql
psql -U postgres -c "CREATE DATABASE ghgconnect_db;"

# Or using pgAdmin or your preferred PostgreSQL client
```

### 3. Install Dependencies

```bash
cd GHGConnect
npm install
```

### 4. Initialize Database Schema

Run the database initialization script:

```bash
npm run db:init
```

This will:
- Create all required tables
- Set up indexes and constraints
- Load sample data (ports, fuels, users, vessels)
- Create default login credentials

### 5. Verify Connection

Check that everything is working:

```bash
npm run db:check
```

You should see:
- ✅ Database connection is working
- ✅ All tables created
- ✅ Extensions installed

### 6. Start Application

```bash
npm run dev
```

Visit http://localhost:5000

## Default Login Credentials

After running `npm run db:init`, you can login with:

**Admin User:**
- Email: `admin@maritime-solutions.com`
- Password: `admin123`

**Compliance User:**
- Email: `compliance@maritime-solutions.com`  
- Password: `compliance123`

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/dbname` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Server port | `5000` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CORS_ORIGIN` | Allowed origins (comma-separated) | `http://localhost:5000` |
| `SESSION_SECRET` | Session encryption key | Auto-generated |
| `LOG_LEVEL` | Logging level | `info` |

## Database Connection String Format

```
postgresql://[username]:[password]@[host]:[port]/[database]
```

### Common Examples

**Local PostgreSQL (default user):**
```
postgresql://postgres:postgres@localhost:5432/ghgconnect_db
```

**Local PostgreSQL (custom user):**
```
postgresql://ghgconnect_user:mypassword@localhost:5432/ghgconnect_db
```

**Custom port:**
```
postgresql://postgres:postgres@localhost:5433/ghgconnect_db
```

**With SSL (production):**
```
postgresql://user:pass@host:5432/db?sslmode=require
```

## Troubleshooting

### Connection Refused

**Error:** `ECONNREFUSED` or `connection refused`

**Solutions:**
1. Check PostgreSQL is running:
   ```bash
   # Windows
   services.msc  # Look for PostgreSQL service
   
   # Mac
   brew services list
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Verify port 5432 is not blocked:
   ```bash
   netstat -an | grep 5432
   ```

3. Check PostgreSQL is listening on localhost:
   - Edit `postgresql.conf`: `listen_addresses = 'localhost'`
   - Edit `pg_hba.conf`: Add line `host all all 127.0.0.1/32 md5`

### Authentication Failed

**Error:** `password authentication failed`

**Solutions:**
1. Verify credentials in `.env` file
2. Reset PostgreSQL password:
   ```sql
   ALTER USER postgres WITH PASSWORD 'new_password';
   ```

3. Check `pg_hba.conf` authentication method is set to `md5` or `scram-sha-256`

### Database Does Not Exist

**Error:** `database "ghgconnect_db" does not exist`

**Solution:**
```bash
psql -U postgres -c "CREATE DATABASE ghgconnect_db;"
```

### Permission Denied

**Error:** `permission denied to create database` or `must be owner`

**Solutions:**
1. Grant permissions to user:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE ghgconnect_db TO postgres;
   ```

2. Or create database as superuser and then initialize

### Schema Not Initialized

**Error:** Table doesn't exist errors

**Solution:**
```bash
npm run db:init
```

### Port Already in Use

**Error:** `EADDRINUSE` or port 5000 already in use

**Solution:**
Change port in `.env`:
```
PORT=3000
```

## Hybrid Storage Behavior

### When Database is Available
- ✅ All data persisted to PostgreSQL
- ✅ Data survives server restarts
- ✅ Can be accessed by multiple instances
- ✅ Full transaction support

### When Database is Unavailable
- ⚠️ Falls back to in-memory storage
- ⚠️ Data cleared on server restart
- ⚠️ Single instance only
- ✅ Application continues to work

### Monitoring Storage Mode

Check the console output when starting the server:

```
✅ Hybrid Storage: Using PostgreSQL database
```

or

```
⚠️  Hybrid Storage: Database unavailable, using memory storage
```

## Advanced Configuration

### Connection Pooling

Configure in `server/db.ts`:

```typescript
const poolConfig: PoolConfig = {
  max: 20,           // Maximum pool size
  min: 2,            // Minimum pool size
  idleTimeoutMillis: 30000,  // Close idle connections after 30s
  connectionTimeoutMillis: 10000,  // Timeout for new connections
};
```

### SSL Configuration

For production, enable SSL in `.env`:

```
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

Update `server/db.ts` to enforce SSL:

```typescript
ssl: NODE_ENV === 'production' ? {
  rejectUnauthorized: true,
  ca: fs.readFileSync('path/to/ca-certificate.crt').toString(),
} : false,
```

## Database Maintenance

### Backup Database

```bash
pg_dump -U postgres ghgconnect_db > backup.sql
```

### Restore Database

```bash
psql -U postgres -d ghgconnect_db < backup.sql
```

### Reset Database

```bash
# Drop and recreate
psql -U postgres -c "DROP DATABASE IF EXISTS ghgconnect_db;"
psql -U postgres -c "CREATE DATABASE ghgconnect_db;"

# Reinitialize
npm run db:init
```

### View Database Stats

```bash
npm run db:check
```

## npm Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run db:init` | Initialize database schema with sample data |
| `npm run db:check` | Check database connection and health |
| `npm run db:push` | Push Drizzle schema to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with test data |

## Security Best Practices

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Use strong passwords** - Especially in production
3. **Enable SSL** - For production databases
4. **Restrict database access** - Use firewall rules
5. **Regular backups** - Automate with cron jobs
6. **Rotate credentials** - Change passwords periodically
7. **Use environment-specific configs** - Different credentials per environment

## Support

For additional help:
- Check console logs for detailed error messages
- Run `npm run db:check` for diagnostic information
- Review `server/db.ts` for connection configuration
- See `server/dbStorage.ts` for database implementation

## Next Steps

After successful database connection:

1. **Explore the application:**
   - Login with default credentials
   - View vessels and voyages
   - Test compliance calculations

2. **Import your data:**
   - Use the Data Import page
   - Upload CSV/XLSX files
   - Map fields to database schema

3. **Customize:**
   - Add your vessels and fleets
   - Configure regulatory constants
   - Set up user accounts

4. **Deploy to production:**
   - Update `.env` with production credentials
   - Enable SSL
   - Configure backup strategy
   - Set up monitoring

