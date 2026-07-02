import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Prisma } from '@prisma/client'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildStartTimeRange, calculateTrackedMinutes } from '@/lib/time'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const userId = searchParams.get('userId')

  if (!companyId) {
    return NextResponse.json({ error: 'Company ID required' }, { status: 400 })
  }

  const member = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
  })
  if (!member || member.status !== 'approved') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const where: Prisma.TimeLogWhereInput = {
    companyId,
    isRunning: false,
  }

  if (member.role !== 'admin') {
    where.userId = session.user.id
  } else if (userId) {
    where.userId = userId
  }

  const startTime = buildStartTimeRange(startDate, endDate)
  if (startTime) {
    where.startTime = startTime
  }

  const timeLogs = await prisma.timeLog.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      company: { select: { id: true, name: true } },
    },
    orderBy: { startTime: 'asc' },
  })

  const userMap: Record<
    string,
    { name: string; email: string; totalMinutes: number; logs: number }
  > = {}
  let totalMinutes = 0

  for (const log of timeLogs) {
    if (!log.endTime) {
      continue
    }

    const durationMinutes = calculateTrackedMinutes(
      log.startTime,
      log.endTime,
      log.totalBreakMinutes,
    )

    totalMinutes += durationMinutes

    if (!userMap[log.userId]) {
      userMap[log.userId] = {
        name: log.user.name,
        email: log.user.email,
        totalMinutes: 0,
        logs: 0,
      }
    }

    userMap[log.userId].totalMinutes += durationMinutes
    userMap[log.userId].logs += 1
  }

  return NextResponse.json({
    timeLogs,
    summary: {
      totalMinutes,
      totalHours: totalMinutes / 60,
      userBreakdown: userMap,
    },
  })
}
