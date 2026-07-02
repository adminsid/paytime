'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
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
      router.push('/login')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-2">
            <img
              src="/icon-192.png"
              alt="Paytime Logo"
              className="h-10 w-10 rounded-xl object-cover border border-blue-100 shadow-sm"
            />
            <span className="text-2xl font-bold text-gray-900">Paytime</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1 text-gray-500">Start tracking your time today</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Full Name
              </label>
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
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Password
              </label>
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
              className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
