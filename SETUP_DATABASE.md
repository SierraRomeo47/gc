# Quick Database Setup Guide

Follow these steps to connect GHGConnect to your local PostgreSQL database.

## Step 1: Create .env File

Create a file named `.env` in the `GHGConnect` folder with this content:

```env
# Database Connection - Update with YOUR PostgreSQL password
DATABASE_URL=postgresql://postgres:Password@localhost:5432/ghgconnect_db

# Server Configuration
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:5000,http://localhost:5173
SESSION_SECRET=ghgconnect_dev_secret_change_in_production
```

**Important:** Replace `YOUR_PASSWORD_HERE` with your actual PostgreSQL password!

## Step 2: Create Database

Open a terminal and run:

```bash
psql -U postgres -c "CREATE DATABASE ghgconnect_db;"
```

If prompted, enter your PostgreSQL password.

## Step 3: Install Dependencies

```bash
cd GHGConnect
npm install
```

## Step 4: Initialize Database

```bash
npm run db:init
```

This creates all tables and loads sample data.

## Step 5: Verify Connection

```bash
npm run db:check
```

You should see green checkmarks (✅) indicating successful connection.

## Step 6: Start the Application

```bash
npm run dev
```

Visit: http://localhost:5000

## Login Credentials

After initialization, login with:

- **Email:** `admin@maritime-solutions.com`
- **Password:** `admin123`

---

## Troubleshooting

### "psql: command not found"

PostgreSQL is not in your PATH. Instead, try:

**Windows:**
```cmd
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE ghgconnect_db;"
```

**Mac (with Homebrew):**
```bash
/usr/local/bin/psql -U postgres -c "CREATE DATABASE ghgconnect_db;"
```

### "connection refused" Error

PostgreSQL is not running. Start it:

**Windows:** Open Services, find PostgreSQL, click Start

**Mac:**
```bash
brew services start postgresql
```

**Linux:**
```bash
sudo systemctl start postgresql
```

### "password authentication failed"

Your DATABASE_URL password doesn't match PostgreSQL. 

1. Open `.env` file
2. Update the password in DATABASE_URL
3. Save and try again

### Database Already Exists

That's fine! Skip Step 2 and continue with Step 3.

---

## What Gets Created

The database initialization creates:

- ✅ 1 Tenant organization
- ✅ 3 Users (admin, compliance, ops)
- ✅ 25 Ports (EU, UK, International)
- ✅ 16 Fuel types (including alternative fuels)
- ✅ 8 Vessels with sample voyages
- ✅ All required tables and indexes

---

## Need More Help?

See the detailed guide: `DATABASE_CONNECTION_GUIDE.md`

Or run diagnostic check: `npm run db:check`

