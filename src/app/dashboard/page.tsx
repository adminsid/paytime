'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

interface BreakEntry {
  id: string
  startTime: string
  endTime: string | null
  isRunning: boolean
}

interface TimeLog {
  id: string
  companyId: string
  description: string
  startTime: string
  endTime: string | null
  isRunning: boolean
  totalBreakMinutes: number
  breaks: BreakEntry[]
  company: { id: string; name: string }
}

interface CompanyMember {
  id: string
  companyId: string
  status: string
  company: { id: string; name: string }
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export default function DashboardPage() {
  const [currentLog, setCurrentLog] = useState<TimeLog | null>(null)
  const [companies, setCompanies] = useState<CompanyMember[]>([])
  const [selectedCompany, setSelectedCompany] = useState('')
  const [description, setDescription] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  useEffect(() => {
    let active = true

    const loadDashboard = async () => {
      const [currentResponse, companiesResponse] = await Promise.all([
        fetch('/api/timelogs/current'),
        fetch('/api/companies'),
      ])

      if (!active) {
        return
      }

      if (currentResponse.ok) {
        const data = (await currentResponse.json()) as { timeLog: TimeLog | null }
        if (active) {
          setCurrentLog(data.timeLog)
        }
      }

      if (companiesResponse.ok) {
        const data = (await companiesResponse.json()) as { companies: CompanyMember[] }
        const approved = data.companies.filter(
          (membership) => membership.status === 'approved',
        )

        if (active) {
          setCompanies(approved)
          if (!selectedCompany && approved.length > 0) {
            setSelectedCompany(approved[0].companyId)
          }
        }
      }

      if (active) {
        setInitialLoad(false)
      }
    }

    void loadDashboard()

    return () => {
      active = false
    }
  }, [selectedCompany])

  useEffect(() => {
    if (!currentLog?.isRunning) {
      return
    }

    const tick = () => {
      const activeBreak = currentLog.breaks.find((currentBreak) => currentBreak.isRunning)
      const start = new Date(currentLog.startTime).getTime()
      const now = Date.now()
      const totalMs = now - start
      const breakMs = currentLog.totalBreakMinutes * 60000
      const activeBreakMs = activeBreak
        ? now - new Date(activeBreak.startTime).getTime()
        : 0
      setElapsed(totalMs - breakMs - activeBreakMs)
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [currentLog])

  const startTimer = async () => {
    if (!selectedCompany) {
      return
    }

    setLoading(true)
    const response = await fetch('/api/timelogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: selectedCompany, description }),
    })

    if (response.ok) {
      const data = (await response.json()) as { timeLog: TimeLog }
      setCurrentLog(data.timeLog)
      setDescription('')
    }

    setLoading(false)
  }

  const stopTimer = async () => {
    if (!currentLog) {
      return
    }

    setLoading(true)
    const response = await fetch(`/api/timelogs/${currentLog.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop' }),
    })

    if (response.ok) {
      setCurrentLog(null)
      setElapsed(0)
    }

    setLoading(false)
  }

  const toggleBreak = async () => {
    if (!currentLog) {
      return
    }

    const activeBreak = currentLog.breaks.find((currentBreak) => currentBreak.isRunning)
    const action = activeBreak ? 'break_end' : 'break_start'

    setLoading(true)
    const response = await fetch(`/api/timelogs/${currentLog.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })

    if (response.ok) {
      const data = (await response.json()) as { timeLog: TimeLog }
      setCurrentLog(data.timeLog)
    }

    setLoading(false)
  }

  const updateDescription = async () => {
    if (!currentLog) {
      return
    }

    const response = await fetch(`/api/timelogs/${currentLog.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: currentLog.description }),
    })

    if (response.ok) {
      const data = (await response.json()) as { timeLog: TimeLog }
      setCurrentLog(data.timeLog)
    }
  }

  const isOnBreak = useMemo(
    () => currentLog?.breaks.some((currentBreak) => currentBreak.isRunning) ?? false,
    [currentLog],
  )

  if (initialLoad) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Timer</h1>

      {currentLog ? (
        <div
          className={`mb-6 rounded-2xl border-2 p-8 text-center ${
            isOnBreak ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'
          }`}
        >
          <div className="mb-1 text-sm font-medium text-gray-500">
            {currentLog.company.name}
          </div>
          <div
            className={`mb-2 font-mono text-6xl font-bold ${
              isOnBreak ? 'text-amber-600' : 'text-blue-700'
            }`}
          >
            {formatDuration(elapsed)}
          </div>
          {isOnBreak && (
            <div className="mb-3 text-sm font-medium text-amber-600">⏸ On Break</div>
          )}
          <div className="mt-4">
            <input
              type="text"
              value={currentLog.description}
              onChange={(event) =>
                setCurrentLog({ ...currentLog, description: event.target.value })
              }
              onBlur={() => void updateDescription()}
              className="w-full rounded-lg border border-gray-200 bg-white/70 px-4 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="What are you working on?"
            />
          </div>
          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={() => void toggleBreak()}
              disabled={loading}
              className={`rounded-xl px-6 py-2.5 font-semibold text-white transition ${
                isOnBreak
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              {isOnBreak ? '▶ Resume' : '⏸ Break'}
            </button>
            <button
              onClick={() => void stopTimer()}
              disabled={loading}
              className="rounded-xl bg-red-500 px-6 py-2.5 font-semibold text-white transition hover:bg-red-600"
            >
              ⏹ Stop
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-8">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">Start Tracking</h2>

          {companies.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p className="mb-3 text-4xl">🏢</p>
              <p className="font-medium">No companies yet</p>
              <p className="mt-1 text-sm">
                <Link href="/dashboard/companies" className="text-blue-600 hover:underline">
                  Create or join a company
                </Link>{' '}
                to start tracking time
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Company
                </label>
                <select
                  value={selectedCompany}
                  onChange={(event) => setSelectedCompany(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select company...</option>
                  {companies.map((membership) => (
                    <option key={membership.companyId} value={membership.companyId}>
                      {membership.company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="What will you be working on?"
                />
              </div>
              <button
                onClick={() => void startTimer()}
                disabled={loading || !selectedCompany}
                className="w-full rounded-xl bg-blue-600 py-3 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                ▶ Start Timer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
