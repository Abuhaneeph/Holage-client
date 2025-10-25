"use client"

import { useState } from "react"
import { Truck, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useAppContext } from "../context/AppContext"
import Header from "../components/Header"

const LoginPage = () => {
  const { 
    navigateTo, 
    formData, 
    handleInputChange, 
    loginUser, 
    loading,
    setUserRole 
  } = useAppContext()
  
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})

  // Form validation
  const validateForm = () => {
    const newErrors = {}
    
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
      // Call the login function from context
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
      } else {
        console.log("Role not recognized, using fallback. Role was:", response.user?.role)
        navigateTo("dashboard") // fallback
      }
      
    } catch (error) {
      console.error("Login error:", error)
      
      // Check if the error is due to unverified email
      // The error object from the API includes requiresVerification flag
      if (error.requiresVerification) {
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
              <h2 className="text-2xl font-bold text-text-primary">Welcome Back</h2>
              <p className="text-text-secondary mt-2">Sign in to your account</p>
            </div>

            {/* Display general error */}
            {errors.general && (
              <div className="mb-6 p-4 bg-destructive/20 border border-destructive/50 rounded-xl">
                <p className="text-destructive text-sm text-center">{errors.general}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-text-secondary" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      handleInputChange("email", e.target.value)
                      // Clear error when user starts typing
                      if (errors.email) {
                        setErrors(prev => ({ ...prev, email: "" }))
                      }
                    }}
                    className={`w-full pl-10 pr-4 py-3 bg-input border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-text-primary placeholder-text-secondary ${
                      errors.email ? 'border-destructive/50' : 'border-border'
                    }`}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-destructive text-sm">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-text-secondary" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => {
                      handleInputChange("password", e.target.value)
                      // Clear error when user starts typing
                      if (errors.password) {
                        setErrors(prev => ({ ...prev, password: "" }))
                      }
                    }}
                    className={`w-full pl-10 pr-12 py-3 bg-input border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-text-primary placeholder-text-secondary ${
                      errors.password ? 'border-destructive/50' : 'border-border'
                    }`}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-text-secondary hover:text-text-primary"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-destructive text-sm">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-border text-secondary focus:ring-ring" 
                  />
                  <span className="ml-2 text-sm text-text-secondary">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => navigateTo("forgot-password")}
                  className="text-sm text-secondary hover:text-accent font-medium"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-xl font-semibold transition-all duration-200 transform shadow-lg hover:shadow-xl ${
                  loading 
                    ? 'opacity-70 cursor-not-allowed' 
                    : 'hover:from-primary/90 hover:to-secondary/90 hover:scale-105'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>

              <div className="text-center">
                <p className="text-sm text-text-secondary">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigateTo("signup")}
                    className="text-secondary hover:text-accent font-medium"
                  >
                    Sign up
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

export default LoginPage