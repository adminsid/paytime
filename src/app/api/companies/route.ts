import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const memberships = await prisma.companyMember.findMany({
    where: { userId: session.user.id },
    include: { company: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ companies: memberships })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name } = await request.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Company name required' }, { status: 400 })
    }

    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        members: {
          create: {
            userId: session.user.id,
            role: 'admin',
            status: 'approved',
          },
        },
      },
      include: { members: true },
    })

    return NextResponse.json({ company }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
