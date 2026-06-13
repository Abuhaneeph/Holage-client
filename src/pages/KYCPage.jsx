"use client"

import { useState, useEffect } from "react"
import { Phone, Home, FileText, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Loader, X, ChevronDown, Search } from "lucide-react"
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
  const [banks, setBanks] = useState([])
  const [loadingBanks, setLoadingBanks] = useState(false)
  const [showBankModal, setShowBankModal] = useState(false)
  const [bankSearchQuery, setBankSearchQuery] = useState('')
  const [resolvedAccountName, setResolvedAccountName] = useState(null)
  const [verifyingAccount, setVerifyingAccount] = useState(false)
  const [accountVerified, setAccountVerified] = useState(false)
  const totalSteps = userRole === "trucker" ? 4 : 3

  // Fetch banks from Paystack API (for all roles - bank details are optional)
  useEffect(() => {
    const fetchBanks = async () => {
      setLoadingBanks(true)
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
        const response = await fetch(`${API_BASE_URL}/wallet/paystack/banks`)
        const data = await response.json()
        if (data.success && data.banks) {
          // Sort banks alphabetically by name
          const sortedBanks = data.banks.sort((a, b) => a.name.localeCompare(b.name))
          setBanks(sortedBanks)
          console.log('Fetched banks from Paystack:', sortedBanks.length)
        } else {
          console.error('Failed to fetch banks:', data.message)
        }
      } catch (error) {
        console.error('Error fetching banks:', error)
      } finally {
        setLoadingBanks(false)
      }
    }
    
    fetchBanks()
  }, [])

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
          if (data.documents.bvn) updates.bvn = data.documents.bvn
          if (data.documents.plateNumber) updates.plateNumber = data.documents.plateNumber
          if (data.documents.vehicleType) updates.vehicleType = data.documents.vehicleType
          if (data.documents.bankAccountNumber) updates.bankAccountNumber = data.documents.bankAccountNumber
          if (data.documents.bankCode) updates.bankCode = data.documents.bankCode
          if (data.documents.bankName) updates.bankName = data.documents.bankName
          
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
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Personal Information</h3>
              <p className="text-sm text-text-secondary">Fill in your personal details to complete your profile</p>
              {existingData && existingData.phone && existingData.address && existingData.nin && (
                <span className="inline-flex items-center space-x-1 mt-2 text-xs bg-success/10 text-success px-3 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  <span>Data loaded from profile</span>
                </span>
              )}
            </div>

            {/* Show info if data exists in database */}
            {existingData && existingData.phone && existingData.address && existingData.nin && (
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3 flex-1">
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
                    className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    Skip to Documents →
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Phone Number *</label>
              <div className="relative">
                <Phone className="absolute left-4 top-3.5 w-5 h-5 text-text-secondary/70" />
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/80 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all duration-200 text-text-primary placeholder:text-text-secondary/70 shadow-sm"
                  placeholder="+234 801 234 5678"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Address *</label>
              <div className="relative">
                <Home className="absolute left-4 top-3.5 w-5 h-5 text-text-secondary/70" />
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/80 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all duration-200 min-h-[100px] text-text-primary placeholder:text-text-secondary/70 shadow-sm resize-none"
                  placeholder="Enter your full address"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-text-secondary">
                  NIN (National Identification Number) *
                </label>
                {!!existingData?.ninVerified && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <div className="relative">
                <FileText className="absolute left-4 top-3.5 w-5 h-5 text-text-secondary/70" />
                <input
                  type="text"
                  value={formData.nin || ''}
                  onChange={(e) => handleInputChange("nin", e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/80 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all duration-200 text-text-primary placeholder:text-text-secondary/70 shadow-sm"
                  placeholder="Enter your 11-digit NIN"
                  maxLength="11"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-text-secondary">
                  BVN (Bank Verification Number)
                </label>
                {!!existingData?.bvnVerified && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <div className="relative">
                <FileText className="absolute left-4 top-3.5 w-5 h-5 text-text-secondary/70" />
                <input
                  type="text"
                  value={formData.bvn || ''}
                  onChange={(e) => handleInputChange("bvn", e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/80 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all duration-200 text-text-primary placeholder:text-text-secondary/70 shadow-sm"
                  placeholder="Enter your 11-digit BVN"
                  maxLength="11"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Identity Verification</h3>
              <p className="text-text-secondary text-sm">Upload your documents for verification (optional but recommended)</p>
            </div>

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
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Driver's License</h3>
                <p className="text-text-secondary text-sm">Upload your driver's license for verification</p>
              </div>

              <FileUpload
                label="Driver's License"
                field="driverLicense"
                acceptedTypes="image/*,application/pdf"
                onFileSelect={handleFileUpload}
                currentFile={formData.driverLicense}
              />

              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-secondary mt-0.5 mr-3 flex-shrink-0" />
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
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Bank Account Details (Optional)</h3>
                <p className="text-text-secondary text-sm">Add your bank account details for withdrawals (optional)</p>
              </div>

              <div className="border-t border-border pt-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Bank Name</label>
                    {loadingBanks ? (
                      <div className="w-full px-4 py-3.5 bg-white/80 border border-border rounded-2xl flex items-center space-x-2">
                        <Loader className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-text-secondary">Loading banks...</span>
                      </div>
                    ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (banks.length > 0) {
                          setShowBankModal(true)
                          setBankSearchQuery('')
                        }
                      }}
                      disabled={loadingBanks || banks.length === 0}
                      className="w-full px-4 py-3.5 bg-white/80 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all duration-200 text-left text-text-primary shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                    >
                      <span className={formData.bankName ? 'text-text-primary' : 'text-text-secondary'}>
                        {loadingBanks ? 'Loading banks...' : formData.bankName || 'Select your bank (optional)'}
                      </span>
                      <ChevronDown className="w-5 h-5 text-text-secondary" />
                    </button>
                    )}
                    {banks.length === 0 && !loadingBanks && (
                      <p className="text-xs text-warning mt-1">Unable to load banks. Please refresh the page.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Account Number</label>
                    <input
                      type="text"
                      value={formData.bankAccountNumber || ''}
                      onChange={(e) => {
                        handleInputChange("bankAccountNumber", e.target.value.replace(/\D/g, ""))
                        setResolvedAccountName(null)
                        setAccountVerified(false)
                      }}
                      className="w-full px-4 py-3.5 bg-white/80 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all duration-200 text-text-primary placeholder:text-text-secondary/70 shadow-sm"
                      placeholder="Enter your 10-digit account number (optional)"
                      maxLength="10"
                    />
                  </div>

                  {/* Account Verification */}
                  {formData.bankAccountNumber && formData.bankCode && (
                    <div className="space-y-2">
                      {!accountVerified ? (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              if (!formData.bankAccountNumber || !formData.bankCode) {
                                alert("Please fill in account number and select a bank")
                                return
                              }
                              
                              setVerifyingAccount(true)
                              const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
                              
                              const response = await fetch(
                                `${API_BASE_URL}/wallet/paystack/resolve-account?account_number=${formData.bankAccountNumber}&bank_code=${formData.bankCode}`
                              )
                              
                              const data = await response.json()
                              
                              if (response.ok && data.success) {
                                setResolvedAccountName(data.account_name)
                                setAccountVerified(true)
                                alert(`Account verified: ${data.account_name}`)
                              } else {
                                // Show user-friendly error message
                                const errorMsg = data.message || "Failed to verify account. Please check your details."
                                alert(errorMsg)
                                setResolvedAccountName(null)
                                setAccountVerified(false)
                              }
                            } catch (error) {
                              console.error("Error verifying account:", error)
                              alert("Failed to verify account. Please try again.")
                              setResolvedAccountName(null)
                              setAccountVerified(false)
                            } finally {
                              setVerifyingAccount(false)
                            }
                          }}
                          disabled={verifyingAccount}
                          className="w-full px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {verifyingAccount ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Verify Account
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-success">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Account Verified</span>
                          </div>
                          <p className="text-sm text-text-primary mt-1">
                            Account Name: <span className="font-semibold">{resolvedAccountName}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-surface/80 rounded-2xl p-6 border border-border">
                <h4 className="font-medium text-text-primary mb-4">Application Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-text-secondary">Full Name:</span>
                    <span className="font-medium text-text-primary">{formData.fullName || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-text-secondary">Email:</span>
                    <span className="font-medium text-text-primary">{formData.email || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-text-secondary">Phone:</span>
                    <span className="font-medium text-text-primary">{formData.phone || 'Not provided'}</span>
                  </div>
                  {formData.bankName && (
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-text-secondary">Bank Name:</span>
                      <span className="font-medium text-text-primary">{formData.bankName}</span>
                    </div>
                  )}
                  {formData.bankAccountNumber && (
                    <div className="flex justify-between py-2">
                      <span className="text-text-secondary">Account Number:</span>
                      <span className="font-medium text-text-primary">{formData.bankAccountNumber ? `****${formData.bankAccountNumber.slice(-4)}` : 'Not provided'}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2">
                    <span className="text-text-secondary">Role:</span>
                    <span className="font-medium text-text-primary capitalize">{userRole}</span>
                  </div>
                </div>
              </div>

              <div className="bg-success/10 border border-success/20 rounded-2xl p-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 mr-3 flex-shrink-0" />
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
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Vehicle Information</h3>
              <p className="text-text-secondary text-sm">Enter your vehicle details</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Vehicle Type *</label>
              <select
                value={formData.vehicleType || ''}
                onChange={(e) => handleInputChange("vehicleType", e.target.value)}
                className="w-full px-4 py-3.5 bg-white/80 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all duration-200 text-text-primary shadow-sm [&>option]:bg-white [&>option]:text-text-primary"
                required
              >
                <option value="" className="bg-white text-text-primary">Select vehicle type</option>
                <option value="Flatbed trucks" className="bg-white text-text-primary">Flatbed trucks</option>
                <option value="Container trucks" className="bg-white text-text-primary">Container trucks</option>
                <option value="refrigerated trucks" className="bg-white text-text-primary">refrigerated trucks</option>
                <option value="10 ton packers" className="bg-white text-text-primary">10 ton packers</option>
                <option value="15 ton packers" className="bg-white text-text-primary">15 ton packers</option>
                <option value="20 ton 12 tyres" className="bg-white text-text-primary">20 ton 12 tyres</option>
                <option value="30 ton 12 tyres" className="bg-white text-text-primary">30 ton 12 tyres</option>
                <option value="40 tons trailer" className="bg-white text-text-primary">40 tons trailer</option>
                <option value="50 tons trailer" className="bg-white text-text-primary">50 tons trailer</option>
                <option value="60 tons trailer" className="bg-white text-text-primary">60 tons trailer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Plate Number *</label>
              <input
                type="text"
                value={formData.plateNumber || ''}
                onChange={(e) => handleInputChange("plateNumber", e.target.value.toUpperCase())}
                className="w-full px-4 py-3.5 bg-white/80 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all duration-200 text-text-primary placeholder:text-text-secondary/70 shadow-sm"
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

            <div className="border-t border-border pt-6 mt-6">
              <h4 className="text-lg font-semibold text-text-primary mb-4">Bank Account Details (Optional)</h4>
              <p className="text-sm text-text-secondary mb-4">You can add your bank account details now or update them later in your profile</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Bank Name</label>
                  {loadingBanks ? (
                    <div className="w-full px-4 py-3.5 bg-white/80 border border-border rounded-2xl flex items-center space-x-2">
                      <Loader className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-text-secondary">Loading banks...</span>
                    </div>
                  ) : (
                    <select
                      value={formData.bankName || ''}
                      onChange={(e) => {
                        const selectedBankName = e.target.value
                        handleInputChange("bankName", selectedBankName)
                        
                        // Auto-fill bank code based on selection from fetched banks
                        if (selectedBankName && banks.length > 0) {
                          const selectedBank = banks.find(b => b.name === selectedBankName)
                          if (selectedBank && selectedBank.code) {
                            handleInputChange("bankCode", selectedBank.code)
                            console.log(`Auto-filled bank code: ${selectedBank.code} for ${selectedBankName}`)
                          }
                        }
                      }}
                      className="w-full px-4 py-3.5 bg-white/80 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all duration-200 text-text-primary shadow-sm [&>option]:bg-white [&>option]:text-text-primary"
                      disabled={loadingBanks || banks.length === 0}
                    >
                      <option value="" className="bg-white text-text-primary">
                        {banks.length === 0 ? "No banks available" : "Select your bank"}
                      </option>
                        {banks.map((bank, index) => (
                          <option key={`${bank.code}-${bank.name}-${index}`} value={bank.name} className="bg-white text-text-primary">
                            {bank.name}
                          </option>
                        ))}
                    </select>
                  )}
                  {banks.length === 0 && !loadingBanks && (
                    <p className="text-xs text-warning mt-1">Unable to load banks. Please refresh the page.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Account Number</label>
                  <input
                    type="text"
                    value={formData.bankAccountNumber || ''}
                    onChange={(e) => handleInputChange("bankAccountNumber", e.target.value.replace(/\D/g, ""))}
                    className="w-full px-4 py-3.5 bg-white/80 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all duration-200 text-text-primary placeholder:text-text-secondary/70 shadow-sm"
                    placeholder="Enter your 10-digit account number (optional)"
                    maxLength="10"
                  />
                </div>

              </div>
            </div>

            <div className="bg-surface/80 rounded-2xl p-6 border border-border">
              <h4 className="font-medium text-text-primary mb-4">Application Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-text-secondary">Full Name:</span>
                  <span className="font-medium text-text-primary">{formData.fullName || 'Not provided'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-text-secondary">Email:</span>
                  <span className="font-medium text-text-primary">{formData.email || 'Not provided'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-text-secondary">Phone:</span>
                  <span className="font-medium text-text-primary">{formData.phone || 'Not provided'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-text-secondary">Vehicle Type:</span>
                  <span className="font-medium text-text-primary capitalize">{formData.vehicleType || 'Not selected'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-text-secondary">Plate Number:</span>
                  <span className="font-medium text-text-primary">{formData.plateNumber || 'Not provided'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-text-secondary">Bank Name:</span>
                  <span className="font-medium text-text-primary">{formData.bankName || 'Not provided'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-text-secondary">Account Number:</span>
                  <span className="font-medium text-text-primary">{formData.bankAccountNumber ? `****${formData.bankAccountNumber.slice(-4)}` : 'Not provided'}</span>
                </div>
              </div>
            </div>

            <div className="bg-success/10 border border-success/20 rounded-2xl p-4">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-success mt-0.5 mr-3 flex-shrink-0" />
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

  const gradientBackdrop =
    "pointer-events-none absolute inset-0 before:absolute before:-top-40 before:left-1/4 before:h-72 before:w-72 before:rounded-full before:bg-secondary/30 before:blur-[120px] after:absolute after:bottom-0 after:right-1/4 after:h-80 after:w-80 after:rounded-full after:bg-primary/35 after:blur-[140px]"

  if (loadingData) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#070b1d] via-[#10173b] to-[#17224f]">
        <div className={gradientBackdrop} />
        <Header transparent={true} />
        <div className="relative z-10 flex items-center justify-center min-h-screen pt-28 sm:pt-32 lg:pt-36">
          <div className="relative overflow-hidden rounded-3xl border border-white/25 bg-white/95 shadow-[0_32px_80px_rgba(12,17,36,0.35)] backdrop-blur-xl p-12 text-center max-w-md mx-4">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at top, rgba(79,70,229,0.18), transparent 55%)" }} />
            <div className="relative z-10">
              <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-text-secondary">Loading your profile...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#070b1d] via-[#10173b] to-[#17224f]">
      <div className={gradientBackdrop} />

      <Header transparent={true} />

      <div className="relative z-10 container mx-auto px-4 pb-16 pt-36 sm:pt-44 md:pt-48 lg:pt-52 xl:pt-56 lg:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-white/25 bg-white/95 shadow-[0_32px_80px_rgba(12,17,36,0.35)] backdrop-blur-xl">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at top, rgba(79,70,229,0.18), transparent 55%)" }} />
            
            <div className="relative z-10 p-6 sm:p-8 lg:p-10">
              {/* Back to Dashboard Button */}
              <div className="mb-6">
                <button
                  onClick={() => {
                    if (userRole === 'shipper') {
                      navigateTo('shipper-dashboard')
                    } else if (userRole === 'trucker') {
                      navigateTo('trucker-dashboard')
                    } else if (userRole === 'fleet_manager') {
                      navigateTo('fleet-manager-dashboard')
                    } else if (userRole === 'agent') {
                      navigateTo('agent-dashboard')
                    } else {
                      navigateTo('landing')
                    }
                  }}
                  className="flex items-center space-x-2 text-text-secondary hover:text-primary transition-colors text-sm sm:text-base"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-secondary">KYC Verification</p>
                    <h2 className="mt-2 text-xl sm:text-2xl font-bold text-text-primary md:text-3xl">Complete Your Profile</h2>
                  </div>
                  <span className="text-sm text-text-secondary font-medium">
                    Step {currentStep} of {totalSteps}
                  </span>
                </div>
                <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  />
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-6 bg-destructive/10 border border-destructive/40 rounded-2xl p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-destructive mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-destructive">Submission Error</h4>
                      <p className="text-sm text-destructive/80 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step Content */}
              <div className="mb-8">
                {renderStep()}
              </div>

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-border">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 1 || loading}
                  className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl transition-all duration-200 ${
                    currentStep === 1 || loading
                      ? "bg-muted/50 text-text-secondary cursor-not-allowed opacity-50"
                      : "bg-surface border border-border text-text-primary hover:bg-muted/80"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  onClick={handleNext}
                  disabled={!validateCurrentStep() || loading}
                  className={`group flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl font-semibold text-sm sm:text-base transition-all duration-200 shadow-lg hover:shadow-xl ${
                    !validateCurrentStep() || loading
                      ? "bg-muted/50 text-text-secondary cursor-not-allowed opacity-50"
                      : "bg-gradient-to-r from-primary to-secondary text-white hover:shadow-primary/30"
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
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Selection Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-text-primary font-bold text-lg">Select Bank</h3>
              <button
                onClick={() => {
                  setShowBankModal(false)
                  setBankSearchQuery('')
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="text"
                  value={bankSearchQuery}
                  onChange={(e) => setBankSearchQuery(e.target.value)}
                  placeholder="Search banks..."
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-text-primary placeholder:text-text-secondary/70"
                  autoFocus
                />
              </div>
            </div>

            {/* Banks List */}
            <div className="flex-1 overflow-y-auto p-2">
              {loadingBanks ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-text-secondary">Loading banks...</span>
                </div>
              ) : banks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-text-secondary">No banks available</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {banks
                    .filter(bank => 
                      bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
                      bank.code.includes(bankSearchQuery)
                    )
                    .map((bank, index) => (
                      <button
                        key={`${bank.code}-${bank.name}-${index}`}
                        onClick={() => {
                          handleInputChange("bankName", bank.name)
                          handleInputChange("bankCode", bank.code)
                          setShowBankModal(false)
                          setBankSearchQuery('')
                        }}
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20"
                      >
                        <div className="font-medium text-text-primary">{bank.name}</div>
                      </button>
                    ))}
                  {banks.filter(bank => 
                    bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
                    bank.code.includes(bankSearchQuery)
                  ).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-text-secondary">No banks found matching "{bankSearchQuery}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KYCPage