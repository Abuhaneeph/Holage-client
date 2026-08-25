"use client"

import { useState } from "react"
import { Truck, Phone, Lock, Eye, EyeOff, ArrowRight } from "lucide-react"
import { useAppContext } from "../context/AppContext"
import Header from "../components/Header"
import Reveal from "../components/Reveal"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const DriverLoginPage = () => {
  const { navigateTo, setUser, setUserRole } = useAppContext()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    phoneNumber: "",
    password: ""
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required"
    } else if (!/^[0-9]{10,11}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = "Please enter a valid phone number"
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    
    setErrors({})
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/drivers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber.replace(/\s/g, ''),
          password: formData.password
        })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        // Store driver token and info
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('driverInfo', JSON.stringify(data.driver))
        localStorage.setItem('userRole', 'driver')

        // Router.jsx guards each dashboard route against the AppContext userRole state
        // (not localStorage) — without updating it here too, navigateTo below would fire
        // but Router would immediately bounce back to the landing page since its guard
        // would still see the pre-login (empty) role.
        setUser({
          id: data.driver.id,
          role: 'driver',
          driverName: data.driver.driverName,
          phoneNumber: data.driver.phoneNumber,
          fleetManagerId: data.driver.fleetManagerId
        })
        setUserRole('driver')

        // Navigate to driver dashboard
        navigateTo("driver-dashboard")
      } else {
        setErrors({ general: data.message || "Login failed. Please check your credentials." })
      }
    } catch (error) {
      console.error("Login error:", error)
      setErrors({ general: "An error occurred. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-12">
        <Reveal>
          <div className="w-full max-w-md">
            <div className="bg-card border border-border rounded-3xl p-8 shadow-xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <Truck className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">Driver Login</h1>
                <p className="text-text-secondary">Sign in to access your dashboard</p>
              </div>

              {errors.general && (
                <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-xl">
                  <p className="text-error text-sm">{errors.general}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-text-primary font-medium mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className={`w-full pl-12 pr-4 py-3 bg-input border ${
                        errors.phoneNumber ? 'border-error' : 'border-border'
                      } rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-text-primary`}
                      placeholder="08012345678"
                      disabled={loading}
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="mt-1 text-error text-sm">{errors.phoneNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-text-primary font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`w-full pl-12 pr-12 py-3 bg-input border ${
                        errors.password ? 'border-error' : 'border-border'
                      } rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-text-primary`}
                      placeholder="Enter your password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-error text-sm">{errors.password}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-text-secondary text-sm">
                  Not a driver?{" "}
                  <button
                    onClick={() => navigateTo("login")}
                    className="text-primary font-medium hover:text-primary/80 transition-colors"
                  >
                    Login as Fleet Manager
                  </button>
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}

export default DriverLoginPage

