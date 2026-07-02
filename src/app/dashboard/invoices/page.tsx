'use client'

import { endOfMonth, format, startOfMonth } from 'date-fns'
import { useCallback, useEffect, useState } from 'react'

interface CompanyMember {
  companyId: string
  status: string
  hourlyRate: number
  currency: string
  role: string
  company: { id: string; name: string }
}

interface MemberOption {
  id: string
  userId: string
  status: string
  user: { id: string; name: string; email: string }
}

interface Invoice {
  id: string
  userId: string
  startDate: string
  endDate: string
  totalHours: number
  totalAmount: number
  currency: string
  status: string
  notes: string
  createdAt: string
  company: { id: string; name: string }
  user?: { id: string; name: string; email: string }
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  INR: '₹',
  PHP: '₱',
  NPR: 'Rs.',
  AED: 'AED ',
  SAR: 'SR ',
  MYR: 'RM',
  IDR: 'Rp',
  PKR: 'Rs.',
  VND: '₫',
  CNY: '¥',
  BDT: '৳',
  ZAR: 'R',
}

function drawBarChart(data: { label: string; value: number }[]): string {
  const canvas = document.createElement('canvas')
  canvas.width = 600
  canvas.height = 300
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 600, 300)

  const margin = { top: 40, right: 20, bottom: 40, left: 50 }
  const width = 600 - margin.left - margin.right
  const height = 300 - margin.top - margin.bottom

  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(margin.left, margin.top)
  ctx.lineTo(margin.left, margin.top + height)
  ctx.lineTo(margin.left + width, margin.top + height)
  ctx.stroke()

  if (data.length === 0) return canvas.toDataURL('image/png')

  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const barWidth = Math.floor((width / data.length) * 0.6)
  const gap = Math.floor((width / data.length) * 0.4)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (let i = 0; i <= 4; i++) {
    const yVal = (maxVal / 4) * i
    const yPos = margin.top + height - (yVal / maxVal) * height
    ctx.beginPath()
    ctx.moveTo(margin.left, yPos)
    ctx.lineTo(margin.left + width, yPos)
    ctx.strokeStyle = i === 0 ? '#cbd5e1' : '#f1f5f9'
    ctx.stroke()
    ctx.fillText(yVal.toFixed(1) + 'h', margin.left - 8, yPos)
  }

  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  data.forEach((d, idx) => {
    const xPos = margin.left + idx * (barWidth + gap) + gap / 2
    const barHeight = (d.value / maxVal) * height
    const yPos = margin.top + height - barHeight

    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(xPos, yPos, barWidth, barHeight)

    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 10px sans-serif'
    ctx.fillText(d.value.toFixed(1), xPos + barWidth / 2, yPos - 12)

    ctx.fillStyle = '#64748b'
    ctx.font = '9px sans-serif'
    ctx.fillText(d.label, xPos + barWidth / 2, margin.top + height + 6)
  })

  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Hours Logged per Day', margin.left, margin.top - 15)

  return canvas.toDataURL('image/png')
}

