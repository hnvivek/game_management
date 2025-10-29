const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

console.log('Available Prisma models:', Object.keys(db).filter(key => !key.startsWith('$') && !key.startsWith('_')))

process.exit(0)
