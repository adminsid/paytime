'use client'

import { useCallback, useEffect, useState } from 'react'

interface CompanyMember {
  id: string
  companyId: string
  role: string
  status: string
  hourlyRate: number
  currency: string
  company: { id: string; name: string }
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

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'INR', 'PHP', 'MXN']

export default function CompaniesPage() {
  const [memberships, setMemberships] = useState<CompanyMember[]>([])
  const [newCompanyName, setNewCompanyName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Company[]>([])
  const [creating, setCreating] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'my' | 'create' | 'join'>('my')
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null)
  const [members, setMembers] = useState<Record<string, Member[]>>({})
  const [editingRate, setEditingRate] = useState<string | null>(null)
  const [rateValue, setRateValue] = useState('')
  const [currencyValue, setCurrencyValue] = useState('USD')

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
    }
    setCreating(false)
  }

  const searchCompanies = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const response = await fetch(
      `/api/companies/search?q=${encodeURIComponent(searchQuery)}`,
    )
    if (response.ok) {
      const data = (await response.json()) as { companies: Company[] }
      setSearchResults(data.companies)
    }
  }, [searchQuery])

  useEffect(() => {
    const timeout = setTimeout(() => {
      void searchCompanies()
    }, 300)

    return () => clearTimeout(timeout)
  }, [searchCompanies])

  const joinCompany = async (companyId: string) => {
    const response = await fetch('/api/companies/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId }),
    })
    if (response.ok) {
      window.alert('Join request sent! Waiting for admin approval.')
      setSearchResults([])
      setSearchQuery('')
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
              <p className="mb-3 text-4xl">🏢</p>
              <p>You haven&apos;t joined any companies yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {memberships.map((membership) => (
                <div key={membership.id} className="rounded-xl border border-gray-200 bg-white">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between p-4 text-left"
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
                        <p className="mt-0.5 text-sm text-gray-500">
                          Rate: {membership.hourlyRate} {membership.currency}/hr
                        </p>
                      )}
                    </div>
                    <span className="text-gray-400">
                      {expandedCompany === membership.companyId ? '▲' : '▼'}
                    </span>
                  </button>

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

                      {membership.role === 'admin' && members[membership.companyId] && (
                        <div>
                          <h4 className="mb-2 text-sm font-medium text-gray-700">Members</h4>
                          <div className="space-y-2">
                            {members[membership.companyId].map((member) => (
                              <div
                                key={member.id}
                                className="flex items-center justify-between border-b border-gray-50 py-2 last:border-0"
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{member.user.name}</p>
                                  <p className="text-xs text-gray-500">{member.user.email}</p>
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
                                </div>
                              </div>
                            ))}
                          </div>
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
            Search for a company by name. An admin will need to approve your request.
          </p>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="mb-3 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Search company name..."
          />
          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                >
                  <span className="font-medium text-gray-800">{company.name}</span>
                  <button
                    onClick={() => void joinCompany(company.id)}
                    className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700"
                  >
                    Request to Join
                  </button>
                </div>
              ))}
            </div>
          )}
          {searchQuery && searchResults.length === 0 && (
            <p className="text-sm text-gray-400">No companies found</p>
          )}
        </div>
      )}
    </div>
  )
}