function drawDonutChart(data: { label: string; value: number }[]): string {
  const canvas = document.createElement('canvas')
  canvas.width = 600
  canvas.height = 300
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 600, 300)

  const centerX = 150
  const centerY = 150
  const radius = 90
  const innerRadius = 50

  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return canvas.toDataURL('image/png')

  let startAngle = -Math.PI / 2
  const colors = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#64748b',
  ]

  data.forEach((d, idx) => {
    const sliceAngle = (d.value / total) * 2 * Math.PI
    const endAngle = startAngle + sliceAngle
    const color = colors[idx % colors.length]

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, startAngle, endAngle)
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true)
    ctx.closePath()
    ctx.fill()

    startAngle = endAngle
  })

  ctx.fillStyle = '#1e293b'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = 'bold 14px sans-serif'
  ctx.fillText(total.toFixed(1) + 'h', centerX, centerY - 6)
  ctx.font = '10px sans-serif'
  ctx.fillStyle = '#64748b'
  ctx.fillText('Total', centerX, centerY + 10)

  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = '11px sans-serif'
  data.forEach((d, idx) => {
    const color = colors[idx % colors.length]
    const yPos = 50 + idx * 22
    if (yPos > 270) return

    ctx.fillStyle = color
    ctx.fillRect(320, yPos - 6, 12, 12)

    ctx.fillStyle = '#1e293b'
    const percentage = ((d.value / total) * 100).toFixed(1)
    const labelText = `${d.label} (${d.value.toFixed(1)}h, ${percentage}%)`
    ctx.fillText(labelText, 340, yPos)
  })

  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 12px sans-serif'
  ctx.fillText('Hours by Task Description', 40, 30)

  return canvas.toDataURL('image/png')
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [companies, setCompanies] = useState<CompanyMember[]>([])
  const [selectedCompany, setSelectedCompany] = useState('')
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Filters for Invoices List (Admin support)
  const [filterCompany, setFilterCompany] = useState('')
  const [filterUser, setFilterUser] = useState('')
  const [filterMembers, setFilterMembers] = useState<MemberOption[]>([])
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const activeFilterMembership = companies.find((c) => c.companyId === filterCompany)

  const fetchInvoices = useCallback(async (companyId?: string, userId?: string) => {
    const params = new URLSearchParams()
    if (companyId) {
      params.set('companyId', companyId)
    }
    if (userId) {
      params.set('userId', userId)
    }

    const response = await fetch(`/api/invoices?${params.toString()}`)
    if (response.ok) {
      const data = (await response.json()) as { invoices: Invoice[] }
      setInvoices(data.invoices)
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadInitialData = async () => {
      const [companiesResponse, invoicesResponse] = await Promise.all([
        fetch('/api/companies'),
        fetch('/api/invoices'),
      ])

      if (companiesResponse.ok && active) {
        const data = (await companiesResponse.json()) as { companies?: CompanyMember[] }
        const approved =
          data.companies?.filter((membership) => membership.status === 'approved') ?? []
        setCompanies(approved)
        if (approved.length > 0) {
          setSelectedCompany((current) => current || approved[0].companyId)
        }
      }

      if (invoicesResponse.ok && active) {
        const data = (await invoicesResponse.json()) as { invoices: Invoice[] }
        setInvoices(data.invoices)
      }
    }

    void loadInitialData()

    return () => {
      active = false
    }
  }, [])

  // Load team members for filtering if active filter company has admin role
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

  // Trigger search whenever list filters change
  useEffect(() => {
    void fetchInvoices(filterCompany, filterUser)
  }, [filterCompany, filterUser, fetchInvoices])

  const createInvoice = async () => {
    if (!selectedCompany) {
      return
    }

    setCreating(true)
    const response = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: selectedCompany, startDate, endDate, notes }),
    })

    if (response.ok) {
      await fetchInvoices(filterCompany, filterUser)
      setShowForm(false)
      setNotes('')
    }
    setCreating(false)
  }

  const updateStatus = async (id: string, status: string) => {
    const response = await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (response.ok) {
      const data = (await response.json()) as { invoice: Invoice }
      setInvoices((previous) =>
        previous.map((invoice) =>
          invoice.id === id ? { ...invoice, ...data.invoice } : invoice,
        ),
      )
    }
  }

  const deleteInvoice = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) {
      return
    }

    const response = await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
    if (response.ok) {
      setInvoices((previous) => previous.filter((invoice) => invoice.id !== id))
    } else {
      window.alert('Failed to delete invoice')
    }
  }

  const getCurrencySymbol = (currency: string) => CURRENCY_SYMBOLS[currency] || `${currency} `

  const selectedMember = companies.find((company) => company.companyId === selectedCompany)

  const downloadPdf = async (invoice: Invoice) => {
    setDownloadingId(invoice.id)
    try {
      const start = new Date(invoice.startDate)
      const end = new Date(invoice.endDate)
      const startStr = format(start, 'yyyy-MM-dd')
      const endStr = format(end, 'yyyy-MM-dd')
      const userId = invoice.userId

      const response = await fetch(
        `/api/timelogs?companyId=${invoice.company.id}&startDate=${startStr}&endDate=${endStr}&userId=${userId}`,
      )
      if (!response.ok) {
        window.alert('Failed to load time logs for PDF generation.')
        return
      }

      const { timeLogs } = (await response.json()) as { timeLogs: any[] }

      const dailyMap: Record<string, number> = {}
      const taskMap: Record<string, number> = {}

      timeLogs.forEach((log) => {
        if (!log.endTime) return
        const dateKey = format(new Date(log.startTime), 'MMM d')
        const durationMs = new Date(log.endTime).getTime() - new Date(log.startTime).getTime()
        const hours = Math.max(0, (durationMs / 60000 - log.totalBreakMinutes) / 60)

        dailyMap[dateKey] = (dailyMap[dateKey] || 0) + hours

        const descKey = log.description.trim() || 'No description'
        taskMap[descKey] = (taskMap[descKey] || 0) + hours
      })

      const barChartData = Object.entries(dailyMap)
        .map(([label, value]) => ({ label, value }))
        .slice(-7)
      const donutChartData = Object.entries(taskMap)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)

      const barImg = drawBarChart(barChartData)
      const donutImg = drawDonutChart(donutChartData)

      const { jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF()

      doc.setFillColor(59, 130, 246)
      doc.rect(0, 0, 210, 15, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text('PAYTIME INVOICE', 14, 10)

      doc.setTextColor(51, 65, 85)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      doc.text(`Invoice ID: ${invoice.id}`, 14, 25)
      doc.text(`Status: ${invoice.status.toUpperCase()}`, 14, 30)
      doc.text(`Issue Date: ${format(new Date(invoice.createdAt), 'MMMM dd, yyyy')}`, 14, 35)
      doc.text(
        `Billing Period: ${format(new Date(invoice.startDate), 'MMM dd, yyyy')} - ${format(new Date(invoice.endDate), 'MMM dd, yyyy')}`,
        14,
        40,
      )

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('BILL TO (CLIENT)', 14, 50)
      doc.text('PREPARED BY (CONTRACTOR)', 110, 50)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(invoice.company.name, 14, 56)
      doc.text(invoice.user?.name || 'N/A', 110, 56)
      doc.text(invoice.user?.email || 'N/A', 110, 61)

      const rate = invoice.totalHours > 0 ? invoice.totalAmount / invoice.totalHours : 0
      const tableRows = timeLogs.map((log) => {
        const logStart = new Date(log.startTime)
        const logEnd = log.endTime ? new Date(log.endTime) : new Date()
        const durationMs = logEnd.getTime() - logStart.getTime()
        const rawMinutes = Math.floor(durationMs / 60000)
        const billableHours = Math.max(0, (rawMinutes - log.totalBreakMinutes) / 60)

        return [
          format(logStart, 'yyyy-MM-dd HH:mm') + (log.endTime ? ` - ${format(logEnd, 'HH:mm')}` : ' (Running)'),
          log.description || 'No description',
          `${billableHours.toFixed(2)}h` + (log.totalBreakMinutes > 0 ? ` (${log.totalBreakMinutes}m break)` : ''),
          `${getCurrencySymbol(invoice.currency)}${rate.toFixed(2)}/h`,
          `${getCurrencySymbol(invoice.currency)}${(billableHours * rate).toFixed(2)}`,
        ]
      })

      autoTable(doc, {
        startY: 70,
        head: [['Date/Time', 'Description', 'Tracked Hours', 'Rate', 'Amount']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 },
      })

      let currentY = (doc as any).lastAutoTable.finalY + 12

      if (currentY > 240) {
        doc.addPage()
        currentY = 20
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('INVOICE SUMMARY', 14, currentY)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`Total Logged Hours: ${invoice.totalHours.toFixed(2)} hrs`, 14, currentY + 7)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(
        `Total Amount Due: ${getCurrencySymbol(invoice.currency)}${invoice.totalAmount.toFixed(2)} (${invoice.currency})`,
        14,
        currentY + 14,
      )

      currentY += 24

      if (invoice.notes) {
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(9)
        doc.setTextColor(100, 116, 139)
        doc.text(`Notes: ${invoice.notes}`, 14, currentY)
        doc.setTextColor(51, 65, 85)
        currentY += 10
      }

      doc.addPage()
      doc.setFillColor(59, 130, 246)
      doc.rect(0, 0, 210, 15, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('WORK REPORT SUMMARY & CHARTS', 14, 10)

      doc.setTextColor(51, 65, 85)
      if (barImg) {
        doc.addImage(barImg, 'PNG', 14, 25, 180, 90)
      }
      if (donutImg) {
        doc.addImage(donutImg, 'PNG', 14, 125, 180, 90)
      }

      doc.save(
        `Invoice-${invoice.company.name.replace(/\s+/g, '-')}-${format(new Date(), 'yyyyMMdd')}.pdf`,
      )
    } catch (e) {
      console.error(e)
      window.alert('Error generating PDF')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <button
          onClick={() => setShowForm((current) => !current)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 flex items-center gap-1.5"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Invoice
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-900">Generate Invoice</h2>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Company</label>
              <select
                value={selectedCompany}
                onChange={(event) => setSelectedCompany(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {companies.map((membership) => (
                  <option key={membership.companyId} value={membership.companyId}>
                    {membership.company.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              {selectedMember && (
                <div className="text-sm text-gray-500">
                  Rate: {getCurrencySymbol(selectedMember.currency)}
                  {selectedMember.hourlyRate}/hr
                </div>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows={2}
              placeholder="Optional notes..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void createInvoice()}
              disabled={creating || !selectedCompany}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'Generating...' : 'Generate Invoice'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg px-5 py-2 text-sm text-gray-500 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Admin and general listing filters */}
      <div className="mb-6 flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4">
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
            <label className="mb-1 block text-xs font-medium text-gray-500">Member</label>
            <select
              value={filterUser}
              onChange={(event) => setFilterUser(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="">All Members</option>
              {filterMembers.map((member) => (
                <option key={member.id} value={member.userId}>
                  {member.user.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-end">
          <button
            onClick={() => {
              setFilterCompany('')
              setFilterUser('')
            }}
            className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {invoices.length === 0 ? (
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p>No invoices yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-sm font-medium text-blue-600">
                      {invoice.company.name}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        invoice.status === 'paid'
                          ? 'bg-green-50 text-green-600'
                          : invoice.status === 'sent'
                            ? 'bg-yellow-50 text-yellow-600'
                            : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                  {invoice.user && (
                    <p className="text-xs text-gray-600 font-medium mb-1">By: {invoice.user.name}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    {format(new Date(invoice.startDate), 'MMM d')} –{' '}
                    {format(new Date(invoice.endDate), 'MMM d, yyyy')}
                  </p>
                  <p className="text-sm text-gray-500">{invoice.totalHours.toFixed(2)} hours</p>
                  {invoice.notes && (
                    <p className="mt-1.5 text-xs text-gray-400 bg-gray-50 p-2 rounded-lg italic">
                      Notes: {invoice.notes}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <div className="text-xl font-bold text-gray-900">
                    {getCurrencySymbol(invoice.currency)}
                    {invoice.totalAmount.toFixed(2)}
                  </div>
                  <div className="mb-2 text-xs text-gray-400">{invoice.currency}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <select
                      value={invoice.status}
                      onChange={(event) => void updateStatus(invoice.id, event.target.value)}
                      className="rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none bg-white text-gray-700"
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                    </select>

                    <button
                      onClick={() => void downloadPdf(invoice)}
                      disabled={downloadingId === invoice.id}
                      className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Download PDF Invoice with Charts"
                    >
                      {downloadingId === invoice.id ? (
                        'Saving...'
                      ) : (
                        <>
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          PDF
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => void deleteInvoice(invoice.id)}
                      className="rounded border border-red-200 bg-red-50 p-1 text-red-600 hover:bg-red-100 cursor-pointer"
                      title="Delete Invoice"
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
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
