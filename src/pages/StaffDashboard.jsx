"use client"

import { useEffect, useState } from "react"
import { LogOut, Loader, MessageSquare, Headphones, ChevronDown } from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useToast } from "../context/ToastContext"
import ConfirmModal from "../components/ConfirmModal"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api"

const StaffDashboard = () => {
  const { user, logoutUser } = useAppContext()
  const toast = useToast()
  const [complaints, setComplaints] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, resolved: 0 })
  const [loading, setLoading] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  const token = () => localStorage.getItem("authToken")

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/complaints/stats`, {
        headers: { Authorization: `Bearer ${token()}` },
      })
      const data = await res.json()
      if (res.ok && data.success && data.stats) {
        setStats({
          total: data.stats.total || 0,
          pending: data.stats.pending || 0,
          in_progress: data.stats.in_progress || 0,
          resolved: data.stats.resolved || 0,
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchList = async () => {
    setLoading(true)
    try {
      const q = selectedStatus !== "all" ? `?status=${selectedStatus}` : ""
      const res = await fetch(`${API_BASE_URL}/complaints${q}`, {
        headers: { Authorization: `Bearer ${token()}` },
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setComplaints(data.complaints || [])
        fetchStats()
      } else {
        toast.error(data.message || "Could not load disputes")
      }
    } catch (e) {
      toast.error("Could not load disputes")
    } finally {
      setLoading(false)
    }
  }

  const fetchDetail = async (complaintId) => {
    setDetailLoading(true)
    setSelected(null)
    setMessages([])
    try {
      const res = await fetch(`${API_BASE_URL}/complaints/${complaintId}`, {
        headers: { Authorization: `Bearer ${token()}` },
      })
      const data = await res.json()
      if (res.ok && data.success && data.complaint) {
        setSelected(data.complaint)
        setMessages(data.complaint.messages || [])
      } else {
        toast.error(data.message || "Could not load dispute")
      }
    } catch (e) {
      toast.error("Could not load dispute")
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus])

  const sendReply = async () => {
    if (!selected?.id || !reply.trim()) {
      toast.warning("Enter a message")
      return
    }
    setSending(true)
    try {
      const res = await fetch(`${API_BASE_URL}/complaints/${selected.id}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: reply.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Reply sent")
        setReply("")
        fetchDetail(selected.id)
        fetchList()
      } else {
        toast.error(data.message || "Failed to send")
      }
    } catch (e) {
      toast.error("Failed to send reply")
    } finally {
      setSending(false)
    }
  }

  const updateStatus = async (newStatus) => {
    if (!selected?.id) return
    try {
      const res = await fetch(`${API_BASE_URL}/complaints/${selected.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success("Status updated")
        fetchDetail(selected.id)
        fetchList()
      } else {
        toast.error(data.message || "Update failed")
      }
    } catch (e) {
      toast.error("Update failed")
    }
  }

  const firstName = user?.fullName?.split(" ")[0]?.replace(/^00\s*/, "").trim() || "Staff"

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-primary via-primary to-secondary p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 flex-shrink-0">
              <Headphones className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white/80">Staff</p>
              <p className="text-base sm:text-lg font-bold text-white truncate">{firstName}</p>
              <p className="text-xs text-white/70">Disputes & support</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-error/20 transition-colors hover:bg-error/30 flex-shrink-0"
            title="Log out"
          >
            <LogOut className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total", value: stats.total },
            { label: "Pending", value: stats.pending },
            { label: "In progress", value: stats.in_progress },
            { label: "Resolved", value: stats.resolved },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{s.label}</p>
              <p className="text-2xl font-bold text-text-primary">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {["all", "pending", "in_progress", "resolved", "closed"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedStatus(s)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedStatus === s
                  ? "bg-primary text-white"
                  : "bg-card border border-border text-text-secondary hover:bg-muted/40"
              }`}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border bg-muted/30 px-4 py-3">
              <h2 className="font-bold text-text-primary">Disputes</h2>
            </div>
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : complaints.length === 0 ? (
              <p className="p-8 text-center text-text-secondary">No disputes match this filter.</p>
            ) : (
              <ul className="max-h-[480px] overflow-y-auto divide-y divide-border">
                {complaints.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => fetchDetail(c.id)}
                      className={`w-full text-left px-4 py-3 transition-colors hover:bg-muted/30 ${
                        selected?.id === c.id ? "bg-primary/10" : ""
                      }`}
                    >
                      <p className="font-medium text-text-primary line-clamp-1">{c.subject}</p>
                      <p className="text-xs text-text-secondary">
                        #{c.id} · {c.status}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col min-h-[520px]">
            <div className="border-b border-border bg-muted/30 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-text-primary">Detail</h2>
              {selected && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary">Status</span>
                  <div className="relative">
                    <select
                      value={selected.status}
                      onChange={(e) => updateStatus(e.target.value)}
                      className="appearance-none rounded-xl border border-border bg-white py-2 pl-3 pr-8 text-sm text-text-primary"
                    >
                      <option value="pending">pending</option>
                      <option value="in_progress">in_progress</option>
                      <option value="resolved">resolved</option>
                      <option value="closed">closed</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                  </div>
                </div>
              )}
            </div>

            {detailLoading && (
              <div className="flex flex-1 items-center justify-center py-16">
                <Loader className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {!detailLoading && !selected && (
              <div className="flex flex-1 items-center justify-center p-8 text-text-secondary text-sm">
                Select a dispute to view messages and reply.
              </div>
            )}

            {!detailLoading && selected && (
              <>
                <div className="p-4 border-b border-border space-y-2 text-sm">
                  <p className="text-text-primary font-medium break-words">{selected.subject}</p>
                  <p className="text-text-secondary break-words">{selected.message}</p>
                  {selected.disputeCode && (
                    <p className="text-xs font-mono text-primary break-all">Code: {selected.disputeCode}</p>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto max-h-64 p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Thread</p>
                  {(messages || []).length === 0 ? (
                    <p className="text-sm text-text-secondary">No messages yet.</p>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`rounded-xl p-3 text-sm ${
                          m.senderRole === "staff" || m.senderRole === "admin"
                            ? "bg-primary/10 ml-4"
                            : "bg-muted/50 mr-4"
                        }`}
                      >
                        <p className="text-xs text-text-secondary mb-1">
                          {m.senderName} · {m.senderRole}
                        </p>
                        <p className="text-text-primary">{m.message}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-4 border-t border-border mt-auto">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-text-secondary">
                    <MessageSquare className="h-4 w-4" />
                    Reply as staff
                  </label>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-text-primary"
                    placeholder="Type your message…"
                  />
                  <button
                    type="button"
                    onClick={sendReply}
                    disabled={sending}
                    className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {sending ? "Sending…" : "Send reply"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showLogoutConfirm}
        title="Log out?"
        message="Are you sure you want to log out?"
        confirmLabel="Log out"
        destructive
        onConfirm={logoutUser}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  )
}

export default StaffDashboard
