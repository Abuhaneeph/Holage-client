"use client"

import { useState, useEffect } from "react"
import { Mail } from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useToast } from "../context/ToastContext"
import Header from "../components/Header"

const EmailVerificationPage = () => {
  const { navigateTo, formData, handleInputChange, verifyEmail, resendVerificationCode, loading } = useAppContext()
  const toast = useToast()
  const [timeLeft, setTimeLeft] = useState(60)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft])

const handleVerification = async (e) => {
  e.preventDefault()
  console.log("Verifying email with code:", formData.verificationCode)    
  
  if (!formData.verificationCode || formData.verificationCode.length !== 6) {
    toast.warning("Please enter a valid 6-digit code")
    return
  }

  try {
    // Call the verification API endpoint - now returns token
   await verifyEmail(formData.verificationCode)
    
    
    
    // If successful, navigate to KYC page
    navigateTo("kyc")
  } catch (error) {
    // Error is already handled in the AppContext (alert shown)
    console.error("Email verification failed:", error)
  }
}
  const handleResend = async () => {
    if (!formData.email) {
      toast.error("Email address not found. Please go back to signup.")
      return
    }

    try {
      // Call the actual resend API endpoint
      await resendVerificationCode(formData.email)
      
      // Reset the timer
      setTimeLeft(60)
      setCanResend(false)
    } catch (error) {
      console.error("Resend failed:", error)
      // Error is already handled in AppContext (alert shown)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-border p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary">Verify Your Email</h2>
              <p className="text-sm text-text-secondary mt-2">
                We've sent a 6-digit code to {formData.email || "your email"}
              </p>
            </div>

            <form onSubmit={handleVerification} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Verification Code</label>
               <input
  type="text"
  inputMode="numeric"
  pattern="\d{6}"
  maxLength={6}
  value={formData.verificationCode || ""}
  onChange={(e) => handleInputChange("verificationCode", e.target.value)}
  className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest text-text-primary placeholder-text-secondary"
  placeholder="000000"
  required
  disabled={loading}
/>

              </div>

              <button
                type="submit"
                disabled={loading || formData.verificationCode.length !== 6}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-xl font-semibold hover:from-primary/90 hover:to-secondary/90 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </button>

              <div className="text-center">
                <p className="text-sm text-text-secondary">
                  Didn't receive the code?{" "}
                  {canResend && !loading ? (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="text-secondary hover:text-accent font-medium"
                    >
                      Resend code
                    </button>
                  ) : (
                    <span className="text-text-secondary">
                      {loading ? "Processing..." : `Resend in ${timeLeft}s`}
                    </span>
                  )}
                </p>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigateTo("signup")}
                  className="text-sm text-secondary hover:text-accent"
                  disabled={loading}
                >
                  ← Back to signup
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailVerificationPage