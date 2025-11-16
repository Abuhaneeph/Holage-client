"use client"

import { useState, useEffect } from "react"
import {
  Truck,
  Wallet,
  User,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
  Loader,
  LogOut,
  Users,
  CheckCircle,
  X,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  CreditCard
} from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useToast } from "../context/ToastContext"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const FleetManagerDashboard = () => {
  const { user, logoutUser, navigateTo } = useAppContext()
  const toast = useToast()
  const [activeView, setActiveView] = useState("home")
  const [showBalance, setShowBalance] = useState(true)
  const [wallet, setWallet] = useState(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [kycCheckDone, setKycCheckDone] = useState(false)
  const [documents, setDocuments] = useState(null)
  
  // Trucks state
  const [trucks, setTrucks] = useState([])
  const [loadingTrucks, setLoadingTrucks] = useState(false)
  const [showAddTruckModal, setShowAddTruckModal] = useState(false)
  const [showEditTruckModal, setShowEditTruckModal] = useState(false)
  const [selectedTruck, setSelectedTruck] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  
  // Truck form state
  const [truckForm, setTruckForm] = useState({
    plateNumber: "",
    vehicleType: "",
    driverLicense: "",
    vehicleReg: "",
    status: "active",
  })

  const vehicleTypes = [
    "Flatbed trucks",
    "Container trucks",
    "refrigerated trucks",
    "10 ton packers",
    "15 ton packers",
    "20 ton 12 tyres",
    "30 ton 12 tyres",
    "40 tons trailer",
    "50 tons trailer",
    "60 tons trailer",
  ]

  // Fetch trucks
  const fetchTrucks = async () => {
    setLoadingTrucks(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/trucks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (response.ok && data.success) {
        setTrucks(data.trucks || [])
      } else {
        toast.error(data.message || 'Failed to fetch trucks')
      }
    } catch (error) {
      console.error('Error fetching trucks:', error)
      toast.error('Error fetching trucks')
    } finally {
      setLoadingTrucks(false)
    }
  }

  // Check KYC and fetch data
  useEffect(() => {
    const checkKYC = async () => {
      try {
        const token = localStorage.getItem('authToken')
        
        if (!token) {
          navigateTo('login')
          return
        }
        
        const response = await fetch(`${API_BASE_URL}/kyc/documents`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()
        
        if (data.success) {
          setDocuments(data.documents)
          
          if (!data.documents.phone || !data.documents.address || !data.documents.nin) {
            navigateTo('kyc')
            return
          }
        }
        
        setKycCheckDone(true)
        fetchTrucks()
        
        // Fetch wallet
        try {
          const wr = await fetch(`${API_BASE_URL}/wallet`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const wd = await wr.json()
          if (wr.ok && wd.wallet) {
            setWallet(wd.wallet)
            setWalletBalance(parseFloat(wd.wallet.balance || 0))
          }
          
          const tr = await fetch(`${API_BASE_URL}/wallet/transactions`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const td = await tr.json()
          if (tr.ok && td.transactions) setTransactions(td.transactions)
        } catch (e) {
          console.error('Error fetching wallet:', e)
        }
      } catch (error) {
        console.error('Error checking KYC status:', error)
        setKycCheckDone(true)
      }
    }
    
    checkKYC()
  }, [])

  // Reset truck form
  const resetTruckForm = () => {
    setTruckForm({
      plateNumber: "",
      vehicleType: "",
      driverLicense: "",
      vehicleReg: "",
      status: "active",
    })
  }

  // Handle add truck
  const handleAddTruck = async (e) => {
    e.preventDefault()
    
    if (!truckForm.plateNumber || !truckForm.vehicleType) {
      toast.error("Plate number and vehicle type are required")
      return
    }
    
    setSubmitting(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/trucks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(truckForm)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Truck added successfully!')
        setShowAddTruckModal(false)
        resetTruckForm()
        fetchTrucks()
      } else {
        toast.error(data.message || 'Failed to add truck')
      }
    } catch (error) {
      console.error('Error adding truck:', error)
      toast.error('Error adding truck')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle edit truck
  const handleEditTruck = (truck) => {
    setSelectedTruck(truck)
    setTruckForm({
      plateNumber: truck.plateNumber,
      vehicleType: truck.vehicleType,
      driverLicense: truck.driverLicense || "",
      vehicleReg: truck.vehicleReg || "",
      status: truck.status || "active",
    })
    setShowEditTruckModal(true)
  }

  // Handle update truck
  const handleUpdateTruck = async (e) => {
    e.preventDefault()
    
    if (!truckForm.plateNumber || !truckForm.vehicleType) {
      toast.error("Plate number and vehicle type are required")
      return
    }
    
    setSubmitting(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/trucks/${selectedTruck.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(truckForm)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Truck updated successfully!')
        setShowEditTruckModal(false)
        setSelectedTruck(null)
        resetTruckForm()
        fetchTrucks()
      } else {
        toast.error(data.message || 'Failed to update truck')
      }
    } catch (error) {
      console.error('Error updating truck:', error)
      toast.error('Error updating truck')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle delete truck
  const handleDeleteTruck = async (truckId) => {
    if (!window.confirm('Are you sure you want to delete this truck?')) return
    
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/trucks/${truckId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Truck deleted successfully!')
        fetchTrucks()
      } else {
        toast.error(data.message || 'Failed to delete truck')
      }
    } catch (error) {
      console.error('Error deleting truck:', error)
      toast.error('Error deleting truck')
    }
  }

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-success" />
      case 'inactive':
        return <X className="w-5 h-5 text-error" />
      case 'maintenance':
        return <Clock className="w-5 h-5 text-warning" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  if (!kycCheckDone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {documents?.profilePhoto ? (
              <img
                src={documents.profilePhoto}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <p className="text-white/80 text-sm">Fleet Manager</p>
              <p className="text-white font-bold text-lg">{user?.fullName?.split(' ')[0] || "Manager"}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateTo("complaint")}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              title="Complaints"
            >
              <AlertCircle className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              {showBalance ? <EyeOff className="w-5 h-5 text-white" /> : <Eye className="w-5 h-5 text-white" />}
            </button>
            <button
              onClick={logoutUser}
              className="w-10 h-10 bg-error/20 rounded-full flex items-center justify-center hover:bg-error/30 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {wallet && (
          <div className="mt-6">
            <p className="text-white/80 text-sm mb-1">Wallet Balance</p>
            <p className="text-white text-3xl font-bold">
              {showBalance ? `₦${walletBalance.toLocaleString()}` : '₦ • • • • • •'}
            </p>
            <div className="mt-3 text-white/90 text-sm">
              <div>Account: <span className="font-semibold tracking-wider">{wallet.accountNumber}</span></div>
              <div>Bank: <span className="font-semibold">{wallet.bankName}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="px-4 mt-6">
        {activeView === "home" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-4 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-white/80 text-sm">Total Trucks</p>
                <p className="text-white font-bold text-3xl">{trucks.length}</p>
              </div>

              <div className="bg-gradient-to-br from-success to-success/80 rounded-2xl p-4 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-white/80 text-sm">Active Trucks</p>
                <p className="text-white font-bold text-3xl">
                  {trucks.filter(t => t.status === 'active').length}
                </p>
              </div>
            </div>

            {/* Add Truck Button */}
            <button
              onClick={() => {
                resetTruckForm()
                setShowAddTruckModal(true)
              }}
              className="w-full bg-gradient-to-r from-primary to-primary/80 rounded-3xl p-6 shadow-lg flex items-center justify-center space-x-3 hover:shadow-xl transition-all"
            >
              <Plus className="w-6 h-6 text-white" />
              <span className="text-white font-bold text-lg">Add New Truck</span>
            </button>

            {/* Trucks List */}
            <div>
              <h3 className="text-text-primary font-bold text-lg mb-4">My Fleet</h3>
              
              {loadingTrucks ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-text-secondary text-sm">Loading trucks...</p>
                </div>
              ) : trucks.length > 0 ? (
                <div className="space-y-3">
                  {trucks.map((truck) => (
                    <div
                      key={truck.id}
                      className="bg-card border border-border rounded-2xl p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Truck className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-text-primary font-bold">{truck.plateNumber}</p>
                            <p className="text-text-secondary text-sm">{truck.vehicleType}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(truck.status)}
                          <span className="text-text-secondary text-xs capitalize">{truck.status}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 pt-3 border-t border-border">
                        <button
                          onClick={() => handleEditTruck(truck)}
                          className="flex-1 bg-primary text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteTruck(truck.id)}
                          className="flex-1 bg-error/10 text-error px-4 py-2 rounded-xl font-medium text-sm hover:bg-error/20 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-muted/30 rounded-2xl p-8 text-center">
                  <Truck className="w-12 h-12 text-text-secondary mx-auto mb-2" />
                  <p className="text-text-secondary">No trucks yet</p>
                  <p className="text-text-secondary text-sm mt-1">Add your first truck to get started</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === "wallet" && (
          <div className="space-y-4">
            <h2 className="text-text-primary font-bold text-2xl">Wallet</h2>
            
            
            {wallet && (
              <>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <p className="text-text-secondary mb-2">Available Balance</p>
                  <p className="text-text-primary font-bold text-4xl">₦{Number(walletBalance || 0).toLocaleString()}</p>
                </div>

                <div>
                  <h3 className="text-text-primary font-bold mb-3">Recent Transactions</h3>
                  {transactions.length === 0 ? (
                    <div className="bg-muted/30 rounded-2xl p-6 text-center text-text-secondary">
                      No transactions yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {transactions.slice(0, 10).map((t) => (
                        <div
                          key={t.id || t.reference}
                          className="bg-card border border-border rounded-xl p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-10 h-10 ${
                                t.type === 'credit' ? 'bg-success/10' : 'bg-error/10'
                              } rounded-full flex items-center justify-center`}
                            >
                              {t.type === 'credit' ? (
                                <CheckCircle className="w-5 h-5 text-success" />
                              ) : (
                                <X className="w-5 h-5 text-error" />
                              )}
                            </div>
                            <div>
                              <p className="text-text-primary font-medium">
                                {t.description || (t.type === 'credit' ? 'Wallet Funding' : 'Wallet Debit')}
                              </p>
                              <p className="text-text-secondary text-xs">Ref: {t.reference}</p>
                            </div>
                          </div>
                          <p className={`${t.type === 'credit' ? 'text-success' : 'text-error'} font-bold`}>
                            {t.type === 'credit' ? '+' : '-'}₦{Number(t.amount || 0).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeView === "profile" && (
          <div className="space-y-6">
            {/* Profile Header Card */}
            <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-4">
                {documents?.profilePhoto ? (
                  <img
                    src={documents.profilePhoto}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-4 border-white/30 shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30 shadow-lg">
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-white font-bold text-2xl mb-1">{user?.fullName || "Fleet Manager"}</h2>
                  <div className="flex items-center space-x-2 text-white/90">
                    <Mail className="w-4 h-4" />
                    <p className="text-sm">{user?.email || ""}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-text-primary font-bold text-lg mb-4 flex items-center space-x-2">
                <User className="w-5 h-5 text-primary" />
                <span>Personal Information</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-secondary text-sm mb-1">Phone Number</p>
                    <p className="text-text-primary font-medium">{documents?.phone || "Not provided"}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-secondary text-sm mb-1">Address</p>
                    <p className="text-text-primary font-medium">{documents?.address || "Not provided"}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-secondary text-sm mb-1">NIN</p>
                    <p className="text-text-primary font-medium">{documents?.nin || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Truck Modal */}
      {showAddTruckModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] flex flex-col">
            <div className="flex-shrink-0 bg-card border-b border-border p-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-text-primary font-bold text-xl">Add New Truck</h3>
              <button
                onClick={() => {
                  setShowAddTruckModal(false)
                  resetTruckForm()
                }}
                className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <form onSubmit={handleAddTruck} className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-text-primary font-medium mb-2">Plate Number *</label>
                <input
                  type="text"
                  value={truckForm.plateNumber}
                  onChange={(e) => setTruckForm({ ...truckForm, plateNumber: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  placeholder="e.g., ABC 123 XY"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2">Vehicle Type *</label>
                <select
                  value={truckForm.vehicleType}
                  onChange={(e) => setTruckForm({ ...truckForm, vehicleType: e.target.value })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  required
                  disabled={submitting}
                >
                  <option value="">Select vehicle type</option>
                  {vehicleTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    'Add Truck'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Truck Modal */}
      {showEditTruckModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] flex flex-col">
            <div className="flex-shrink-0 bg-card border-b border-border p-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-text-primary font-bold text-xl">Edit Truck</h3>
              <button
                onClick={() => {
                  setShowEditTruckModal(false)
                  setSelectedTruck(null)
                  resetTruckForm()
                }}
                className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <form onSubmit={handleUpdateTruck} className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-text-primary font-medium mb-2">Plate Number *</label>
                <input
                  type="text"
                  value={truckForm.plateNumber}
                  onChange={(e) => setTruckForm({ ...truckForm, plateNumber: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  placeholder="e.g., ABC 123 XY"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2">Vehicle Type *</label>
                <select
                  value={truckForm.vehicleType}
                  onChange={(e) => setTruckForm({ ...truckForm, vehicleType: e.target.value })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  required
                  disabled={submitting}
                >
                  <option value="">Select vehicle type</option>
                  {vehicleTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2">Status</label>
                <select
                  value={truckForm.status}
                  onChange={(e) => setTruckForm({ ...truckForm, status: e.target.value })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  disabled={submitting}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    'Update Truck'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
        <div className="grid grid-cols-4 gap-1 px-2 py-3">
          <button
            onClick={() => setActiveView("home")}
            className={`flex flex-col items-center space-y-1 py-2 rounded-xl transition-colors ${
              activeView === "home" ? "bg-primary/10" : ""
            }`}
          >
            <Truck className={`w-7 h-7 ${activeView === "home" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-xs font-medium ${activeView === "home" ? "text-primary" : "text-text-secondary"}`}>
              Fleet
            </span>
          </button>

          <button
            onClick={() => setActiveView("wallet")}
            className={`flex flex-col items-center space-y-1 py-2 rounded-xl transition-colors ${
              activeView === "wallet" ? "bg-primary/10" : ""
            }`}
          >
            <Wallet className={`w-7 h-7 ${activeView === "wallet" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-xs font-medium ${activeView === "wallet" ? "text-primary" : "text-text-secondary"}`}>
              Wallet
            </span>
          </button>

          <button
            onClick={() => navigateTo("complaint")}
            className="flex flex-col items-center space-y-1 py-2 rounded-xl transition-colors hover:bg-primary/10"
          >
            <AlertCircle className="w-7 h-7 text-text-secondary" />
            <span className="text-xs font-medium text-text-secondary">
              Complaints
            </span>
          </button>

          <button
            onClick={() => setActiveView("profile")}
            className={`flex flex-col items-center space-y-1 py-2 rounded-xl transition-colors ${
              activeView === "profile" ? "bg-primary/10" : ""
            }`}
          >
            <User className={`w-7 h-7 ${activeView === "profile" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-xs font-medium ${activeView === "profile" ? "text-primary" : "text-text-secondary"}`}>
              Profile
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default FleetManagerDashboard

