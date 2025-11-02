"use client"

import { useState, useEffect } from "react"
import { 
  Package, 
  Wallet,
  Send,
  History,
  User,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Plus,
  Truck,
  CheckCircle,
  Clock,
  X,
  Loader,
  LogOut,
  Upload,
  FileText,
  Camera,
  ChevronDown
} from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useToast } from "../context/ToastContext"
import StateSelect from "../components/StateSelect"
import SelectModal from "../components/SelectModal"
import { calculateDistance, estimateShippingCost } from "../utils/distanceCalculator"

const ShipperDashboard = () => {
  const { user, logoutUser, navigateTo } = useAppContext()
  const toast = useToast()
  const [activeView, setActiveView] = useState("home")
  const [showBalance, setShowBalance] = useState(true)
  const [wallet, setWallet] = useState(null)
  const [walletError, setWalletError] = useState("")
  const [kycCheckDone, setKycCheckDone] = useState(false)
  const [showCreateShipment, setShowCreateShipment] = useState(false)
  
  // Wallet state
  const [walletBalance, setWalletBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  
  // Documents state
  const [documents, setDocuments] = useState(null)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(null)
  
  // Modal states
  const [showCargoModal, setShowCargoModal] = useState(false)
  const [showTruckModal, setShowTruckModal] = useState(false)
  
  // Shipments state
  const [shipments, setShipments] = useState([])
  const [loadingShipments, setLoadingShipments] = useState(false)
  
  // Shipment form state
  const [shipmentForm, setShipmentForm] = useState({
    pickupState: '',
    destinationState: '',
    cargoType: '',
    weight: '',
    truckType: '',
    pickupDate: '',
    fragileItems: false
  })
  
  const [distanceInfo, setDistanceInfo] = useState(null)
  const [costEstimate, setCostEstimate] = useState(null)
  const [calculating, setCalculating] = useState(false)

  // Bank transfer funding state
  const [showFundModal, setShowFundModal] = useState(false)
  const [fundAmount, setFundAmount] = useState("")
  const [fundLoading, setFundLoading] = useState(false)
  const [fundAccount, setFundAccount] = useState(null) // { account_number, bank_name, expiry_date_in_utc }
  const [fundReference, setFundReference] = useState("")
  
  // Fetch my shipments
  const fetchMyShipments = async () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
    setLoadingShipments(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/shipping/shipments/my-shipments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (response.ok) {
        setShipments(data.shipments || [])
      } else {
        console.error('Error fetching shipments:', data.message)
      }
    } catch (error) {
      console.error('Error fetching shipments:', error)
    } finally {
      setLoadingShipments(false)
    }
  }
  
  // Check if user has completed KYC and fetch documents
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
        
        if (data.success) {
          setDocuments(data.documents)
          
          // If user hasn't filled basic KYC info, redirect to KYC page
          if (!data.documents.phone || !data.documents.address || !data.documents.nin) {
            navigateTo('kyc')
            return
          }
        }
        
        setKycCheckDone(true)
        fetchMyShipments()
        // Fetch wallet
        try {
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
          const token = localStorage.getItem('authToken')
          const wr = await fetch(`${API_BASE_URL}/wallet`, { headers: { 'Authorization': `Bearer ${token}` } })
          const wd = await wr.json()
          if (wr.ok && wd.wallet) {
            setWallet(wd.wallet)
            setWalletBalance(parseFloat(wd.wallet.balance || 0))
          } else setWalletError(wd.message || 'No wallet found')
          // Load transactions
          const tr = await fetch(`${API_BASE_URL}/wallet/transactions`, { headers: { 'Authorization': `Bearer ${token}` } })
          const td = await tr.json()
          if (tr.ok && td.transactions) setTransactions(td.transactions)
        } catch (e) { setWalletError('Failed to load wallet') }
      } catch (error) {
        console.error('Error checking KYC status:', error)
        setKycCheckDone(true)
      }
    }
    
    checkKYC()
  }, [])
  
  // Auto-calculate distance and cost
  useEffect(() => {
    const calculateShipmentDetails = async () => {
      const { pickupState, destinationState, weight } = shipmentForm
      
      if (!pickupState || !destinationState) {
        setDistanceInfo(null)
        setCostEstimate(null)
        return
      }

      setCalculating(true)
      
      try {
        const distance = await calculateDistance(pickupState, destinationState)
        setDistanceInfo(distance)
        
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
        console.error('Error calculating:', error)
        setDistanceInfo(null)
        setCostEstimate(null)
      } finally {
        setCalculating(false)
      }
    }

    calculateShipmentDetails()
  }, [shipmentForm.pickupState, shipmentForm.destinationState, shipmentForm.weight])
  
  const handleFormChange = (field, value) => {
    setShipmentForm(prev => ({ ...prev, [field]: value }))
  }
  
  const handleCreateShipment = async (e) => {
    e.preventDefault()
    
    // Validate that pickup and destination states are different
    if (shipmentForm.pickupState === shipmentForm.destinationState) {
      toast.error('Pickup and destination states cannot be the same!')
      return
    }
    
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
    const token = localStorage.getItem('authToken')
    
    try {
      const response = await fetch(`${API_BASE_URL}/shipping/shipments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(shipmentForm)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create shipment')
      }
      
      toast.success('Shipment created successfully!')
      setShowCreateShipment(false)
      setShipmentForm({
        pickupState: '',
        destinationState: '',
        cargoType: '',
        weight: '',
        truckType: '',
        pickupDate: '',
        fragileItems: false
      })
      
      // Refresh shipments list
      fetchMyShipments()
      
    } catch (error) {
      console.error('Error creating shipment:', error)
      toast.error(error.message || 'Failed to create shipment')
    }
  }

  // Handle document upload
  const handleDocumentUpload = async (documentType, file) => {
    if (!file) return
    
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
    setUploadingDoc(documentType)
    try {
      const formData = new FormData()
      formData.append(documentType, file)
      
      // Add required fields from existing documents
      if (documents?.phone) formData.append('phone', documents.phone)
      if (documents?.address) formData.append('address', documents.address)
      if (documents?.nin) formData.append('nin', documents.nin)
      
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

  // Bank transfer: initiate
  const initiateBankTransfer = async () => {
    try {
      const amountNum = parseFloat(fundAmount)
      if (!amountNum || amountNum <= 0) {
        toast.error('Enter a valid amount')
        return
      }
      setFundLoading(true)
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
      const token = localStorage.getItem('authToken')
      const reference = `holage-ref-${Date.now()}`
      const resp = await fetch(`${API_BASE_URL}/wallet/korapay/charges/bank-transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          account_name: user?.fullName || 'Holage User',
          amount: amountNum,
          currency: 'NGN',
          reference,
          customer: { name: user?.fullName || 'Holage User', email: user?.email || 'noreply@example.com' }
        })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.message || 'Failed to initiate')
      const bankAcc = data?.data?.bank_account || data?.data?.data?.bank_account || data?.data?.bank || null
      setFundAccount(bankAcc)
      setFundReference(reference)
      toast.success('Bank transfer created. Transfer to the account shown.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setFundLoading(false)
    }
  }

  // Bank transfer: confirm
  const confirmBankTransfer = async () => {
    if (!fundReference) { toast.error('No reference to confirm'); return }
    try {
      setFundLoading(true)
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
      const token = localStorage.getItem('authToken')
      // Retry loop if still processing on provider side
      const maxTries = 6
      let attempt = 0
      let success = false
      let lastErr = ''
      while (attempt < maxTries && !success) {
        const resp = await fetch(`${API_BASE_URL}/wallet/korapay/charges/${encodeURIComponent(fundReference)}/confirm`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await resp.json().catch(() => ({}))
        // Only accept 200 OK as success (202 is pending, 400 is failed)
        if (resp.status === 200) {
          success = true
          toast.success('Payment confirmed and wallet credited')
          // Refresh wallet and transactions
          try {
            const [wr, tr] = await Promise.all([
              fetch(`${API_BASE_URL}/wallet`, { headers: { 'Authorization': `Bearer ${token}` } }),
              fetch(`${API_BASE_URL}/wallet/transactions`, { headers: { 'Authorization': `Bearer ${token}` } })
            ])
            const wd = await wr.json()
            const td = await tr.json()
            if (wr.ok && wd.wallet) {
              setWallet(wd.wallet)
              setWalletBalance(parseFloat(wd.wallet.balance || 0))
            }
            if (tr.ok && td.transactions) setTransactions(td.transactions)
          } catch {}
          setShowFundModal(false)
          setFundAccount(null)
          setFundReference("")
          setFundAmount("")
          break
        } else if (resp.status === 400) {
          // Final failure
          throw new Error(data?.message || 'Confirmation failed')
        } else {
          // 202 Accepted = pending, retry
          lastErr = data?.message || 'Still processing'
          await new Promise(r => setTimeout(r, 5000))
          attempt += 1
        }
      }
      if (!success) throw new Error(lastErr)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setFundLoading(false)
    }
  }

  // Cargo and Truck options
  const cargoOptions = [
    { label: "Electronics", value: "electronics" },
    { label: "Food Items", value: "food" },
    { label: "Textiles", value: "textiles" },
    { label: "Agricultural Products", value: "agricultural" },
    { label: "Other", value: "other" }
  ]

  const truckOptions = [
    { label: "Flatbed Truck", value: "flatbed" },
    { label: "Container Truck", value: "container" },
    { label: "Refrigerated Truck", value: "refrigerated" },
    { label: "Trailer", value: "trailer" },
    { label: "Other", value: "other" }
  ]

  // Helper function to format state name
  const formatStateName = (stateSlug) => {
    if (!stateSlug) return ''
    return stateSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  // Helper function to get status info
  const getStatusInfo = (status) => {
    const statusMap = {
      'pending': { icon: Clock, color: 'warning', label: 'Pending' },
      'assigned': { icon: CheckCircle, color: 'info', label: 'Assigned' },
      'in_transit': { icon: Truck, color: 'primary', label: 'In Transit' },
      'delivered': { icon: CheckCircle, color: 'success', label: 'Delivered' },
      'cancelled': { icon: X, color: 'error', label: 'Cancelled' }
    }
    return statusMap[status] || statusMap['pending']
  }

  const activeShipments = shipments.filter(s => s.status === 'pending' || s.status === 'in_transit' || s.status === 'assigned')

  if (!kycCheckDone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Wallet Card - Always visible at top */}
      <div className="bg-gradient-to-br from-primary via-primary to-secondary p-6 rounded-b-3xl shadow-lg">
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
              <p className="text-white/80 text-sm">Welcome</p>
              <p className="text-white font-bold text-lg">{user?.fullName?.split(' ')[0] || "User"}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
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

        <div className="mt-6">
          <p className="text-white/80 text-sm mb-1">Wallet Balance</p>
          <p className="text-white text-3xl font-bold">
            {showBalance ? `₦${walletBalance.toLocaleString()}` : '₦ • • • • • •'}
          </p>
        {wallet && (
          <div className="mt-3 text-white/90 text-sm">
            <div>Account: <span className="font-semibold tracking-wider">{wallet.accountNumber}</span></div>
            <div>Name: <span className="font-semibold">{wallet.accountName}</span></div>
            <div>Bank: <span className="font-semibold">{wallet.bankName}</span></div>
          </div>
        )}
        {!wallet && walletError && (
          <div className="mt-3 text-white/80 text-xs">{walletError}</div>
        )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button 
            onClick={() => setShowFundModal(true)}
            className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 flex items-center space-x-3 hover:bg-white/30 transition-colors"
          >
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <ArrowDown className="w-5 h-5 text-primary" />
            </div>
            <span className="text-white font-medium">Add Money</span>
          </button>
          <button 
            onClick={() => toast.info('Withdraw - coming soon!')}
            className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 flex items-center space-x-3 hover:bg-white/30 transition-colors"
          >
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <ArrowUp className="w-5 h-5 text-primary" />
            </div>
            <span className="text-white font-medium">Withdraw</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 mt-6">
        {activeView === "home" && (
          <div className="space-y-6">
            {/* Create Shipment - BIG Button */}
            <button
              onClick={() => setShowCreateShipment(true)}
              className="w-full bg-gradient-to-r from-success to-success/80 rounded-3xl p-6 shadow-lg flex items-center justify-between hover:shadow-xl transition-all"
            >
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
                  <Plus className="w-8 h-8 text-success" />
                </div>
                <div className="text-left">
                  <p className="text-white font-bold text-xl">Send Shipment</p>
                  <p className="text-white/80 text-sm">Create new shipment</p>
                </div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Send className="w-6 h-6 text-white" />
              </div>
            </button>

            {/* Active Shipments */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-text-primary font-bold text-lg">Active Shipments</h3>
                <span className="text-primary text-sm font-medium">See all</span>
              </div>
              
              {loadingShipments ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-text-secondary text-sm">Loading shipments...</p>
                </div>
              ) : activeShipments.length > 0 ? (
                <div className="space-y-3">
                  {activeShipments.map((shipment) => {
                    const statusInfo = getStatusInfo(shipment.status)
                    const StatusIcon = statusInfo.icon
                    return (
                      <div key={shipment.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${statusInfo.color}/10`}>
                              <StatusIcon className={`w-6 h-6 text-${statusInfo.color}`} />
                            </div>
                            <div>
                              <p className="text-text-primary font-bold">
                                {formatStateName(shipment.pickupState)} → {formatStateName(shipment.destinationState)}
                              </p>
                              <p className="text-text-secondary text-sm">#{shipment.id} • {shipment.weight}t • {shipment.distance}km</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-success font-bold">₦{parseFloat(shipment.estimatedCost || 0).toLocaleString()}</p>
                            <p className="text-text-secondary text-xs">{statusInfo.label}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-muted/30 rounded-2xl p-8 text-center">
                  <Package className="w-12 h-12 text-text-secondary mx-auto mb-2" />
                  <p className="text-text-secondary">No active shipments</p>
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div>
              <h3 className="text-text-primary font-bold text-lg mb-4">Recent</h3>
              <div className="space-y-2">
                <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-text-primary font-medium">Delivered</p>
                      <p className="text-text-secondary text-sm">Lagos → Abuja</p>
                    </div>
                  </div>
                  <p className="text-success font-bold">₦180,000</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === "shipments" && (
          <div className="space-y-4">
            <h2 className="text-text-primary font-bold text-2xl">My Shipments</h2>
            
            {loadingShipments ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-text-secondary text-sm">Loading shipments...</p>
              </div>
            ) : shipments.length > 0 ? (
              shipments.map((shipment) => {
                const statusInfo = getStatusInfo(shipment.status)
                const StatusIcon = statusInfo.icon
                return (
                  <div key={shipment.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-${statusInfo.color}/10`}>
                          <StatusIcon className={`w-7 h-7 text-${statusInfo.color}`} />
                        </div>
                        <div>
                          <p className="text-text-primary font-bold text-lg">
                            {formatStateName(shipment.pickupState)} → {formatStateName(shipment.destinationState)}
                          </p>
                          <p className="text-text-secondary text-sm">
                            #{shipment.id} • {shipment.cargoType} • {shipment.weight}t
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                      <div>
                        <p className="text-text-secondary">Distance</p>
                        <p className="text-text-primary font-medium">{shipment.distance}km</p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Duration</p>
                        <p className="text-text-primary font-medium">{shipment.estimatedDuration}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Pickup Date</p>
                        <p className="text-text-primary font-medium">{new Date(shipment.pickupDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Status</p>
                        <p className={`text-${statusInfo.color} font-medium`}>{statusInfo.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <p className="text-success font-bold text-xl">₦{parseFloat(shipment.estimatedCost || 0).toLocaleString()}</p>
                      <button className="bg-primary text-white px-6 py-3 rounded-xl font-medium text-base">
                        View Details
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="bg-muted/30 rounded-2xl p-12 text-center">
                <Package className="w-16 h-16 text-text-secondary mx-auto mb-3" />
                <p className="text-text-primary font-medium mb-2">No shipments yet</p>
                <p className="text-text-secondary text-sm mb-4">Create your first shipment to get started</p>
                <button
                  onClick={() => setShowCreateShipment(true)}
                  className="bg-primary text-white px-6 py-3 rounded-xl font-medium"
                >
                  Create Shipment
                </button>
              </div>
            )}
          </div>
        )}

        {activeView === "wallet" && (
          <div className="space-y-4">
            <h2 className="text-text-primary font-bold text-2xl">Wallet</h2>
            
            <div className="bg-card border border-border rounded-2xl p-6">
              <p className="text-text-secondary mb-2">Available Balance</p>
              <p className="text-text-primary font-bold text-4xl">₦{Number(walletBalance || 0).toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => toast.info('Add money - coming soon!')}
                className="bg-primary text-white rounded-2xl p-6 flex flex-col items-center space-y-3"
              >
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <Plus className="w-7 h-7 text-white" />
                </div>
                <span className="font-bold">Add Money</span>
              </button>
              
              <button
                onClick={() => toast.info('Send money - coming soon!')}
                className="bg-secondary text-white rounded-2xl p-6 flex flex-col items-center space-y-3"
              >
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <Send className="w-7 h-7 text-white" />
                </div>
                <span className="font-bold">Send Money</span>
              </button>
            </div>

            <div>
              <h3 className="text-text-primary font-bold mb-3">Recent Transactions</h3>
              {transactions.length === 0 ? (
                <div className="bg-muted/30 rounded-2xl p-6 text-center text-text-secondary">No transactions yet</div>
              ) : (
              <div className="space-y-2">
                  {transactions.map((t) => (
                    <div key={t.id || t.reference} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${t.type === 'credit' ? 'bg-success/10' : 'bg-error/10'} rounded-full flex items-center justify-center`}>
                          {t.type === 'credit' ? <ArrowDown className="w-5 h-5 text-success" /> : <ArrowUp className="w-5 h-5 text-error" />}
                    </div>
                    <div>
                          <p className="text-text-primary font-medium">{t.description || (t.type === 'credit' ? 'Wallet Funding' : 'Wallet Debit')}</p>
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
          </div>
        )}

        {activeView === "profile" && (
          <div className="space-y-4">
            <h2 className="text-text-primary font-bold text-2xl">Profile</h2>
            
            {/* Profile Info Card */}
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              {documents?.profilePhoto ? (
                <img 
                  src={documents.profilePhoto} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-primary/20"
                />
              ) : (
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-primary" />
                </div>
              )}
              <p className="text-text-primary font-bold text-xl">{user?.fullName || "User"}</p>
              <p className="text-text-secondary">{user?.email || ""}</p>
            </div>

            {/* Personal Information */}
            <div>
              <h3 className="text-text-primary font-bold text-lg mb-3">Personal Information</h3>
              
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-text-secondary">Phone Number</span>
                  <span className="text-text-primary font-medium">{documents?.phone || "Not provided"}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-text-secondary">Address</span>
                  <span className="text-text-primary font-medium text-right">{documents?.address || "Not provided"}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-text-secondary">NIN</span>
                  <span className="text-text-primary font-medium">{documents?.nin || "Not provided"}</span>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div>
              <h3 className="text-text-primary font-bold text-lg mb-3">My Documents</h3>
              
              {loadingDocs ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-text-secondary text-sm">Loading...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Profile Photo */}
                  <div className={`bg-card border-2 rounded-xl p-4 ${
                    documents?.profilePhoto ? 'border-success/30' : 'border-border'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {documents?.profilePhoto ? (
                          <img 
                            src={documents.profilePhoto} 
                            alt="Profile" 
                            className="w-12 h-12 rounded-lg object-cover"
                            onClick={() => window.open(documents.profilePhoto, '_blank')}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                            <Camera className="w-6 h-6 text-warning" />
                          </div>
                        )}
                        <div>
                          <p className="text-text-primary font-bold">Profile Photo</p>
                          <p className="text-text-secondary text-sm">
                            {documents?.profilePhoto ? 'Uploaded ✓' : 'Not uploaded'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => triggerFileUpload('profilePhoto')}
                        disabled={uploadingDoc === 'profilePhoto'}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
                          documents?.profilePhoto 
                            ? 'bg-secondary/10 text-secondary hover:bg-secondary/20' 
                            : 'bg-primary text-white hover:bg-primary/90'
                        } disabled:opacity-50`}
                      >
                        {uploadingDoc === 'profilePhoto' ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            <span className="text-sm">...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span className="text-sm">{documents?.profilePhoto ? 'Update' : 'Upload'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Utility Bill */}
                  <div className={`bg-card border-2 rounded-xl p-4 ${
                    documents?.utilityBill ? 'border-success/30' : 'border-border'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {documents?.utilityBill ? (
                          documents.utilityBill.toLowerCase().includes('.pdf') ? (
                            <div 
                              className="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center cursor-pointer"
                              onClick={() => window.open(documents.utilityBill, '_blank')}
                            >
                              <FileText className="w-6 h-6 text-error" />
                            </div>
                          ) : (
                            <img 
                              src={documents.utilityBill} 
                              alt="Utility Bill" 
                              className="w-12 h-12 rounded-lg object-cover cursor-pointer"
                              onClick={() => window.open(documents.utilityBill, '_blank')}
                            />
                          )
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-text-secondary" />
                          </div>
                        )}
                        <div>
                          <p className="text-text-primary font-bold">Utility Bill</p>
                          <p className="text-text-secondary text-sm">
                            {documents?.utilityBill ? 'Uploaded ✓' : 'Optional'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => triggerFileUpload('utilityBill')}
                        disabled={uploadingDoc === 'utilityBill'}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
                          documents?.utilityBill 
                            ? 'bg-secondary/10 text-secondary hover:bg-secondary/20' 
                            : 'bg-primary text-white hover:bg-primary/90'
                        } disabled:opacity-50`}
                      >
                        {uploadingDoc === 'utilityBill' ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            <span className="text-sm">...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span className="text-sm">{documents?.utilityBill ? 'Update' : 'Upload'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Logout hint */}
            <div className="bg-muted/30 rounded-xl p-4 text-center">
              <p className="text-text-secondary text-sm">
                To logout, tap the 🚪 button at the top right
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Shipment Modal */}
      {showCreateShipment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg h-[95vh] sm:max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 bg-card border-b border-border p-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-text-primary font-bold text-xl">Create Shipment</h3>
              <button 
                onClick={() => setShowCreateShipment(false)}
                className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="flex-1 overflow-y-auto p-4 space-y-4">
              <StateSelect 
                label="From (Pickup State)" 
                placeholder="Select state"
                name="pickupState"
                value={shipmentForm.pickupState}
                onChange={(e) => handleFormChange('pickupState', e.target.value)}
                excludeValue={shipmentForm.destinationState}
              />

              <StateSelect 
                label="To (Destination State)" 
                placeholder="Select state"
                name="destinationState"
                value={shipmentForm.destinationState}
                onChange={(e) => handleFormChange('destinationState', e.target.value)}
                excludeValue={shipmentForm.pickupState}
              />

              <div>
                <label className="block text-text-primary font-medium mb-2">Weight (tons)</label>
                <input
                  type="number"
                  step="0.1"
                  value={shipmentForm.weight}
                  onChange={(e) => handleFormChange('weight', e.target.value)}
                  className="w-full px-4 py-4 bg-input border border-border rounded-xl text-text-primary text-lg"
                  placeholder="e.g., 2.5"
                  required
                />
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2">Cargo Type</label>
                <input type="hidden" name="cargoType" value={shipmentForm.cargoType} required />
                <button
                  type="button"
                  onClick={() => setShowCargoModal(true)}
                  className="w-full px-4 py-4 bg-input border border-border rounded-xl text-left flex items-center justify-between text-lg hover:bg-muted/50 transition-colors"
                >
                  <span className={shipmentForm.cargoType ? "text-text-primary font-medium" : "text-text-secondary"}>
                    {cargoOptions.find(opt => opt.value === shipmentForm.cargoType)?.label || "Select cargo"}
                  </span>
                  <ChevronDown className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2">Truck Type</label>
                <input type="hidden" name="truckType" value={shipmentForm.truckType} required />
                <button
                  type="button"
                  onClick={() => setShowTruckModal(true)}
                  className="w-full px-4 py-4 bg-input border border-border rounded-xl text-left flex items-center justify-between text-lg hover:bg-muted/50 transition-colors"
                >
                  <span className={shipmentForm.truckType ? "text-text-primary font-medium" : "text-text-secondary"}>
                    {truckOptions.find(opt => opt.value === shipmentForm.truckType)?.label || "Select truck"}
                  </span>
                  <ChevronDown className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2">Pickup Date</label>
                <input
                  type="date"
                  value={shipmentForm.pickupDate}
                  onChange={(e) => handleFormChange('pickupDate', e.target.value)}
                  className="w-full px-4 py-4 bg-input border border-border rounded-xl text-text-primary text-lg"
                  required
                />
              </div>

              <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-xl">
                <input
                  type="checkbox"
                  id="fragileItems"
                  checked={shipmentForm.fragileItems}
                  onChange={(e) => handleFormChange('fragileItems', e.target.checked)}
                  className="w-6 h-6 rounded border-border text-primary"
                />
                <label htmlFor="fragileItems" className="text-text-primary font-medium">
                  Fragile Items (special handling)
                </label>
              </div>

              {/* Cost Estimate */}
              {calculating && (
                <div className="bg-muted/30 rounded-xl p-4 text-center">
                  <Loader className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-text-secondary text-sm">Calculating...</p>
                </div>
              )}

              {costEstimate && !calculating && (
                <div className="bg-success/10 border border-success/20 rounded-xl p-4">
                  <p className="text-text-secondary text-sm mb-1">Estimated Cost</p>
                  <p className="text-success font-bold text-3xl">{costEstimate.cost.formattedCost}</p>
                  <p className="text-text-secondary text-sm mt-2">
                    Distance: {distanceInfo?.distance} km • {distanceInfo?.estimatedDuration}
                  </p>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg"
                >
                  Create Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fund Wallet Modal */}
      {showFundModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] flex flex-col">
            <div className="flex-shrink-0 bg-card border-b border-border p-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-text-primary font-bold text-xl">Add Money (Bank Transfer)</h3>
              <button onClick={() => { if (!fundLoading) { setShowFundModal(false); setFundAccount(null); setFundReference(""); setFundAmount("") } }} className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-text-primary font-medium mb-2">Amount (NGN)</label>
                <input type="number" min="100" step="1" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary" placeholder="e.g., 1500" disabled={!!fundAccount || fundLoading} />
              </div>

              {!fundAccount ? (
                <button onClick={initiateBankTransfer} disabled={fundLoading} className="w-full bg-primary text-white py-3 rounded-xl font-semibold">
                  {fundLoading ? 'Creating...' : 'Generate Bank Details'}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-text-secondary text-sm">Transfer to</p>
                    <p className="text-text-primary font-semibold tracking-wider">{fundAccount?.account_number || '------'}</p>
                    <p className="text-text-secondary text-sm">Bank: <span className="text-text-primary font-medium">{fundAccount?.bank_name || 'N/A'}</span></p>
                  </div>
                  <button onClick={confirmBankTransfer} disabled={fundLoading} className="w-full bg-success text-white py-3 rounded-xl font-semibold">
                    {fundLoading ? 'Confirming...' : 'I have paid - Confirm'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cargo Type Modal */}
      <SelectModal
        isOpen={showCargoModal}
        onClose={() => setShowCargoModal(false)}
        title="Select Cargo Type"
        options={cargoOptions}
        value={shipmentForm.cargoType}
        onChange={(value) => handleFormChange('cargoType', value)}
        searchable={false}
      />

      {/* Truck Type Modal */}
      <SelectModal
        isOpen={showTruckModal}
        onClose={() => setShowTruckModal(false)}
        title="Select Truck Type"
        options={truckOptions}
        value={shipmentForm.truckType}
        onChange={(value) => handleFormChange('truckType', value)}
        searchable={false}
      />

      {/* Bottom Navigation - BIG ICONS */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
        <div className="grid grid-cols-4 gap-1 px-2 py-3">
          <button
            onClick={() => setActiveView("home")}
            className={`flex flex-col items-center space-y-1 py-2 rounded-xl transition-colors ${
              activeView === "home" ? "bg-primary/10" : ""
            }`}
          >
            <Package className={`w-7 h-7 ${activeView === "home" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-xs font-medium ${activeView === "home" ? "text-primary" : "text-text-secondary"}`}>
              Home
            </span>
          </button>

          <button
            onClick={() => setActiveView("shipments")}
            className={`flex flex-col items-center space-y-1 py-2 rounded-xl transition-colors ${
              activeView === "shipments" ? "bg-primary/10" : ""
            }`}
          >
            <Truck className={`w-7 h-7 ${activeView === "shipments" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-xs font-medium ${activeView === "shipments" ? "text-primary" : "text-text-secondary"}`}>
              Shipments
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

export default ShipperDashboard
