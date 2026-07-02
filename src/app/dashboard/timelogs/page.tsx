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
  company: { id: string; name: string }
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
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    let active = true

    const loadLogs = async () => {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterCompany) {
        params.set('companyId', filterCompany)
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
  }, [endDate, filterCompany, startDate])

  const deleteLog = async (id: string) => {
    if (!window.confirm('Delete this time log?')) {
      return
    }

    await fetch(`/api/timelogs/${id}`, { method: 'DELETE' })
    setTimeLogs((logs) => logs.filter((log) => log.id !== id))
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Time Logs</h1>

      <div className="mb-6 flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <select
          value={filterCompany}
          onChange={(event) => setFilterCompany(event.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">All Companies</option>
          {companies.map((membership) => (
            <option key={membership.companyId} value={membership.companyId}>
              {membership.company.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <input
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button
          onClick={() => {
            setFilterCompany('')
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
          <p className="mb-3 text-4xl">📋</p>
          <p>No time logs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {timeLogs.map((log) => (
            <div key={log.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-sm font-medium text-blue-600">
                      {log.company.name}
                    </span>
                    {log.isRunning && (
                      <span className="animate-pulse rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
                        Running
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
                  {!log.isRunning && (
                    <button
                      onClick={() => void deleteLog(log.id)}
                      className="mt-1 text-xs text-red-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
