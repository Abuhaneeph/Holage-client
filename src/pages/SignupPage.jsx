"use client"

import { useState } from "react"
import { Truck, User, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useToast } from "../context/ToastContext"
import Header from "../components/Header"

const SignupPage = () => {
  const { navigateTo, userRole, setUserRole, formData, handleInputChange, registerUser, loading } = useAppContext()
  const toast = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
    if (!formData.fullName || !formData.email || !formData.password || !formData.nin || !formData.bvn) {
      toast.warning("Please fill in all required fields")
      return
    }
    if (!/^\d{11}$/.test(String(formData.nin)) || !/^\d{11}$/.test(String(formData.bvn))) {
      toast.error("NIN and BVN must be 11 digits")
      return
    }

    try {
      // Call the API endpoint
      await registerUser(formData.fullName, formData.email, formData.password, userRole, formData.nin, formData.bvn)
      
      // If successful, navigate to email verification
      navigateTo("email-verification")
    } catch (error) {
      // Error is already handled in the AppContext (alert shown)
      console.error("Signup failed:", error)
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
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary">Create Account</h2>
            </div>

            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">Select Your Role</label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setUserRole("shipper")}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center ${
                    userRole === "shipper"
                      ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg"
                      : "bg-surface text-text-secondary border border-border hover:bg-muted"
                  }`}
                >
                  <User className="inline-block w-5 h-5 mr-2" /> Shipper
                </button>
                <button
                  type="button"
                  onClick={() => setUserRole("trucker")}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center ${
                    userRole === "trucker"
                      ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg"
                      : "bg-surface text-text-secondary border border-border hover:bg-muted"
                  }`}
                >
                  <Truck className="inline-block w-5 h-5 mr-2" /> Driver
                </button>
              </div>
              {!userRole && <p className="text-destructive text-sm mt-2">Please select a role.</p>}
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-text-secondary" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-text-primary placeholder-text-secondary"
                    placeholder="Enter your full name"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

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

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">NIN</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.nin}
                  onChange={(e) => handleInputChange("nin", e.target.value)}
                  className="w-full pl-4 pr-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-text-primary placeholder-text-secondary tracking-widest"
                  placeholder="11-digit NIN"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">BVN</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.bvn}
                  onChange={(e) => handleInputChange("bvn", e.target.value)}
                  className="w-full pl-4 pr-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-text-primary placeholder-text-secondary tracking-widest"
                  placeholder="11-digit BVN"
                  required
                  disabled={loading}
                />
              </div>
            </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-text-secondary" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-text-primary placeholder-text-secondary"
                    placeholder="6+ characters"
                    required
                    disabled={loading}
                  />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-text-secondary hover:text-text-primary"
                  disabled={loading}
                >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-text-secondary" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-text-primary placeholder-text-secondary"
                    placeholder="Confirm your password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-text-secondary hover:text-text-primary"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
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
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>

              <div className="text-center">
                <p className="text-sm text-text-secondary">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigateTo("login")}
                    className="text-secondary hover:text-accent font-medium"
                    disabled={loading}
                  >
                    Log in
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupPage