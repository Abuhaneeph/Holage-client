"use client"

import { useState, useEffect } from "react"
import { 
  Package, 
  MapPin, 
  DollarSign, 
  Clock, 
  Truck, 
  Star, 
  Plus,
  Bell,
  User,
  Settings,
  LogOut,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Eye,
  Edit3,
  FileText,
  Download,
  Upload,
  Loader
} from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useToast } from "../context/ToastContext"
import StateSelect from "../components/StateSelect"
import { calculateDistance, estimateShippingCost } from "../utils/distanceCalculator"

const ShipperDashboard = () => {
  const { user, logoutUser, navigateTo } = useAppContext()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState("overview")
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
  
  // Shipment form state
  const [shipmentForm, setShipmentForm] = useState({
    pickupLocation: '',
    pickupState: '',
    destination: '',
    destinationState: '',
    cargoType: '',
    weight: '',
    truckType: '',
    pickupDate: '',
    fragileItems: false,
    specialInstructions: ''
  })
  
  const [distanceInfo, setDistanceInfo] = useState(null)
  const [costEstimate, setCostEstimate] = useState(null)
  const [calculating, setCalculating] = useState(false)
  const [documents, setDocuments] = useState(null)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(null)
  
  // Auto-calculate distance and cost when states or weight change
  useEffect(() => {
    const calculateShipmentDetails = async () => {
      const { pickupState, destinationState, weight } = shipmentForm
      
      // Only calculate if both states are selected
      if (!pickupState || !destinationState) {
        setDistanceInfo(null)
        setCostEstimate(null)
        return
      }

      setCalculating(true)
      
      try {
        // Calculate distance
        const distance = await calculateDistance(pickupState, destinationState)
        setDistanceInfo(distance)
        
        // Calculate cost if weight is also provided
        if (weight && parseFloat(weight) > 0) {
          const cost = await estimateShippingCost(
            pickupState, 
            destinationState, 
            parseFloat(weight)
          )
          setCostEstimate(cost)
        } else {
          setCostEstimate(null)
        }
      } catch (error) {
        console.error('Error calculating shipment details:', error)
        setDistanceInfo(null)
        setCostEstimate(null)
      } finally {
        setCalculating(false)
      }
    }

    calculateShipmentDetails()
  }, [shipmentForm.pickupState, shipmentForm.destinationState, shipmentForm.weight])
  
  // Handle form field changes
  const handleFormChange = (field, value) => {
    setShipmentForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

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

  const stats = {
    activeShipments: 8,
    completedShipments: 156,
    totalSpent: 2450000,
    avgRating: 4.6
  }

  const activeShipments = [
    {
      id: "SH001",
      pickup: "Lagos, Nigeria",
      destination: "Abuja, Nigeria",
      cargo: "Electronics",
      weight: "2.5 tons",
      cost: "₦180,000",
      driverName: "Adamu Ibrahim",
      driverRating: 4.8,
      status: "in_transit",
      estimatedDelivery: "2024-01-28"
    },
    {
      id: "SH002",
      pickup: "Port Harcourt, Nigeria",
      destination: "Kano, Nigeria",
      cargo: "Food Items",
      weight: "1.8 tons",
      cost: "₦220,000",
      driverName: "Fatima Mohammed",
      driverRating: 4.9,
      status: "pickup_pending",
      estimatedDelivery: "2024-01-30"
    }
  ]

  const recentShipments = [
    {
      id: "SH098",
      pickup: "Ibadan, Nigeria",
      destination: "Jos, Nigeria",
      cargo: "Textiles",
      cost: "₦165,000",
      status: "delivered",
      deliveredDate: "2024-01-20",
      driverName: "Musa Bello",
      rating: 5
    },
    {
      id: "SH097",
      pickup: "Benin City, Nigeria",
      destination: "Kaduna, Nigeria",
      cargo: "Agricultural Products",
      cost: "₦145,000",
      status: "delivered",
      deliveredDate: "2024-01-18",
      driverName: "Aisha Usman",
      rating: 4
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case "in_transit":     return "bg-primary text-text-light"
      case "pickup_pending": return "bg-warning text-text-light"
      case "delivered":      return "bg-success text-text-light"
      case "cancelled":      return "bg-error text-text-light"
      default:               return "bg-muted text-text-secondary"
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "in_transit":     return "In Transit"
      case "pickup_pending": return "Pickup Pending"
      case "delivered":      return "Delivered"
      case "cancelled":      return "Cancelled"
      default:               return "Unknown"
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
                  <Package className="w-6 h-6 text-text-light" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-text-primary">Shipper Dashboard</h1>
                <p className="text-text-secondary text-sm">
                  Welcome back, {user?.fullName || "Business Owner"}
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
            { id: "active",   label: "Active Shipments", icon: Truck },
            { id: "create",   label: "Create Shipment", icon: Plus },
            { id: "history",  label: "History", icon: Clock },
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
                    <p className="text-text-secondary text-sm">Active Shipments</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.activeShipments}</p>
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
                    <p className="text-2xl font-bold text-text-primary">{stats.completedShipments}</p>
                  </div>
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">Total Spent</p>
                    <p className="text-2xl font-bold text-text-primary">
                      ₦{stats.totalSpent.toLocaleString()}
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
                    <p className="text-text-secondary text-sm">Avg Rating</p>
                    <div className="flex items-center space-x-1">
                      <p className="text-2xl font-bold text-text-primary">{stats.avgRating}</p>
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Star className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-xl font-bold text-text-primary mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab("create")}
                  className="bg-primary text-text-light p-4 rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center space-x-3"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create New Shipment</span>
                </button>

                <button className="bg-muted text-text-secondary p-4 rounded-xl font-medium hover:bg-muted/80 transition-colors flex items-center space-x-3">
                  <Search className="w-5 h-5" />
                  <span>Find Truckers</span>
                </button>

                <button className="bg-muted text-text-secondary p-4 rounded-xl font-medium hover:bg-muted/80 transition-colors flex items-center space-x-3">
                  <Clock className="w-5 h-5" />
                  <span>Track Shipments</span>
                </button>
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
                    <p className="text-text-primary font-medium">Shipment SH098 delivered successfully</p>
                    <p className="text-text-secondary text-sm">
                      Ibadan to Jos • ₦165,000 • Driver: Musa Bello
                    </p>
                  </div>
                  <p className="text-text-secondary text-sm">2 hours ago</p>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Truck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-text-primary font-medium">Shipment SH001 is in transit</p>
                    <p className="text-text-secondary text-sm">
                      Lagos to Abuja • ₦180,000 • Driver: Adamu Ibrahim
                    </p>
                  </div>
                  <p className="text-text-secondary text-sm">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Shipments Tab */}
        {activeTab === "active" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-primary">Active Shipments</h2>
              <div className="flex space-x-2">
                <button className="bg-muted text-text-secondary px-4 py-2 rounded-lg font-medium hover:bg-muted/80 transition-colors flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>
                <button className="bg-primary text-text-light px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  Refresh
                </button>
              </div>
            </div>

            <div className="grid gap-6">
              {activeShipments.map((shipment) => (
                <div key={shipment.id} className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-bold text-text-primary">Shipment #{shipment.id}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}
                      >
                        {getStatusText(shipment.status)}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-success">{shipment.cost}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-success" />
                      <div>
                        <p className="text-text-secondary text-sm">Pickup</p>
                        <p className="text-text-primary font-medium">{shipment.pickup}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-error" />
                      <div>
                        <p className="text-text-secondary text-sm">Destination</p>
                        <p className="text-text-primary font-medium">{shipment.destination}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-text-secondary" />
                      <div>
                        <p className="text-text-secondary text-sm">Cargo</p>
                        <p className="text-text-primary font-medium">{shipment.cargo}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-text-secondary" />
                      <div>
                        <p className="text-text-secondary text-sm">Est. Delivery</p>
                        <p className="text-text-primary font-medium">{shipment.estimatedDelivery}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-text-light" />
                        </div>
                        <div>
                          <p className="text-text-primary font-medium text-sm">{shipment.driverName}</p>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-text-secondary text-xs">{shipment.driverRating}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-text-secondary">
                        Weight: <span className="text-text-primary font-medium">{shipment.weight}</span>
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium hover:bg-primary/20 transition-colors flex items-center space-x-2">
                        <Eye className="w-4 h-4" />
                        <span>Track</span>
                      </button>
                      <button className="bg-muted text-text-secondary px-4 py-2 rounded-lg font-medium hover:bg-muted/80 transition-colors">
                        Contact Driver
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Shipment Tab */}
        {activeTab === "create" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">Create New Shipment</h2>

            <div className="bg-card border border-border rounded-xl p-6">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Pickup Location</label>
                    <input
                      type="text"
                      value={shipmentForm.pickupLocation}
                      onChange={(e) => handleFormChange('pickupLocation', e.target.value)}
                      className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-text-primary placeholder-text-secondary"
                      placeholder="Enter pickup address"
                    />
                  </div>

                  <StateSelect 
                    label="Pickup State" 
                    placeholder="Select pickup state"
                    name="pickupState"
                    value={shipmentForm.pickupState}
                    onChange={(e) => handleFormChange('pickupState', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Destination</label>
                    <input
                      type="text"
                      value={shipmentForm.destination}
                      onChange={(e) => handleFormChange('destination', e.target.value)}
                      className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-text-primary placeholder-text-secondary"
                      placeholder="Enter destination address"
                    />
                  </div>

                  <StateSelect 
                    label="Destination State" 
                    placeholder="Select destination state"
                    name="destinationState"
                    value={shipmentForm.destinationState}
                    onChange={(e) => handleFormChange('destinationState', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Cargo Type</label>
                    <select 
                      value={shipmentForm.cargoType}
                      onChange={(e) => handleFormChange('cargoType', e.target.value)}
                      className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-text-primary [&>option]:bg-white [&>option]:text-gray-900">
                      <option value="" className="bg-white text-gray-900">Select cargo type</option>
                      <option value="electronics" className="bg-white text-gray-900">Electronics</option>
                      <option value="food" className="bg-white text-gray-900">Food Items</option>
                      <option value="textiles" className="bg-white text-gray-900">Textiles</option>
                      <option value="agricultural" className="bg-white text-gray-900">Agricultural Products/Perishables</option>
                      <option value="other" className="bg-white text-gray-900">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Weight (tons)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={shipmentForm.weight}
                      onChange={(e) => handleFormChange('weight', e.target.value)}
                      className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-text-primary placeholder-text-secondary"
                      placeholder="e.g., 2.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Truck Type Required</label>
                    <select 
                      value={shipmentForm.truckType}
                      onChange={(e) => handleFormChange('truckType', e.target.value)}
                      className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-text-primary [&>option]:bg-white [&>option]:text-gray-900">
                      <option value="" className="bg-white text-gray-900">Select truck type</option>
                      <option value="flatbed" className="bg-white text-gray-900">Flatbed Truck</option>
                      <option value="container" className="bg-white text-gray-900">Container Truck</option>
                      <option value="refrigerated" className="bg-white text-gray-900">Refrigerated Truck</option>
                      <option value="tanker" className="bg-white text-gray-900">Tanker</option>
                      <option value="box-truck" className="bg-white text-gray-900">Box Truck</option>
                      <option value="pickup" className="bg-white text-gray-900">Pickup Truck</option>
                      <option value="trailer" className="bg-white text-gray-900">Trailer</option>
                      <option value="other" className="bg-white text-gray-900">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Pickup Date</label>
                    <input
                      type="date"
                      value={shipmentForm.pickupDate}
                      onChange={(e) => handleFormChange('pickupDate', e.target.value)}
                      className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-text-primary"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="fragileItems"
                      checked={shipmentForm.fragileItems}
                      onChange={(e) => handleFormChange('fragileItems', e.target.checked)}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0 bg-input cursor-pointer"
                    />
                    <label htmlFor="fragileItems" className="text-sm font-medium text-text-primary cursor-pointer select-none">
                      Fragile Items (requires special handling)
                    </label>
                  </div>
                </div>

                {/* Distance and Cost Estimation Display */}
                {calculating && (
                  <div className="bg-muted/30 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-text-secondary">Calculating distance and cost...</p>
                    </div>
                  </div>
                )}

                {distanceInfo && !calculating && (
                  <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-xl p-6">
                    <h4 className="font-semibold text-text-primary mb-4 flex items-center">
                      <Truck className="w-5 h-5 mr-2 text-primary" />
                      Shipment Estimate
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-3 bg-card/50 rounded-lg p-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-text-secondary text-xs">Distance</p>
                          <p className="text-text-primary font-bold text-lg">
                            {distanceInfo.distance} km
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 bg-card/50 rounded-lg p-3">
                        <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Clock className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                          <p className="text-text-secondary text-xs">Est. Duration</p>
                          <p className="text-text-primary font-bold text-lg">
                            {distanceInfo.estimatedDuration}
                          </p>
                        </div>
                      </div>
                      
                      {costEstimate && (
                        <div className="flex items-center space-x-3 bg-card/50 rounded-lg p-3">
                          <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <DollarSign className="w-6 h-6 text-success" />
                          </div>
                          <div>
                            <p className="text-text-secondary text-xs">Est. Cost</p>
                            <p className="text-success font-bold text-xl">
                              {costEstimate.cost.formattedCost}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-text-secondary bg-card/30 rounded-lg p-3 flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-primary" />
                      <span className="font-medium">Route:</span>
                      <span className="ml-1">{distanceInfo.route}</span>
                    </div>

                    {costEstimate && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <p className="text-xs text-text-secondary mb-2 font-medium">Cost Breakdown:</p>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between text-text-secondary">
                            <span className="flex items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></span>
                              Diesel Cost ({costEstimate.cost.litersNeeded}L @ ₦{costEstimate.cost.dieselRate.toLocaleString()}/L)
                            </span>
                            <span className="text-text-primary font-medium">₦{costEstimate.cost.dieselCost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-text-secondary">
                            <span className="flex items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary mr-2"></span>
                              Tonnage Cost ({costEstimate.cost.weight}t × {distanceInfo.distance}km × ₦{costEstimate.cost.tonnageRatePerKm}/t-km)
                            </span>
                            <span className="text-text-primary font-medium">₦{costEstimate.cost.tonnageCost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-text-secondary">
                            <span className="flex items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent mr-2"></span>
                              Base Service Fee
                            </span>
                            <span className="text-text-primary font-medium">₦{costEstimate.cost.baseFee.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-text-primary font-semibold pt-1 mt-1 border-t border-border/30">
                            <span>Total Estimated Cost</span>
                            <span className="text-success">₦{costEstimate.cost.totalCost.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-text-secondary bg-muted/30 rounded-lg p-2">
                          <p className="flex items-center">
                            <span className="mr-1">💡</span>
                            <span>Fuel efficiency: {costEstimate.cost.fuelEfficiency} km/L | Weight band rate: ₦{costEstimate.cost.tonnageRatePerKm}/ton-km</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {distanceInfo && !costEstimate && shipmentForm.pickupState && shipmentForm.destinationState && !calculating && (
                  <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-warning font-medium text-sm">Add weight to see cost estimate</p>
                      <p className="text-text-secondary text-xs mt-1">Enter the cargo weight in tons to calculate the estimated shipping cost.</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Special Instructions</label>
                  <textarea
                    rows="4"
                    value={shipmentForm.specialInstructions}
                    onChange={(e) => handleFormChange('specialInstructions', e.target.value)}
                    className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-text-primary placeholder-text-secondary"
                    placeholder="Any special handling instructions..."
                  ></textarea>
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    type="submit"
                    className="bg-primary text-text-light px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Create Shipment
                  </button>
                  <button
                    type="button"
                    className="bg-muted text-text-secondary px-6 py-3 rounded-xl font-medium hover:bg-muted/80 transition-colors"
                  >
                    Save as Draft
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-primary">Shipment History</h2>
              <div className="flex space-x-2">
                <button className="bg-muted text-text-secondary px-4 py-2 rounded-lg font-medium hover:bg-muted/80 transition-colors">
                  Export
                </button>
                <button className="bg-muted text-text-secondary px-4 py-2 rounded-lg font-medium hover:bg-muted/80 transition-colors flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              {recentShipments.map((shipment) => (
                <div key={shipment.id} className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-bold text-text-primary">#{shipment.id}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}
                        >
                          {getStatusText(shipment.status)}
                        </span>
                      </div>
                      <div className="text-text-secondary text-sm">
                        <p>{shipment.pickup} → {shipment.destination}</p>
                        <p>Driver: {shipment.driverName}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-success">{shipment.cost}</p>
                      <p className="text-text-secondary text-sm">Delivered: {shipment.deliveredDate}</p>
                      <div className="flex items-center space-x-1 justify-end mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < shipment.rating ? "text-yellow-500 fill-current" : "text-text-secondary"
                            }`}
                          />
                        ))}
                      </div>
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
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-text-primary">Profile Photo</h4>
                          </div>
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
                      <div className="bg-muted/30 rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors">
                        <div className="relative bg-gradient-to-br from-primary/5 to-secondary/5 cursor-pointer" onClick={() => window.open(documents.utilityBill, '_blank')}>
                          {documents.utilityBill.toLowerCase().includes('.pdf') ? (
                            <div className="h-32 flex flex-col items-center justify-center">
                              <FileText className="w-12 h-12 text-primary mb-2" />
                              <p className="text-text-secondary text-sm">PDF Document</p>
                              <p className="text-text-secondary text-xs">Click to view</p>
                            </div>
                          ) : (
                            <img 
                              src={documents.utilityBill} 
                              alt="Utility Bill" 
                              className="w-full h-48 object-cover"
                            />
                          )}
                          <div className="absolute top-2 right-2 bg-success/90 backdrop-blur-sm rounded-full p-1.5">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-text-primary">Utility Bill</h4>
                              <p className="text-xs text-text-secondary">Proof of Address</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => triggerFileUpload('utilityBill')}
                            disabled={uploadingDoc === 'utilityBill'}
                            className="w-full bg-secondary/10 text-secondary px-3 py-2 rounded-lg text-sm font-medium hover:bg-secondary/20 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
                          >
                            {uploadingDoc === 'utilityBill' ? (
                              <>
                                <Loader className="w-4 h-4 animate-spin" />
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                <span>Update Document</span>
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
                  </div>
            </div>

                {/* Document Information Card */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                  <div className="flex items-start space-x-3">
                    <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-text-primary mb-2">About Document Verification</h4>
                      <p className="text-text-secondary text-sm mb-3">
                        Uploading and verifying your documents helps build trust and unlocks additional features on the platform.
                      </p>
                      <ul className="space-y-2 text-sm text-text-secondary">
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                          <span>Increased credibility with truckers</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                          <span>Access to premium shipping options</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                          <span>Priority customer support</span>
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
            <h2 className="text-2xl font-bold text-text-primary">Business Profile</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-text-primary">Company Information</h3>
                  <button className="text-secondary hover:text-secondary/80">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Company Name</label>
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
                    <label className="block text-sm font-medium text-text-secondary mb-1">Business Registration</label>
                    <p className="text-text-primary">RC123456789</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-xl font-bold text-text-primary mb-4">Account Statistics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Member Since</span>
                    <span className="text-text-primary font-medium">January 2023</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Total Shipments</span>
                    <span className="text-text-primary font-medium">{stats.completedShipments + stats.activeShipments}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Success Rate</span>
                    <span className="text-success font-medium">98.5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Average Rating</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-text-primary font-medium">{stats.avgRating}</span>
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    </div>
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
                  <p className="text-text-primary font-medium">Business Verified</p>
                  <p className="text-text-secondary text-sm">
                    Your business account is fully verified and ready for shipping
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShipperDashboard