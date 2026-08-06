"use client"

import { useState, useEffect } from "react"
import { Truck, User, Mail, Lock, Eye, EyeOff, Package, Users, UserPlus, ArrowRight, ShieldCheck, CheckCircle2, Sparkles, Phone, CreditCard, UserCheck } from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useToast } from "../context/ToastContext"
import Header from "../components/Header"
import Reveal from "../components/Reveal"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const SignupPage = () => {
  const { navigateTo, userRole, setUserRole, formData, handleInputChange, registerUser, loading } = useAppContext()
  const toast = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [step, setStep] = useState(1) // 1: Role selection, 2: Basic info, 3: Additional info (for fleet managers)

  // Drivers live in a separate `drivers` table (phone + password login, no email), so they
  // can't reuse the shared `formData` (fullName/email) the other roles submit through.
  const [driverForm, setDriverForm] = useState({
    driverName: "",
    phoneNumber: "",
    driverLicense: "",
    password: "",
    confirmPassword: "",
    nin: "",
    bvn: "",
  })
  const [submittingDriver, setSubmittingDriver] = useState(false)

  useEffect(() => {
    const preset = sessionStorage.getItem("holage_signup_role")
    if (!preset) return
    sessionStorage.removeItem("holage_signup_role")
    const allowed = ["shipper", "trucker", "fleet_manager", "agent", "driver"]
    if (!allowed.includes(preset)) return
    setUserRole(preset)
    setStep(2)
  }, [setUserRole])

  const roleOptions = [
    {
      value: "shipper",
      label: "I'm a Shipper",
      description: "Book reliable trucks instantly and monitor every mile in real time.",
      icon: Package,
      color: "from-blue-500 to-blue-600",
    },
    {
      value: "trucker",
      label: "I'm a Driver",
      description: "Access high-value loads, instant payouts, and dedicated support.",
      icon: Truck,
      color: "from-green-500 to-green-600",
    },
    {
      value: "fleet_manager",
      label: "I'm a Fleet Manager",
      description: "Manage multiple trucks and grow your fleet business.",
      icon: Users,
      color: "from-purple-500 to-purple-600",
    },
    {
      value: "agent",
      label: "I'm an Agent",
      description: "Onboard drivers with your referral code and earn from eligible trips.",
      icon: UserPlus,
      color: "from-amber-500 to-orange-600",
    },
    {
      value: "driver",
      label: "I'm a Fleet Driver",
      description: "Sign up with your phone number, then share your driver code with a fleet manager to get enrolled.",
      icon: UserCheck,
      color: "from-teal-500 to-cyan-600",
    },
  ]

  const highlightPoints = [
    {
      icon: ShieldCheck,
      title: "Bank-Grade Security",
      description: "Every profile is verified through layered KYC and encrypted infrastructure.",
    },
    {
      icon: CheckCircle2,
      title: "Trusted Network",
      description: "Thousands of successful loads with vetted truckers across the continent.",
    },
    {
      icon: Sparkles,
      title: "Guided Onboarding",
      description: "Concierge-style support walks you through KYC, payouts, and first bookings.",
    },
  ]

  const handleRoleSelect = (role) => {
    setUserRole(role)
    setStep(2)
  }

  const handleNext = () => {
    if (step === 2) {
      if (userRole === "driver") {
        if (!driverForm.driverName || !driverForm.phoneNumber || !driverForm.driverLicense || !driverForm.password || !driverForm.confirmPassword) {
          toast.warning("Please fill in all fields")
          return
        }
        if (driverForm.phoneNumber.length !== 11) {
          toast.error("Phone number must be 11 digits")
          return
        }
        if (driverForm.password !== driverForm.confirmPassword) {
          toast.error("Passwords do not match")
          return
        }
        if (driverForm.password.length < 6) {
          toast.warning("Password must be at least 6 characters")
          return
        }
        if (driverForm.nin && driverForm.nin.length !== 11) {
          toast.error("NIN must be 11 digits")
          return
        }
        if (driverForm.bvn && driverForm.bvn.length !== 11) {
          toast.error("BVN must be 11 digits")
          return
        }
        handleDriverSubmit()
        return
      }

      // Validate basic info
      if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
        toast.warning("Please fill in all fields")
        return
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match")
        return
      }
      if (formData.password.length < 6) {
        toast.warning("Password must be at least 6 characters")
        return
      }

      // For all roles including fleet managers, submit directly (NIN is collected during KYC)
      handleSubmit()
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    if (userRole === "driver") {
      handleDriverSubmit()
      return
    }

    try {
      // For fleet managers, NIN and BVN are not collected during signup (collected during KYC)
      // For all roles, submit without NIN/BVN during signup
      await registerUser(
        formData.fullName,
        formData.email,
        formData.password,
        userRole,
        null,
        null,
        userRole === "trucker" ? formData.agentReferralCode : null,
        formData.inviteCode,
      )

      navigateTo("email-verification")
    } catch (error) {
      console.error("Signup failed:", error)
    }
  }

  // Drivers self-register directly against the drivers table (phone/password, no email
  // verification) and are logged in immediately — no fleet manager involved yet. They get a
  // driverCode to hand to a fleet manager later via the "Enroll Driver" flow.
  const handleDriverSubmit = async () => {
    setSubmittingDriver(true)
    try {
      const response = await fetch(`${API_BASE_URL}/drivers/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverName: driverForm.driverName,
          phoneNumber: driverForm.phoneNumber,
          driverLicense: driverForm.driverLicense,
          password: driverForm.password,
          nin: driverForm.nin || undefined,
          bvn: driverForm.bvn || undefined,
        }),
      })
      const data = await response.json()

      if (response.ok && data.success) {
        localStorage.setItem("authToken", data.token)
        localStorage.setItem("driverInfo", JSON.stringify(data.driver))
        localStorage.setItem("userRole", "driver")
        toast.success(`Account created! Your driver code is ${data.driver.driverCode} — share it with a fleet manager to get enrolled.`, 8000)
        navigateTo("driver-dashboard")
      } else {
        toast.error(data.message || "Signup failed")
      }
    } catch (error) {
      console.error("Driver signup failed:", error)
      toast.error(error.message || "Signup failed")
    } finally {
      setSubmittingDriver(false)
    }
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
    }
  }

  const gradientBackdrop =
    "pointer-events-none absolute inset-0 before:absolute before:-top-40 before:left-1/4 before:h-72 before:w-72 before:rounded-full before:bg-secondary/30 before:blur-[120px] after:absolute after:bottom-0 after:right-1/4 after:h-80 after:w-80 after:rounded-full after:bg-primary/35 after:blur-[140px]"

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#070b1d] via-[#10173b] to-[#17224f]">
      <div className={gradientBackdrop} />

      <Header transparent={true} />

      <div className="relative z-10 container mx-auto px-4 pb-16 pt-36 sm:pt-44 md:pt-48 lg:pt-52 xl:pt-56 lg:px-6">
        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="flex flex-col-reverse items-stretch gap-12 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 mt-6 sm:mt-8">
            <div className="space-y-6 sm:space-y-10 text-white">
              <Reveal className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/70 backdrop-blur sm:px-5 sm:text-xs">
                Holage onboarding
              </Reveal>

              <Reveal delay={80} className="space-y-4 sm:space-y-6">
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight md:text-4xl xl:text-5xl lg:text-6xl">
                  Launch your logistics command center in minutes.
                </h1>
                <p className="max-w-2xl text-sm text-white/80 sm:text-base lg:text-lg">
                  Join Africa's most advanced freight ecosystem. Seamlessly onboard, verify, and start shipping or driving
                  with confidence—backed by a network engineered for reliability and scale.
                </p>
              </Reveal>

              <div className="grid gap-4 sm:grid-cols-2">
                {highlightPoints.map((point, index) => {
                  const Icon = point.icon
                  return (
                    <Reveal
                      key={point.title}
                      delay={index * 140}
                      className="group rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-secondary/40 hover:bg-white/10"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/70 to-accent/70 text-white shadow-lg flex-shrink-0">
                          <Icon className="h-5 w-5" />
                        </span>
                        <h3 className="text-base sm:text-lg font-semibold text-white">{point.title}</h3>
                      </div>
                      <p className="text-xs sm:text-sm leading-relaxed text-white/70">{point.description}</p>
                    </Reveal>
                  )
                })}
              </div>

              <Reveal delay={320} className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 sm:px-5 py-2 sm:py-3 backdrop-blur">
                  <span className="text-xl sm:text-2xl font-bold text-white">50K+</span>
                  <span className="text-xs uppercase tracking-[0.25em] text-white/60">loads moved</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 sm:px-5 py-2 sm:py-3 backdrop-blur">
                  <span className="text-xl sm:text-2xl font-bold text-white">24/7</span>
                  <span className="text-xs uppercase tracking-[0.25em] text-white/60">concierge support</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 sm:px-5 py-2 sm:py-3 backdrop-blur">
                  <span className="text-xl sm:text-2xl font-bold text-white">99.9%</span>
                  <span className="text-xs uppercase tracking-[0.25em] text-white/60">uptime guaranteed</span>
                </div>
              </Reveal>
            </div>

            <Reveal delay={120} className="relative">
              <div className="absolute inset-x-8 sm:inset-x-10 -top-10 h-24 rounded-full bg-secondary/25 blur-3xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/25 sm:border-white/30 bg-white/95 shadow-[0_32px_80px_rgba(12,17,36,0.35)] backdrop-blur-xl">
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at top, rgba(79,70,229,0.18), transparent 55%)" }} />
                
                <div className="relative z-10 p-6 sm:p-8 lg:p-10">
                  <div className="mb-6 sm:mb-8 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-secondary">Secure sign up</p>
                      <h2 className="mt-2 text-xl sm:text-2xl font-bold text-text-primary md:text-3xl">
                        Create your Holage account
                      </h2>
                      <p className="mt-2 text-xs sm:text-sm text-text-secondary">
                        Choose your role—including <span className="font-medium text-text-primary">Agent</span> to onboard
                        drivers with your referral code.
                      </p>
                    </div>
                    <div className="hidden sm:flex rounded-2xl bg-gradient-to-br from-primary to-secondary p-3 text-white shadow-lg ml-4">
                      <Truck className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {roleOptions.map((option) => {
                      const Icon = option.icon
                      const isActive = userRole === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleRoleSelect(option.value)}
                          className={`group w-full rounded-2xl border px-4 py-3 sm:py-4 text-left transition-all duration-200 ${
                            isActive
                              ? "border-transparent bg-gradient-to-br from-primary to-secondary text-white shadow-xl shadow-primary/25"
                              : "border-border bg-surface/80 hover:border-secondary/50 hover:bg-white"
                          }`}
                          disabled={loading}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 ${
                                isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm sm:text-base font-semibold ${isActive ? "text-white" : "text-text-primary"}`}>
                                {option.label}
                              </p>
                              <p
                                className={`mt-1 text-xs leading-relaxed ${
                                  isActive ? "text-white/80" : "text-text-secondary"
                                }`}
                              >
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-6 text-center text-xs sm:text-sm text-text-secondary">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigateTo("login")}
                      className="font-medium text-secondary transition-colors hover:text-accent"
                      disabled={loading}
                    >
                      Log in
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        )}

        {/* Step 2: Basic Information */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto mt-6 sm:mt-8">
            <Reveal className="relative">
              <div className="absolute inset-x-8 -top-10 h-24 rounded-full bg-secondary/25 blur-3xl sm:inset-x-10" />
              <div className="relative overflow-hidden rounded-3xl border border-white/25 bg-white/95 shadow-[0_32px_80px_rgba(12,17,36,0.35)] backdrop-blur-xl">
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at top, rgba(79,70,229,0.18), transparent 55%)" }} />

                <div className="relative z-10 p-6 sm:p-8 lg:p-10">
                  <div className="mb-6 sm:mb-8">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="text-text-secondary hover:text-text-primary transition-colors mb-4 flex items-center gap-2 text-sm sm:text-base"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                      Back
                    </button>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-secondary">Step 2 of 2</p>
                    <h2 className="mt-2 text-xl sm:text-2xl font-bold text-text-primary md:text-3xl">
                      {userRole === "fleet_manager"
                        ? "Fleet Manager Information"
                        : userRole === "agent"
                          ? "Agent registration"
                          : userRole === "driver"
                            ? "Driver registration"
                            : "Create Your Account"}
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-text-secondary">
                      {userRole === "fleet_manager"
                        ? "Enter your basic information"
                        : userRole === "agent"
                          ? "Use a real email—you will verify it to activate your account and see your referral code."
                          : userRole === "driver"
                            ? "You'll log in with your phone number, not email."
                            : "Fill in your details to create your account"}
                    </p>
                  </div>

                  {userRole === "agent" && (
                    <div className="mb-6 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
                      <p className="font-semibold text-amber-900">How agent signup works</p>
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-amber-900/90">
                        <li>No NIN or BVN is required at signup.</li>
                        <li>After you verify your email, you get your personal referral code and agent ID on your dashboard.</li>
                        <li>Use that code when onboarding eligible drivers.</li>
                      </ul>
                    </div>
                  )}

                  {userRole === "driver" && (
                    <div className="mb-6 rounded-2xl border border-teal-200/80 bg-teal-50/90 px-4 py-3 text-sm text-teal-950">
                      <p className="font-semibold text-teal-900">How driver signup works</p>
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-teal-900/90">
                        <li>You're creating your own account — no fleet manager needed to sign up.</li>
                        <li>You'll get a driver code (e.g. DRV-ABC123) right after signup.</li>
                        <li>Share that code with a fleet manager so they can enroll you, or start bidding independently.</li>
                      </ul>
                    </div>
                  )}

                  <form onSubmit={(e) => { e.preventDefault(); handleNext() }} className="space-y-5 sm:space-y-6">
                    {userRole === "driver" ? (
                      <>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-text-secondary">Full name</label>
                          <div className="relative">
                            <User className="absolute left-4 top-3.5 h-5 w-5 text-text-secondary/70" />
                            <input
                              type="text"
                              value={driverForm.driverName}
                              onChange={(e) => setDriverForm({ ...driverForm, driverName: e.target.value })}
                              className="w-full rounded-2xl border border-border bg-white/80 py-3 sm:py-3.5 pl-12 pr-4 text-text-primary text-sm sm:text-base shadow-sm transition-all duration-200 placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                              placeholder="Enter your full name"
                              required
                              disabled={submittingDriver}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-text-secondary">Phone number</label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-3.5 h-5 w-5 text-text-secondary/70" />
                            <input
                              type="tel"
                              value={driverForm.phoneNumber}
                              onChange={(e) => setDriverForm({ ...driverForm, phoneNumber: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                              className="w-full rounded-2xl border border-border bg-white/80 py-3 sm:py-3.5 pl-12 pr-4 text-text-primary text-sm sm:text-base shadow-sm transition-all duration-200 placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                              placeholder="08117458593"
                              maxLength="11"
                              required
                              disabled={submittingDriver}
                            />
                          </div>
                          <p className="text-xs text-text-secondary">11 digits — this is how you'll log in, not your email.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-text-secondary">Driver's license number</label>
                          <div className="relative">
                            <CreditCard className="absolute left-4 top-3.5 h-5 w-5 text-text-secondary/70" />
                            <input
                              type="text"
                              value={driverForm.driverLicense}
                              onChange={(e) => setDriverForm({ ...driverForm, driverLicense: e.target.value })}
                              className="w-full rounded-2xl border border-border bg-white/80 py-3 sm:py-3.5 pl-12 pr-4 text-text-primary text-sm sm:text-base shadow-sm transition-all duration-200 placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                              placeholder="Enter your driver's license number"
                              required
                              disabled={submittingDriver}
                            />
                          </div>
                        </div>

                        <div className="grid gap-5 sm:gap-6 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-secondary">Password</label>
                            <div className="relative">
                              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-text-secondary/70" />
                              <input
                                type={showPassword ? "text" : "password"}
                                value={driverForm.password}
                                onChange={(e) => setDriverForm({ ...driverForm, password: e.target.value })}
                                className="w-full rounded-2xl border border-border bg-white/80 py-3 sm:py-3.5 pl-12 pr-12 text-text-primary text-sm sm:text-base shadow-sm transition-all duration-200 placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                                placeholder="6+ characters"
                                required
                                disabled={submittingDriver}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-4 top-3.5 text-text-secondary/70 transition-colors hover:text-text-primary"
                                disabled={submittingDriver}
                              >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-secondary">Confirm password</label>
                            <div className="relative">
                              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-text-secondary/70" />
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={driverForm.confirmPassword}
                                onChange={(e) => setDriverForm({ ...driverForm, confirmPassword: e.target.value })}
                                className="w-full rounded-2xl border border-border bg-white/80 py-3 sm:py-3.5 pl-12 pr-12 text-text-primary text-sm sm:text-base shadow-sm transition-all duration-200 placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                                placeholder="Re-enter password"
                                required
                                disabled={submittingDriver}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                className="absolute right-4 top-3.5 text-text-secondary/70 transition-colors hover:text-text-primary"
                                disabled={submittingDriver}
                              >
                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-5 sm:gap-6 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-secondary">NIN (optional)</label>
                            <input
                              type="text"
                              value={driverForm.nin}
                              onChange={(e) => setDriverForm({ ...driverForm, nin: e.target.value.replace(/\D/g, "") })}
                              className="w-full rounded-2xl border border-border bg-white/80 py-3 sm:py-3.5 px-4 text-text-primary text-sm sm:text-base shadow-sm transition-all duration-200 placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                              placeholder="11-digit NIN"
                              maxLength="11"
                              disabled={submittingDriver}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-secondary">BVN (optional)</label>
                            <input
                              type="text"
                              value={driverForm.bvn}
                              onChange={(e) => setDriverForm({ ...driverForm, bvn: e.target.value.replace(/\D/g, "") })}
                              className="w-full rounded-2xl border border-border bg-white/80 py-3 sm:py-3.5 px-4 text-text-primary text-sm sm:text-base shadow-sm transition-all duration-200 placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                              placeholder="11-digit BVN"
                              maxLength="11"
                              disabled={submittingDriver}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-text-secondary">
                            {userRole === "fleet_manager" ? "Company name" : "Full name"}
                          </label>
                          <div className="relative">
                            <User className="absolute left-4 top-3.5 h-5 w-5 text-text-secondary/70" />
                            <input
                              type="text"
                              value={formData.fullName}
                              onChange={(e) => handleInputChange("fullName", e.target.value)}
                              className="w-full rounded-2xl border border-border bg-white/80 py-3 sm:py-3.5 pl-12 pr-4 text-text-primary text-sm sm:text-base shadow-sm transition-all duration-200 placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                              placeholder={userRole === "fleet_manager" ? "Enter your company name (must match your CAC certificate)" : "Enter your full name"}
                              required
                              disabled={loading}
                            />
                          </div>
                          {userRole === "fleet_manager" && (
                            <p className="text-xs text-text-secondary">This should match the name on your CAC registration certificate — it's shown on your dashboard and to shippers.</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-text-secondary">Email address</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-3.5 h-5 w-5 text-text-secondary/70" />
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleInputChange("email", e.target.value)}
                              className="w-full rounded-2xl border border-border bg-white/80 py-3 sm:py-3.5 pl-12 pr-4 text-text-primary text-sm sm:text-base shadow-sm transition-all duration-200 placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                              placeholder="Enter your email"
                              required
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <div className="grid gap-5 sm:gap-6 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-secondary">Password</label>
                            <div className="relative">
                              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-text-secondary/70" />
                              <input
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={(e) => handleInputChange("password", e.target.value)}
                                className="w-full rounded-2xl border border-border bg-white/80 py-3 sm:py-3.5 pl-12 pr-12 text-text-primary text-sm sm:text-base shadow-sm transition-all duration-200 placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                                placeholder="6+ characters"
                                required
                                disabled={loading}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-4 top-3.5 text-text-secondary/70 transition-colors hover:text-text-primary"
                                disabled={loading}
                              >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-secondary">Confirm password</label>
                            <div className="relative">
                              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-text-secondary/70" />
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                                className="w-full rounded-2xl border border-border bg-white/80 py-3 sm:py-3.5 pl-12 pr-12 text-text-primary text-sm sm:text-base shadow-sm transition-all duration-200 placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                                placeholder="Re-enter password"
                                required
                                disabled={loading}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                className="absolute right-4 top-3.5 text-text-secondary/70 transition-colors hover:text-text-primary"
                                disabled={loading}
                              >
                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {userRole === "trucker" && (
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-secondary">
                              Agent referral code (optional)
                            </label>
                            <input
                              type="text"
                              value={formData.agentReferralCode || ""}
                              onChange={(e) => handleInputChange("agentReferralCode", e.target.value)}
                              className="w-full rounded-2xl border border-border bg-white/80 py-3 sm:py-3.5 px-4 text-text-primary text-sm sm:text-base shadow-sm transition-all duration-200 placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                              placeholder="e.g. HOLAGE-ABC23"
                              disabled={loading}
                            />
                            <p className="text-xs text-text-secondary">
                              If an agent referred you, enter their Holage code (starts with HOLAGE-).
                            </p>
                          </div>
                        )}

                        {["shipper", "trucker", "fleet_manager", "agent"].includes(userRole) && (
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-secondary">
                              Invite code (optional)
                            </label>
                            <input
                              type="text"
                              value={formData.inviteCode || ""}
                              onChange={(e) => handleInputChange("inviteCode", e.target.value)}
                              className="w-full rounded-2xl border border-border bg-white/80 py-3 sm:py-3.5 px-4 text-text-primary text-sm sm:text-base shadow-sm transition-all duration-200 placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                              placeholder="e.g. AB12CD"
                              disabled={loading}
                            />
                            <p className="text-xs text-text-secondary">
                              Were you invited by another Holage user? Enter their invite code — you'll be able to invite others too.
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    <button
                      type="submit"
                      disabled={userRole === "driver" ? submittingDriver : loading}
                      className="group flex h-12 sm:h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary text-sm sm:text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:shadow-secondary/30 focus:outline-none focus:ring-2 focus:ring-secondary/40 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {(userRole === "driver" ? submittingDriver : loading) ? (
                        <>
                          <svg
                            className="h-5 w-5 animate-spin text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span className="text-sm sm:text-base">Creating account...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm sm:text-base">
                            {userRole === "fleet_manager"
                              ? "Next"
                              : userRole === "agent"
                                ? "Create agent account"
                                : userRole === "driver"
                                  ? "Create driver account"
                                  : "Create account"}
                          </span>
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>

                    <p className="text-center text-xs text-text-secondary">
                      By continuing, you agree to our{" "}
                      <span className="font-medium text-secondary hover:text-accent transition-colors">Terms</span> and{" "}
                      <span className="font-medium text-secondary hover:text-accent transition-colors">Privacy Policy</span>.
                    </p>
                  </form>
                </div>
              </div>
            </Reveal>
          </div>
        )}

      </div>
    </div>
  )
}

export default SignupPage
