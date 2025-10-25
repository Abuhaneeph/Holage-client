"use client"

import { useState, useEffect } from "react"
import { Phone, Home, FileText, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Loader, X } from "lucide-react"
import { useAppContext } from "../context/AppContext"
import Header from "../components/Header"
import FileUpload from "../components/FileUpload"

const KYCPage = () => {
  const { 
    navigateTo, 
    userRole,
    user,
    formData, 
    handleInputChange, 
    handleFileUpload, 
    submitKyc, 
    validateKycStep,
    loading,
    error
  } = useAppContext()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [existingData, setExistingData] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const totalSteps = userRole === "trucker" ? 4 : 3

  // Fetch existing user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
        const token = localStorage.getItem('authToken')
        const response = await fetch(`${API_BASE_URL}/kyc/documents`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await response.json()
        if (data.success) {
          console.log('Fetched KYC data:', data.documents)
          setExistingData(data.documents)
          
          // Pre-populate form with existing data - do all at once
          const updates = {}
          if (data.documents.phone) updates.phone = data.documents.phone
          if (data.documents.address) updates.address = data.documents.address
          if (data.documents.nin) updates.nin = data.documents.nin
          if (data.documents.plateNumber) updates.plateNumber = data.documents.plateNumber
          if (data.documents.vehicleType) updates.vehicleType = data.documents.vehicleType
          
          console.log('Applying updates:', updates)
          
          // Apply all updates at once
          Object.keys(updates).forEach(key => {
            handleInputChange(key, updates[key])
          })
          
          // Small delay to ensure state updates, then check if we should skip to documents
          setTimeout(() => {
            console.log('After timeout - current formData:', formData)
            if (data.documents.phone && data.documents.address && data.documents.nin) {
              console.log('Skipping to step 2')
              setCurrentStep(2) // Go directly to documents upload
            }
          }, 100)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoadingData(false)
      }
    }
    
    fetchUserData()
  }, [])

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      try {
        // Submit KYC when on the last step using context function
        await submitKyc()
        // Navigate to success page on successful submission
        navigateTo("success")
      } catch (error) {
        // Error is already handled in the context (alert shown)
        console.error('KYC submission failed:', error)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const validateCurrentStep = () => {
    return validateKycStep(currentStep)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">Personal Information</h3>
              {existingData && existingData.phone && existingData.address && existingData.nin && (
                <span className="text-xs bg-success/10 text-success px-3 py-1 rounded-full flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Data loaded from profile</span>
                </span>
              )}
            </div>

            {/* Show info if data exists in database */}
            {existingData && existingData.phone && existingData.address && existingData.nin && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-text-primary">Profile Information Found</h4>
                      <p className="text-sm text-text-secondary mt-1">
                        Your personal information is already saved. You can skip this step.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="bg-primary text-text-light px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
                  >
                    Skip to Documents →
                  </button>
                </div>
              </div>
            )}

            {/* Debug info - shows current form state */}
            <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-1">
              <p className="font-medium text-text-primary">Current Form Values:</p>
              <p className="text-text-secondary">Phone: {formData.phone || '(not filled)'}</p>
              <p className="text-text-secondary">Address: {formData.address || '(not filled)'}</p>
              <p className="text-text-secondary">NIN: {formData.nin || '(not filled)'}</p>
              <p className={`font-medium ${validateKycStep(currentStep) ? 'text-success' : 'text-warning'}`}>
                Next Button: {validateKycStep(currentStep) ? 'Enabled ✓' : 'Disabled (fill all required fields)'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Phone Number *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-5 h-5 text-text-secondary" />
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-text-primary placeholder-text-secondary"
                  placeholder="+234 801 234 5678"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Address *</label>
              <div className="relative">
                <Home className="absolute left-3 top-3 w-5 h-5 text-text-secondary" />
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 min-h-[100px] text-text-primary placeholder-text-secondary"
                  placeholder="Enter your full address"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                NIN (National Identification Number) *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-text-secondary" />
                <input
                  type="text"
                  value={formData.nin || ''}
                  onChange={(e) => handleInputChange("nin", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-text-primary placeholder-text-secondary"
                  placeholder="Enter your NIN"
                  maxLength="11"
                  required
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-text-primary">Identity Verification</h3>
            <p className="text-text-secondary text-sm">Upload your documents for verification (optional but recommended)</p>

            <FileUpload
              label="Profile Photo"
              field="profilePhoto"
              acceptedTypes="image/*"
              onFileSelect={handleFileUpload}
              currentFile={formData.profilePhoto}
            />

            <FileUpload
              label="Utility Bill (Proof of Address)"
              field="utilityBill"
              acceptedTypes="image/*,application/pdf"
              onFileSelect={handleFileUpload}
              currentFile={formData.utilityBill}
            />
          </div>
        )

      case 3:
        if (userRole === "trucker") {
          return (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-text-primary">Driver's License</h3>

              <FileUpload
                label="Driver's License"
                field="driverLicense"
                acceptedTypes="image/*,application/pdf"
                onFileSelect={handleFileUpload}
                currentFile={formData.driverLicense}
              />

              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-secondary mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-medium text-text-primary">License Requirements</h4>
                    <p className="text-sm text-text-secondary mt-1">
                      Please ensure your driver's license is valid and not expired. Commercial licenses are preferred
                      for truckers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        } else {
          return (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-text-primary">Review & Submit</h3>

              <div className="bg-surface rounded-xl p-6 border border-border">
                <h4 className="font-medium text-text-primary mb-4">Application Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Full Name:</span>
                    <span className="font-medium text-text-primary">{formData.fullName || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Email:</span>
                    <span className="font-medium text-text-primary">{formData.email || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Phone:</span>
                    <span className="font-medium text-text-primary">{formData.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Role:</span>
                    <span className="font-medium text-text-primary capitalize">{userRole}</span>
                  </div>
                </div>
              </div>

              <div className="bg-success/10 border border-success/20 rounded-xl p-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-medium text-text-primary">Ready to Submit</h4>
                    <p className="text-sm text-text-secondary mt-1">
                      Your application is complete and ready for review. You'll receive a confirmation email once
                      approved.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        }

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-text-primary">Vehicle Information</h3>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Vehicle Type *</label>
              <select
                value={formData.vehicleType || ''}
                onChange={(e) => handleInputChange("vehicleType", e.target.value)}
                className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-text-primary [&>option]:bg-white [&>option]:text-gray-900"
                required
              >
                <option value="" className="bg-white text-gray-900">Select vehicle type</option>
                <option value="pickup" className="bg-white text-gray-900">Pickup Truck</option>
                <option value="van" className="bg-white text-gray-900">Van</option>
                <option value="truck" className="bg-white text-gray-900">Truck</option>
                <option value="trailer" className="bg-white text-gray-900">Trailer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Plate Number *</label>
              <input
                type="text"
                value={formData.plateNumber || ''}
                onChange={(e) => handleInputChange("plateNumber", e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-text-primary placeholder-text-secondary"
                placeholder="e.g., ABC-123DE"
                required
              />
            </div>

            <FileUpload
              label="Vehicle Registration Documents"
              field="vehicleReg"
              acceptedTypes="image/*,application/pdf"
              onFileSelect={handleFileUpload}
              currentFile={formData.vehicleReg}
            />

            <div className="bg-surface rounded-xl p-6 border border-border">
              <h4 className="font-medium text-text-primary mb-4">Application Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Full Name:</span>
                  <span className="font-medium text-text-primary">{formData.fullName || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Email:</span>
                  <span className="font-medium text-text-primary">{formData.email || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Phone:</span>
                  <span className="font-medium text-text-primary">{formData.phone || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Vehicle Type:</span>
                  <span className="font-medium text-text-primary capitalize">{formData.vehicleType || 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Plate Number:</span>
                  <span className="font-medium text-text-primary">{formData.plateNumber || 'Not provided'}</span>
                </div>
              </div>
            </div>

            <div className="bg-success/10 border border-success/20 rounded-xl p-4">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-success mt-0.5 mr-3" />
                <div>
                  <h4 className="font-medium text-text-primary">Ready to Submit</h4>
                  <p className="text-sm text-text-secondary mt-1">
                    Your trucker application is complete and ready for review. You'll receive a confirmation email once
                    approved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-border p-12 text-center">
          <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-text-secondary">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-border p-8">
            {/* Back to Dashboard Button */}
            <div className="mb-4">
              <button
                onClick={() => {
                  if (userRole === 'shipper') {
                    navigateTo('shipper-dashboard')
                  } else if (userRole === 'trucker') {
                    navigateTo('trucker-dashboard')
                  } else {
                    navigateTo('landing')
                  }
                }}
                className="flex items-center space-x-2 text-text-secondary hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-text-primary">Complete Your Profile</h2>
                <span className="text-sm text-text-secondary">
                  Step {currentStep} of {totalSteps}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-medium text-red-300">Submission Error</h4>
                    <p className="text-sm text-red-200 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step Content */}
            {renderStep()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={handleBack}
                disabled={currentStep === 1 || loading}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                  currentStep === 1 || loading
                    ? "bg-muted text-text-secondary cursor-not-allowed opacity-50"
                    : "bg-surface text-text-primary hover:bg-muted border border-border"
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                onClick={handleNext}
                disabled={!validateCurrentStep() || loading}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                  !validateCurrentStep() || loading
                    ? "bg-muted text-text-secondary cursor-not-allowed opacity-50 transform-none"
                    : "bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90"
                }`}
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>{currentStep === totalSteps ? "Submit" : "Next"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default KYCPage