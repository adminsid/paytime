import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, inviteCode } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 },
      )
    }

    let companyToJoin = null
    if (inviteCode) {
      companyToJoin = await prisma.company.findFirst({
        where: { inviteCode: inviteCode.trim().toUpperCase() },
      })
      if (!companyToJoin) {
        return NextResponse.json({ error: 'Invalid company invite code' }, { status: 400 })
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const u = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true },
    })

    if (companyToJoin) {
      await prisma.companyMember.create({
        data: {
          userId: u.id,
          companyId: companyToJoin.id,
          role: 'member',
          status: 'pending',
        },
      })
    }

    return NextResponse.json({ user: u }, { status: 201 })
  } catch (error) {
    console.error('Registration API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
