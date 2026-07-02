import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const timeLog = await prisma.timeLog.findFirst({
    where: { userId: session.user.id, isRunning: true },
    include: {
      breaks: true,
      company: { select: { id: true, name: true } },
    },
    orderBy: { startTime: 'desc' },
  })

  return NextResponse.json({ timeLog })
}
