import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Prisma } from '@prisma/client'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildStartTimeRange, calculateBreakMinutes } from '@/lib/time'

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

  const where: Prisma.TimeLogWhereInput = {}

  if (companyId) {
    const member = await prisma.companyMember.findUnique({
      where: { userId_companyId: { userId: session.user.id, companyId } },
    })
    if (!member || member.status !== 'approved') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    where.companyId = companyId
    if (member.role === 'admin' && userId) {
      where.userId = userId
    } else if (member.role !== 'admin') {
      where.userId = session.user.id
    }
  } else {
    where.userId = session.user.id
  }

  const startTime = buildStartTimeRange(startDate, endDate)
  if (startTime) {
    where.startTime = startTime
  }

  const timeLogs = await prisma.timeLog.findMany({
    where,
    include: {
      breaks: true,
      user: { select: { id: true, name: true, email: true } },
      company: { select: { id: true, name: true } },
    },
    orderBy: { startTime: 'desc' },
  })

  return NextResponse.json({ timeLogs })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { companyId, description } = await request.json()
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 })
    }

    const member = await prisma.companyMember.findUnique({
      where: { userId_companyId: { userId: session.user.id, companyId } },
    })
    if (!member || member.status !== 'approved') {
      return NextResponse.json({ error: 'Not an approved member' }, { status: 403 })
    }

    const now = new Date()
    const activeLogs = await prisma.timeLog.findMany({
      where: { userId: session.user.id, isRunning: true },
      include: { breaks: true },
    })

    await prisma.$transaction(
      activeLogs.flatMap((log) => {
        const completedBreaks = log.breaks.map((currentBreak) => ({
          ...currentBreak,
          endTime: currentBreak.endTime ?? now,
        }))

        return [
          prisma.break.updateMany({
            where: { timeLogId: log.id, isRunning: true },
            data: { isRunning: false, endTime: now },
          }),
          prisma.timeLog.update({
            where: { id: log.id },
            data: {
              isRunning: false,
              endTime: now,
              totalBreakMinutes: calculateBreakMinutes(completedBreaks, now),
            },
          }),
        ]
      }),
    )

    const timeLog = await prisma.timeLog.create({
      data: {
        userId: session.user.id,
        companyId,
        description: typeof description === 'string' ? description : '',
        startTime: now,
        isRunning: true,
      },
      include: {
        breaks: true,
        company: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ timeLog }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
