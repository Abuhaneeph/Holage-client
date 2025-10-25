"use client"

import { useState, useEffect } from "react"
import { 
  Truck, 
  MapPin, 
  DollarSign, 
  Clock, 
  Package, 
  Star, 
  Navigation,
  Bell,
  User,
  Settings,
  LogOut,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  FileText,
  Download,
  Upload,
  Eye,
  Loader
} from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useToast } from "../context/ToastContext"

const TruckerDashboard = () => {
  const { user, logoutUser, navigateTo } = useAppContext()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [documents, setDocuments] = useState(null)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(null)
  const [kycCheckDone, setKycCheckDone] = useState(false)
  
  // Check if user has completed KYC
  useEffect(() => {
    const checkKYC = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
        const token = localStorage.getItem('authToken')
        
        if (!token) {
          navigateTo('login')
          return
        }
        
        const response = await fetch(`${API_BASE_URL}/kyc/documents`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()
        
        // If user hasn't filled basic KYC info, redirect to KYC page
        if (data.success && (!data.documents.phone || !data.documents.address || !data.documents.nin)) {
          console.log('User has not completed KYC, redirecting...')
          navigateTo('kyc')
          return
        }
        
        setKycCheckDone(true)
      } catch (error) {
        console.error('Error checking KYC status:', error)
        setKycCheckDone(true) // Allow access even if check fails
      }
    }
    
    checkKYC()
  }, [])

  const stats = {
    activeLoads: 3,
    completedLoads: 47,
    totalEarnings: 125000,
    rating: 4.8
  }

  const activeLoads = [
    {
      id: "TL001",
      pickup: "Lagos, Nigeria",
      destination: "Abuja, Nigeria",
      cargo: "Electronics",
      weight: "2.5 tons",
      payment: "₦180,000",
      deadline: "2024-01-28",
      status: "in_transit"
    },
    {
      id: "TL002",
      pickup: "Kano, Nigeria",
      destination: "Port Harcourt, Nigeria",
      cargo: "Food Items",
      weight: "1.8 tons",
      payment: "₦220,000",
      deadline: "2024-01-30",
      status: "pickup_ready"
    }
  ]

  const availableLoads = [
    {
      id: "AL001",
      pickup: "Ibadan, Nigeria",
      destination: "Kaduna, Nigeria",
      cargo: "Textiles",
      weight: "3.2 tons",
      payment: "₦200,000",
      deadline: "2024-02-02",
      distance: "450km"
    },
    {
      id: "AL002",
      pickup: "Benin City, Nigeria",
      destination: "Jos, Nigeria",
      cargo: "Agricultural Products",
      weight: "2.1 tons",
      payment: "₦165,000",
      deadline: "2024-02-05",
      distance: "380km"
    }
  ]

  // Fetch documents on mount for profile photo in header
  useEffect(() => {
    const fetchDocuments = async () => {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
      const token = localStorage.getItem('authToken')
      
      if (!token) return
      
      if (activeTab === 'documents') setLoadingDocs(true)
      
      try {
        const response = await fetch(`${API_BASE_URL}/kyc/documents`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await response.json()
        if (data.success) {
          setDocuments(data.documents)
        }
      } catch (error) {
        console.error('Error fetching documents:', error)
      } finally {
        if (activeTab === 'documents') setLoadingDocs(false)
      }
    }
    
    fetchDocuments()
  }, [activeTab])

  // Handle document upload
  const handleDocumentUpload = async (documentType, file) => {
    if (!file) return
    
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
    setUploadingDoc(documentType)
    try {
      const formData = new FormData()
      formData.append(documentType, file)
      
      // Add required fields from existing documents
      if (documents.phone) formData.append('phone', documents.phone)
      if (documents.address) formData.append('address', documents.address)
      if (documents.nin) formData.append('nin', documents.nin)
      if (documents.plateNumber) formData.append('plateNumber', documents.plateNumber)
      if (documents.vehicleType) formData.append('vehicleType', documents.vehicleType)
      
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/kyc/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      const data = await response.json()
      if (response.ok) {
        toast.success('Document uploaded successfully!')
        // Refresh documents
        const refreshResponse = await fetch(`${API_BASE_URL}/kyc/documents`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const refreshData = await refreshResponse.json()
        if (refreshData.success) {
          setDocuments(refreshData.documents)
        }
      } else {
        toast.error(data.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      toast.error('Error uploading document')
    } finally {
      setUploadingDoc(null)
    }
  }

  // Trigger file input
  const triggerFileUpload = (documentType) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,application/pdf'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        handleDocumentUpload(documentType, file)
      }
    }
    input.click()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "in_transit":   return "bg-primary text-text-light"
      case "pickup_ready": return "bg-success text-text-light"
      case "delivered":    return "bg-muted text-text-secondary"
      default:             return "bg-warning text-text-light"
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "in_transit":   return "In Transit"
      case "pickup_ready": return "Ready for Pickup"
      case "delivered":    return "Delivered"
      default:             return "Pending"
    }
  }

  // Show loading while checking KYC status
  if (!kycCheckDone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {documents?.profilePhoto ? (
                <img 
                  src={documents.profilePhoto} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-xl object-cover border-2 border-primary"
                />
              ) : (
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Truck className="w-6 h-6 text-text-light" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-text-primary">Trucker Dashboard</h1>
                <p className="text-text-secondary text-sm">
                  Welcome back, {user?.fullName || "Driver"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 bg-muted rounded-lg text-text-secondary hover:bg-muted/80 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 bg-muted rounded-lg text-text-secondary hover:bg-muted/80 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button 
                onClick={logoutUser}
                className="p-2 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-muted/50 rounded-xl p-1 overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: TrendingUp },
            { id: "active",   label: "Active Loads", icon: Truck },
            { id: "available",label: "Available Loads", icon: Package },
            { id: "documents", label: "Documents", icon: FileText },
            { id: "profile",  label: "Profile", icon: User }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-text-light"
                  : "text-text-secondary hover:text-text-primary hover:bg-muted"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">Active Loads</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.activeLoads}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Truck className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">Completed</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.completedLoads}</p>
                  </div>
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">Total Earnings</p>
                    <p className="text-2xl font-bold text-text-primary">
                      ₦{stats.totalEarnings.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-secondary" />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">Rating</p>
                    <div className="flex items-center space-x-1">
                      <p className="text-2xl font-bold text-text-primary">{stats.rating}</p>
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Star className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-xl font-bold text-text-primary mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="text-text-primary font-medium">Load TL003 delivered successfully</p>
                    <p className="text-text-secondary text-sm">Lagos to Abuja • ₦180,000</p>
                  </div>
                  <p className="text-text-secondary text-sm">2 hours ago</p>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-text-primary font-medium">Started journey for Load TL001</p>
                    <p className="text-text-secondary text-sm">Kano to Port Harcourt • ₦220,000</p>
                  </div>
                  <p className="text-text-secondary text-sm">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Loads Tab */}
        {activeTab === "active" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-primary">Active Loads</h2>
              <button className="bg-primary text-text-light px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                View All
              </button>
            </div>

            <div className="grid gap-6">
              {activeLoads.map((load) => (
                <div key={load.id} className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-bold text-text-primary">Load #{load.id}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(load.status)}`}>
                        {getStatusText(load.status)}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-success">{load.payment}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-text-secondary" />
                      <div>
                        <p className="text-text-secondary text-sm">Pickup</p>
                        <p className="text-text-primary font-medium">{load.pickup}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Navigation className="w-4 h-4 text-text-secondary" />
                      <div>
                        <p className="text-text-secondary text-sm">Destination</p>
                        <p className="text-text-primary font-medium">{load.destination}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-text-secondary" />
                      <div>
                        <p className="text-text-secondary text-sm">Cargo</p>
                        <p className="text-text-primary font-medium">{load.cargo}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-text-secondary" />
                      <div>
                        <p className="text-text-secondary text-sm">Deadline</p>
                        <p className="text-text-primary font-medium">{load.deadline}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div className="flex items-center space-x-4">
                      <p className="text-text-secondary">
                        Weight: <span className="text-text-primary font-medium">{load.weight}</span>
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium hover:bg-primary/20 transition-colors">
                        Track
                      </button>
                      <button className="bg-success/10 text-success px-4 py-2 rounded-lg font-medium hover:bg-success/20 transition-colors">
                        Update Status
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Loads Tab */}
        {activeTab === "available" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-primary">Available Loads</h2>
              <div className="flex space-x-2">
                <button className="bg-muted text-text-secondary px-4 py-2 rounded-lg font-medium hover:bg-muted/80 transition-colors">
                  Filters
                </button>
                <button className="bg-primary text-text-light px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  Refresh
                </button>
              </div>
            </div>

            <div className="grid gap-6">
              {availableLoads.map((load) => (
                <div key={load.id} className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-text-primary">Load #{load.id}</h3>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-success">{load.payment}</p>
                      <p className="text-text-secondary text-sm">{load.distance}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-text-secondary" />
                      <div>
                        <p className="text-text-secondary text-sm">Pickup</p>
                        <p className="text-text-primary font-medium">{load.pickup}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Navigation className="w-4 h-4 text-text-secondary" />
                      <div>
                        <p className="text-text-secondary text-sm">Destination</p>
                        <p className="text-text-primary font-medium">{load.destination}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-text-secondary" />
                      <div>
                        <p className="text-text-secondary text-sm">Cargo</p>
                        <p className="text-text-primary font-medium">{load.cargo}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-text-secondary" />
                      <div>
                        <p className="text-text-secondary text-sm">Deadline</p>
                        <p className="text-text-primary font-medium">{load.deadline}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center space-x-4">
                      <p className="text-text-secondary">
                        Weight: <span className="text-text-primary font-medium">{load.weight}</span>
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="bg-muted text-text-secondary px-4 py-2 rounded-lg font-medium hover:bg-muted/80 transition-colors">
                        View Details
                      </button>
                      <button className="bg-primary text-text-light px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                        Accept Load
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-primary">My Documents</h2>
            </div>

            {loadingDocs ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-text-secondary">Loading documents...</p>
                </div>
              </div>
            ) : documents ? (
              <>
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      documents.kycStatus === 'verified' ? 'bg-success/10' : 
                      documents.kycStatus === 'pending' ? 'bg-warning/10' : 'bg-muted'
                    }`}>
                      {documents.kycStatus === 'verified' ? (
                        <CheckCircle className="w-6 h-6 text-success" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-warning" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">
                        {documents.kycStatus === 'verified' ? 'Verification Status: Verified' :
                         documents.kycStatus === 'pending' ? 'Verification Status: Pending Review' :
                         'Verification Status: Not Submitted'}
                      </h3>
                      <p className="text-text-secondary text-sm">
                        {documents.kycStatus === 'verified' ? 'Your documents have been verified' :
                         documents.kycStatus === 'pending' ? 'Your documents are under review' :
                         'Please upload your documents for verification'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Profile Photo */}
                    {documents.profilePhoto ? (
                      <div className="bg-muted/30 rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors">
                        <div className="relative">
                          <img 
                            src={documents.profilePhoto} 
                            alt="Profile Photo" 
                            className="w-full h-32 object-cover cursor-pointer"
                            onClick={() => window.open(documents.profilePhoto, '_blank')}
                          />
                          <div className="absolute top-2 right-2 bg-success/90 backdrop-blur-sm rounded-full p-1.5">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-medium text-text-primary mb-2">Profile Photo</h4>
                          <button 
                            onClick={() => triggerFileUpload('profilePhoto')}
                            disabled={uploadingDoc === 'profilePhoto'}
                            className="w-full bg-secondary/10 text-secondary px-3 py-2 rounded-lg text-sm font-medium hover:bg-secondary/20 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
                          >
                            {uploadingDoc === 'profilePhoto' ? (
                              <>
                                <Loader className="w-4 h-4 animate-spin" />
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                <span>Update Photo</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/30 rounded-xl p-4 border border-dashed border-border hover:border-warning/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                              <User className="w-5 h-5 text-warning" />
                            </div>
                            <div>
                              <h4 className="font-medium text-text-primary">Profile Photo</h4>
                              <p className="text-xs text-warning">Not uploaded</p>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => triggerFileUpload('profilePhoto')}
                          disabled={uploadingDoc === 'profilePhoto'}
                          className="w-full bg-muted text-text-secondary px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
                        >
                          {uploadingDoc === 'profilePhoto' ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>Upload Document</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Utility Bill */}
                    {documents.utilityBill ? (
                      <div className="bg-muted/30 rounded-xl p-4 border border-border hover:border-primary/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium text-text-primary">Utility Bill</h4>
                              <p className="text-xs text-text-secondary">Proof of Address</p>
                            </div>
                          </div>
                          <CheckCircle className="w-5 h-5 text-success" />
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => window.open(documents.utilityBill, '_blank')}
                            className="flex-1 bg-primary/10 text-primary px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors flex items-center justify-center space-x-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                          <button 
                            onClick={() => triggerFileUpload('utilityBill')}
                            disabled={uploadingDoc === 'utilityBill'}
                            className="flex-1 bg-secondary/10 text-secondary px-3 py-2 rounded-lg text-sm font-medium hover:bg-secondary/20 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
                          >
                            {uploadingDoc === 'utilityBill' ? (
                              <>
                                <Loader className="w-4 h-4 animate-spin" />
                                <span>...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                <span>Update</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/30 rounded-xl p-4 border border-dashed border-border hover:border-warning/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-warning" />
                            </div>
                            <div>
                              <h4 className="font-medium text-text-primary">Utility Bill</h4>
                              <p className="text-xs text-warning">Not uploaded (Optional)</p>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => triggerFileUpload('utilityBill')}
                          disabled={uploadingDoc === 'utilityBill'}
                          className="w-full bg-muted text-text-secondary px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
                        >
                          {uploadingDoc === 'utilityBill' ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>Upload Document</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Driver's License - Trucker Specific */}
                    {documents.driverLicense ? (
                      <div className="bg-muted/30 rounded-xl p-4 border border-border hover:border-primary/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                              <Truck className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                              <h4 className="font-medium text-text-primary">Driver's License</h4>
                              <p className="text-xs text-text-secondary">Commercial License</p>
                            </div>
                          </div>
                          <CheckCircle className="w-5 h-5 text-success" />
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => window.open(documents.driverLicense, '_blank')}
                            className="flex-1 bg-primary/10 text-primary px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors flex items-center justify-center space-x-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                          <button 
                            onClick={() => triggerFileUpload('driverLicense')}
                            disabled={uploadingDoc === 'driverLicense'}
                            className="flex-1 bg-secondary/10 text-secondary px-3 py-2 rounded-lg text-sm font-medium hover:bg-secondary/20 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
                          >
                            {uploadingDoc === 'driverLicense' ? (
                              <>
                                <Loader className="w-4 h-4 animate-spin" />
                                <span>...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                <span>Update</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/30 rounded-xl p-4 border border-dashed border-border hover:border-warning/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                              <Truck className="w-5 h-5 text-warning" />
                            </div>
                            <div>
                              <h4 className="font-medium text-text-primary">Driver's License</h4>
                              <p className="text-xs text-warning">Not uploaded</p>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => triggerFileUpload('driverLicense')}
                          disabled={uploadingDoc === 'driverLicense'}
                          className="w-full bg-muted text-text-secondary px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
                        >
                          {uploadingDoc === 'driverLicense' ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>Upload Document</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Vehicle Registration - Trucker Specific */}
                    {documents.vehicleReg ? (
                      <div className="bg-muted/30 rounded-xl p-4 border border-border hover:border-primary/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                              <h4 className="font-medium text-text-primary">Vehicle Registration</h4>
                              <p className="text-xs text-text-secondary">Uploaded</p>
                            </div>
                          </div>
                          <CheckCircle className="w-5 h-5 text-success" />
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => window.open(documents.vehicleReg, '_blank')}
                            className="flex-1 bg-primary/10 text-primary px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors flex items-center justify-center space-x-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                          <button 
                            onClick={() => triggerFileUpload('vehicleReg')}
                            disabled={uploadingDoc === 'vehicleReg'}
                            className="flex-1 bg-secondary/10 text-secondary px-3 py-2 rounded-lg text-sm font-medium hover:bg-secondary/20 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
                          >
                            {uploadingDoc === 'vehicleReg' ? (
                              <>
                                <Loader className="w-4 h-4 animate-spin" />
                                <span>...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                <span>Update</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/30 rounded-xl p-4 border border-dashed border-border hover:border-warning/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-warning" />
                            </div>
                            <div>
                              <h4 className="font-medium text-text-primary">Vehicle Registration</h4>
                              <p className="text-xs text-warning">Not uploaded</p>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => triggerFileUpload('vehicleReg')}
                          disabled={uploadingDoc === 'vehicleReg'}
                          className="w-full bg-muted text-text-secondary px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
                        >
                          {uploadingDoc === 'vehicleReg' ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>Upload Document</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
            </div>

                {/* Document Information Card */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                  <div className="flex items-start space-x-3">
                    <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-text-primary mb-2">About Document Verification</h4>
                      <p className="text-text-secondary text-sm mb-3">
                        Uploading and verifying your documents helps build trust and unlocks more job opportunities on the platform.
                      </p>
                      <ul className="space-y-2 text-sm text-text-secondary">
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                          <span>Access to premium shipment opportunities</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                          <span>Higher earnings potential</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                          <span>Priority customer support</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                          <span>Trust badge on your profile</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <FileText className="w-16 h-16 text-text-secondary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">No Documents Found</h3>
                <p className="text-text-secondary mb-4">You haven't uploaded any documents yet</p>
                <button 
                  onClick={() => navigateTo('kyc')}
                  className="bg-primary text-text-light px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Upload Documents
                </button>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">Driver Profile</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-xl font-bold text-text-primary mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                    <p className="text-text-primary">{user?.fullName || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                    <p className="text-text-primary">{user?.email || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Phone</label>
                    <p className="text-text-primary">+234 801 234 5678</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">License Number</label>
                    <p className="text-text-primary">DL123456789</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-xl font-bold text-text-primary mb-4">Vehicle Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Vehicle Type</label>
                    <p className="text-text-primary">Heavy Duty Truck</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Plate Number</label>
                    <p className="text-text-primary">ABC-123XY</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Capacity</label>
                    <p className="text-text-primary">5 tons</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success">
                      Available
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-xl font-bold text-text-primary mb-4">KYC Status</h3>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-text-primary font-medium">KYC Verified</p>
                  <p className="text-text-secondary text-sm">Your account is fully verified and ready for operations</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TruckerDashboard