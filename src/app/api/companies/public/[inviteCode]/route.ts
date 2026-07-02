import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ inviteCode: string }>
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { inviteCode } = await params
  if (!inviteCode) {
    return NextResponse.json({ error: 'Invite code required' }, { status: 400 })
  }

  try {
    const company = await prisma.company.findFirst({
      where: { inviteCode: inviteCode.toUpperCase() },
      select: {
        id: true,
        name: true,
        isPremium: true,
        inviteCode: true,
      },
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json({ company })
  } catch (error) {
    console.error('GET /api/companies/public/[inviteCode] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
