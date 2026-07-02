import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateBreakMinutes } from '@/lib/time'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const timeLog = await prisma.timeLog.findFirst({
    where: { id, userId: session.user.id },
    include: { breaks: true },
  })
  if (!timeLog) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const { action, description } = await request.json()

    if (action === 'stop') {
      const now = new Date()
      await prisma.break.updateMany({
        where: { timeLogId: id, isRunning: true },
        data: { isRunning: false, endTime: now },
      })
      const breaks = await prisma.break.findMany({ where: { timeLogId: id } })

      const updated = await prisma.timeLog.update({
        where: { id },
        data: {
          isRunning: false,
          endTime: now,
          totalBreakMinutes: calculateBreakMinutes(breaks, now),
        },
        include: {
          breaks: true,
          company: { select: { id: true, name: true } },
        },
      })
      return NextResponse.json({ timeLog: updated })
    }

    if (action === 'break_start') {
      if (!timeLog.isRunning) {
        return NextResponse.json({ error: 'Timer not running' }, { status: 400 })
      }

      const activeBreak = timeLog.breaks.find((currentBreak) => currentBreak.isRunning)
      if (activeBreak) {
        return NextResponse.json({ error: 'Break already active' }, { status: 400 })
      }

      await prisma.break.create({
        data: { timeLogId: id, startTime: new Date(), isRunning: true },
      })
      const updated = await prisma.timeLog.findFirst({
        where: { id },
        include: {
          breaks: true,
          company: { select: { id: true, name: true } },
        },
      })
      return NextResponse.json({ timeLog: updated })
    }

    if (action === 'break_end') {
      const activeBreak = timeLog.breaks.find((currentBreak) => currentBreak.isRunning)
      if (!activeBreak) {
        return NextResponse.json({ error: 'No active break' }, { status: 400 })
      }

      await prisma.break.update({
        where: { id: activeBreak.id },
        data: { isRunning: false, endTime: new Date() },
      })
      const updated = await prisma.timeLog.findFirst({
        where: { id },
        include: {
          breaks: true,
          company: { select: { id: true, name: true } },
        },
      })
      return NextResponse.json({ timeLog: updated })
    }

    if (description !== undefined) {
      const updated = await prisma.timeLog.update({
        where: { id },
        data: { description: typeof description === 'string' ? description : '' },
        include: {
          breaks: true,
          company: { select: { id: true, name: true } },
        },
      })
      return NextResponse.json({ timeLog: updated })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const timeLog = await prisma.timeLog.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!timeLog) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.timeLog.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
