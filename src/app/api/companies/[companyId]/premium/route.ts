import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ companyId: string }>
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { companyId } = await params

  // Verify that the current user is an admin of the company
  const membership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
  })

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { isPremium } = await request.json()

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: { isPremium: Boolean(isPremium) },
    })

    return NextResponse.json({ company: updated })
  } catch (error) {
    console.error('POST /api/companies/[companyId]/premium error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
