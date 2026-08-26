"use client"

import { useState } from "react"
import { Mail, Lock, Shield, Eye, EyeOff, Loader2 } from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useToast } from "../context/ToastContext"
import Header from "../components/Header"

const ForgotPasswordPage = () => {
  const {
    navigateTo,
    formData,
    handleInputChange,
    forgotPassword,
    verifyResetCode,
    resetPassword,
    driverForgotPassword,
    driverVerifyResetCode,
    driverResetPassword,
    loading,
  } = useAppContext()
  const toast = useToast()
  const [currentStep, setCurrentStep] = useState("email") // "email", "code", "newPassword"
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetToken, setResetToken] = useState("")
  // LoginPage's "Forgot password?" is shared by its Email and Driver tabs — this flag,
  // stashed by navigateToForgotPassword, tells us which /drivers/... endpoints to hit.
  const [isDriver] = useState(() => {
    const flag = sessionStorage.getItem("holage_forgot_password_is_driver") === "true"
    sessionStorage.removeItem("holage_forgot_password_is_driver")
    return flag
  })

  /* ---------- Handlers ---------- */
  const handleForgotPassword = async (e) => {
    e.preventDefault()
    try {
      if (isDriver) {
        await driverForgotPassword(formData.email)
      } else {
        await forgotPassword(formData.email)
      }
      setCurrentStep("code")
    } catch {
      /* handled in context */
    }
  }

  const handleVerifyCode = async (e) => {
    e.preventDefault()
    try {
      const response = isDriver
        ? await driverVerifyResetCode(formData.email, formData.resetCode)
        : await verifyResetCode(formData.email, formData.resetCode)
      setResetToken(response.resetToken)
      setCurrentStep("newPassword")
    } catch {
      /* handled in context */
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (formData.newPassword !== formData.confirmNewPassword) {
      toast.error("Passwords do not match")
      return
    }
    if (formData.newPassword.length < 6) {
      toast.warning("Password must be at least 6 characters long")
      return
    }
    try {
      if (isDriver) {
        await driverResetPassword(resetToken, formData.newPassword)
      } else {
        await resetPassword(resetToken, formData.newPassword)
      }
      handleInputChange("email", "")
      handleInputChange("resetCode", "")
      handleInputChange("newPassword", "")
      handleInputChange("confirmNewPassword", "")
      setCurrentStep("email")
      navigateTo("login")
    } catch {
      /* handled in context */
    }
  }

  const handleCodeInput = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
    handleInputChange("resetCode", value)
  }

  /* ---------- Render helpers ---------- */
  const renderEmailStep = () => (
    <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-border p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary">Reset Password</h2>
        <p className="text-sm text-text-secondary mt-2">
          Enter your email to receive a verification code
        </p>
      </div>

      <form onSubmit={handleForgotPassword} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-text-secondary" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-text-primary placeholder-text-secondary"
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !formData.email}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-xl font-semibold hover:from-primary/90 hover:to-secondary/90 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending…
            </>
          ) : (
            "Send Verification Code"
          )}
        </button>

        <div className="text-center">
          <p className="text-sm text-text-secondary">
            Remember your password?{" "}
            <button
              type="button"
              onClick={() => navigateTo("login")}
              className="text-secondary hover:text-accent font-medium"
              disabled={loading}
            >
              Sign in
            </button>
          </p>
        </div>
      </form>
    </div>
  )

  const renderCodeStep = () => (
    <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-border p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary">Enter Verification Code</h2>
        <p className="text-sm text-text-secondary mt-2">
          We&apos;ve sent a 6-digit code to {formData.email}
        </p>
      </div>

      <form onSubmit={handleVerifyCode} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Verification Code</label>
          <input
            type="text"
            value={formData.resetCode || ""}
            onChange={handleCodeInput}
            className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-text-primary placeholder-text-secondary text-center text-2xl tracking-widest"
            placeholder="000000"
            maxLength={6}
            required
            disabled={loading}
          />
          <p className="text-xs text-text-secondary mt-1 text-center">Enter the 6-digit code sent to your email</p>
        </div>

        <button
          type="submit"
          disabled={loading || !formData.resetCode || formData.resetCode.length !== 6}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-xl font-semibold hover:from-primary/90 hover:to-secondary/90 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying…
            </>
          ) : (
            "Verify Code"
          )}
        </button>

        <div className="text-center space-y-2">
          <p className="text-sm text-text-secondary">
            Didn&apos;t receive the code?{" "}
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-secondary hover:text-accent font-medium disabled:opacity-50"
              disabled={loading}
            >
              Resend
            </button>
          </p>
          <button
            type="button"
            onClick={() => setCurrentStep("email")}
            className="text-secondary hover:text-accent font-medium disabled:opacity-50"
            disabled={loading}
          >
            Change email address
          </button>
        </div>
      </form>
    </div>
  )

  const renderNewPasswordStep = () => (
    <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-border p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary">Set New Password</h2>
        <p className="text-sm text-text-secondary mt-2">Create a strong password for your account</p>
      </div>

      <form onSubmit={handleResetPassword} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">New Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-text-secondary" />
            <input
              type={showPassword ? "text" : "password"}
              value={formData.newPassword || ""}
              onChange={(e) => handleInputChange("newPassword", e.target.value)}
              className="w-full pl-10 pr-12 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-text-primary placeholder-text-secondary"
              placeholder="6+ characters"
              required
              minLength={6}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-text-secondary hover:text-text-primary disabled:opacity-50"
              disabled={loading}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Confirm New Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-text-secondary" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmNewPassword || ""}
              onChange={(e) => handleInputChange("confirmNewPassword", e.target.value)}
              className="w-full pl-10 pr-12 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-text-primary placeholder-text-secondary"
              placeholder="Confirm new password"
              required
              minLength={6}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3 text-text-secondary hover:text-text-primary disabled:opacity-50"
              disabled={loading}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
          <p className="text-sm text-text-primary font-medium">Password Requirements</p>
          <ul className="text-xs text-text-secondary mt-1 space-y-1">
            <li>• At least 6 characters long</li>
            <li>• Both passwords must match</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={
            loading ||
            !formData.newPassword ||
            !formData.confirmNewPassword ||
            formData.newPassword.length < 6
          }
          className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-xl font-semibold hover:from-primary/90 hover:to-secondary/90 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Resetting…
            </>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>
    </div>
  )

  /* ---------- Render ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {currentStep === "email" && renderEmailStep()}
          {currentStep === "code" && renderCodeStep()}
          {currentStep === "newPassword" && renderNewPasswordStep()}
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage