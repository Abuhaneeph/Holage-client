"use client"

import { useState } from "react"
import { Truck, User, Mail, Lock, Eye, EyeOff, Package, CheckCircle2, ShieldCheck, Sparkles, ArrowRight } from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useToast } from "../context/ToastContext"
import Header from "../components/Header"
import Reveal from "../components/Reveal"

const SignupPage = () => {
  const { navigateTo, userRole, setUserRole, formData, handleInputChange, registerUser, loading } = useAppContext()
  const toast = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

  const roleOptions = [
    {
      value: "shipper",
      label: "I'm a Shipper",
      blurb: "Book reliable trucks instantly and monitor every mile in real time.",
      icon: Package,
    },
    {
      value: "trucker",
      label: "I'm a Driver",
      blurb: "Access high-value loads, instant payouts, and dedicated support.",
      icon: Truck,
    },
  ]

  const handleSignup = async (e) => {
    e.preventDefault()
    
    // Validation checks
    if (!userRole) {
      toast.warning("Please select a role (Shipper or Driver).")
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
    if (!formData.fullName || !formData.email || !formData.password) {
      toast.warning("Please fill in all required fields")
      return
    }

    try {
      // Call the API endpoint
      await registerUser(formData.fullName, formData.email, formData.password, userRole)
      
      // If successful, navigate to email verification
      navigateTo("email-verification")
    } catch (error) {
      // Error is already handled in the AppContext (alert shown)
      console.error("Signup failed:", error)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#070b1d] via-[#0c1230] to-[#131f45]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-24 h-80 w-80 rounded-full bg-secondary/30 blur-3xl animate-float" />
        <div className="absolute top-1/3 -left-32 h-96 w-96 rounded-full bg-primary/35 blur-[140px] animate-pulse-soft" />
        <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-accent/25 blur-[120px] animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <Header transparent={true} />

      <div className="relative z-10 container mx-auto px-4 pb-16 pt-28 sm:pt-32 lg:pt-36 lg:px-6">
        <div className="flex flex-col-reverse items-stretch gap-12 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="space-y-10 text-white">
            <Reveal className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/70 backdrop-blur sm:px-5 sm:text-xs">
              Holage onboarding
            </Reveal>

            <Reveal delay={80} className="space-y-6">
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl xl:text-6xl">
                Launch your logistics command center in minutes.
              </h1>
              <p className="max-w-2xl text-sm text-white/80 sm:text-base lg:text-lg">
                Join Africa’s most advanced freight ecosystem. Seamlessly onboard, verify, and start shipping or driving
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
                    className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-secondary/40 hover:bg-white/10"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/70 to-accent/70 text-white shadow-lg">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="text-lg font-semibold text-white">{point.title}</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-white/70">{point.description}</p>
                  </Reveal>
                )
              })}
            </div>

            <Reveal delay={320} className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
                <span className="text-2xl font-bold text-white">50K+</span>
                <span className="text-xs uppercase tracking-[0.25em] text-white/60">loads moved</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
                <span className="text-2xl font-bold text-white">24/7</span>
                <span className="text-xs uppercase tracking-[0.25em] text-white/60">concierge support</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
                <span className="text-2xl font-bold text-white">99.9%</span>
                <span className="text-xs uppercase tracking-[0.25em] text-white/60">uptime guaranteed</span>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120} className="relative">
            <div className="absolute inset-x-10 -top-10 h-24 rounded-full bg-secondary/25 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/95 shadow-[0_35px_90px_rgba(12,17,36,0.35)] backdrop-blur-xl">
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at top, rgba(79,70,229,0.18), transparent 55%)" }} />
              <div className="relative z-10 p-8 sm:p-10">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-secondary">Secure sign up</p>
                    <h2 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">
                      Create your Holage account
                    </h2>
                    <p className="mt-2 text-sm text-text-secondary">
                      Choose your role to personalise the onboarding journey.
                    </p>
                  </div>
                  <div className="hidden rounded-2xl bg-gradient-to-br from-primary to-secondary p-3 text-white shadow-lg sm:flex">
                    <Truck className="h-6 w-6" />
                  </div>
            </div>

                <div className="mb-6 space-y-3">
                  <label className="block text-sm font-medium text-text-secondary">Select your role</label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {roleOptions.map((option) => {
                      const Icon = option.icon
                      const isActive = userRole === option.value
                      return (
                <button
                          key={option.value}
                  type="button"
                          onClick={() => setUserRole(option.value)}
                          className={`group rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
                            isActive
                              ? "border-transparent bg-gradient-to-br from-primary to-secondary text-white shadow-xl shadow-primary/25"
                              : "border-border bg-surface/80 hover:border-secondary/50 hover:bg-white"
                          }`}
                          disabled={loading}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                            </span>
                            <div>
                              <p className={`font-semibold ${isActive ? "text-white" : "text-text-primary"}`}>
                                {option.label}
                              </p>
                              <p
                                className={`mt-1 text-xs leading-relaxed ${
                                  isActive ? "text-white/80" : "text-text-secondary"
                                }`}
                              >
                                {option.blurb}
                              </p>
                            </div>
                          </div>
                </button>
                      )
                    })}
              </div>
                  {!userRole && <p className="text-xs text-destructive">Please select a role to continue.</p>}
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-secondary">Full name</label>
                <div className="relative">
                      <User className="absolute left-4 top-3.5 h-5 w-5 text-text-secondary/70" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                        className="w-full rounded-2xl border border-border bg-white/80 py-3.5 pl-12 pr-4 text-text-primary shadow-sm transition-all duration-200 placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                    placeholder="Enter your full name"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-secondary">Email address</label>
                <div className="relative">
                      <Mail className="absolute left-4 top-3.5 h-5 w-5 text-text-secondary/70" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                        className="w-full rounded-2xl border border-border bg-white/80 py-3.5 pl-12 pr-4 text-text-primary shadow-sm transition-all duration-200 placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                    placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-text-secondary">Password</label>
              <div className="relative">
                        <Lock className="absolute left-4 top-3.5 h-5 w-5 text-text-secondary/70" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                          className="w-full rounded-2xl border border-border bg-white/80 py-3.5 pl-12 pr-12 text-text-primary shadow-sm transition-all duration-200 placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
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
                          className="w-full rounded-2xl border border-border bg-white/80 py-3.5 pl-12 pr-12 text-text-primary shadow-sm transition-all duration-200 placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
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

              <button
                type="submit"
                disabled={loading}
                    className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:shadow-secondary/30 focus:outline-none focus:ring-2 focus:ring-secondary/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
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
                        Creating account...
                  </>
                ) : (
                      <>
                        Create account
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                )}
              </button>

                  <p className="text-center text-xs text-text-secondary">
                    By continuing, you agree to our{" "}
                    <span className="font-medium text-secondary hover:text-accent transition-colors">Terms</span> and{" "}
                    <span className="font-medium text-secondary hover:text-accent transition-colors">Privacy Policy</span>.
                  </p>

              <div className="text-center">
                <p className="text-sm text-text-secondary">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigateTo("login")}
                        className="font-medium text-secondary transition-colors hover:text-accent"
                    disabled={loading}
                  >
                    Log in
                  </button>
                </p>
              </div>
            </form>
          </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  )
}

export default SignupPage