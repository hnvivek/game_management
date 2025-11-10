# Prisma Client Singleton Pattern - Production Notes

## Overview

The application uses a singleton pattern for the Prisma Client instance to optimize database connections and performance. This document explains how it works in different deployment environments.

## Current Implementation

The `src/lib/db.ts` file exports a shared `db` instance that:

1. **Checks for existing instance**: Uses `globalForPrisma.prisma ?? new PrismaClient()`
2. **Stores in global**: Prevents multiple instances within the same process
3. **Handles connection pooling**: Prisma automatically manages connection pools

## How It Works in Different Environments

### Development (Local)
- ✅ **Module caching**: Next.js caches modules, so `db` is created once
- ✅ **Global storage**: Instance stored in `globalThis` for hot-reload scenarios
- ✅ **Single instance**: All API routes share the same Prisma Client
- ✅ **Connection pooling**: Prisma manages connections efficiently

### Production - Traditional Server (Node.js)
- ✅ **Module caching**: Node.js caches modules, so `db` is created once per process
- ✅ **Global storage**: Instance persists across requests in the same process
- ✅ **Connection pooling**: Prisma reuses connections efficiently
- ✅ **Optimal**: Best performance scenario

### Production - Serverless Functions (Vercel, AWS Lambda, etc.)
- ⚠️ **Function isolation**: Each function invocation may be a new process
- ✅ **Prisma handles it**: Prisma Client automatically manages connection pooling
- ✅ **Connection reuse**: Connections are reused within the same function invocation
- ✅ **Cold starts**: New instance created on cold start, but Prisma optimizes this
- ✅ **Warm instances**: Reuses existing instance if function is warm

### Production - Edge Functions (Vercel Edge, Cloudflare Workers)
- ⚠️ **Limited support**: Prisma doesn't fully support Edge Runtime
- ⚠️ **Consider alternatives**: May need Prisma Data Proxy or different approach
- ⚠️ **Check compatibility**: Verify Prisma Edge compatibility

## Why Use Shared Instance?

### Benefits:
1. **Connection Pooling**: Prisma manages a connection pool efficiently
2. **Memory Efficiency**: Single instance uses less memory
3. **Performance**: Avoids overhead of creating multiple clients
4. **Query Optimization**: Prisma can optimize queries across the application

### Without Shared Instance (Creating `new PrismaClient()` in each route):
- ❌ Multiple connection pools (wasteful)
- ❌ Higher memory usage
- ❌ Slower query performance
- ❌ Potential connection limit issues

## Production Best Practices

### ✅ Recommended:
```typescript
// ✅ GOOD: Use shared instance
import { db } from '@/lib/db'
export async function GET() {
  const users = await db.user.findMany()
}
```

### ❌ Avoid:
```typescript
// ❌ BAD: Creates new instance each time
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient() // Don't do this!
```

## Connection Pool Configuration

For production databases (PostgreSQL, MySQL), you can configure connection pooling:

```typescript
// In src/lib/db.ts (if needed)
export const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Connection pool settings (for PostgreSQL/MySQL)
  // Note: SQLite doesn't use connection pooling
})
```

### Environment Variables:
- `DATABASE_URL`: Your database connection string
- For PostgreSQL: Use connection pooling URL (e.g., `postgresql://user:pass@host:5432/db?connection_limit=10`)

## Monitoring & Debugging

### Development:
- Slow query logging enabled (>100ms)
- Query details logged for debugging

### Production:
- Only errors and warnings logged
- Monitor connection pool usage
- Watch for connection limit errors

## Troubleshooting

### Issue: "Too many connections"
- **Cause**: Multiple Prisma Client instances or connection pool too large
- **Solution**: Ensure using shared `db` instance, reduce connection limit

### Issue: Slow queries in production
- **Cause**: Database performance, missing indexes, or inefficient queries
- **Solution**: Check database indexes, optimize queries, use query logging

### Issue: Cold start delays
- **Cause**: First Prisma Client creation in serverless
- **Solution**: Normal behavior, Prisma optimizes subsequent queries

## Migration from Individual Instances

If you have routes using `new PrismaClient()`:

1. **Find all instances**:
   ```bash
   grep -r "new PrismaClient" src/
   ```

2. **Replace with shared instance**:
   ```typescript
   // Before
   import { PrismaClient } from '@prisma/client'
   const prisma = new PrismaClient()
   
   // After
   import { db } from '@/lib/db'
   // Use db instead of prisma
   ```

3. **Test thoroughly**: Ensure all routes work correctly

## Summary

✅ **The shared `db` instance works correctly in production**
✅ **Prisma handles connection pooling automatically**
✅ **Serverless functions work fine with this pattern**
✅ **No changes needed for most deployments**

The current implementation is production-ready and follows Prisma best practices!

