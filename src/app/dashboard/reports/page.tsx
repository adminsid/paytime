'use client'

import { endOfMonth, format, startOfMonth } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'

interface CompanyMember {
  companyId: string
  role: string
  status: string
  company: { id: string; name: string }
}

interface MemberOption {
  id: string
  userId: string
  status: string
  user: { id: string; name: string; email: string }
}

interface ReportUser {
  name: string
  email: string
  totalMinutes: number
  logs: number
}

interface ReportSummary {
  totalMinutes: number
  totalHours: number
  userBreakdown: Record<string, ReportUser>
}

export default function ReportsPage() {
  const [companies, setCompanies] = useState<CompanyMember[]>([])
  const [members, setMembers] = useState<MemberOption[]>([])
  const [selectedCompany, setSelectedCompany] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const loadCompanies = async () => {
      const response = await fetch('/api/companies')
      if (!response.ok) {
        return
      }

      const data = (await response.json()) as { companies?: CompanyMember[] }
      const approved = data.companies?.filter((membership) => membership.status === 'approved') ?? []
      setCompanies(approved)
      if (approved.length > 0) {
        setSelectedCompany((current) => current || approved[0].companyId)
      }
    }

    void loadCompanies()
  }, [])

  const activeMembership = useMemo(
    () => companies.find((membership) => membership.companyId === selectedCompany),
    [companies, selectedCompany],
  )

  useEffect(() => {
    const loadMembers = async () => {
      if (!selectedCompany || activeMembership?.role !== 'admin') {
        setMembers([])
        setSelectedUser('')
        return
      }

      const response = await fetch(`/api/companies/${selectedCompany}/members`)
      if (!response.ok) {
        return
      }

      const data = (await response.json()) as { members: MemberOption[] }
      setMembers(data.members.filter((member) => member.status === 'approved'))
    }

    void loadMembers()
  }, [activeMembership?.role, selectedCompany])

  useEffect(() => {
    if (!selectedCompany) {
      return
    }

    let active = true

    const loadReport = async () => {
      setLoading(true)
      const params = new URLSearchParams({ companyId: selectedCompany })
      if (startDate) {
        params.set('startDate', startDate)
      }
      if (endDate) {
        params.set('endDate', endDate)
      }
      if (selectedUser) {
        params.set('userId', selectedUser)
      }

      const response = await fetch(`/api/reports?${params.toString()}`)
      if (response.ok && active) {
        const data = (await response.json()) as { summary: ReportSummary }
        setSummary(data.summary)
      }
      if (active) {
        setLoading(false)
      }
    }

    void loadReport()

    return () => {
      active = false
    }
  }, [endDate, selectedCompany, selectedUser, startDate, refreshKey])

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Reports</h1>

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Company</label>
          <select
            value={selectedCompany}
            onChange={(event) => setSelectedCompany(event.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {companies.map((membership) => (
              <option key={membership.companyId} value={membership.companyId}>
                {membership.company.name}
              </option>
            ))}
          </select>
        </div>
        {activeMembership?.role === 'admin' && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">User</label>
            <select
              value={selectedUser}
              onChange={(event) => setSelectedUser(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All users</option>
              {members.map((member) => (
                <option key={member.id} value={member.userId}>
                  {member.user.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Generate
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">Generating report...</div>
      ) : summary ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-blue-600 p-6 text-white">
            <h2 className="mb-1 text-sm font-medium text-blue-200">Total Hours</h2>
            <div className="text-4xl font-bold">{summary.totalHours.toFixed(2)}h</div>
            <p className="mt-1 text-sm text-blue-200">{formatHours(summary.totalMinutes)}</p>
          </div>

          {Object.entries(summary.userBreakdown).length > 0 && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-4 py-3">
                <h2 className="font-semibold text-gray-900">Team Breakdown</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {Object.entries(summary.userBreakdown).map(([userId, user]) => (
                  <div key={userId} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800">{user.name}</p>
                      <p className="text-sm text-gray-500">
                        {user.email} · {user.logs} sessions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {(user.totalMinutes / 60).toFixed(2)}h
                      </p>
                      <p className="text-sm text-gray-400">{formatHours(user.totalMinutes)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : companies.length === 0 ? (
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"
            />
          </svg>
          <p>No companies available. Join a company to view reports.</p>
        </div>
      ) : null}
    </div>
  )
}
