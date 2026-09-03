import React, { useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'
import { formatWithCommas, parseFormattedNumber } from '../utils/currencyFormat'

const MIN_WITHDRAWAL = 30000

/**
 * Bonus/cashback wallet card — a second, separate balance from the main wallet, funded by
 * referral rewards (invite reward, agent commission). Withdrawals here have a ₦30,000 minimum,
 * enforced both here and server-side.
 *
 * variant="driver" hits /drivers/wallet/bonus (drivers don't have stored bank details, so the
 * withdraw form collects them inline); any other variant hits /wallet/bonus (bank details come
 * from the user's profile, same as the main wallet withdrawal).
 */
export default function BonusWallet({ variant = 'user' }) {
  const isDriver = variant === 'driver'
  const infoEndpoint = isDriver ? '/drivers/wallet/bonus' : '/wallet/bonus'
  const transactionsEndpoint = isDriver ? null : '/wallet/bonus/transactions'
  const withdrawEndpoint = isDriver ? '/drivers/wallet/bonus/withdraw' : '/wallet/bonus/withdraw'

  const [balance, setBalance] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [amount, setAmount] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [bankName, setBankName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  const loadWallet = async () => {
    setLoading(true)
    try {
      const res = await apiFetch(infoEndpoint)
      if (res.ok) {
        setBalance(res.data.wallet?.balance ?? 0)
        if (res.data.transactions) setTransactions(res.data.transactions)
      }
      if (transactionsEndpoint) {
        const txRes = await apiFetch(transactionsEndpoint)
        if (txRes.ok) setTransactions(txRes.data.transactions || [])
      }
    } catch (e) {
      // ignore — card just shows a loading/empty state
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWallet()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant])

  const submitWithdraw = async (e) => {
    e?.preventDefault?.()
    setMessage(null)
    const numericAmount = Number(parseFormattedNumber(amount))

    if (!numericAmount || numericAmount < MIN_WITHDRAWAL) {
      setMessage({ type: 'error', text: `Minimum bonus wallet withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString('en-NG')}` })
      return
    }
    if (numericAmount > (balance || 0)) {
      setMessage({ type: 'error', text: 'Amount exceeds your bonus wallet balance' })
      return
    }
    if (isDriver && (!bankAccountNumber || !bankCode)) {
      setMessage({ type: 'error', text: 'Bank account number and bank code are required' })
      return
    }

    setSubmitting(true)
    try {
      const payload = isDriver
        ? { amount: numericAmount, bankAccountNumber, bankCode, bankName }
        : { amount: numericAmount }
      const res = await apiFetch(withdrawEndpoint, { method: 'POST', body: JSON.stringify(payload) })
      if (res.ok) {
        setMessage({ type: 'success', text: res.data.message || 'Withdrawal successful' })
        setAmount('')
        loadWallet()
      } else {
        setMessage({ type: 'error', text: res.data?.message || 'Withdrawal failed' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Withdrawal failed' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Bonus Wallet / Cashback</h3>
          <p className="text-xs text-gray-500 mt-0.5">Referral rewards earned from invites and commissions</p>
        </div>
        <span className="text-amber-500 text-xl">🎁</span>
      </div>

      <div className="mb-4">
        <p className="text-2xl font-bold text-gray-900">
          {loading ? '—' : `₦${Number(balance || 0).toLocaleString('en-NG')}`}
        </p>
        <p className="text-xs text-gray-500 mt-1">Minimum withdrawal: ₦{MIN_WITHDRAWAL.toLocaleString('en-NG')}</p>
      </div>

      <button
        onClick={() => setShowWithdraw((v) => !v)}
        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition"
      >
        {showWithdraw ? 'Cancel' : 'Withdraw Bonus'}
      </button>

      {showWithdraw && (
        <form onSubmit={submitWithdraw} className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          {message && (
            <div className={`text-sm rounded px-3 py-2 ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {message.text}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Amount (NGN)</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatWithCommas(amount)}
              onChange={(e) => setAmount(parseFormattedNumber(e.target.value))}
              placeholder={MIN_WITHDRAWAL.toLocaleString('en-NG')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>
          {isDriver && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bank Account Number</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bank Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bank Name</label>
                  <input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
          >
            {submitting ? 'Processing...' : 'Confirm Withdrawal'}
          </button>
        </form>
      )}

      {transactions.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent Bonus Activity</p>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {transactions.slice(0, 10).map((t) => (
              <li key={t.id || t.reference} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 truncate pr-2">{t.description}</span>
                <span className={t.type === 'credit' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {t.type === 'credit' ? '+' : '-'}₦{Number(t.amount).toLocaleString('en-NG')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
