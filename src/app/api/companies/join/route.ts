import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { companyId } = await request.json()
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 })
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } })
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const existing = await prisma.companyMember.findUnique({
      where: { userId_companyId: { userId: session.user.id, companyId } },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Already a member or request pending' },
        { status: 400 },
      )
    }

    const member = await prisma.companyMember.create({
      data: {
        userId: session.user.id,
        companyId,
        status: 'pending',
      },
    })

    return NextResponse.json({ member }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
