"use client"

import { useEffect, useState } from "react"
import {
  Copy,
  Check,
  LogOut,
  Share2,
  Hash,
  User,
  UserCircle,
  Loader,
  Truck,
  Wallet,
  Map,
  AlertTriangle,
} from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useToast } from "../context/ToastContext"

const AgentDashboard = () => {
  const { user, logoutUser } = useAppContext()
  const toast = useToast()
  const [copiedField, setCopiedField] = useState(null)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [disputeLoading, setDisputeLoading] = useState(false)
  const [disputes, setDisputes] = useState([])

  const referralCode = user?.referralCode || ""
  const uniqueCode = user?.uniqueCode || ""

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api"

  const copyText = async (label, value) => {
    if (!value) {
      toast.warning("No code to copy yet. Run DB migrations for agent codes if missing.")
      return
    }
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(label)
      toast.success(`${label} copied`)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      toast.error("Could not copy to clipboard")
    }
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("authToken")
        const res = await fetch(`${API_BASE_URL}/agents/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (!res.ok) {
          throw new Error(json.message || "Failed to load dashboard")
        }
        setData(json)
      } catch (e) {
        console.error(e)
        toast.error(e.message || "Could not load agent dashboard")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [API_BASE_URL, toast])

  useEffect(() => {
    const loadDisputes = async () => {
      setDisputeLoading(true)
      try {
        const token = localStorage.getItem("authToken")
        const res = await fetch(`${API_BASE_URL}/complaints/agent/assigned`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (res.ok && json.disputes) setDisputes(json.disputes)
      } catch (e) {
        console.error(e)
      } finally {
        setDisputeLoading(false)
      }
    }
    loadDisputes()
  }, [API_BASE_URL])

  const stats = data?.stats

  const firstName =
    user?.fullName?.split(" ")[0]?.replace(/^00\s*/, "").trim() || "Agent"

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Match shipper/trucker: gradient header + welcome */}
      <div className="bg-gradient-to-br from-primary via-primary to-secondary p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/40 bg-white/20">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/80">Welcome</p>
              <p className="text-lg font-bold text-white">{firstName}</p>
              <p className="text-xs text-white/70">Agent · referrals & disputes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => logoutUser()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-error/20 transition-colors hover:bg-error/30"
            title="Log out"
          >
            <LogOut className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 mt-6 space-y-6">
        {/* Referral cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-text-secondary">
              <Hash className="h-4 w-4" />
              <span className="text-sm font-medium">Referral code</span>
            </div>
            <p className="mb-2 text-xs text-text-secondary">
              Share this with truckers at signup (format HOLAGE- plus 5 characters).
            </p>
            <div className="flex items-center justify-between gap-2">
              <code className="break-all text-base font-semibold tracking-tight text-text-primary sm:text-lg">
                {referralCode || "—"}
              </code>
              <button
                type="button"
                onClick={() => copyText("Referral code", referralCode)}
                className="rounded-xl p-2 hover:bg-muted/40"
                aria-label="Copy referral code"
              >
                {copiedField === "Referral code" ? (
                  <Check className="h-5 w-5 text-success" />
                ) : (
                  <Copy className="h-5 w-5 text-text-secondary" />
                )}
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-text-secondary">
              <Share2 className="h-4 w-4" />
              <span className="text-sm font-medium">Secondary ID</span>
            </div>
            <p className="mb-2 text-xs text-text-secondary">
              Longer internal ID for support (also HOLAGE-…). Do not share publicly.
            </p>
            <div className="flex items-center justify-between gap-2">
              <code className="break-all text-base font-semibold tracking-tight text-text-primary sm:text-lg">
                {uniqueCode || "—"}
              </code>
              <button
                type="button"
                onClick={() => copyText("Unique code", uniqueCode)}
                className="rounded-xl p-2 hover:bg-muted/40"
                aria-label="Copy unique code"
              >
                {copiedField === "Unique code" ? (
                  <Check className="h-5 w-5 text-success" />
                ) : (
                  <Copy className="h-5 w-5 text-text-secondary" />
                )}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
            <Loader className="mb-2 h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Loading dashboard…</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-1 flex items-center gap-2 text-text-secondary">
                  <UserCircle className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Referred truckers</span>
                </div>
                <p className="text-2xl font-bold text-text-primary">{stats?.referredTruckers ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-1 flex items-center gap-2 text-text-secondary">
                  <Map className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Total trips</span>
                </div>
                <p className="text-2xl font-bold text-text-primary">{stats?.totalTrips ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-1 flex items-center gap-2 text-text-secondary">
                  <Truck className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Completed</span>
                </div>
                <p className="text-2xl font-bold text-text-primary">{stats?.completedTrips ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-1 flex items-center gap-2 text-text-secondary">
                  <Wallet className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Commission (NGN)</span>
                </div>
                <p className="text-2xl font-bold text-success">
                  {stats?.agentCommissionTotal != null ? Number(stats.agentCommissionTotal).toFixed(2) : "0.00"}
                </p>
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-bold text-text-primary">Trips (referred truckers)</h2>
              <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="px-4 py-3 font-medium text-text-primary">ID</th>
                      <th className="px-4 py-3 font-medium text-text-primary">Stage</th>
                      <th className="px-4 py-3 font-medium text-text-primary">Route</th>
                      <th className="px-4 py-3 font-medium text-text-primary">Trucker</th>
                      <th className="px-4 py-3 font-medium text-text-primary">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.trips || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                          No trips yet. Share your referral code with truckers.
                        </td>
                      </tr>
                    ) : (
                      (data?.trips || []).map((t) => (
                        <tr key={t.id} className="border-b border-border/60 last:border-0">
                          <td className="px-4 py-3 font-mono text-xs text-text-secondary">#{t.id}</td>
                          <td className="px-4 py-3 capitalize text-text-primary">{t.stage}</td>
                          <td className="px-4 py-3 text-text-primary">
                            {t.pickup?.state} → {t.destination?.state}
                          </td>
                          <td className="px-4 py-3 text-text-primary">{t.trucker?.name}</td>
                          <td className="px-4 py-3 text-text-primary">
                            {t.payment?.commissionCounts && t.payment?.agentCommission != null
                              ? `₦${Number(t.payment.agentCommission).toFixed(2)}`
                              : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-text-primary">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Assigned disputes
              </h2>
              <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
                {disputeLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-border bg-muted/30">
                      <tr>
                        <th className="px-4 py-3 font-medium text-text-primary">ID</th>
                        <th className="px-4 py-3 font-medium text-text-primary">Subject</th>
                        <th className="px-4 py-3 font-medium text-text-primary">Status</th>
                        <th className="px-4 py-3 font-medium text-text-primary">Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {disputes.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">
                            No disputes assigned to you.
                          </td>
                        </tr>
                      ) : (
                        disputes.map((d) => (
                          <tr key={d.id} className="border-b border-border/60 last:border-0">
                            <td className="px-4 py-3 font-mono text-xs text-text-secondary">#{d.id}</td>
                            <td className="px-4 py-3 text-text-primary">{d.subject}</td>
                            <td className="px-4 py-3 capitalize text-text-primary">{d.status}</td>
                            <td className="px-4 py-3 font-mono text-xs text-text-primary">{d.disputeCode || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default AgentDashboard
