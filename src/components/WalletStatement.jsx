import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../utils/api'
import { FileText, ArrowUp, ArrowDown, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const PAGE_SIZE = 15

/** 'YYYY-MM' for the given Date, in local time. */
const toMonthStr = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** Turns a 'YYYY-MM' month filter into the [dateFrom, dateTo] the backend expects. */
const monthToDateRange = (monthStr) => {
  const [year, month] = monthStr.split('-').map(Number)
  const dateFrom = `${monthStr}-01`
  const lastDay = new Date(year, month, 0).getDate() // month is 1-indexed here, so this is correct
  const dateTo = `${monthStr}-${String(lastDay).padStart(2, '0')}`
  return { dateFrom, dateTo }
}

const formatNaira = (amount) => `₦${Number(amount).toLocaleString('en-NG')}`

/**
 * "Travel history and amount, like a bank statement" — combines wallet transactions with the
 * trip they belong to (route + booking reference) and a running balance per row, instead of a
 * bare transaction list. variant="driver" hits /drivers/wallet/statement, anything else hits
 * /wallet/statement.
 *
 * Supports filtering to a single calendar month (passed to the backend as dateFrom/dateTo query
 * params, since the endpoints only return the most-recent 200 rows by default — a month further
 * back than that cap needs a real query-side filter, not a client-side one over the capped set),
 * client-side pagination over the filtered result, and exporting the full filtered statement as
 * a PDF.
 */
export default function WalletStatement({ variant = 'user' }) {
  const endpoint = variant === 'driver' ? '/drivers/wallet/statement' : '/wallet/statement'
  const [statement, setStatement] = useState([])
  const [currentBalance, setCurrentBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [monthFilter, setMonthFilter] = useState('') // '' = default (last 200, unfiltered)
  const [page, setPage] = useState(1)

  const currentMonthStr = useMemo(() => toMonthStr(new Date()), [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        let url = endpoint
        if (monthFilter) {
          const { dateFrom, dateTo } = monthToDateRange(monthFilter)
          url = `${endpoint}?dateFrom=${dateFrom}&dateTo=${dateTo}`
        }
        const res = await apiFetch(url)
        if (!cancelled && res.ok) {
          setStatement(res.data.statement || [])
          setCurrentBalance(res.data.currentBalance || 0)
          setPage(1)
        }
      } catch (e) {
        // ignore — card just shows an empty state
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, monthFilter])

  const totalPages = Math.max(1, Math.ceil(statement.length / PAGE_SIZE))
  const pagedStatement = statement.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const monthLabel = monthFilter
    ? new Date(`${monthFilter}-01T00:00:00`).toLocaleDateString('en-NG', { year: 'numeric', month: 'long' })
    : ''

  const handleDownload = () => {
    if (statement.length === 0) return

    const doc = new jsPDF()
    const periodLabel = monthFilter ? monthLabel : 'Last 200 transactions'

    doc.setFontSize(16)
    doc.setTextColor(20)
    doc.text('Wallet Statement', 14, 18)

    doc.setFontSize(10)
    doc.setTextColor(90)
    doc.text(`Period: ${periodLabel}`, 14, 26)
    doc.text(`Balance: NGN ${Number(currentBalance).toLocaleString('en-NG')}`, 14, 32)
    doc.text(`Generated: ${new Date().toLocaleString('en-NG')}`, 14, 38)

    const rows = statement.map((row) => [
      new Date(row.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' }),
      row.trip
        ? `${row.trip.bookingReference || `#${row.trip.shipmentId}`}\n${row.trip.pickup} -> ${row.trip.destination}`
        : '-',
      row.description || (row.type === 'credit' ? 'Credit' : 'Debit'),
      `${row.type === 'credit' ? '+' : '-'}NGN ${Number(row.amount).toLocaleString('en-NG')}`,
      `NGN ${Number(row.balanceAfter).toLocaleString('en-NG')}`,
    ])

    autoTable(doc, {
      startY: 44,
      head: [['Date', 'Trip', 'Description', 'Amount', 'Balance']],
      body: rows,
      styles: { fontSize: 8, cellPadding: 3, valign: 'middle' },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
    })

    const suffix = monthFilter || 'statement'
    doc.save(`wallet-statement-${suffix}.pdf`)
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-text-primary font-bold text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" /> Statement
        </h3>
        <p className="text-text-secondary text-sm">
          Balance: <span className="text-text-primary font-semibold">{formatNaira(currentBalance)}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={monthFilter}
            max={currentMonthStr}
            onChange={(e) => setMonthFilter(e.target.value)}
            aria-label="Filter statement by month"
            className="px-3 py-2 border border-border rounded-lg text-sm text-text-primary bg-card"
          />
          {monthFilter && (
            <button
              onClick={() => setMonthFilter('')}
              className="px-3 py-2 bg-muted text-text-secondary rounded-lg text-sm font-medium hover:bg-muted/80"
            >
              Clear
            </button>
          )}
        </div>
        <button
          onClick={handleDownload}
          disabled={loading || statement.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" /> Download
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      ) : statement.length === 0 ? (
        <div className="bg-muted/30 rounded-xl p-8 text-center text-text-secondary text-sm">
          {monthFilter
            ? `No transactions in ${monthLabel}.`
            : 'No transactions yet. Your trip and payment history will appear here.'}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="py-2 pr-3 font-medium text-text-secondary">Date</th>
                  <th className="py-2 pr-3 font-medium text-text-secondary">Trip</th>
                  <th className="py-2 pr-3 font-medium text-text-secondary">Description</th>
                  <th className="py-2 pr-3 font-medium text-text-secondary text-right">Amount</th>
                  <th className="py-2 pr-3 font-medium text-text-secondary text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {pagedStatement.map((row) => (
                  <tr key={row.id || row.reference} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-3 text-text-secondary whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-2 pr-3 text-text-secondary">
                      {row.trip ? (
                        <>
                          <p className="font-mono text-xs">{row.trip.bookingReference || `#${row.trip.shipmentId}`}</p>
                          <p className="text-xs">{row.trip.pickup} → {row.trip.destination}</p>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2 pr-3 text-text-primary">{row.description || (row.type === 'credit' ? 'Credit' : 'Debit')}</td>
                    <td className={`py-2 pr-3 text-right font-medium whitespace-nowrap ${row.type === 'credit' ? 'text-success' : 'text-error'}`}>
                      <span className="inline-flex items-center gap-1 justify-end">
                        {row.type === 'credit' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                        {formatNaira(row.amount)}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-right text-text-secondary whitespace-nowrap">
                      {formatNaira(row.balanceAfter)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-muted rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Previous
              </button>
              <p className="text-text-secondary text-sm">Page {page} of {totalPages}</p>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-muted rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
