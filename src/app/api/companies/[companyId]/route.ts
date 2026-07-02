import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ companyId: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
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
    // Delete the company (foreign key cascades will delete members, timelogs, breaks, and invoices)
    await prisma.company.delete({
      where: { id: companyId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/companies/[companyId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
