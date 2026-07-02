import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { randomBytes } from 'crypto'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'PAY-'
  const bytes = randomBytes(6)
  for (let i = 0; i < 6; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

async function getUniqueInviteCode(): Promise<string> {
  let inviteCode = ''
  let isUnique = false
  let attempts = 0
  while (!isUnique && attempts < 10) {
    inviteCode = generateInviteCode()
    const existing = await prisma.company.findFirst({ where: { inviteCode } })
    if (!existing) {
      isUnique = true
    }
    attempts++
  }
  if (!isUnique) {
    inviteCode = `PAY-${Date.now().toString(36).toUpperCase()}`
  }
  return inviteCode
}

export async function GET() {
  const session = await getServerSession(authOptions)
  console.log('GET /api/companies session details:', JSON.stringify(session))
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const memberships = await prisma.companyMember.findMany({
      where: { userId: session.user.id },
      include: { company: true },
      orderBy: { createdAt: 'desc' },
    })

    // Backfill invite codes for any legacy companies that do not have one
    for (const membership of memberships) {
      if (!membership.company.inviteCode) {
        try {
          const inviteCode = await getUniqueInviteCode()
          await prisma.company.update({
            where: { id: membership.company.id },
            data: { inviteCode },
          })
          membership.company.inviteCode = inviteCode
        } catch (updateErr) {
          console.error('Failed to backfill invite code for company:', membership.company.id, updateErr)
        }
      }
    }

    return NextResponse.json({ companies: memberships })
  } catch (error) {
    console.error('GET /api/companies error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  console.log('POST /api/companies session details:', JSON.stringify(session))
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 })
    }

    const { name } = body || {}
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Company name required' }, { status: 400 })
    }

    const inviteCode = await getUniqueInviteCode()

    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        inviteCode,
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
  } catch (error) {
    console.error('POST /api/companies error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
