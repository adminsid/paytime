import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

let prismaInstance: PrismaClient

try {
  // Dynamically require to avoid compilation errors on non-edge platforms
  const { getCloudflareContext } = require('@opennextjs/cloudflare')
  const { env } = getCloudflareContext()
  
  if (env && env.DB) {
    const adapter = new PrismaD1(env.DB)
    prismaInstance = new PrismaClient({ adapter })
  } else {
    throw new Error('D1 binding not found in environment')
  }
} catch (e) {
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
