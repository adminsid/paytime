import NextAuth from 'next-auth'
import { NextRequest } from 'next/server'

import { authOptions } from '@/lib/auth'

const handler = (req: NextRequest, ctx: any) => {
  return NextAuth(req, ctx, {
    ...authOptions,
    secret: process.env.NEXTAUTH_SECRET || '358e8749a941e17e805562149e836b76a084',
  })
}

export { handler as GET, handler as POST }
