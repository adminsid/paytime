'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'

interface Props {
  user: { name?: string | null; email?: string | null }
}

export function DashboardNav({ user }: Props) {
  const pathname = usePathname()

  const links = [
    { href: '/dashboard', label: 'Timer', icon: '⏱' },
    { href: '/dashboard/timelogs', label: 'Time Logs', icon: '📋' },
    { href: '/dashboard/reports', label: 'Reports', icon: '📊' },
    { href: '/dashboard/invoices', label: 'Invoices', icon: '📄' },
    { href: '/dashboard/companies', label: 'Companies', icon: '🏢' },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex min-h-14 flex-col gap-3 py-3 md:h-14 md:flex-row md:items-center md:justify-between md:py-0">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            <Link href="/dashboard" className="mr-4 flex items-center gap-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </div>
              <span className="hidden font-bold text-gray-900 sm:block">Paytime</span>
            </Link>
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/dashboard' && pathname.startsWith(link.href))

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-base">{link.icon}</span>
                  <span className="hidden sm:block">{link.label}</span>
                </Link>
              )
            })}
          </div>
          <div className="flex items-center justify-between gap-2 md:justify-end">
            <div className="truncate text-sm text-gray-500">{user.name || user.email}</div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/settings"
                className="rounded-lg px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                ⚙️ <span className="hidden sm:inline">Settings</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="rounded-lg px-2.5 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
