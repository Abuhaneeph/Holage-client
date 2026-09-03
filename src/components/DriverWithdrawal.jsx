import React, { useState, useContext, useEffect } from 'react'
import { useAppContext } from '../context/AppContext.jsx'
import { apiFetch } from '../utils/api'

export default function DriverWithdrawal() {
  const { user, token } = useAppContext()
  const [amount, setAmount] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [bankName, setBankName] = useState('')
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    // Fetch driver wallet info
    const fetchWallet = async () => {
      try {
        const res = await apiFetch('/drivers/wallet')
        if (res.ok && res.data && res.data.wallet) setBalance(res.data.wallet.balance)
      } catch (e) {
        // ignore
      }
    }
    if (token) fetchWallet()
  }, [token])

  const submit = async (e) => {
    e.preventDefault()
    setMessage(null)
      setLoading(true)
    try {
      const payload = { amount: Number(amount), bankAccountNumber, bankCode, bankName }
      const res = await apiFetch('/drivers/wallet/withdraw', { method: 'POST', body: JSON.stringify(payload) })
      if (res.ok) {
        setMessage({ type: 'success', text: res.data.message || 'Withdrawal successful' })
        if (res.data.balance !== undefined) setBalance(res.data.balance)
      } else {
        setMessage({ type: 'error', text: res.data?.message || JSON.stringify(res.data) })
      }
    } catch (err) {
      const text = err.response?.data?.message || err.message || 'Withdrawal failed'
      setMessage({ type: 'error', text })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 bg-white rounded shadow max-w-md">
      <h3 className="text-lg font-semibold mb-3">Withdraw from Wallet</h3>
      <p className="text-sm text-gray-600 mb-3">Balance: {balance !== null ? `₦${Number(balance).toLocaleString()}` : '—'}</p>
      {message && (
        <div className={message.type === 'error' ? 'text-red-600 mb-3' : 'text-green-600 mb-3'}>{message.text}</div>
      )}
      <form onSubmit={submit}>
        <div className="mb-2">
          <label className="block text-sm font-medium">Amount (NGN)</label>
          <input type="number" min="100" value={amount} onChange={e=>setAmount(e.target.value)} className="mt-1 block w-full border rounded px-2 py-1" required />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium">Bank Account Number</label>
          <input type="text" inputMode="numeric" value={bankAccountNumber} onChange={e=>setBankAccountNumber(e.target.value)} className="mt-1 block w-full border rounded px-2 py-1" required />
        </div>
        <div className="mb-2 grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium">Bank Code</label>
            <input type="text" inputMode="numeric" value={bankCode} onChange={e=>setBankCode(e.target.value)} className="mt-1 block w-full border rounded px-2 py-1" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Bank Name</label>
            <input value={bankName} onChange={e=>setBankName(e.target.value)} className="mt-1 block w-full border rounded px-2 py-1" />
          </div>
        </div>
        <button disabled={loading} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Processing...' : 'Withdraw'}</button>
      </form>
    </div>
  )
}
