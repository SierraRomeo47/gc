# Quick Start Guide - After Optimization

## 🚀 Getting Started (5 Minutes)

### 1. Setup Environment
```bash
# Navigate to project
cd GHGConnect

# Copy environment template
cp env.development.template .env

# Edit .env file (set DATABASE_URL if using PostgreSQL)
nano .env
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database (Optional - runs in memory mode without it)
```bash
# If using PostgreSQL:
npm run db:push

# Apply performance indexes
psql $DATABASE_URL < database/migrations/003_add_indexes.sql
```

### 4. Start Development Server
```bash
npm run dev
```

**Server will start on**: http://localhost:5000

---

## ⚙️ What Changed?

### ✅ Fixed Issues
1. **Port Mismatch** - Frontend now calls correct port (5000)
2. **Auth Bypass** - No more security holes in development
3. **Weak Secrets** - Production requires proper environment variables

### ✅ New Features
1. **Error Handling** - Graceful error recovery with user-friendly messages
2. **Rate Limiting** - DDoS protection (100 requests / 15 min)
3. **Input Validation** - XSS and SQL injection prevention
4. **Caching** - Redis caching for better performance
5. **Database Indexes** - 40+ indexes for faster queries

---

## 🔐 Environment Variables (Required for Production)

```bash
# Required in production
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=<generate-with-crypto.randomBytes>
JWT_REFRESH_SECRET=<generate-with-crypto.randomBytes>

# Optional but recommended
REDIS_URL=redis://localhost:6379
```

**Generate Secrets**:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🧪 Testing

```bash
# Type check
npm run check

# Build
npm run build

# Start production
npm start
```

---

## 📊 New API Features

### Rate Limiting
All API endpoints now have rate limiting:
- **API endpoints**: 100 requests / 15 minutes
- **Auth endpoints**: 5 attempts / 15 minutes
- **Upload endpoints**: 10 uploads / hour

Check headers:
- `X-RateLimit-Limit` - Total allowed requests
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - When limit resets

### Error Handling
API now returns structured errors:
```json
{
  "status": "error",
  "message": "User-friendly error message",
  "code": "ERROR_CODE",
  "requestId": "unique-request-id",
  "timestamp": "2025-10-21T12:00:00.000Z"
}
```

### Validation
All inputs are now validated and sanitized:
- XSS attacks prevented
- SQL injection blocked
- File uploads validated
- Request schemas enforced

---

## 🐛 Troubleshooting

### "Database connection failed"
**Solution**: Either set `DATABASE_URL` in `.env` or run without it (memory-only mode)

### "Missing JWT_SECRET"
**Solution**: Only required in production. Generate with:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### "Rate limit exceeded"
**Solution**: Wait for the time specified in `X-RateLimit-Reset` header

### "Validation failed"
**Solution**: Check the error response for specific field validation errors

---

## 📚 Documentation

- `IMPLEMENTATION_SUMMARY.md` - Complete implementation details
- `OPTIMIZATION_PROGRESS.md` - Detailed progress tracking
- `env.development.template` - Development environment setup
- `env.production.template` - Production environment setup
- `database/migrations/003_add_indexes.sql` - Database performance indexes

---

## 🎯 Next Steps

1. **Review Changes**: Check `IMPLEMENTATION_SUMMARY.md`
2. **Test Application**: Verify all features work
3. **Setup Production**: Use `env.production.template`
4. **Run Migrations**: Apply database indexes
5. **Monitor Performance**: Check response times

---

## ⚠️ Important Notes

- **Port Changed**: Frontend now uses port 5000 (was 5001)
- **Auth Required**: No more development bypass
- **Environment Variables**: Must be set in production
- **Database Indexes**: Run migration for best performance
- **Redis Optional**: Falls back to memory if not available

---

## 💡 Pro Tips

1. **Use Memory Mode** for quick local testing (no DATABASE_URL needed)
2. **Enable Redis** for production (better caching and rate limiting)
3. **Apply Indexes** for production databases (40+ indexes available)
4. **Monitor Rate Limits** to avoid hitting API limits
5. **Check Error Logs** for debugging (structured with request IDs)

---

## ✅ Verification Checklist

- [ ] Application starts without errors
- [ ] Can access http://localhost:5000
- [ ] API calls work (check browser console)
- [ ] No linter errors (`npm run check`)
- [ ] Environment variables set for production
- [ ] Database indexes applied (if using PostgreSQL)

---

**Need Help?** Check `IMPLEMENTATION_SUMMARY.md` for detailed information.

**Ready for Production?** Follow deployment guide in `env.production.template`.

