import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

let prismaInstance: PrismaClient

// Detect if we are running in the Cloudflare V8 worker sandbox environment
const isCloudflare = 
  typeof globalThis !== 'undefined' && 
  'caches' in globalThis && 
  !('process' in globalThis && (globalThis as any).process?.versions?.node)

if (isCloudflare) {
  try {
    const { getCloudflareContext } = require('@opennextjs/cloudflare')
    const { env } = getCloudflareContext()
    
    if (env && env.DB) {
      const adapter = new PrismaD1(env.DB)
      prismaInstance = new PrismaClient({ adapter })
    } else {
      throw new Error('D1 database binding "DB" not found in Cloudflare context')
    }
  } catch (e) {
    console.error('Failed to initialize Prisma D1 adapter on Edge:', e)
    prismaInstance = new PrismaClient()
  }
} else {
  // Standard Node.js client fallback (development dev server, build phase, migrations, scripts)
  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
  }

  // Clear cached global client to pick up hot-reload schema updates
  globalForPrisma.prisma = undefined

  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: ['error'],
    })

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance
}

export const prisma = prismaInstance
