import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ companyId: string }>
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { companyId } = await params

  const member = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
  })
  if (!member || member.status !== 'approved') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ hourlyRate: member.hourlyRate, currency: member.currency })
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { companyId } = await params

  const member = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
  })
  if (!member || member.status !== 'approved') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { hourlyRate, currency } = await request.json()
    const parsedRate = Number(hourlyRate)

    if (!Number.isFinite(parsedRate) || parsedRate < 0 || !currency) {
      return NextResponse.json({ error: 'Invalid rate settings' }, { status: 400 })
    }

    const updated = await prisma.companyMember.update({
      where: { id: member.id },
      data: { hourlyRate: parsedRate, currency },
    })

    return NextResponse.json({
      hourlyRate: updated.hourlyRate,
      currency: updated.currency,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
