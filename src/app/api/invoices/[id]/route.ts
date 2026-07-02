import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: session.user.id },
    include: {
      company: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  })
  if (!invoice) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ invoice })
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!invoice) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const { status, notes } = await request.json()
    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: typeof status === 'string' ? status : invoice.status,
        notes: typeof notes === 'string' ? notes : invoice.notes,
      },
      include: {
        company: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })
    return NextResponse.json({ invoice: updated })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
