'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'

export default function SettingsPage() {
  const { data: session } = useSession()

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Settings</h1>

      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-gray-900">Profile</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Name</label>
            <p className="text-gray-900">{session?.user?.name}</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Email</label>
            <p className="text-gray-900">{session?.user?.email}</p>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-2 font-semibold text-gray-900">Hourly Rates</h2>
        <p className="text-sm text-gray-500">
          Manage your hourly rate and currency for each company from the{' '}
          <Link href="/dashboard/companies" className="text-blue-600 hover:underline">
            Companies page
          </Link>
          .
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-2 font-semibold text-gray-900">Account</h2>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="text-sm text-red-600 hover:underline"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
