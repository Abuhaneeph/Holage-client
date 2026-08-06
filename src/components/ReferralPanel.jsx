"use client"

import { useState, useEffect } from "react"
import { Gift, Copy, Check } from "lucide-react"
import { useToast } from "../context/ToastContext"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

/** "Refer & Earn" panel — shows the user's invite code, copy action, and referral stats. */
const ReferralPanel = () => {
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchReferrals()
  }, [])

  const fetchReferrals = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/auth/me/referrals`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await response.json()
      if (response.ok && json.success) {
        setData(json)
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!data?.inviteCode) return
    navigator.clipboard.writeText(data.inviteCode)
    setCopied(true)
    toast.success('Invite code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-pulse">
        <div className="h-5 w-40 bg-muted rounded mb-3" />
        <div className="h-12 w-full bg-muted rounded-xl" />
      </div>
    )
  }

  if (!data || !data.inviteCode) return null

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Gift className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-text-primary font-bold text-lg">Refer & Earn</h3>
          <p className="text-text-secondary text-sm">
            Earn ₦{data.rewardAmounts.truck.toLocaleString('en-NG')} for a trucker/fleet manager or ₦{data.rewardAmounts.user.toLocaleString('en-NG')} for a shipper/agent — paid when they complete their first shipment.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-3 font-mono font-bold text-text-primary tracking-[0.3em] text-center">
          {data.inviteCode}
        </div>
        <button
          onClick={handleCopy}
          className="bg-primary text-white px-4 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors flex-shrink-0"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/30 rounded-xl p-3 text-center">
          <p className="text-text-secondary text-xs">People Invited</p>
          <p className="text-text-primary font-bold text-xl">{data.invitedCount}</p>
        </div>
        <div className="bg-muted/30 rounded-xl p-3 text-center">
          <p className="text-text-secondary text-xs">Rewards Earned</p>
          <p className="text-success font-bold text-xl">
            ₦{data.totalRewarded.toLocaleString('en-NG')}
          </p>
        </div>
      </div>

      {data.invitedUsers?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-text-secondary text-xs uppercase tracking-wide mb-2">Your Invitees</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.invitedUsers.map((invitee) => (
              <div key={invitee.id} className="flex items-center justify-between text-sm gap-2">
                <span className="text-text-primary truncate">
                  {invitee.fullName}{' '}
                  <span className="text-text-secondary capitalize">({String(invitee.role).replace('_', ' ')})</span>
                </span>
                <span className={`flex-shrink-0 ${invitee.inviteRewardPaid ? 'text-success font-medium' : 'text-text-secondary'}`}>
                  {invitee.inviteRewardPaid ? 'Rewarded' : 'Pending first shipment'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ReferralPanel
