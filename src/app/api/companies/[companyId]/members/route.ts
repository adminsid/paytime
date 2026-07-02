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

  const adminMember = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
  })
  if (!adminMember || adminMember.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const members = await prisma.companyMember.findMany({
    where: { companyId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ members })
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { companyId } = await params

  const adminMember = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
  })
  if (!adminMember || adminMember.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { memberId, status } = await request.json()
    if (!memberId || !status) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const member = await prisma.companyMember.update({
      where: { id: memberId },
      data: { status },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    return NextResponse.json({ member })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
