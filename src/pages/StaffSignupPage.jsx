"use client"

import { useState } from "react"
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, Headphones } from "lucide-react"
import { useAppContext } from "../context/AppContext"
import Header from "../components/Header"
import Reveal from "../components/Reveal"
import { useToast } from "../context/ToastContext"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api"

const StaffSignupPage = () => {
  const { navigateTo } = useAppContext()
  const toast = useToast()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !password) {
      toast.warning("Please fill in all fields.")
      return
    }
    if (password.length < 6) {
      toast.warning("Password must be at least 6 characters.")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/staff-requests/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.message || "Could not submit request.")
      }
      toast.success(data.message || "Request submitted. An admin will review your application.")
      navigateTo("login")
    } catch (err) {
      toast.error(err.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const gradientBackdrop =
    "pointer-events-none absolute inset-0 before:absolute before:-top-40 before:left-1/4 before:h-72 before:w-72 before:rounded-full before:bg-secondary/30 before:blur-[120px] after:absolute after:bottom-0 after:right-1/4 after:h-80 after:w-80 after:rounded-full after:bg-primary/35 after:blur-[140px]"

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#070b1d] via-[#10173b] to-[#17224f]">
      <div className={gradientBackdrop} />
      <Header transparent />

      <div className="relative z-10 container mx-auto px-4 pb-16 pt-28 sm:pt-36 lg:px-6">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-start">
          <div className="space-y-6 text-white">
            <Reveal className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
              <Headphones className="h-4 w-4" />
              Staff access
            </Reveal>
            <Reveal delay={80}>
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Request Holage staff access</h1>
              <p className="mt-4 max-w-lg text-sm text-white/80 sm:text-base">
                Customer-care and operations staff sign up here. Your request is reviewed by an administrator. You will
                only be able to log in after approval.
              </p>
            </Reveal>
            <Reveal delay={160} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                <div>
                  <p className="font-semibold">How it works</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-white/75">
                    <li>Submit your details below.</li>
                    <li>An admin approves or rejects your request.</li>
                    <li>After approval, use the same email and password on the Login page.</li>
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120}>
            <div className="overflow-hidden rounded-3xl border border-white/25 bg-white/95 shadow-[0_32px_80px_rgba(12,17,36,0.35)] backdrop-blur-xl">
              <div className="p-8 sm:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-secondary">Staff request</p>
                <h2 className="mt-2 text-2xl font-bold text-text-primary">Create your request</h2>
                <p className="mt-2 text-sm text-text-secondary">Use a work email you can access.</p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-secondary">Full name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 h-5 w-5 text-text-secondary/70" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full rounded-2xl border border-border bg-white/80 py-3.5 pl-12 pr-4 text-text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Ada Okonkwo"
                        autoComplete="name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-secondary">Work email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 h-5 w-5 text-text-secondary/70" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-2xl border border-border bg-white/80 py-3.5 pl-12 pr-4 text-text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="you@company.com"
                        autoComplete="email"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-secondary">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 h-5 w-5 text-text-secondary/70" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-2xl border border-border bg-white/80 py-3.5 pl-12 pr-12 text-text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-text-secondary/70 hover:text-text-primary"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-secondary">Confirm password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 h-5 w-5 text-text-secondary/70" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-2xl border border-border bg-white/80 py-3.5 pl-12 pr-4 text-text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Repeat password"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl disabled:opacity-60"
                  >
                    {loading ? "Submitting…" : "Submit request"}
                    {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-text-secondary">
                  Already approved?{" "}
                  <button type="button" onClick={() => navigateTo("login")} className="font-medium text-secondary hover:text-accent">
                    Log in
                  </button>
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  )
}

export default StaffSignupPage
