'use client'

import type { FormEvent } from 'react'
import { useState, useEffect, use } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CompanyPublic {
  id: string
  name: string
  isPremium: boolean
  inviteCode: string
}

interface PageProps {
  params: Promise<{ inviteCode: string }>
}

export default function BrandedRegisterPage({ params }: PageProps) {
  const router = useRouter()
  const { inviteCode } = use(params)

  const [company, setCompany] = useState<CompanyPublic | null>(null)
  const [loadingCompany, setLoadingCompany] = useState(true)
  const [errorCompany, setErrorCompany] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const response = await fetch(`/api/companies/public/${inviteCode}`)
        if (response.ok) {
          const data = (await response.json()) as { company: CompanyPublic }
          setCompany(data.company)
        } else {
          setErrorCompany('Invalid company portal link')
        }
      } catch {
        setErrorCompany('Failed to load company details')
      } finally {
        setLoadingCompany(false)
      }
    }
    void fetchCompany()
  }, [inviteCode])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, inviteCode }),
    })

    if (!response.ok) {
      const data = (await response.json()) as { error?: string }
      setError(data.error || 'Registration failed')
      setLoading(false)
      return
    }

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    setLoading(false)

    if (result?.error) {
      router.push(`/c/${inviteCode}/login`)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  if (loadingCompany) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Loading custom portal...</p>
        </div>
      </div>
    )
  }

  if (errorCompany || !company) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-red-50 to-white px-4">
        <div className="w-full max-w-md text-center rounded-2xl border border-red-100 bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Portal Link Invalid</h1>
          <p className="mt-2 text-sm text-gray-500">{errorCompany || 'This company portal does not exist.'}</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Go back to Paytime
          </Link>
        </div>
      </div>
    )
  }

  // Paywall check for non-premium companies
  if (!company.isPremium) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4">
        <div className="w-full max-w-lg rounded-3xl border border-blue-100/50 bg-white/70 backdrop-blur-md p-8 shadow-xl text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 bg-blue-400/10 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 h-40 w-40 bg-purple-400/10 rounded-full blur-3xl -z-10"></div>

          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Premium VA Portal
          </div>

          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Custom Portal Locked</h1>
          <p className="mt-4 text-sm text-gray-600 leading-relaxed">
            Welcome to the onboarding space for <span className="font-semibold text-gray-900">{company.name}</span>.
            Custom branded VA portals are a premium feature of Paytime.
          </p>

          <div className="my-6 rounded-2xl border border-gray-100 bg-gray-50/50 p-5 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Unlocked with Premium</h3>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Fully custom domain / link for VA onboarding.</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Personalized portal branding showing <span className="font-medium">{company.name}</span> name.</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Automated onboarding: new users registering here join this company automatically!</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/register"
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Sign Up (Standard)
            </Link>
            <Link
              href="/"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-500/25 transition"
            >
              Back to Paytime
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Branded register screen for premium companies
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50/50 to-white px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-10 left-10 h-72 w-72 bg-blue-400/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-10 right-10 h-72 w-72 bg-indigo-400/5 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-xl shadow-lg shadow-blue-500/25">
            {company.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{company.name}</h1>
          <p className="mt-1.5 text-sm text-gray-500">Create your contractor account to join portal</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg shadow-gray-100/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Jane Doe"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="you@email.com"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Min. 8 characters"
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-700 shadow-md shadow-blue-500/10 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account & Request Entry'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link
            href={`/c/${company.inviteCode}/login`}
            className="font-semibold text-blue-600 hover:underline"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}
