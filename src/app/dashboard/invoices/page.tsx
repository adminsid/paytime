'use client'

import { endOfMonth, format, startOfMonth } from 'date-fns'
import { useCallback, useEffect, useState } from 'react'

interface CompanyMember {
  companyId: string
  status: string
  hourlyRate: number
  currency: string
  company: { id: string; name: string }
}

interface Invoice {
  id: string
  startDate: string
  endDate: string
  totalHours: number
  totalAmount: number
  currency: string
  status: string
  notes: string
  createdAt: string
  company: { id: string; name: string }
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

  const fetchInvoices = useCallback(async (companyId?: string) => {
    const params = new URLSearchParams()
    if (companyId) {
      params.set('companyId', companyId)
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
      await fetchInvoices()
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

  const getCurrencySymbol = (currency: string) => CURRENCY_SYMBOLS[currency] || `${currency} `

  const selectedMember = companies.find((company) => company.companyId === selectedCompany)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <button
          onClick={() => setShowForm((current) => !current)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Invoice
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

      {invoices.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <p className="mb-3 text-4xl">📄</p>
          <p>No invoices yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
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
                  <p className="text-sm text-gray-500">
                    {format(new Date(invoice.startDate), 'MMM d')} –{' '}
                    {format(new Date(invoice.endDate), 'MMM d, yyyy')}
                  </p>
                  <p className="text-sm text-gray-500">{invoice.totalHours.toFixed(2)} hours</p>
                  {invoice.notes && (
                    <p className="mt-1 text-xs text-gray-400">{invoice.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">
                    {getCurrencySymbol(invoice.currency)}{invoice.totalAmount.toFixed(2)}
                  </div>
                  <div className="mb-2 text-xs text-gray-400">{invoice.currency}</div>
                  <select
                    value={invoice.status}
                    onChange={(event) => void updateStatus(invoice.id, event.target.value)}
                    className="rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
