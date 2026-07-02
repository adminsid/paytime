'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

interface CompanyMember {
  id: string
  companyId: string
  role: string
  status: string
  hourlyRate: number
  currency: string
  company: { id: string; name: string; inviteCode: string | null; isPremium: boolean }
}

interface Member {
  id: string
  userId: string
  role: string
  status: string
  hourlyRate: number
  currency: string
  user: { id: string; name: string; email: string }
}

interface Company {
  id: string
  name: string
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'INR', 'PHP', 'NPR', 'AED', 'SAR', 'MYR', 'IDR', 'PKR', 'VND', 'BDT', 'ZAR', 'CNY', 'MXN']

export default function CompaniesPage() {
  const [memberships, setMemberships] = useState<CompanyMember[]>([])
  const [newCompanyName, setNewCompanyName] = useState('')
  const [inviteCodeInput, setInviteCodeInput] = useState('')
  const [creating, setCreating] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'my' | 'create' | 'join'>('my')
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null)
  const [members, setMembers] = useState<Record<string, Member[]>>({})
  const [editingRate, setEditingRate] = useState<string | null>(null)
  const [rateValue, setRateValue] = useState('')
  const [currencyValue, setCurrencyValue] = useState('USD')
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [memberRate, setMemberRate] = useState('')
  const [memberCurrency, setMemberCurrency] = useState('USD')

  const fetchMemberships = useCallback(async () => {
    const response = await fetch('/api/companies')
    if (response.ok) {
      const data = (await response.json()) as { companies: CompanyMember[] }
      setMemberships(data.companies)
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadMemberships = async () => {
      const response = await fetch('/api/companies')
      if (response.ok && active) {
        const data = (await response.json()) as { companies: CompanyMember[] }
        setMemberships(data.companies)
      }
    }

    void loadMemberships()

    return () => {
      active = false
    }
  }, [])

  const createCompany = async () => {
    if (!newCompanyName.trim()) {
      return
    }

    setCreating(true)
    const response = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCompanyName }),
    })
    if (response.ok) {
      setNewCompanyName('')
      setSelectedTab('my')
      await fetchMemberships()
    } else {
      const data = (await response.json().catch(() => ({}))) as { error?: string }
      window.alert(data.error || 'Failed to create company')
    }
    setCreating(false)
  }

  const joinCompany = async (code: string) => {
    if (!code.trim()) {
      return
    }

    const response = await fetch('/api/companies/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: code.trim() }),
    })
    if (response.ok) {
      window.alert('Join request sent! Waiting for admin approval.')
      setInviteCodeInput('')
      setSelectedTab('my')
      await fetchMemberships()
    } else {
      const data = (await response.json()) as { error?: string }
      window.alert(data.error || 'Failed to send join request')
    }
  }

  const fetchMembers = async (companyId: string) => {
    const response = await fetch(`/api/companies/${companyId}/members`)
    if (response.ok) {
      const data = (await response.json()) as { members: Member[] }
      setMembers((previous) => ({ ...previous, [companyId]: data.members }))
    }
  }

  const approveReject = async (companyId: string, memberId: string, status: string) => {
    const response = await fetch(`/api/companies/${companyId}/members`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, status }),
    })
    if (response.ok) {
      await fetchMembers(companyId)
      await fetchMemberships()
    }
  }

  const removeMember = async (companyId: string, memberId: string) => {
    if (!window.confirm('Are you sure you want to remove this member from the company?')) {
      return
    }

    const response = await fetch(`/api/companies/${companyId}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    })
    if (response.ok) {
      await fetchMembers(companyId)
      await fetchMemberships()
    } else {
      const data = (await response.json()) as { error?: string }
      window.alert(data.error || 'Failed to remove member')
    }
  }

  const saveRate = async (companyId: string) => {
    const response = await fetch(`/api/companies/${companyId}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hourlyRate: Number.parseFloat(rateValue),
        currency: currencyValue,
      }),
    })
    if (response.ok) {
      setEditingRate(null)
      await fetchMemberships()
    }
  }

  const saveMemberRate = async (companyId: string, memberId: string) => {
    const response = await fetch(`/api/companies/${companyId}/members`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberId,
        hourlyRate: Number.parseFloat(memberRate),
        currency: memberCurrency,
      }),
    })
    if (response.ok) {
      setEditingMemberId(null)
      await fetchMembers(companyId)
      await fetchMemberships()
    } else {
      const data = (await response.json()) as { error?: string }
      window.alert(data.error || 'Failed to update member rate')
    }
  }

  const deleteCompany = async (companyId: string, companyName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the company "${companyName}"? This action will permanently remove all members, time logs, and invoices. It cannot be undone.`)) {
      return
    }

    const response = await fetch(`/api/companies/${companyId}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      window.alert(`Company "${companyName}" has been successfully deleted.`)
      setExpandedCompany(null)
      await fetchMemberships()
    } else {
      const data = (await response.json()) as { error?: string }
      window.alert(data.error || 'Failed to delete company')
    }
  }

  const togglePremium = async (companyId: string, isPremium: boolean) => {
    const response = await fetch(`/api/companies/${companyId}/premium`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPremium }),
    })

    if (response.ok) {
      window.alert(
        isPremium
          ? '🎉 Congratulations! Premium features are unlocked. Custom branded portals are now active!'
          : 'Downgraded successfully.'
      )
      await fetchMemberships()
    } else {
      const data = (await response.json()) as { error?: string }
      window.alert(data.error || 'Failed to update premium status')
    }
  }

  const toggleExpand = async (companyId: string, isAdmin: boolean) => {
    if (expandedCompany === companyId) {
      setExpandedCompany(null)
      return
    }

    setExpandedCompany(companyId)
    if (isAdmin && !members[companyId]) {
      await fetchMembers(companyId)
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Companies</h1>

      <div className="mb-6 flex w-fit gap-1 rounded-xl bg-gray-100 p-1">
        {(['my', 'create', 'join'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              selectedTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'my' ? 'My Companies' : tab === 'create' ? 'Create New' : 'Join Company'}
          </button>
        ))}
      </div>

      {selectedTab === 'my' && (
        <div>
          {memberships.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <svg
                className="mx-auto mb-3 h-12 w-12 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <p>You haven&apos;t joined any companies yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {memberships.map((membership) => (
                <div key={membership.id} className="rounded-xl border border-gray-200 bg-white">
                  <div
                    className="flex w-full items-center justify-between p-4 text-left cursor-pointer hover:bg-gray-50/20 transition-colors"
                    onClick={() => void toggleExpand(membership.companyId, membership.role === 'admin')}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{membership.company.name}</h3>
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            membership.role === 'admin'
                              ? 'bg-purple-50 text-purple-600'
                              : 'bg-gray-50 text-gray-500'
                          }`}
                        >
                          {membership.role}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            membership.status === 'approved'
                              ? 'bg-green-50 text-green-600'
                              : membership.status === 'pending'
                                ? 'bg-yellow-50 text-yellow-600'
                                : 'bg-red-50 text-red-600'
                          }`}
                        >
                          {membership.status}
                        </span>
                      </div>
                      {membership.status === 'approved' && (
                        <div className="mt-0.5 text-sm text-gray-500">
                          <p>Rate: {membership.hourlyRate} {membership.currency}/hr</p>
                          {membership.company.inviteCode && (
                            <div className="mt-1 flex items-center gap-1.5">
                              <span>Invite Code: <span className="font-mono font-semibold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded text-xs">{membership.company.inviteCode}</span></span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  void navigator.clipboard.writeText(membership.company.inviteCode!)
                                  window.alert('Invite code copied to clipboard!')
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                              >
                                Copy
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-gray-400">
                      {expandedCompany === membership.companyId ? (
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </span>
                  </div>

                  {expandedCompany === membership.companyId && (
                    <div className="border-t border-gray-100 p-4">
                      {membership.status === 'approved' && (
                        <div className="mb-4">
                          <h4 className="mb-2 text-sm font-medium text-gray-700">Your Rate</h4>
                          {editingRate === membership.companyId ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={rateValue}
                                onChange={(event) => setRateValue(event.target.value)}
                                className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="0.00"
                              />
                              <select
                                value={currencyValue}
                                onChange={(event) => setCurrencyValue(event.target.value)}
                                className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              >
                                {CURRENCIES.map((currency) => (
                                  <option key={currency} value={currency}>
                                    {currency}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => void saveRate(membership.companyId)}
                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingRate(null)}
                                className="px-2 text-sm text-gray-400"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingRate(membership.companyId)
                                setRateValue(String(membership.hourlyRate))
                                setCurrencyValue(membership.currency)
                              }}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {membership.hourlyRate} {membership.currency}/hr — Edit
                            </button>
                          )}
                        </div>
                      )}

                      {membership.role === 'admin' && (
                        <div className="mb-6 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/20 p-5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                              <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Custom Branded VA Portal
                            </h4>
                            {membership.company.isPremium ? (
                              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 tracking-wider">👑 PREMIUM</span>
                            ) : (
                              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-500 tracking-wider">STANDARD</span>
                            )}
                          </div>

                          {!membership.company.isPremium ? (
                            <div className="mt-3">
                              <p className="text-xs text-gray-600 leading-relaxed">
                                Unlock a custom, branded login/signup portal for your Virtual Assistants. VAs registering via your portal are automatically linked to your company!
                              </p>
                              <button
                                onClick={() => void togglePremium(membership.companyId, true)}
                                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition cursor-pointer shadow-sm shadow-blue-500/10"
                              >
                                Upgrade to Premium & Unlock
                              </button>
                            </div>
                          ) : (
                            <div className="mt-3 space-y-3">
                              <p className="text-xs text-gray-600">
                                Your premium branded portals are active. VAs can register and log in at the following secure links:
                              </p>
                              <div className="space-y-2">
                                <div className="rounded-lg bg-white border border-gray-150 p-2.5 flex items-center justify-between text-xs">
                                  <div className="truncate pr-2">
                                    <span className="font-semibold text-gray-500">VA Login: </span>
                                    <span className="font-mono text-gray-800 bg-gray-50 px-1 py-0.5 rounded">
                                      {typeof window !== 'undefined' ? `${window.location.origin}/c/${membership.company.inviteCode}/login` : `/c/${membership.company.inviteCode}/login`}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const url = `${window.location.origin}/c/${membership.company.inviteCode}/login`
                                      void navigator.clipboard.writeText(url)
                                      window.alert('VA Login URL copied to clipboard!')
                                    }}
                                    className="text-blue-600 hover:text-blue-800 font-medium shrink-0 cursor-pointer"
                                  >
                                    Copy
                                  </button>
                                </div>
                                <div className="rounded-lg bg-white border border-gray-150 p-2.5 flex items-center justify-between text-xs">
                                  <div className="truncate pr-2">
                                    <span className="font-semibold text-gray-500">VA Register: </span>
                                    <span className="font-mono text-gray-800 bg-gray-50 px-1 py-0.5 rounded">
                                      {typeof window !== 'undefined' ? `${window.location.origin}/c/${membership.company.inviteCode}/register` : `/c/${membership.company.inviteCode}/register`}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const url = `${window.location.origin}/c/${membership.company.inviteCode}/register`
                                      void navigator.clipboard.writeText(url)
                                      window.alert('VA Register URL copied to clipboard!')
                                    }}
                                    className="text-blue-600 hover:text-blue-800 font-medium shrink-0 cursor-pointer"
                                  >
                                    Copy
                                  </button>
                                </div>
                              </div>
                              <div className="pt-2 flex justify-between items-center border-t border-blue-50">
                                <Link
                                  href={`/c/${membership.company.inviteCode}/login`}
                                  target="_blank"
                                  className="text-xs text-blue-600 hover:underline font-medium"
                                >
                                  View Live Portal &rarr;
                                </Link>
                                <button
                                  onClick={() => void togglePremium(membership.companyId, false)}
                                  className="text-[10px] text-gray-400 hover:text-red-500 transition cursor-pointer"
                                >
                                  Manage Subscription (Downgrade)
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {membership.role === 'admin' && members[membership.companyId] && (
                        <div>
                          <h4 className="mb-2 text-sm font-medium text-gray-700">Members</h4>
                          <div className="space-y-2">
                            {members[membership.companyId].map((member) => (
                              <div
                                key={member.id}
                                className="flex items-center justify-between border-b border-gray-50 py-2.5 last:border-0"
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{member.user.name}</p>
                                  <p className="text-xs text-gray-500">{member.user.email}</p>
                                  {member.status === 'approved' && (
                                    <div className="mt-1 text-xs text-gray-500">
                                      {editingMemberId === member.id ? (
                                        <div className="flex items-center gap-1.5 mt-1">
                                          <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={memberRate}
                                            onChange={(e) => setMemberRate(e.target.value)}
                                            className="w-16 rounded border border-gray-200 px-1.5 py-0.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none text-gray-900"
                                            placeholder="0.00"
                                          />
                                          <select
                                            value={memberCurrency}
                                            onChange={(e) => setMemberCurrency(e.target.value)}
                                            className="rounded border border-gray-200 px-1 py-0.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-gray-900"
                                          >
                                            {CURRENCIES.map((currency) => (
                                              <option key={currency} value={currency}>
                                                {currency}
                                              </option>
                                            ))}
                                          </select>
                                          <button
                                            onClick={() => void saveMemberRate(membership.companyId, member.id)}
                                            className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-blue-700 cursor-pointer"
                                          >
                                            Save
                                          </button>
                                          <button
                                            onClick={() => setEditingMemberId(null)}
                                            className="text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <span>Rate: <span className="font-semibold text-gray-700">{member.hourlyRate} {member.currency}/hr</span></span>
                                          <button
                                            onClick={() => {
                                              setEditingMemberId(member.id)
                                              setMemberRate(String(member.hourlyRate))
                                              setMemberCurrency(member.currency)
                                            }}
                                            className="text-blue-600 hover:underline hover:text-blue-800 text-[10px] cursor-pointer"
                                          >
                                            Edit Rate
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`rounded px-2 py-0.5 text-xs ${
                                      member.status === 'approved'
                                        ? 'bg-green-50 text-green-600'
                                        : member.status === 'pending'
                                          ? 'bg-yellow-50 text-yellow-600'
                                          : 'bg-red-50 text-red-600'
                                    }`}
                                  >
                                    {member.status}
                                  </span>
                                  {member.status === 'pending' && member.role !== 'admin' && (
                                    <>
                                      <button
                                        onClick={() =>
                                          void approveReject(membership.companyId, member.id, 'approved')
                                        }
                                        className="rounded bg-green-500 px-2.5 py-1 text-xs text-white hover:bg-green-600"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() =>
                                          void approveReject(membership.companyId, member.id, 'rejected')
                                        }
                                        className="rounded bg-red-500 px-2.5 py-1 text-xs text-white hover:bg-red-600"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  {member.role !== 'admin' && (
                                    <button
                                      onClick={() => void removeMember(membership.companyId, member.id)}
                                      className="rounded bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {membership.role === 'admin' && (
                        <div className="mt-6 border-t border-red-100 pt-4">
                          <h4 className="mb-1 text-sm font-medium text-red-600">Danger Zone</h4>
                          <p className="mb-3 text-xs text-gray-500">
                            Permanently delete this company and all associated logs and invoices. This action cannot be undone.
                          </p>
                          <button
                            onClick={() => void deleteCompany(membership.companyId, membership.company.name)}
                            className="rounded-lg bg-red-500 hover:bg-red-600 px-4 py-2 text-sm font-medium text-white cursor-pointer transition"
                          >
                            Delete Company
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'create' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-900">Create a New Company</h2>
          <p className="mb-4 text-sm text-gray-500">
            You&apos;ll become the admin and can approve members who request to join.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={newCompanyName}
              onChange={(event) => setNewCompanyName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void createCompany()
                }
              }}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Company name"
            />
            <button
              onClick={() => void createCompany()}
              disabled={creating || !newCompanyName.trim()}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {selectedTab === 'join' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-900">Join a Company</h2>
          <p className="mb-4 text-sm text-gray-500">
            Enter the unique invite code of the company you want to join. An admin will need to approve your request.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={inviteCodeInput}
              onChange={(event) => setInviteCodeInput(event.target.value)}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
              placeholder="e.g. PAY-A1B2C3"
            />
            <button
              onClick={() => void joinCompany(inviteCodeInput)}
              disabled={!inviteCodeInput.trim()}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Join Company
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
