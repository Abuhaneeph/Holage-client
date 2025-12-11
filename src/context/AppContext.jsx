"use client"

import { createContext, useState, useContext, useEffect } from "react"
import { useToast } from "./ToastContext"

// Create the context
const AppContext = createContext()

// Export the context hook
export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}

// Get the API URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

// Log API configuration on module load
console.log('🔧 [API Config] API_BASE_URL:', API_BASE_URL)
console.log('🔧 [API Config] VITE_API_URL env:', import.meta.env.VITE_API_URL)

// AppProvider component
export const AppProvider = ({ children }) => {
  const toast = useToast()
  const [currentPage, setCurrentPage] = useState("landing")
  const [userRole, setUserRole] = useState("")
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    verificationCode: "",
    resetCode: "", // Added for forgot password flow
    newPassword: "", // Added for forgot password flow
    confirmNewPassword: "", // Added for forgot password flow
    phone: "",
    address: "",
    profilePhoto: null,
    driverLicense: null,
    vehicleReg: null,
    plateNumber: "",
    vehicleType: "",
    nin: "",
    bvn: "",
    utilityBill: null,
  })

  // Navigation handler
  const navigateTo = (page) => {
    setCurrentPage(page)
  }

  // Handle token expiration - clear session and redirect to login
  const handleTokenExpiration = () => {
    // Clear all auth data
    localStorage.removeItem("authToken")
    localStorage.removeItem("userInfo")
    localStorage.removeItem("driverInfo")
    localStorage.removeItem("userRole")
    localStorage.removeItem("rememberedEmail")
    localStorage.removeItem("rememberedPhone")
    
    // Clear user state
    setUser(null)
    setUserRole("")
    
    // Redirect to login
    navigateTo("login")
  }

  // Form input handler
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // File upload handler
  const handleFileUpload = (field, file) => {
    setFormData((prev) => ({ ...prev, [field]: file }))
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      verificationCode: "",
      resetCode: "",
      newPassword: "",
      confirmNewPassword: "",
      phone: "",
      address: "",
      profilePhoto: null,
      driverLicense: null,
      vehicleReg: null,
      plateNumber: "",
      vehicleType: "",
      nin: "",
      bvn: "",
      utilityBill: null,
      passportPhoto: null,
      bankAccountNumber: "",
      bankCode: "",
      bankName: "",
    })
    setUserRole("")
  }

  // API caller for JSON requests
  const callApi = async (endpoint, method = "GET", data = null, authRequired = false) => {
    setLoading(true)
    setError(null)
    try {
      const headers = {
        "Content-Type": "application/json",
      }

      if (authRequired) {
        const token = localStorage.getItem("authToken")
        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        } else {
          throw new Error("No authentication token found.")
        }
      }

      const config = {
        method,
        headers,
        body: data ? JSON.stringify(data) : null,
      }

      const fullUrl = `${API_BASE_URL}${endpoint}`
      console.log('🌐 [API] Making request:', { method, url: fullUrl, authRequired })
      
      const response = await fetch(fullUrl, config)
      
      // Check content type before parsing
      const contentType = response.headers.get("content-type")
      let responseData
      
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json()
      } else {
        // If not JSON, get text and try to parse
        const text = await response.text()
        console.error('❌ [API] Non-JSON response received:', {
          status: response.status,
          statusText: response.statusText,
          contentType,
          url: fullUrl,
          textPreview: text.substring(0, 200)
        })
        
        // Try to parse as JSON anyway (in case content-type is wrong)
        try {
          responseData = JSON.parse(text)
        } catch (parseErr) {
          // If parsing fails, create a meaningful error
          if (response.status === 404) {
            throw new Error(`API endpoint not found: ${fullUrl}. Please check if the backend server is running and the endpoint is correct.`)
          } else if (response.status >= 500) {
            throw new Error(`Server error (${response.status}): ${response.statusText}`)
          } else {
            throw new Error(`Invalid response from server (${response.status}): Expected JSON but received ${contentType || 'unknown content type'}`)
          }
        }
      }

      // Check for token expiration (401 status or expired flag)
      if (response.status === 401 || responseData.expired === true) {
        handleTokenExpiration()
        // Don't show error toast, just redirect
        return
      }

      if (!response.ok) {
        // Create an error object that includes all response data
        const error = new Error(responseData.message || `Request failed with status ${response.status}`)
        // Attach additional properties from the response
        Object.assign(error, responseData)
        throw error
      }
      
      console.log('✅ [API] Request successful:', { url: fullUrl, status: response.status })
      return responseData
    } catch (err) {
      console.error('❌ [API] Request failed:', {
        endpoint,
        method,
        error: err.message,
        stack: err.stack
      })
      
      // Don't show error if it's a token expiration (already handled)
      if (err.message && (err.message.includes("expired") || err.message.includes("token"))) {
        // Token expiration already handled above, just return
        return
      }
      setError(err.message)
      toast.error(`Error: ${err.message}`)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // API caller for FormData requests (file uploads)
  const callApiWithFiles = async (endpoint, formData, authRequired = true) => {
    setLoading(true)
    setError(null)
    try {
      const headers = {}

      if (authRequired) {
        const token = localStorage.getItem("authToken")
        console.log("Token from localStorage:", token) // Debug log
        
        if (token) {
          headers["Authorization"] = `Bearer ${token}`
          console.log("Authorization header set:", headers["Authorization"]) // Debug log
        } else {
          throw new Error("No authentication token found.")
        }
      }

      console.log("Making request to:", `${API_BASE_URL}${endpoint}`) // Debug log
      console.log("Headers:", headers) // Debug log

      const config = {
        method: "POST",
        headers,
        body: formData,
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
      const responseData = await response.json()

      console.log("Response status:", response.status) // Debug log
      console.log("Response data:", responseData) // Debug log

      // Check for token expiration (401 status or expired flag)
      if (response.status === 401 || responseData.expired === true) {
        handleTokenExpiration()
        // Don't show error toast, just redirect
        return
      }

      if (!response.ok) {
        throw new Error(responseData.message || "Something went wrong")
      }
      return responseData
    } catch (err) {
      console.error("API call error:", err) // Enhanced error logging
      // Don't show error if it's a token expiration (already handled)
      if (err.message && (err.message.includes("expired") || err.message.includes("token"))) {
        // Token expiration already handled above, just return
        return
      }
      setError(err.message)
      toast.error(`Error: ${err.message}`)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Auth functions
  const registerUser = async (fullName, email, password, role, nin, bvn) => {
    try {
      const payload = { fullName, email, password, role }

      const normalizeOptional = (value) => {
        if (value === undefined || value === null) return undefined
        const trimmed = String(value).trim()
        return trimmed.length ? trimmed : undefined
      }

      const normalizedNin = normalizeOptional(nin)
      const normalizedBvn = normalizeOptional(bvn)

      if (normalizedNin) {
        payload.nin = normalizedNin
      }
      if (normalizedBvn) {
        payload.bvn = normalizedBvn
      }

      const data = await callApi("/auth/register", "POST", payload)
      toast.success(data.message)
      return data
    } catch (err) {
      console.error("Registration failed:", err)
      throw err
    }
  }

  const loginUser = async (email, password) => {
    try {
      console.log('🔐 [Login] Attempting login for:', email)
      console.log('🔐 [Login] API_BASE_URL:', API_BASE_URL)
      console.log('🔐 [Login] Full endpoint will be:', `${API_BASE_URL}/auth/login`)
      const data = await callApi("/auth/login", "POST", { email, password })
      console.log('✅ [Login] Login successful, token received')
      localStorage.setItem("authToken", data.token)
      // Store user info in localStorage for persistence
      if (data.user) {
        localStorage.setItem("userInfo", JSON.stringify(data.user))
        setUserRole(data.user.role || "")
      }
      setUser(data.user)
      return data
    } catch (err) {
      console.error("Login failed:", err)
      throw err
    }
  }

  const logoutUser = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userInfo")
    localStorage.removeItem("driverInfo")
    localStorage.removeItem("userRole")
    setUser(null)
    setUserRole("")
    resetForm()
    navigateTo("landing")
  }
  
  const verifyEmail = async (verificationCode) => {
    console.log("Verifying email with code received:", verificationCode)
    try {
      const data = await callApi(`/auth/verify-email`, "POST", { code: verificationCode })
      
      // Store the token if returned after email verification
      if (data.token) {
        localStorage.setItem('authToken', data.token)
        console.log("Token stored after email verification")
      }
      
      // Update user data if returned
      if (data.user) {
        setUser(data.user)
        // Store user info in localStorage for persistence
        localStorage.setItem("userInfo", JSON.stringify(data.user))
        if (data.user.role) {
          setUserRole(data.user.role)
          localStorage.setItem("userRole", data.user.role)
        }
      }
      
      toast.success(data.message)
      return data
    } catch (err) {
      console.error("Email verification failed:", err)
      throw err
    }
  }

  const resendVerificationCode = async (email) => {
    try {
      const data = await callApi("/auth/resend-verification", "POST", { email })
      toast.success(data.message || "Verification code resent successfully")
      return data
    } catch (err) {
      console.error("Resend verification failed:", err)
      throw err
    }
  }

  // Forgot Password Functions
  const forgotPassword = async (email) => {
    try {
      const data = await callApi("/auth/forgot-password", "POST", { email })
      toast.success(data.message || "Password reset code sent to your email")
      return data
    } catch (err) {
      console.error("Forgot password failed:", err)
      throw err
    }
  }

  const verifyResetCode = async (email, resetCode) => {
    try {
      const data = await callApi("/auth/verify-reset-code", "POST", { email, resetCode })
      return data // Should return { resetToken, message }
    } catch (err) {
      console.error("Reset code verification failed:", err)
      throw err
    }
  }

  const resetPassword = async (resetToken, newPassword) => {
    try {
      const data = await callApi("/auth/reset-password", "POST", { 
        resetToken, 
        newPassword 
      })
      toast.success(data.message || "Password reset successfully")
      return data
    } catch (err) {
      console.error("Reset password failed:", err)
      throw err
    }
  }

  // Updated KYC submission function
  const submitKyc = async () => {
    try {
      // Validate required fields
      if (!formData.phone || !formData.address || !formData.nin) {
        throw new Error("Phone, address, and NIN are required.")
      }

      if (userRole === "trucker") {
        if (!formData.plateNumber || !formData.vehicleType) {
          throw new Error("Vehicle information is required for truckers.")
        }
        // Bank account details are optional - can be added later via profile
      }

      // Create FormData object for file uploads
      const kycFormData = new FormData()
      
      // Add text fields
      kycFormData.append('phone', formData.phone)
      kycFormData.append('address', formData.address)
      kycFormData.append('nin', formData.nin)
      
      // Add trucker-specific fields if applicable
      if (userRole === "trucker") {
        kycFormData.append('plateNumber', formData.plateNumber)
        kycFormData.append('vehicleType', formData.vehicleType)
      }
      
      // Add bank account details for all roles (optional)
      if (formData.bankAccountNumber && formData.bankCode) {
        kycFormData.append('bankAccountNumber', formData.bankAccountNumber)
        kycFormData.append('bankCode', formData.bankCode)
        if (formData.bankName) {
          kycFormData.append('bankName', formData.bankName)
        }
      }

      // Add files if they exist
      const fileFields = ['profilePhoto', 'driverLicense', 'vehicleReg', 'utilityBill']
      
      fileFields.forEach(field => {
        if (formData[field] && formData[field] instanceof File) {
          kycFormData.append(field, formData[field])
        }
      })

      // Submit to API
      const data = await callApiWithFiles("/kyc/submit", kycFormData, true)
      
      toast.success(data.message || "KYC submitted successfully!")
      return data
      
    } catch (err) {
      console.error("KYC submission failed:", err)
      throw err
    }
  }

  // Get KYC status
  const getKycStatus = async () => {
    try {
      const data = await callApi("/kyc/status", "GET", null, true)
      return data.kycStatus
    } catch (err) {
      console.error("Get KYC status failed:", err)
      return null
    }
  }

  // Validate KYC form step
  const validateKycStep = (step) => {
    switch (step) {
      case 1:
        return formData.phone && formData.address && formData.nin
      case 2:
        // Files are optional, so just return true
        return true
      case 3:
        if (userRole === "trucker") {
          // Driver's license step for truckers
          return true
        } else {
          // Final step for non-truckers
          return true
        }
      case 4:
        // Vehicle info step for truckers (bank account is optional)
        return formData.vehicleType && formData.plateNumber
      default:
        return true
    }
  }

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!localStorage.getItem("authToken")
  }

  // Get current user from token (if needed)
  const getCurrentUser = () => {
    const token = localStorage.getItem("authToken")
    if (token && !user) {
      // You could decode the JWT token here if needed
      // or make an API call to get current user info
    }
    return user
  }

  // Restore user session on app initialization
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("authToken")
      
      if (!token) {
        return // No token, user needs to login
      }

      // Check if it's a driver session
      const driverInfo = localStorage.getItem("driverInfo")
      if (driverInfo) {
        try {
          const driver = JSON.parse(driverInfo)
          setUser({
            id: driver.id,
            role: 'driver',
            driverName: driver.driverName,
            phoneNumber: driver.phoneNumber,
            fleetManagerId: driver.fleetManagerId
          })
          setUserRole("driver")
          // Navigate to driver dashboard (only if we're on landing/login)
          // Since this runs on mount, currentPage will be "landing" by default
          navigateTo("driver-dashboard")
          return
        } catch (error) {
          console.error("Error parsing driver info:", error)
          // Clear invalid data
          localStorage.removeItem("driverInfo")
          localStorage.removeItem("authToken")
        }
      }

      // Check for regular user session
      const userInfo = localStorage.getItem("userInfo")
      if (userInfo) {
        try {
          const userData = JSON.parse(userInfo)
          setUser(userData)
          setUserRole(userData.role || "")
          
          // Navigate to appropriate dashboard
          if (userData.role === "trucker") {
            navigateTo("trucker-dashboard")
          } else if (userData.role === "shipper") {
            navigateTo("shipper-dashboard")
          } else if (userData.role === "fleet_manager") {
            navigateTo("fleet-manager-dashboard")
          } else if (userData.role === "admin") {
            navigateTo("admin-dashboard")
          }
        } catch (error) {
          console.error("Error parsing user info:", error)
          // Clear invalid data
          localStorage.removeItem("userInfo")
          localStorage.removeItem("authToken")
        }
      } else {
        // No user info stored, try to fetch from API to verify token
        try {
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
          const response = await fetch(`${API_BASE_URL}/kyc/documents`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            // Token is valid, navigate based on stored role
            const storedRole = localStorage.getItem("userRole")
            if (storedRole) {
              setUserRole(storedRole)
              if (storedRole === "trucker") {
                navigateTo("trucker-dashboard")
              } else if (storedRole === "shipper") {
                navigateTo("shipper-dashboard")
              } else if (storedRole === "fleet_manager") {
                navigateTo("fleet-manager-dashboard")
              } else if (storedRole === "admin") {
                navigateTo("admin-dashboard")
              }
            }
          } else if (response.status === 401) {
            // Token is invalid or expired
            localStorage.removeItem("authToken")
            localStorage.removeItem("userInfo")
            localStorage.removeItem("driverInfo")
            localStorage.removeItem("userRole")
          }
        } catch (error) {
          console.error("Error verifying token:", error)
          // On error, clear session
          localStorage.removeItem("authToken")
          localStorage.removeItem("userInfo")
          localStorage.removeItem("driverInfo")
          localStorage.removeItem("userRole")
        }
      }
    }

    restoreSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Context value
  const contextValue = {
    currentPage,
    userRole,
    user,
    loading,
    error,
    formData,
    navigateTo,
    setUserRole,
    setUser,
    handleInputChange,
    handleFileUpload,
    resetForm,
    registerUser,
    loginUser,
    logoutUser,
    verifyEmail,
    resendVerificationCode,
    forgotPassword,
    verifyResetCode, // Added missing function
    resetPassword,
    submitKyc,
    getKycStatus,
    validateKycStep,
    isAuthenticated,
    getCurrentUser,
  }

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
}