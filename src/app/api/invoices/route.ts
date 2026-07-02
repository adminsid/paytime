import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Prisma } from '@prisma/client'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateTrackedMinutes } from '@/lib/time'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId')

  const where: Prisma.InvoiceWhereInput = { userId: session.user.id }
  if (companyId) {
    where.companyId = companyId
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      company: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ invoices })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { companyId, startDate, endDate, notes } = await request.json()
    if (!companyId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const member = await prisma.companyMember.findUnique({
      where: { userId_companyId: { userId: session.user.id, companyId } },
    })
    if (!member || member.status !== 'approved') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [start, end] = [new Date(startDate), new Date(endDate)]

    const timeLogs = await prisma.timeLog.findMany({
      where: {
        userId: session.user.id,
        companyId,
        isRunning: false,
        startTime: { gte: start },
        endTime: { lte: new Date(`${endDate}T23:59:59.999Z`) },
      },
    })

    let totalMinutes = 0
    for (const log of timeLogs) {
      if (log.endTime) {
        totalMinutes += calculateTrackedMinutes(
          log.startTime,
          log.endTime,
          log.totalBreakMinutes,
        )
      }
    }

    const totalHours = totalMinutes / 60
    const totalAmount = totalHours * member.hourlyRate

    const invoice = await prisma.invoice.create({
      data: {
        userId: session.user.id,
        companyId,
        startDate: start,
        endDate: end,
        totalHours,
        totalAmount,
        currency: member.currency,
        notes: typeof notes === 'string' ? notes : '',
      },
      include: { company: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ invoice }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
