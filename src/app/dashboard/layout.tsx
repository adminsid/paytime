import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { DashboardNav } from '@/components/DashboardNav'
import { authOptions } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav user={session.user} />
      <main className="mx-auto max-w-5xl px-4 py-8 pb-20 md:pb-8">{children}</main>
    </div>
  )
}
