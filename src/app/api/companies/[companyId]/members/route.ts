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
    const { memberId, status, hourlyRate, currency, role } = await request.json()
    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 })
    }

    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (hourlyRate !== undefined) {
      updateData.hourlyRate = Number(hourlyRate)
    }
    if (currency !== undefined) updateData.currency = currency
    if (role !== undefined) updateData.role = role

    const member = await prisma.companyMember.update({
      where: { id: memberId },
      data: updateData,
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    return NextResponse.json({ member })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
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
    const { memberId } = await request.json()
    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 })
    }

    const memberToDelete = await prisma.companyMember.findUnique({
      where: { id: memberId },
    })

    if (!memberToDelete) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Do not allow deleting themselves
    if (memberToDelete.userId === session.user.id) {
      return NextResponse.json({ error: 'You cannot remove yourself' }, { status: 400 })
    }

    // Cascade delete logs and invoices for this member to clean up company reports
    await prisma.timeLog.deleteMany({
      where: { companyId, userId: memberToDelete.userId },
    })

    await prisma.invoice.deleteMany({
      where: { companyId, userId: memberToDelete.userId },
    })

    await prisma.companyMember.delete({
      where: { id: memberId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
