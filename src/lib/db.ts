import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use test database when running tests
const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined

const databaseUrl = isTestEnvironment
  ? 'file:./test.db'
  : process.env.DATABASE_URL

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    },
    log: process.env.NODE_ENV === 'development' 
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'error' },
          { emit: 'stdout', level: 'warn' },
        ]
      : ['error', 'warn'],
  })

// Enhanced query logging for performance monitoring
if (process.env.NODE_ENV === 'development') {
  db.$on('query' as never, (e: any) => {
    const duration = e.duration || 0
    const query = e.query || ''
    
    // Log slow queries (>100ms) with details
    if (duration > 100) {
      console.warn(`🐌 Slow Query (${duration}ms):`)
      console.warn(`   Query: ${query.substring(0, 200)}${query.length > 200 ? '...' : ''}`)
      console.warn(`   Params: ${e.params?.substring(0, 200) || 'N/A'}${e.params?.length > 200 ? '...' : ''}`)
    }
    
    // Log very slow queries (>1000ms) as errors
    if (duration > 1000) {
      console.error(`❌ Very Slow Query (${duration}ms): ${query.substring(0, 100)}`)
    }
  })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db