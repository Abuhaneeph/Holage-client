"use client"

import { useState, useEffect } from "react"
import { Truck, Mail, Lock, Eye, EyeOff, ShieldCheck, Sparkles, ArrowRight, Phone, User } from "lucide-react"
import { useAppContext } from "../context/AppContext"
import Header from "../components/Header"
import Reveal from "../components/Reveal"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const LoginPage = () => {
  const { 
    navigateTo, 
    formData, 
    handleInputChange, 
    loginUser, 
    loading,
    setUserRole,
    currentPage
  } = useAppContext()
  
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [loginType, setLoginType] = useState(() => {
    // Check if we're coming from driver-login route
    return currentPage === 'driver-login' ? 'driver' : 'regular'
  })
  const [driverFormData, setDriverFormData] = useState({
    phoneNumber: "",
    password: ""
  })
  
  // Update login type when route changes
  useEffect(() => {
    if (currentPage === 'driver-login') {
      setLoginType('driver')
    } else if (currentPage === 'login') {
      setLoginType('regular')
    }
  }, [currentPage])

  // Form validation
  const validateForm = () => {
    const newErrors = {}
    
    if (loginType === "regular") {
      if (!formData.email) {
        newErrors.email = "Email is required"
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Please enter a valid email"
      }
      
      if (!formData.password) {
        newErrors.password = "Password is required"
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters"
      }
    } else {
      // Driver validation
      if (!driverFormData.phoneNumber) {
        newErrors.phoneNumber = "Phone number is required"
      } else {
        // Normalize phone number for validation - remove spaces, dashes, plus signs
        const normalizedPhone = driverFormData.phoneNumber.replace(/\s/g, '').replace(/-/g, '').replace(/\+/g, '')
        // Accept Nigerian phone format: 11 digits starting with 0 (e.g., 08117458593)
        // Also accept 10 digits (without leading 0) or international format
        if (!/^0[0-9]{10}$/.test(normalizedPhone) && !/^[0-9]{10,15}$/.test(normalizedPhone)) {
          newErrors.phoneNumber = "Please enter a valid phone number (e.g., 08117458593)"
        }
      }
      
      if (!driverFormData.password) {
        newErrors.password = "Password is required"
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    
    // Clear previous errors
    setErrors({})
    
    // Validate form
    if (!validateForm()) {
      return
    }

    try {
      if (loginType === "driver") {
        // Driver login
        // Normalize phone number - remove spaces, dashes, plus signs
        let normalizedPhone = driverFormData.phoneNumber.replace(/\s/g, '').replace(/-/g, '').replace(/\+/g, '')
        
        // Keep phone number as-is (e.g., 08117458593) - backend will handle format variations
        
        const response = await fetch(`${API_BASE_URL}/drivers/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phoneNumber: normalizedPhone,
            password: driverFormData.password
          })
        })
        
        const data = await response.json()
        
        if (response.ok && data.success) {
          // Store driver token and info
          localStorage.setItem('authToken', data.token)
          localStorage.setItem('driverInfo', JSON.stringify(data.driver))
          localStorage.setItem('userRole', 'driver')
          
          // Navigate to driver dashboard
          navigateTo("driver-dashboard")
        } else {
          console.error("Driver login error:", data)
          setErrors({ 
            general: data.message || "Invalid phone number or password. Please check your credentials or contact your fleet manager." 
          })
        }
      } else {
        // Regular user login
        const response = await loginUser(formData.email, formData.password)
        
        console.log("Full response:", response)
        console.log("User role:", response.user?.role)
        console.log("KYC Status:", response.user?.kycStatus)
        
        // Set user role if available in response
        if (response.user && response.user.role) {
          setUserRole(response.user.role)
          console.log("Role set to:", response.user.role)
        }
        
        // Check if user needs to complete KYC (if kycStatus is null or they haven't filled basic info)
        if (!response.user?.kycStatus || response.user?.kycStatus === null) {
          console.log("User needs to complete KYC, redirecting to KYC page")
          navigateTo("kyc")
          return
        }
        
        // Navigate directly based on user role
        if (response.user?.role === "trucker") {
          console.log("Navigating to trucker dashboard")
          navigateTo("trucker-dashboard")
        } else if (response.user?.role === "shipper") {
          console.log("Navigating to shipper dashboard")
          navigateTo("shipper-dashboard")
        } else if (response.user?.role === "fleet_manager") {
          console.log("Navigating to fleet manager dashboard")
          navigateTo("fleet-manager-dashboard")
        } else if (response.user?.role === "admin") {
          console.log("Navigating to admin dashboard")
          navigateTo("admin-dashboard")
        } else {
          console.log("Role not recognized, using fallback. Role was:", response.user?.role)
          navigateTo("dashboard") // fallback
        }
      }
      
    } catch (error) {
      console.error("Login error:", error)
      
      // Check if the error is due to unverified email (only for regular users)
      if (loginType === "regular" && error.requiresVerification) {
        // Redirect to email verification page
        navigateTo("email-verification")
        return
      }
      
      // Set form-level error for other errors
      setErrors({ 
        general: error.message || "Login failed. Please try again." 
      })
    }
  }

  const gradientBackdrop =
    "pointer-events-none absolute inset-0 before:absolute before:-top-40 before:left-1/4 before:h-72 before:w-72 before:rounded-full before:bg-secondary/30 before:blur-[120px] after:absolute after:bottom-0 after:right-1/4 after:h-80 after:w-80 after:rounded-full after:bg-primary/35 after:blur-[140px]"

  const reassurance = [
    {
      label: "Confident Sign-In",
      text: "Enterprise-grade protection with continuous monitoring.",
    },
    {
      label: "Instant Routing",
      text: "We take you straight to your personalised dashboard.",
    },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#070b1d] via-[#10173b] to-[#17224f]">
      <div className={gradientBackdrop} />

      <Header transparent />

      <div className="relative z-10 container mx-auto px-4 pb-16 pt-28 sm:pt-32 lg:pt-36 lg:px-6">
        <div className="flex flex-col-reverse gap-12 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="space-y-10 text-white">
            <Reveal className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/70 backdrop-blur sm:px-5 sm:text-xs">
              Seamless re-entry
            </Reveal>

            <Reveal delay={80} className="space-y-5">
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl xl:text-5xl">
                Pick up exactly where you paused.
              </h1>
              <p className="max-w-xl text-sm text-white/80 sm:text-base lg:text-lg">
                Access your lanes, active loads, payout insights, and fleet health in seconds. Holage keeps your entire
                logistics operation synchronized.
              </p>
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-2">
              {reassurance.map((item, index) => (
                <Reveal
                  key={item.label}
                  delay={index * 140}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-secondary/40 hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/70 to-accent/70 text-white shadow-lg">
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    <h3 className="text-base font-semibold text-white">{item.label}</h3>
              </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{item.text}</p>
                </Reveal>
              ))}
            </div>

            <Reveal delay={320} className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.25em] text-white/70">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
                <span className="text-2xl font-bold text-white">3m+</span>
                <span>secure logins</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
                <span className="text-2xl font-bold text-white">5s avg</span>
                <span>to confirm</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
                <span className="text-2xl font-bold text-white">24/7</span>
                <span>live ops</span>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120} className="relative">
            <div className="absolute inset-x-8 -top-10 h-24 rounded-full bg-secondary/25 blur-3xl sm:inset-x-10" />
            <div className="relative overflow-hidden rounded-3xl border border-white/25 bg-white/95 shadow-[0_32px_80px_rgba(12,17,36,0.35)] backdrop-blur-xl">
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at top, rgba(79,70,229,0.18), transparent 55%)" }} />

              <div className="relative z-10 p-8 sm:p-10">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-secondary">Log in</p>
                    <h2 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">Welcome back to Holage</h2>
                    <p className="mt-2 text-sm text-text-secondary">
                      Authenticate and jump straight into your command hub.
                    </p>
                  </div>
                  <div className="hidden rounded-2xl bg-gradient-to-br from-primary to-secondary p-3 text-white shadow-lg sm:flex">
                    <Truck className="h-6 w-6" />
                  </div>
                </div>

                {/* Login Type Toggle */}
                <div className="mb-6 flex gap-2 rounded-2xl border border-border bg-white/50 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginType("regular")
                      setErrors({})
                    }}
                    className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                      loginType === "regular"
                        ? "bg-gradient-to-r from-primary to-secondary text-white shadow-md"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Regular User</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginType("driver")
                      setErrors({})
                    }}
                    className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                      loginType === "driver"
                        ? "bg-gradient-to-r from-primary to-secondary text-white shadow-md"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Truck className="h-4 w-4" />
                      <span>Driver</span>
                    </div>
                  </button>
                </div>

            {errors.general && (
                  <div className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                    {errors.general}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
                  {loginType === "regular" ? (
                    <>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-secondary">Email address</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-3.5 h-5 w-5 text-text-secondary/70" />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => {
                              handleInputChange("email", e.target.value)
                              if (errors.email) {
                                setErrors((prev) => ({ ...prev, email: "" }))
                              }
                            }}
                            className={`w-full rounded-2xl border bg-white/80 py-3.5 pl-12 pr-4 text-text-primary shadow-sm transition-all duration-200 placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 ${
                              errors.email ? "border-destructive/60" : "border-border"
                            }`}
                            placeholder="Enter your email"
                            required
                          />
                        </div>
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-secondary">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-3.5 h-5 w-5 text-text-secondary/70" />
                          <input
                            type="tel"
                            value={driverFormData.phoneNumber}
                            onChange={(e) => {
                              setDriverFormData({ ...driverFormData, phoneNumber: e.target.value })
                              if (errors.phoneNumber) {
                                setErrors((prev) => ({ ...prev, phoneNumber: "" }))
                              }
                            }}
                            className={`w-full rounded-2xl border bg-white/80 py-3.5 pl-12 pr-4 text-text-primary shadow-sm transition-all duration-200 placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 ${
                              errors.phoneNumber ? "border-destructive/60" : "border-border"
                            }`}
                            placeholder="08117458593"
                            required
                          />
                        </div>
                        {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber}</p>}
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-secondary">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 h-5 w-5 text-text-secondary/70" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={loginType === "regular" ? formData.password : driverFormData.password}
                        onChange={(e) => {
                          if (loginType === "regular") {
                            handleInputChange("password", e.target.value)
                            if (errors.password) {
                              setErrors((prev) => ({ ...prev, password: "" }))
                            }
                          } else {
                            setDriverFormData({ ...driverFormData, password: e.target.value })
                            if (errors.password) {
                              setErrors((prev) => ({ ...prev, password: "" }))
                            }
                          }
                        }}
                        className={`w-full rounded-2xl border bg-white/80 py-3.5 pl-12 pr-12 text-text-primary shadow-sm transition-all duration-200 placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 ${
                          errors.password ? "border-destructive/60" : "border-border"
                        }`}
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-4 top-3.5 text-text-secondary/70 transition-colors hover:text-text-primary"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  {loginType === "regular" && (
                    <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-text-secondary">
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" className="rounded border-border text-secondary focus:ring-ring" />
                        Remember me
                      </label>
                      <button
                        type="button"
                        onClick={() => navigateTo("forgot-password")}
                        className="font-medium text-secondary transition-colors hover:text-accent"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

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
                        Authenticating...
                      </>
                    ) : (
                      <>
                        Sign in securely
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                )}
              </button>

                  {loginType === "regular" && (
                    <div className="text-center text-sm text-text-secondary">
                      New to Holage?{" "}
                      <button
                        type="button"
                        onClick={() => navigateTo("signup")}
                        className="font-medium text-secondary transition-colors hover:text-accent"
                      >
                        Create an account
                      </button>
                    </div>
                  )}
                  {loginType === "driver" && (
                    <div className="text-center text-sm text-text-secondary">
                      <p className="text-text-secondary/70">
                        Drivers are registered by fleet managers. Contact your fleet manager for login credentials.
                      </p>
                    </div>
                  )}
                </form>
              </div>

              <div className="relative z-10 border-t border-white/20 bg-white/70 px-8 py-6 text-sm text-text-secondary sm:px-10">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/70 to-accent/70 text-white shadow-lg">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-text-primary">Need help signing in?</p>
                    <p className="text-xs text-text-secondary">
                      Our operations desk is on standby 24/7 via chat and phone.
                    </p>
                  </div>
                </div>
              </div>
          </div>
          </Reveal>
        </div>
      </div>
    </div>
  )
}

export default LoginPage