import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { authOptions } from '@/lib/auth'

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white">
      <header className="flex items-center justify-between border-b border-blue-100 px-6 py-4">
        <div className="flex items-center gap-2">
          <img
            src="/icon-192.png"
            alt="Paytime Logo"
            className="h-8 w-8 rounded-lg object-cover border border-blue-100 shadow-sm"
          />
          <span className="text-xl font-bold text-gray-900">Paytime</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="font-medium text-gray-600 hover:text-gray-900">
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-3xl">
          <h1 className="mb-6 text-5xl leading-tight font-extrabold text-gray-900">
            Time Tracking for{' '}
            <span className="text-blue-600">Virtual Assistants</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-600">
            Track your work hours, manage clients, generate invoices, and get
            paid — all in one lightweight app.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="rounded-xl bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition hover:bg-blue-700"
            >
              Start for Free
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-gray-300 px-8 py-3 text-lg font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-20 grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
          {[
            {
              icon: (
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              title: 'Simple Timer',
              desc: 'Start, pause, and stop your work timer with one click. Add descriptions to your sessions.',
            },
            {
              icon: (
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              ),
              title: 'Multi-Company',
              desc: 'Join multiple companies, get approved by admins, and set your invite codes and rates.',
            },
            {
              icon: (
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
              title: 'Auto Invoices',
              desc: 'Generate professional invoices from your time logs. Support for multiple currencies.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Paytime. Simple time tracking for virtual
        assistants.
      </footer>
    </div>
  )
}
