"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Copy,
  Check,
  LogOut,
  RefreshCw,
  Share2,
  Hash,
  User,
  UserCircle,
  Loader,
  Truck,
  Wallet,
  Map,
  AlertTriangle,
  Home,
  TrendingUp,
  ShieldCheck,
  MessageSquare,
  X,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  Clock,
  FileText,
  Mail,
  Phone,
  ChevronRight,
  Gift,
  Camera,
  Upload,
} from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useToast } from "../context/ToastContext"
import ReferralPanel from "../components/ReferralPanel"
import BonusWallet from "../components/BonusWallet"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api"

const AgentDashboard = () => {
  const { user, logoutUser, navigateTo } = useAppContext()
  const toast = useToast()

  const [activeView, setActiveView] = useState("home")
  const [copiedField, setCopiedField] = useState(null)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [disputeLoading, setDisputeLoading] = useState(false)
  const [disputes, setDisputes] = useState([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [transactionsPage, setTransactionsPage] = useState(1)
  const transactionsPerPage = 5
  const [walletLoading, setWalletLoading] = useState(false)
  const [documents, setDocuments] = useState(null)
  const [uploadingDoc, setUploadingDoc] = useState(null)
  const [selectedDispute, setSelectedDispute] = useState(null)
  const [disputeDetail, setDisputeDetail] = useState(null)
  const [disputeDetailLoading, setDisputeDetailLoading] = useState(false)
  const [resolveCode, setResolveCode] = useState("")
  const [resolving, setResolving] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [trucks, setTrucks] = useState([])
  const [trucksLoading, setTrucksLoading] = useState(false)
  const [bonusBalance, setBonusBalance] = useState(0)
  const [refreshingAll, setRefreshingAll] = useState(false)

  const referralCode = user?.referralCode || ""
  const uniqueCode = user?.uniqueCode || ""
  const stats = data?.stats
  const progress = data?.progress
  const verification = data?.verification

  const firstName =
    user?.fullName?.split(" ")[0]?.replace(/^00\s*/, "").trim() || "Agent"

  const copyText = async (label, value) => {
    if (!value) {
      toast.warning("No code to copy yet.")
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

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${API_BASE_URL}/agents/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to load dashboard")
      setData(json)
    } catch (e) {
      console.error(e)
      toast.error(e.message || "Could not load agent dashboard")
    } finally {
      setLoading(false)
    }
  }, [toast])

  const loadDisputes = useCallback(async () => {
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
  }, [])

  const loadWallet = useCallback(async () => {
    setWalletLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      const [wr, tr] = await Promise.all([
        fetch(`${API_BASE_URL}/wallet`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/wallet/transactions`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const wd = await wr.json()
      const td = await tr.json()
      if (wr.ok && wd.wallet) setWalletBalance(parseFloat(wd.wallet.balance || 0))
      if (tr.ok && td.transactions) setTransactions(td.transactions)
    } catch (e) {
      console.error(e)
    } finally {
      setWalletLoading(false)
    }
  }, [])

  const loadTrucks = useCallback(async () => {
    setTrucksLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${API_BASE_URL}/agents/trucks`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (res.ok && json.trucks) setTrucks(json.trucks)
    } catch (e) {
      console.error(e)
    } finally {
      setTrucksLoading(false)
    }
  }, [])

  const loadBonusBalance = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${API_BASE_URL}/wallet/bonus`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (res.ok && json.wallet) setBonusBalance(parseFloat(json.wallet.balance || 0))
    } catch (e) {
      console.error(e)
    }
  }, [])

  const loadDocuments = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${API_BASE_URL}/kyc/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (res.ok && json.documents) setDocuments(json.documents)
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
    loadDisputes()
    loadDocuments()
    loadTrucks()
    loadBonusBalance()
  }, [loadDashboard, loadDisputes, loadDocuments, loadTrucks, loadBonusBalance])

  // Systemic refresh — always visible in the header, reloads the dashboard stats, disputes,
  // trucks, and bonus balance regardless of which tab is active.
  const handleGlobalRefresh = async () => {
    setRefreshingAll(true)
    try {
      await Promise.all([loadDashboard(), loadDisputes(), loadTrucks(), loadBonusBalance()])
      toast.success('Refreshed')
    } catch (error) {
      console.error('Error during global refresh:', error)
    } finally {
      setRefreshingAll(false)
    }
  }

  // Upload/update profile photo — its own endpoint, stays editable even after KYC approval
  const handleProfilePhotoUpload = async (file) => {
    if (!file) return
    setUploadingDoc("profilePhoto")
    try {
      const formData = new FormData()
      formData.append("profilePhoto", file)

      const token = localStorage.getItem("authToken")
      const response = await fetch(`${API_BASE_URL}/kyc/profile-photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const data = await response.json()
      if (response.ok) {
        toast.success("Profile photo updated!")
        setDocuments((d) => ({ ...(d || {}), profilePhoto: data.profilePhoto }))
      } else {
        toast.error(data.message || "Upload failed")
      }
    } catch (error) {
      console.error("Error uploading profile photo:", error)
      toast.error("Error uploading profile photo")
    } finally {
      setUploadingDoc(null)
    }
  }

  const triggerProfilePhotoUpload = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        handleProfilePhotoUpload(file)
      }
    }
    input.click()
  }

  useEffect(() => {
    if (activeView === "wallet") loadWallet()
  }, [activeView, loadWallet])

  const openDisputeDetail = async (dispute) => {
    setSelectedDispute(dispute)
    setDisputeDetail(null)
    setResolveCode("")
    setDisputeDetailLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${API_BASE_URL}/complaints/agent/${dispute.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to load dispute")
      setDisputeDetail(json.complaint)
    } catch (e) {
      toast.error(e.message || "Could not load dispute details")
      setSelectedDispute(null)
    } finally {
      setDisputeDetailLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedDispute || !newMessage.trim()) return
    setSendingMessage(true)
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${API_BASE_URL}/complaints/${selectedDispute.id}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: newMessage.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to send message")
      setNewMessage("")
      await openDisputeDetail(selectedDispute)
      toast.success("Message sent")
    } catch (e) {
      toast.error(e.message || "Could not send message")
    } finally {
      setSendingMessage(false)
    }
  }

  const handleResolveDispute = async () => {
    if (!selectedDispute || !resolveCode.trim()) {
      toast.error("Enter the dispute code to resolve")
      return
    }
    setResolving(true)
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${API_BASE_URL}/complaints/${selectedDispute.id}/agent/resolve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ disputeCode: resolveCode.trim(), status: "resolved" }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to resolve dispute")
      toast.success(
        json.incentivePaidNgn
          ? `Dispute resolved! ₦${Number(json.incentivePaidNgn).toLocaleString("en-NG")} incentive credited.`
          : json.message || "Dispute resolved"
      )
      setSelectedDispute(null)
      setDisputeDetail(null)
      loadDisputes()
      loadWallet()
      loadDashboard()
    } catch (e) {
      toast.error(e.message || "Could not resolve dispute")
    } finally {
      setResolving(false)
    }
  }

  const kycStatus = documents?.kycStatus || verification?.kycStatus || "pending"
  const kycBadge = {
    approved: { label: "Verified", className: "bg-success/10 text-success" },
    pending: { label: "Pending Review", className: "bg-warning/10 text-warning" },
    rejected: { label: "Rejected", className: "bg-error/10 text-error" },
  }[kycStatus] || { label: "Not Submitted", className: "bg-muted text-text-secondary" }

  const renderReferralCards = () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-text-secondary">
          <Hash className="h-4 w-4" />
          <span className="text-sm font-medium">Referral code</span>
        </div>
        <p className="mb-2 text-xs text-text-secondary">
          Share with truckers at signup (HOLAGE-XXXXX).
        </p>
        <div className="flex items-center justify-between gap-2">
          <code className="break-all text-base font-semibold text-text-primary">{referralCode || "—"}</code>
          <button type="button" onClick={() => copyText("Referral code", referralCode)} className="rounded-xl p-2 hover:bg-muted/40">
            {copiedField === "Referral code" ? <Check className="h-5 w-5 text-success" /> : <Copy className="h-5 w-5 text-text-secondary" />}
          </button>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-text-secondary">
          <Share2 className="h-4 w-4" />
          <span className="text-sm font-medium">Secondary ID</span>
        </div>
        <p className="mb-2 text-xs text-text-secondary">Internal support ID — keep private.</p>
        <div className="flex items-center justify-between gap-2">
          <code className="break-all text-base font-semibold text-text-primary">{uniqueCode || "—"}</code>
          <button type="button" onClick={() => copyText("Unique code", uniqueCode)} className="rounded-xl p-2 hover:bg-muted/40">
            {copiedField === "Unique code" ? <Check className="h-5 w-5 text-success" /> : <Copy className="h-5 w-5 text-text-secondary" />}
          </button>
        </div>
      </div>
    </div>
  )

  const renderStatsGrid = () => (
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
          <span className="text-xs font-medium uppercase tracking-wide">Commission earned</span>
        </div>
        <p className="text-2xl font-bold text-success">
          ₦{Number(stats?.agentCommissionTotal || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  )

  // Pagination for transactions (wallet view)
  const totalTransactionsPages = Math.ceil(transactions.length / transactionsPerPage)
  const paginatedTransactions = transactions.slice(
    (transactionsPage - 1) * transactionsPerPage,
    transactionsPage * transactionsPerPage
  )

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="bg-gradient-to-br from-primary via-primary to-secondary p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/40 bg-white/20">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/80">Welcome</p>
              <p className="text-lg font-bold text-white">{firstName}</p>
              <p className="text-xs text-white/70">
                {progress?.currentLevel?.title || "Agent"} · Level {progress?.currentLevel?.level || 1}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleGlobalRefresh}
              disabled={refreshingAll}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`h-5 w-5 text-white ${refreshingAll ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => logoutUser()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-error/20 hover:bg-error/30"
              title="Log out"
            >
              <LogOut className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 mt-6 space-y-6">
        {activeView === "home" && (
          <>
            {renderReferralCards()}
            {loading ? (
              <div className="flex flex-col items-center py-16 text-text-secondary">
                <Loader className="mb-2 h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">Loading dashboard…</p>
              </div>
            ) : (
              <>
                {renderStatsGrid()}
                <button
                  type="button"
                  onClick={() => setActiveView("referrals")}
                  className="w-full text-left rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm hover:bg-amber-100/70 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-amber-700">
                    <span className="text-xl">🎁</span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide">Bonus Wallet</p>
                      <p className="text-2xl font-bold text-text-primary">₦{bonusBalance.toLocaleString('en-NG')}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-amber-600" />
                </button>
                <div>
                  <h2 className="mb-3 text-lg font-bold text-text-primary">Trips (referred truckers)</h2>
                  <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b border-border bg-muted/30">
                        <tr>
                          <th className="px-4 py-3 font-medium">ID</th>
                          <th className="px-4 py-3 font-medium">Stage</th>
                          <th className="px-4 py-3 font-medium">Route</th>
                          <th className="px-4 py-3 font-medium">Trucker</th>
                          <th className="px-4 py-3 font-medium">Commission</th>
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
                              <td className="px-4 py-3 font-mono text-xs">#{t.id}</td>
                              <td className="px-4 py-3 capitalize">{t.stage}</td>
                              <td className="px-4 py-3">{t.pickup?.state} → {t.destination?.state}</td>
                              <td className="px-4 py-3">{t.trucker?.name}</td>
                              <td className="px-4 py-3">
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
              </>
            )}
          </>
        )}

        {activeView === "wallet" && (
          <div className="space-y-4">
            <h2 className="text-text-primary font-bold text-2xl">Wallet</h2>
            {walletLoading ? (
              <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <p className="text-text-secondary mb-2">Available Balance</p>
                  <p className="text-text-primary font-bold text-4xl">₦{Number(walletBalance || 0).toLocaleString("en-NG")}</p>
                  <p className="text-text-secondary text-xs mt-2">
                    Includes dispute onsite incentives. Trip commissions are calculated separately.
                  </p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-4 border border-border">
                  <p className="text-text-secondary text-sm">Total commission (completed trips)</p>
                  <p className="text-success font-bold text-xl">
                    ₦{Number(stats?.agentCommissionTotal || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div>
                  <h3 className="text-text-primary font-bold mb-3">Recent Transactions</h3>
                  {transactions.length === 0 ? (
                    <div className="bg-muted/30 rounded-2xl p-6 text-center text-text-secondary">No transactions yet</div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {paginatedTransactions.map((t) => (
                          <div key={t.id || t.reference} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === "credit" ? "bg-success/10" : "bg-error/10"}`}>
                                {t.type === "credit" ? <ArrowDown className="w-5 h-5 text-success" /> : <ArrowUp className="w-5 h-5 text-error" />}
                              </div>
                              <div>
                                <p className="text-text-primary font-medium text-sm">{t.description || t.type}</p>
                                <p className="text-text-secondary text-xs">{new Date(t.createdAt).toLocaleString()}</p>
                              </div>
                            </div>
                            <p className={`font-bold ${t.type === "credit" ? "text-success" : "text-error"}`}>
                              {t.type === "credit" ? "+" : "-"}₦{Number(t.amount || 0).toLocaleString("en-NG")}
                            </p>
                          </div>
                        ))}
                      </div>
                      {totalTransactionsPages > 1 && (
                        <div className="flex items-center justify-center space-x-2 mt-4">
                          <button onClick={() => setTransactionsPage(p => Math.max(1, p - 1))} disabled={transactionsPage === 1} className="px-3 py-1 bg-card border border-border rounded-lg text-sm disabled:opacity-50">Prev</button>
                          <span className="text-text-secondary text-sm">Page {transactionsPage} of {totalTransactionsPages}</span>
                          <button onClick={() => setTransactionsPage(p => Math.min(totalTransactionsPages, p + 1))} disabled={transactionsPage === totalTransactionsPages} className="px-3 py-1 bg-card border border-border rounded-lg text-sm disabled:opacity-50">Next</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeView === "trucks" && (
          <div className="space-y-4">
            <h2 className="text-text-primary font-bold text-2xl flex items-center gap-2">
              <Truck className="w-6 h-6 text-primary" />
              My Trucks
            </h2>
            <p className="text-text-secondary text-sm">
              Vehicles belonging to truckers you referred — the ones your commission is earned on.
            </p>
            <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
              {trucksLoading ? (
                <div className="flex justify-center py-12"><Loader className="h-6 w-6 animate-spin text-primary" /></div>
              ) : trucks.length === 0 ? (
                <div className="px-4 py-12 text-center text-text-secondary">
                  No trucks yet. Once a trucker signs up with your referral code and adds their vehicle, it'll show up here.
                </div>
              ) : (
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="px-4 py-3 font-medium">Trucker</th>
                      <th className="px-4 py-3 font-medium">Vehicle</th>
                      <th className="px-4 py-3 font-medium">Plate No.</th>
                      <th className="px-4 py-3 font-medium">Trips</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trucks.map((t) => (
                      <tr key={t.truckerId} className="border-b border-border/60 last:border-0">
                        <td className="px-4 py-3">
                          <p className="font-medium text-text-primary">{t.truckerName}</p>
                          <p className="text-text-secondary text-xs">{t.phone}</p>
                        </td>
                        <td className="px-4 py-3">{t.vehicleType || '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs">{t.plateNumber || '—'}</td>
                        <td className="px-4 py-3">{t.completedTrips}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            t.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-text-secondary'
                          }`}>
                            {t.status === 'active' ? 'Active' : 'Inactive (6mo+)'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeView === "referrals" && (
          <div className="space-y-4">
            <h2 className="text-text-primary font-bold text-2xl">Refer & Earn</h2>
            <p className="text-text-secondary text-sm">
              Invite other shippers, truckers, fleet managers, or agents to Holage and earn a reward once they complete their first shipment.
            </p>
            <ReferralPanel />
            <BonusWallet variant="user" />
          </div>
        )}

        {activeView === "complaints" && (
          <div className="space-y-4">
            <h2 className="text-text-primary font-bold text-2xl flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-warning" />
              Complaints & Disputes
            </h2>
            <p className="text-text-secondary text-sm">Disputes assigned to you for onsite resolution.</p>
            <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
              {disputeLoading ? (
                <div className="flex justify-center py-12"><Loader className="h-6 w-6 animate-spin text-primary" /></div>
              ) : disputes.length === 0 ? (
                <div className="px-4 py-12 text-center text-text-secondary">No disputes assigned to you.</div>
              ) : (
                <div className="divide-y divide-border">
                  {disputes.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => openDisputeDetail(d)}
                      className="w-full text-left px-4 py-4 hover:bg-muted/30 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-text-primary font-medium truncate">{d.subject}</p>
                        <p className="text-text-secondary text-xs mt-1">
                          #{d.id} · {d.status} · Code: {d.disputeCode || "—"}
                        </p>
                        {d.requiresAgentOnsite && d.agentIncentiveAmount > 0 && (
                          <p className="text-success text-xs mt-1">
                            Onsite incentive: ₦{Number(d.agentIncentiveAmount).toLocaleString("en-NG")}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-text-secondary flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === "progress" && (
          <div className="space-y-4">
            <h2 className="text-text-primary font-bold text-2xl flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Progress & Level
            </h2>

            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-text-secondary text-sm">Current Level</p>
                  <p className="text-text-primary font-bold text-2xl">{progress?.currentLevel?.title || "Starter"}</p>
                  <p className="text-text-secondary text-xs">Level {progress?.currentLevel?.level || 1}</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold text-xl">L{progress?.currentLevel?.level || 1}</span>
                </div>
              </div>
              {progress?.nextRequirements ? (
                <>
                  <div className="w-full bg-muted rounded-full h-3 mb-2">
                    <div
                      className="bg-primary h-3 rounded-full transition-all"
                      style={{ width: `${progress.progressPercent || 0}%` }}
                    />
                  </div>
                  <p className="text-text-secondary text-sm">
                    {progress.progressPercent}% to {progress.nextRequirements.nextLevel}
                  </p>
                  <p className="text-text-secondary text-xs mt-2">
                    Need {progress.nextRequirements.referralsNeeded} more referral(s) and {progress.nextRequirements.tripsNeeded} more completed trip(s).
                  </p>
                </>
              ) : (
                <p className="text-success text-sm font-medium">Maximum level reached!</p>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-text-primary font-bold mb-4">Level Tiers</h3>
              <div className="space-y-3">
                {(progress?.levels || []).map((lvl) => {
                  const isCurrent = lvl.level === progress?.currentLevel?.level
                  const isDone = lvl.level < (progress?.currentLevel?.level || 1)
                  return (
                    <div
                      key={lvl.level}
                      className={`flex items-center justify-between p-3 rounded-xl border ${
                        isCurrent ? "border-primary bg-primary/5" : isDone ? "border-success/30 bg-success/5" : "border-border"
                      }`}
                    >
                      <div>
                        <p className="text-text-primary font-medium">L{lvl.level} — {lvl.title}</p>
                        <p className="text-text-secondary text-xs">{lvl.minReferrals}+ referrals · {lvl.minTrips}+ trips</p>
                      </div>
                      {isDone && <CheckCircle className="w-5 h-5 text-success" />}
                      {isCurrent && <span className="text-primary text-xs font-bold">CURRENT</span>}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-text-primary font-bold mb-4">Progress Flow</h3>
              <div className="space-y-0">
                {(data?.progressFlow || []).map((step, idx, arr) => (
                  <div key={step.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed ? "bg-success text-white" : "bg-muted text-text-secondary"
                      }`}>
                        {step.completed ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      {idx < arr.length - 1 && (
                        <div className={`w-0.5 flex-1 min-h-[24px] ${step.completed ? "bg-success" : "bg-border"}`} />
                      )}
                    </div>
                    <div className="pb-5">
                      <p className={`font-medium ${step.completed ? "text-text-primary" : "text-text-secondary"}`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === "verification" && (
          <div className="space-y-4">
            <h2 className="text-text-primary font-bold text-2xl flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              Verification / ID
            </h2>

            <div className={`bg-card border-2 rounded-xl p-4 ${
              documents?.profilePhoto ? "border-success/30" : "border-border"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {documents?.profilePhoto ? (
                    <img
                      src={documents.profilePhoto}
                      alt="Profile"
                      className="w-12 h-12 rounded-lg object-cover"
                      onClick={() => window.open(documents.profilePhoto, "_blank")}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                      <Camera className="w-6 h-6 text-warning" />
                    </div>
                  )}
                  <div>
                    <p className="text-text-primary font-bold">Profile Photo</p>
                    <p className="text-text-secondary text-sm">
                      {documents?.profilePhoto ? "Uploaded ✓" : "Not uploaded"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={triggerProfilePhotoUpload}
                  disabled={uploadingDoc === "profilePhoto"}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
                    documents?.profilePhoto
                      ? "bg-secondary/10 text-secondary hover:bg-secondary/20"
                      : "bg-primary text-white hover:bg-primary/90"
                  } disabled:opacity-50`}
                >
                  {uploadingDoc === "profilePhoto" ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span className="text-sm">...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">{documents?.profilePhoto ? "Update" : "Upload"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-text-secondary">Verification Status</p>
                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${kycBadge.className}`}>
                  {kycBadge.label}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-text-secondary flex items-center gap-2"><Mail className="w-4 h-4" /> Email</span>
                  <span className="text-text-primary">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-text-secondary flex items-center gap-2"><Phone className="w-4 h-4" /> Phone</span>
                  <span className="text-text-primary">{documents?.phone || verification?.phone || "Not provided"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-text-secondary flex items-center gap-2"><FileText className="w-4 h-4" /> NIN</span>
                  <span className="text-text-primary">
                    {documents?.nin ? `${documents.nin.slice(0, 4)}****` : "Not provided"}
                    {documents?.ninVerified && <CheckCircle className="w-4 h-4 text-success inline ml-1" />}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-text-secondary flex items-center gap-2"><FileText className="w-4 h-4" /> BVN</span>
                  <span className="text-text-primary">
                    {documents?.bvn ? "Provided" : "Not provided"}
                    {documents?.bvnVerified && <CheckCircle className="w-4 h-4 text-success inline ml-1" />}
                  </span>
                </div>
              </div>

              {(documents?.profilePhoto || documents?.passportPhoto || verification?.passportPhoto) && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-text-secondary text-sm mb-2">ID Photo</p>
                  <img
                    src={documents?.passportPhoto || documents?.profilePhoto || verification?.passportPhoto}
                    alt="ID"
                    className="w-24 h-24 rounded-xl object-cover border border-border"
                  />
                </div>
              )}

              {kycStatus === "approved" ? (
                <div className="w-full mt-6 bg-success/10 border border-success/20 rounded-xl text-success font-medium text-sm text-center py-3 flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> KYC Approved
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => navigateTo("kyc")}
                  className="w-full mt-6 bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90"
                >
                  {kycStatus === "rejected" ? "Fix & Resubmit Verification" : documents?.nin ? "Update Verification" : "Complete ID Verification"}
                </button>
              )}
            </div>

            <div className="bg-muted/30 rounded-2xl p-4 border border-border">
              <p className="text-text-secondary text-sm">
                Verified agents can receive wallet payouts and dispute incentives. Submit your NIN, BVN, and ID photo to complete verification.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
        <div className="max-w-6xl mx-auto grid grid-cols-7 gap-1 px-1 py-2">
          {[
            { id: "home", label: "Home", icon: Home },
            { id: "wallet", label: "Wallet", icon: Wallet },
            { id: "trucks", label: "Trucks", icon: Truck },
            { id: "referrals", label: "Refer", icon: Gift },
            { id: "complaints", label: "Complaints", icon: AlertTriangle },
            { id: "progress", label: "Progress", icon: TrendingUp },
            { id: "verification", label: "Verify", icon: ShieldCheck },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveView(id)}
              className={`flex flex-col items-center py-2 rounded-xl ${activeView === id ? "bg-primary/10" : ""}`}
            >
              <Icon className={`w-6 h-6 ${activeView === id ? "text-primary" : "text-text-secondary"}`} />
              <span className={`text-[10px] font-medium mt-0.5 ${activeView === id ? "text-primary" : "text-text-secondary"}`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Dispute detail modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-text-primary font-bold">Dispute #{selectedDispute.id}</h3>
              <button type="button" onClick={() => { setSelectedDispute(null); setDisputeDetail(null) }} className="p-2 hover:bg-muted rounded-full">
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {disputeDetailLoading ? (
                <div className="flex justify-center py-12"><Loader className="h-6 w-6 animate-spin text-primary" /></div>
              ) : disputeDetail ? (
                <>
                  <div>
                    <p className="text-text-primary font-semibold">{disputeDetail.subject}</p>
                    <p className="text-text-secondary text-sm mt-1">{disputeDetail.description}</p>
                    <p className="text-text-secondary text-xs mt-2 capitalize">Status: {disputeDetail.status}</p>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <p className="text-text-secondary text-xs font-medium uppercase">Messages</p>
                    {(disputeDetail.messages || []).length === 0 ? (
                      <p className="text-text-secondary text-sm">No messages yet.</p>
                    ) : (
                      (disputeDetail.messages || []).map((m) => (
                        <div key={m.id} className="bg-muted/30 rounded-lg p-3 text-sm">
                          <p className="text-text-primary">{m.message}</p>
                          <p className="text-text-secondary text-xs mt-1">{new Date(m.createdAt).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {disputeDetail.status !== "resolved" && disputeDetail.status !== "closed" && (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Reply to dispute..."
                          className="flex-1 px-3 py-2 bg-muted/30 border border-border rounded-xl text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleSendMessage}
                          disabled={sendingMessage || !newMessage.trim()}
                          className="px-4 py-2 bg-primary text-white rounded-xl text-sm disabled:opacity-50"
                        >
                          {sendingMessage ? <Loader className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="border-t border-border pt-4">
                        <p className="text-text-secondary text-sm mb-2">Resolve with dispute code</p>
                        <input
                          type="text"
                          value={resolveCode}
                          onChange={(e) => setResolveCode(e.target.value)}
                          placeholder="Enter dispute code"
                          className="w-full px-3 py-2 bg-muted/30 border border-border rounded-xl text-sm mb-3"
                        />
                        <button
                          type="button"
                          onClick={handleResolveDispute}
                          disabled={resolving || !resolveCode.trim()}
                          className="w-full bg-success text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {resolving ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          Mark Resolved
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AgentDashboard
