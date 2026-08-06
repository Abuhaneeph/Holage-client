import React, { useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'
import { FileText, ArrowUp, ArrowDown } from 'lucide-react'

/**
 * "Travel history and amount, like a bank statement" — combines wallet transactions with the
 * trip they belong to (route + booking reference) and a running balance per row, instead of a
 * bare transaction list. variant="driver" hits /drivers/wallet/statement, anything else hits
 * /wallet/statement.
 */
export default function WalletStatement({ variant = 'user' }) {
  const endpoint = variant === 'driver' ? '/drivers/wallet/statement' : '/wallet/statement'
  const [statement, setStatement] = useState([])
  const [currentBalance, setCurrentBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await apiFetch(endpoint)
        if (!cancelled && res.ok) {
          setStatement(res.data.statement || [])
          setCurrentBalance(res.data.currentBalance || 0)
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
  }, [variant])

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-text-primary font-bold text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" /> Statement
        </h3>
        <p className="text-text-secondary text-sm">
          Balance: <span className="text-text-primary font-semibold">₦{Number(currentBalance).toLocaleString('en-NG')}</span>
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      ) : statement.length === 0 ? (
        <div className="bg-muted/30 rounded-xl p-8 text-center text-text-secondary text-sm">
          No transactions yet. Your trip and payment history will appear here.
        </div>
      ) : (
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
              {statement.map((row) => (
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
                      ₦{Number(row.amount).toLocaleString('en-NG')}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-right text-text-secondary whitespace-nowrap">
                    ₦{Number(row.balanceAfter).toLocaleString('en-NG')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
