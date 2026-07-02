'use client'

import { format } from 'date-fns'
import { useEffect, useState } from 'react'

interface TimeLog {
  id: string
  userId: string
  companyId: string
  description: string
  startTime: string
  endTime: string | null
  isRunning: boolean
  totalBreakMinutes: number
  user: { id: string; name: string; email: string }
  company: { id: string; name: string }
}

interface CompanyMember {
  companyId: string
  status: string
  role: string
  company: { id: string; name: string }
}

interface MemberOption {
  id: string
  userId: string
  status: string
  user: { id: string; name: string; email: string }
}

function formatDuration(startTime: string, endTime: string | null, breakMinutes: number): string {
  const end = endTime ? new Date(endTime) : new Date()
  const ms = end.getTime() - new Date(startTime).getTime()
  const totalMinutes = Math.max(0, Math.floor(ms / 60000) - breakMinutes)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes}m`
}

export default function TimeLogsPage() {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([])
  const [companies, setCompanies] = useState<CompanyMember[]>([])
  const [filterCompany, setFilterCompany] = useState('')
  const [filterUser, setFilterUser] = useState('')
  const [filterMembers, setFilterMembers] = useState<MemberOption[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)

  // Edit Modal State
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editStartTime, setEditStartTime] = useState('')
  const [editEndTime, setEditEndTime] = useState('')
  const [editBreakMinutes, setEditBreakMinutes] = useState(0)

  const activeFilterMembership = companies.find((c) => c.companyId === filterCompany)

  useEffect(() => {
    const loadCompanies = async () => {
      const response = await fetch('/api/companies')
      if (response.ok) {
        const data = (await response.json()) as { companies?: CompanyMember[] }
        setCompanies(
          data.companies?.filter((membership) => membership.status === 'approved') ?? [],
        )
      }
    }

    void loadCompanies()
  }, [])

  // Load team members for filtering if user is admin of selected company
  useEffect(() => {
    const loadFilterMembers = async () => {
      if (!filterCompany || activeFilterMembership?.role !== 'admin') {
        setFilterMembers([])
        setFilterUser('')
        return
      }

      const response = await fetch(`/api/companies/${filterCompany}/members`)
      if (response.ok) {
        const data = (await response.json()) as { members: MemberOption[] }
        setFilterMembers(data.members.filter((m) => m.status === 'approved'))
      }
    }

    void loadFilterMembers()
  }, [filterCompany, activeFilterMembership?.role])

  useEffect(() => {
    let active = true

    const loadLogs = async () => {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterCompany) {
        params.set('companyId', filterCompany)
      }
      if (filterUser) {
        params.set('userId', filterUser)
      }
      if (startDate) {
        params.set('startDate', startDate)
      }
      if (endDate) {
        params.set('endDate', endDate)
      }

      const response = await fetch(`/api/timelogs?${params.toString()}`)
      if (response.ok && active) {
        const data = (await response.json()) as { timeLogs: TimeLog[] }
        setTimeLogs(data.timeLogs)
      }
      if (active) {
        setLoading(false)
      }
    }

    void loadLogs()

    return () => {
      active = false
    }
  }, [endDate, filterCompany, filterUser, startDate])

  const deleteLog = async (id: string) => {
    if (!window.confirm('Delete this time log?')) {
      return
    }

    await fetch(`/api/timelogs/${id}`, { method: 'DELETE' })
    setTimeLogs((logs) => logs.filter((log) => log.id !== id))
  }

  const openEditModal = (log: TimeLog) => {
    setEditingLog(log)
    setEditDescription(log.description)
    setEditStartTime(format(new Date(log.startTime), "yyyy-MM-dd'T'HH:mm"))
    setEditEndTime(log.endTime ? format(new Date(log.endTime), "yyyy-MM-dd'T'HH:mm") : '')
    setEditBreakMinutes(log.totalBreakMinutes)
  }

  const saveEdit = async () => {
    if (!editingLog) return

    const response = await fetch(`/api/timelogs/${editingLog.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: editDescription,
        startTime: new Date(editStartTime).toISOString(),
        endTime: editEndTime ? new Date(editEndTime).toISOString() : null,
        totalBreakMinutes: Number(editBreakMinutes),
      }),
    })

    if (response.ok) {
      const data = (await response.json()) as { timeLog: TimeLog }
      setTimeLogs((logs) =>
        logs.map((log) => (log.id === editingLog.id ? { ...log, ...data.timeLog } : log)),
      )
      setEditingLog(null)
    } else {
      window.alert('Failed to update time log')
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Time Logs</h1>

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col">
          <label className="mb-1 block text-xs font-medium text-gray-500">Company</label>
          <select
            value={filterCompany}
            onChange={(event) => setFilterCompany(event.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          >
            <option value="">All Companies</option>
            {companies.map((membership) => (
              <option key={membership.companyId} value={membership.companyId}>
                {membership.company.name}
              </option>
            ))}
          </select>
        </div>

        {activeFilterMembership?.role === 'admin' && (
          <div className="flex flex-col">
            <label className="mb-1 block text-xs font-medium text-gray-500">User</label>
            <select
              value={filterUser}
              onChange={(event) => setFilterUser(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="">All Users</option>
              {filterMembers.map((member) => (
                <option key={member.id} value={member.userId}>
                  {member.user.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col">
          <label className="mb-1 block text-xs font-medium text-gray-500">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 block text-xs font-medium text-gray-500">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          />
        </div>

        <button
          onClick={() => {
            setFilterCompany('')
            setFilterUser('')
            setStartDate('')
            setEndDate('')
          }}
          className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          Clear
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">Loading...</div>
      ) : timeLogs.length === 0 ? (
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <p>No time logs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {timeLogs.map((log) => (
            <div key={log.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-sm font-medium text-blue-600">
                      {log.company.name}
                    </span>
                    {log.isRunning && (
                      <span className="animate-pulse rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
                        Running
                      </span>
                    )}
                    {log.user && (
                      <span className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded border border-gray-150">
                        By: {log.user.name}
                      </span>
                    )}
                  </div>
                  <p className="truncate font-medium text-gray-800">
                    {log.description || (
                      <span className="italic text-gray-400">No description</span>
                    )}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    <span>{format(new Date(log.startTime), 'MMM d, yyyy')}</span>
                    <span>{format(new Date(log.startTime), 'h:mm a')}</span>
                    {log.endTime && <span>→ {format(new Date(log.endTime), 'h:mm a')}</span>}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatDuration(log.startTime, log.endTime, log.totalBreakMinutes)}
                  </div>
                  {log.totalBreakMinutes > 0 && (
                    <div className="text-xs text-gray-400">{log.totalBreakMinutes}m break</div>
                  )}
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => void openEditModal(log)}
                      className="rounded border border-blue-200 bg-blue-50 p-1 text-blue-600 hover:bg-blue-100 cursor-pointer"
                      title="Edit Log"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    {!log.isRunning && (
                      <button
                        onClick={() => void deleteLog(log.id)}
                        className="rounded border border-red-200 bg-red-50 p-1 text-red-600 hover:bg-red-100 cursor-pointer"
                        title="Delete Log"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Log Modal */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-gray-150">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Edit Time Log</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Start Time</label>
                <input
                  type="datetime-local"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">End Time</label>
                <input
                  type="datetime-local"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Running"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Break Minutes</label>
                <input
                  type="number"
                  min="0"
                  value={editBreakMinutes}
                  onChange={(e) => setEditBreakMinutes(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setEditingLog(null)}
                className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => void saveEdit()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
