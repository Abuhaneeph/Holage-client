"use client"

import { useState, useEffect } from "react"
import { 
  Truck, 
  Wallet,
  Package,
  User,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  Clock,
  MapPin,
  Navigation,
  DollarSign,
  Loader,
  LogOut,
  Upload,
  FileText,
  Camera,
  AlertCircle,
  Mail,
  Phone,
  CreditCard,
  ChevronDown,
  Search,
  X
} from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useToast } from "../context/ToastContext"
import StateSelect from "../components/StateSelect"
import SelectModal from "../components/SelectModal"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const TruckerDashboard = () => {
  const { user, logoutUser, navigateTo } = useAppContext()
  const toast = useToast()
  const [activeView, setActiveView] = useState("home")
  const [showBalance, setShowBalance] = useState(true)
  const [wallet, setWallet] = useState(null)
  const [kycCheckDone, setKycCheckDone] = useState(false)
  
  // Wallet state
  const [walletBalance, setWalletBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  
  // Documents state
  const [documents, setDocuments] = useState(null)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(null)
  
  // Bank account edit state
  const [editingBankAccount, setEditingBankAccount] = useState(false)
  const [bankAccountForm, setBankAccountForm] = useState({
    bankAccountNumber: '',
    bankCode: '',
    bankName: ''
  })
  const [banks, setBanks] = useState([])
  const [loadingBanks, setLoadingBanks] = useState(false)
  const [updatingBankAccount, setUpdatingBankAccount] = useState(false)
  const [showBankModal, setShowBankModal] = useState(false)
  const [bankSearchQuery, setBankSearchQuery] = useState('')
  
  // Fund wallet modal state
  const [showFundModal, setShowFundModal] = useState(false)
  const [fundAmount, setFundAmount] = useState("")
  const [fundAccount, setFundAccount] = useState(null)
  const [fundReference, setFundReference] = useState("")
  const [fundLoading, setFundLoading] = useState(false)
  
  // Available shipments state
  const [availableShipments, setAvailableShipments] = useState([])
  const [loadingShipments, setLoadingShipments] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [acceptingShipment, setAcceptingShipment] = useState(false)
  
  // Active loads (assigned shipments) state
  const [activeLoads, setActiveLoads] = useState([])
  const [loadingActiveLoads, setLoadingActiveLoads] = useState(false)
  
  // Filter state
  const [filters, setFilters] = useState({
    pickupState: "",
    destinationState: "",
    truckType: ""
  })
  const [states, setStates] = useState([])
  const [loadingStates, setLoadingStates] = useState(false)
  
  const truckOptions = [
    { label: "Flatbed trucks", value: "Flatbed trucks" },
    { label: "Container trucks", value: "Container trucks" },
    { label: "refrigerated trucks", value: "refrigerated trucks" },
    { label: "10 ton packers", value: "10 ton packers" },
    { label: "15 ton packers", value: "15 ton packers" },
    { label: "20 ton 12 tyres", value: "20 ton 12 tyres" },
    { label: "30 ton 12 tyres", value: "30 ton 12 tyres" },
    { label: "40 tons trailer", value: "40 tons trailer" },
    { label: "50 tons trailer", value: "50 tons trailer" },
    { label: "60 tons trailer", value: "60 tons trailer" }
  ]
  
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
        // Fetch wallet
        try {
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
          const token = localStorage.getItem('authToken')
          const wr = await fetch(`${API_BASE_URL}/wallet`, { headers: { 'Authorization': `Bearer ${token}` } })
          const wd = await wr.json()
          if (wr.ok && wd.wallet) {
            setWallet(wd.wallet)
            setWalletBalance(parseFloat(wd.wallet.balance || 0))
          } else {
            setWallet(null)
          }
          // Load transactions
          const tr = await fetch(`${API_BASE_URL}/wallet/transactions`, { headers: { 'Authorization': `Bearer ${token}` } })
          const td = await tr.json()
          if (tr.ok && td.transactions) setTransactions(td.transactions)
        } catch (e) {
          setWallet(null)
        }
        // Fetch active loads
        fetchActiveLoads()
      } catch (error) {
        console.error('Error checking KYC status:', error)
        setKycCheckDone(true)
      }
    }
    
    checkKYC()
  }, [])

  // Fetch banks list
  useEffect(() => {
    const fetchBanks = async () => {
      setLoadingBanks(true)
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
        const response = await fetch(`${API_BASE_URL}/wallet/paystack/banks`)
        const data = await response.json()
        if (data.success && data.banks && Array.isArray(data.banks)) {
          const sortedBanks = data.banks.sort((a, b) => a.name.localeCompare(b.name))
          setBanks(sortedBanks)
          console.log('Banks loaded successfully:', sortedBanks.length)
        } else {
          console.error('Failed to fetch banks:', data.message || 'Unknown error')
          toast.error('Failed to load banks. Please refresh the page.')
        }
      } catch (error) {
        console.error('Error fetching banks:', error)
        toast.error('Error loading banks. Please check your connection and try again.')
      } finally {
        setLoadingBanks(false)
      }
    }
    
    fetchBanks()
  }, [])

  // Refresh wallet balance when wallet view is active
  useEffect(() => {
    const refreshWallet = async () => {
      if (activeView === "wallet") {
        try {
          const token = localStorage.getItem('authToken')
          const wr = await fetch(`${API_BASE_URL}/wallet`, { headers: { 'Authorization': `Bearer ${token}` } })
          const wd = await wr.json()
          if (wr.ok && wd.wallet) {
            setWallet(wd.wallet)
            const newBalance = parseFloat(wd.wallet.balance || 0)
            setWalletBalance(newBalance)
            console.log('Wallet balance refreshed:', newBalance)
          }
        } catch (error) {
          console.error('Error refreshing wallet:', error)
        }
      }
    }
    
    refreshWallet()
  }, [activeView])

  // Fetch KYC documents when profile view is active
  useEffect(() => {
    const fetchKycDocuments = async () => {
      setLoadingDocs(true)
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
          setDocuments(data.documents)
        }
      } catch (error) {
        console.error("Error fetching KYC documents:", error)
      } finally {
        setLoadingDocs(false)
      }
    }
    
    if (activeView === "profile") {
      fetchKycDocuments()
    }
  }, [activeView])

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
      if (documents?.plateNumber) formData.append('plateNumber', documents.plateNumber)
      if (documents?.vehicleType) formData.append('vehicleType', documents.vehicleType)
      
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

  // Paystack Payment: initiate
  const initiatePaystackPayment = async () => {
    try {
      const amountNum = parseFloat(fundAmount)
      if (!amountNum || amountNum < 100) {
        toast.error('Enter a valid amount (minimum ₦100)')
        return
      }
      setFundLoading(true)
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
      const token = localStorage.getItem('authToken')
      
      // Get payment details from backend
      const resp = await fetch(`${API_BASE_URL}/wallet/paystack/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount: amountNum, currency: 'NGN' })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.message || 'Failed to initialize payment')

      // Check if Paystack script is loaded
      if (!window.PaystackPop) {
        throw new Error('Paystack payment gateway is not loaded. Please refresh the page.')
      }

      // Validate required data
      if (!data.publicKey || !data.reference || !data.amount || !data.email) {
        console.error('Missing required data:', data)
        throw new Error('Invalid payment data received from server')
      }

      // Validate public key format
      if (!data.publicKey.startsWith('pk_')) {
        console.error('Invalid public key format:', data.publicKey?.substring(0, 20))
        throw new Error('Invalid payment gateway configuration. Please contact support.')
      }

      // Initialize Paystack payment
      console.log('Initializing Paystack payment with:', {
        key: data.publicKey?.substring(0, 20) + '...',
        reference: data.reference,
        amount: data.amount,
        currency: data.currency,
        email: data.email
      })

      console.log('🔧 Setting up Paystack handler with:', {
        key: data.publicKey?.substring(0, 20) + '...',
        email: data.email,
        amount: data.amount,
        reference: data.reference
      })

      const handler = window.PaystackPop.setup({
        key: data.publicKey,
        email: data.email,
        amount: data.amount, // Amount in kobo
        currency: data.currency,
        ref: data.reference,
        metadata: {
          custom_fields: [
            {
              display_name: "Customer Name",
              variable_name: "customer_name",
              value: data.name || "User"
            }
          ]
        },
        callback: function (response) {
          console.log('✅✅✅ PAYSTACK CALLBACK TRIGGERED ✅✅✅')
          console.log('Payment success response:', JSON.stringify(response, null, 2))
          setFundLoading(false)
          
          // Credit wallet directly from Paystack callback
          if (response.status === 'success') {
            console.log('✅ Payment successful, crediting wallet...')
            
            const creditToken = token || localStorage.getItem('authToken')
            const creditApiUrl = API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
            
            console.log('🔧 Credit variables:', {
              hasToken: !!creditToken,
              apiUrl: creditApiUrl,
              reference: response.reference
            })
            
            console.log('🚀 About to execute async credit function...')
            
            // Immediately invoke async function
            ;(async () => {
              console.log('✅ Async credit function started!')
              try {
                console.log('💰 Starting credit request with reference:', response.reference)
                const creditUrl = `${creditApiUrl}/wallet/paystack/credit`
                console.log('🌐 Credit URL:', creditUrl)
                
                const creditResp = await fetch(creditUrl, {
                  method: 'POST',
                  headers: { 
                    'Authorization': `Bearer ${creditToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ reference: response.reference })
                })
                
                console.log('📡 Credit response status:', creditResp.status, creditResp.statusText)
                
                if (!creditResp.ok) {
                  const errorText = await creditResp.text()
                  console.error('❌ Credit request failed:', {
                    status: creditResp.status,
                    statusText: creditResp.statusText,
                    body: errorText
                  })
                  throw new Error(`Credit failed: ${creditResp.status} ${errorText}`)
                }
                
                const creditData = await creditResp.json()
                console.log('📥 Credit response data:', JSON.stringify(creditData, null, 2))
                
                if (creditData.success) {
                  // Wallet credited successfully
                  console.log('✅ Credit successful!', {
                    balance: creditData.balance,
                    amount: creditData.transaction?.amount
                  })
                  toast.success(`Payment successful! ₦${creditData.transaction.amount.toLocaleString('en-NG')} credited to your wallet.`)
                  
                  // Update balance immediately
                  if (creditData.balance !== undefined) {
                    const newBalance = parseFloat(creditData.balance || 0)
                    setWalletBalance(newBalance)
                    console.log('✅ Balance updated from credit response:', newBalance)
                  }
                  
                  // Refresh wallet and transactions
                  console.log('🔄 Refreshing wallet and transactions...')
                  const [wr, tr] = await Promise.all([
                    fetch(`${creditApiUrl}/wallet`, { headers: { 'Authorization': `Bearer ${creditToken}` } }),
                    fetch(`${creditApiUrl}/wallet/transactions`, { headers: { 'Authorization': `Bearer ${creditToken}` } })
                  ])
                  const wd = await wr.json()
                  const td = await tr.json()
                  
                  console.log('📥 Wallet refresh response:', {
                    ok: wr.ok,
                    hasWallet: !!wd.wallet,
                    balance: wd.wallet?.balance
                  })
                  
                  if (wr.ok && wd.wallet) {
                    setWallet(wd.wallet)
                    const refreshedBalance = parseFloat(wd.wallet.balance || 0)
                    setWalletBalance(refreshedBalance)
                    console.log('✅ Balance refreshed from wallet endpoint:', refreshedBalance)
                  }
                  if (tr.ok && td.transactions) {
                    setTransactions(td.transactions)
                    console.log('✅ Transactions refreshed:', td.transactions.length)
                  }
                } else {
                  console.error('❌ Credit failed:', creditData)
                  toast.error(creditData.message || 'Failed to credit wallet. Please contact support.')
                }
              } catch (error) {
                console.error('❌ Error crediting wallet:', error)
                console.error('❌ Error details:', {
                  message: error.message,
                  stack: error.stack
                })
                toast.error('Error crediting wallet. Please check your balance or contact support.')
              }
            })()
          } else {
            console.warn('⚠️ Payment status is not success:', response.status)
            toast.error('Payment was not successful. Please try again.')
          }
          
          setShowFundModal(false)
          setFundAmount("")
        },
        onClose: function () {
          console.log('❌ Paystack modal closed by user')
          setFundLoading(false)
          toast.info('Payment cancelled')
        }
      })

      console.log('🚀 Opening Paystack payment modal...')
      handler.openIframe()
      console.log('📱 Paystack modal should be open now')
    } catch (e) {
      setFundLoading(false)
      console.error('Error in initiatePaystackPayment:', e)
      toast.error(e.message || 'Failed to initialize payment')
    }
  }

  // Fetch states for filters
  useEffect(() => {
    const fetchStates = async () => {
      setLoadingStates(true)
      try {
        const response = await fetch(`${API_BASE_URL}/shipping/locations/states`)
        const data = await response.json()
        if (data.success && data.data) {
          const stateOptions = data.data.map(state => ({
            label: state.state,
            value: state.state
          }))
          setStates(stateOptions)
        }
      } catch (error) {
        console.error('Error fetching states:', error)
      } finally {
        setLoadingStates(false)
      }
    }
    fetchStates()
  }, [])

  // Fetch available shipments
  const fetchAvailableShipments = async () => {
    setLoadingShipments(true)
    try {
      const token = localStorage.getItem('authToken')
      
      const queryParams = new URLSearchParams()
      if (filters.pickupState) queryParams.append('pickupState', filters.pickupState)
      if (filters.destinationState) queryParams.append('destinationState', filters.destinationState)
      if (filters.truckType) queryParams.append('truckType', filters.truckType)
      
      const response = await fetch(`${API_BASE_URL}/shipping/shipments/available?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (response.ok && data.success) {
        setAvailableShipments(data.shipments || [])
        } else {
        toast.error(data.message || 'Failed to load shipments')
      }
    } catch (error) {
      console.error('Error fetching shipments:', error)
      toast.error('Error loading shipments')
    } finally {
      setLoadingShipments(false)
    }
  }

  // Fetch shipments when jobs view is active or filters change
  useEffect(() => {
    if (activeView === "jobs" && kycCheckDone) {
      fetchAvailableShipments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, filters.pickupState, filters.destinationState, filters.truckType, kycCheckDone])

  // Accept shipment
  const handleAcceptShipment = async (shipmentId) => {
    if (!window.confirm('Are you sure you want to accept this shipment?')) {
      return
    }

    setAcceptingShipment(true)
    try {
      const token = localStorage.getItem('authToken')
      
      const response = await fetch(`${API_BASE_URL}/shipping/shipments/${shipmentId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('Shipment accepted successfully!')
        fetchAvailableShipments()
        fetchActiveLoads() // Refresh active loads
        setSelectedShipment(null)
      } else {
        toast.error(data.message || 'Failed to accept shipment')
      }
    } catch (error) {
      console.error('Error accepting shipment:', error)
      toast.error('Error accepting shipment')
    } finally {
      setAcceptingShipment(false)
    }
  }

  // Fetch shipment details
  const fetchShipmentDetails = async (shipmentId) => {
    try {
      const token = localStorage.getItem('authToken')
      
      const response = await fetch(`${API_BASE_URL}/shipping/shipments/${shipmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (response.ok && data.success) {
        setSelectedShipment(data.shipment)
      } else {
        toast.error(data.message || 'Failed to load shipment details')
      }
    } catch (error) {
      console.error('Error fetching shipment details:', error)
      toast.error('Error loading shipment details')
    }
  }

  // Fetch active loads (assigned shipments)
  const fetchActiveLoads = async () => {
    setLoadingActiveLoads(true)
    try {
      const token = localStorage.getItem('authToken')
      
      const response = await fetch(`${API_BASE_URL}/shipping/shipments/my-jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (response.ok && data.success) {
        // Filter to only show active shipments (not completed/cancelled)
        const active = (data.shipments || []).filter(
          shipment => shipment.status !== 'completed' && shipment.status !== 'cancelled'
        )
        setActiveLoads(active)
      }
    } catch (error) {
      console.error('Error fetching active loads:', error)
    } finally {
      setLoadingActiveLoads(false)
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
              <p className="text-white font-bold text-lg">{user?.fullName?.split(' ')[0] || "Driver"}</p>
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

        {wallet && (
          <div className="mt-6">
            <p className="text-white/80 text-sm mb-1">Wallet Balance</p>
            <p className="text-white text-3xl font-bold">
              {showBalance ? `₦${walletBalance.toLocaleString('en-NG')}` : '₦ • • • • • •'}
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button 
            onClick={() => setShowFundModal(true)}
            className="backdrop-blur-sm rounded-2xl p-4 flex items-center space-x-3 bg-white/20 hover:bg-white/30 transition-colors"
          >
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <ArrowDown className="w-5 h-5 text-primary" />
            </div>
            <span className="text-white font-medium">Top Up</span>
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

      {/* Fund Wallet Modal - Kora Checkout Standard */}
      {showFundModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] flex flex-col">
            <div className="flex-shrink-0 bg-card border-b border-border p-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-text-primary font-bold text-xl">Top Up Wallet</h3>
              <button onClick={() => { if (!fundLoading) { setShowFundModal(false); setFundAmount("") } }} className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <LogOut className="w-5 h-5 text-text-secondary rotate-45" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-text-primary font-medium mb-2">Amount (NGN)</label>
                <input 
                  type="number" 
                  min="100" 
                  step="1" 
                  value={fundAmount} 
                  onChange={(e) => setFundAmount(e.target.value)} 
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary" 
                  placeholder="e.g., 5000" 
                  disabled={fundLoading} 
                />
                <p className="text-text-secondary text-xs mt-1">Minimum amount: ₦100</p>
              </div>

              <button 
                onClick={initiatePaystackPayment} 
                disabled={fundLoading || !fundAmount || parseFloat(fundAmount) < 100} 
                className="w-full bg-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {fundLoading ? 'Initializing...' : 'Pay with Paystack'}
                </button>
                  </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 mt-6">
        {activeView === "home" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-success to-success/80 rounded-2xl p-4 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-white/80 text-sm">Active Loads</p>
                <p className="text-white font-bold text-3xl">{activeLoads.length}</p>
              </div>

              <div className="bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl p-4 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-white/80 text-sm">This Month</p>
                <p className="text-white font-bold text-2xl">₦125k</p>
              </div>
            </div>

            {/* Active Loads */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-text-primary font-bold text-lg">Active Loads</h3>
                <span className="text-primary text-sm font-medium">See all</span>
              </div>
              
              {loadingActiveLoads ? (
                <div className="flex justify-center items-center py-8">
                  <Loader className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : activeLoads.length > 0 ? (
                <div className="space-y-3">
                  {activeLoads.map((load) => (
                    <div key={load.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            load.status === 'assigned' || load.status === 'in_transit' ? 'bg-primary/10' : 'bg-success/10'
                          }`}>
                            <Navigation className={`w-6 h-6 ${
                              load.status === 'assigned' || load.status === 'in_transit' ? 'text-primary' : 'text-success'
                            }`} />
                          </div>
                          <div>
                            <p className="text-text-primary font-bold">
                              {load.pickupState} → {load.destinationState}
                            </p>
                            <p className="text-text-secondary text-sm">
                              #{load.id} • {load.weight} tons
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <p className="text-success font-bold text-lg">
                          ₦{parseFloat(load.estimatedCost || 0).toLocaleString('en-NG')}
                        </p>
                        <button className="bg-primary text-white px-5 py-2 rounded-xl font-medium text-sm">
                          {load.status === 'assigned' ? 'Start' : load.status === 'in_transit' ? 'Track' : 'View'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-muted/30 rounded-2xl p-8 text-center">
                  <Truck className="w-12 h-12 text-text-secondary mx-auto mb-2" />
                  <p className="text-text-secondary">No active loads</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === "jobs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-text-primary font-bold text-2xl">Find Jobs</h2>
                <p className="text-text-secondary">Browse available shipments</p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="text-text-primary font-semibold">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <StateSelect
                  label="Pickup State"
                  placeholder="All states"
                  value={filters.pickupState}
                  onChange={(e) => setFilters({ ...filters, pickupState: e.target.value })}
                  options={states}
                  disabled={loadingStates}
                />
                <StateSelect
                  label="Destination State"
                  placeholder="All states"
                  value={filters.destinationState}
                  onChange={(e) => setFilters({ ...filters, destinationState: e.target.value })}
                  options={states}
                  disabled={loadingStates}
                />
                <div>
                  <label className="block text-text-primary font-medium mb-2">Vehicle Type</label>
                  <select
                    value={filters.truckType}
                    onChange={(e) => setFilters({ ...filters, truckType: e.target.value })}
                    className="w-full px-4 py-4 bg-input border border-border rounded-xl text-text-primary"
                  >
                    <option value="">All types</option>
                    {truckOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(filters.pickupState || filters.destinationState || filters.truckType) && (
                <button
                  onClick={() => setFilters({ pickupState: "", destinationState: "", truckType: "" })}
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Shipments List */}
            {loadingShipments ? (
              <div className="flex justify-center items-center py-12">
                <Loader className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : selectedShipment ? (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedShipment(null)}
                  className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <ArrowDown className="w-5 h-5 rotate-90" />
                  <span>Back to List</span>
                </button>
                
                <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Package className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <p className="text-text-primary font-bold text-lg">
                          {selectedShipment.pickupState} → {selectedShipment.destinationState}
                        </p>
                        <p className="text-text-secondary text-sm">Shipment #{selectedShipment.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-success font-bold text-xl">₦{parseFloat(selectedShipment.estimatedCost || 0).toLocaleString('en-NG')}</p>
                      <p className="text-text-secondary text-xs">{selectedShipment.distance ? `${selectedShipment.distance}km` : 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Pickup Location</p>
                      <p className="text-text-primary font-medium">{selectedShipment.pickupLga}, {selectedShipment.pickupState}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Destination</p>
                      <p className="text-text-primary font-medium">{selectedShipment.destinationLga}, {selectedShipment.destinationState}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Cargo Type</p>
                      <p className="text-text-primary font-medium">{selectedShipment.cargoType}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Weight</p>
                      <p className="text-text-primary font-medium">{selectedShipment.weight} tons</p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Vehicle Type Required</p>
                      <p className="text-text-primary font-medium">{selectedShipment.truckType}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Pickup Date</p>
                      <p className="text-text-primary font-medium">
                        {selectedShipment.pickupDate ? new Date(selectedShipment.pickupDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    {selectedShipment.shipperName && (
                      <div>
                        <p className="text-text-secondary text-sm mb-1">Shipper</p>
                        <p className="text-text-primary font-medium">{selectedShipment.shipperName}</p>
                        {selectedShipment.shipperPhone && (
                          <p className="text-text-secondary text-xs">{selectedShipment.shipperPhone}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {(Boolean(selectedShipment.fragileItems) || Boolean(selectedShipment.insurance)) && (
                    <div className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-xl">
                      <p className="text-warning font-semibold text-sm mb-2">Special Requirements:</p>
                      <div className="space-y-1">
                        {Boolean(selectedShipment.fragileItems) && (
                          <p className="text-warning/90 text-sm">• Fragile/Perishable Items (+₦300,000)</p>
                        )}
                        {Boolean(selectedShipment.insurance) && (
                          <p className="text-warning/90 text-sm">• Insurance Included (+₦200,000)</p>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleAcceptShipment(selectedShipment.id)}
                    disabled={acceptingShipment}
                    className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {acceptingShipment ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Accepting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Accept Shipment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : availableShipments.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-12 text-center">
                <Package className="w-16 h-16 text-text-secondary mx-auto mb-4" />
                <p className="text-text-secondary">No available shipments found</p>
                <p className="text-text-secondary text-sm mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableShipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    className="bg-card border-2 border-border rounded-2xl p-5 shadow-sm hover:border-primary/50 transition-colors"
                  >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Package className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                          <p className="text-text-primary font-bold text-lg">
                            {shipment.pickupState} → {shipment.destinationState}
                          </p>
                          <p className="text-text-secondary text-sm">#{shipment.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                        <p className="text-success font-bold text-xl">
                          ₦{parseFloat(shipment.estimatedCost || 0).toLocaleString('en-NG')}
                        </p>
                        <p className="text-text-secondary text-xs">
                          {shipment.distance ? `${shipment.distance}km` : 'N/A'}
                        </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mb-4 text-sm text-text-secondary">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                        <span>{shipment.pickupLga}, {shipment.pickupState}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Navigation className="w-4 h-4" />
                        <span>{shipment.destinationLga}, {shipment.destinationState}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Package className="w-4 h-4" />
                        <span>{shipment.weight} tons</span>
                  </div>
                </div>

                    <div className="mb-4">
                      <p className="text-text-secondary text-sm">
                        <span className="font-medium">Cargo:</span> {shipment.cargoType} | 
                        <span className="font-medium"> Vehicle:</span> {shipment.truckType}
                      </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => fetchShipmentDetails(shipment.id)}
                        className="bg-muted text-text-secondary py-3 rounded-xl font-medium hover:bg-muted/80 transition-colors"
                      >
                        View Details
                  </button>
                  <button 
                        onClick={() => handleAcceptShipment(shipment.id)}
                        disabled={acceptingShipment}
                        className="bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                        {acceptingShipment ? 'Accepting...' : 'Accept Load'}
                  </button>
                </div>
              </div>
            ))}
              </div>
            )}
          </div>
        )}

        {activeView === "wallet" && (
          <div className="space-y-4">
            <h2 className="text-text-primary font-bold text-2xl">Wallet</h2>
            
            <div className="bg-card border border-border rounded-2xl p-6">
              <p className="text-text-secondary mb-2">Available Balance</p>
              <p className="text-text-primary font-bold text-4xl">₦{Number(walletBalance || 0).toLocaleString('en-NG')}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowFundModal(true)}
                className="bg-primary text-white rounded-2xl p-6 flex flex-col items-center space-y-3"
              >
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <ArrowDown className="w-7 h-7 text-white" />
                </div>
                <span className="font-bold">Top Up</span>
              </button>
              
              <button
                onClick={() => toast.info('Withdraw - coming soon!')}
                className="bg-secondary text-white rounded-2xl p-6 flex flex-col items-center space-y-3"
              >
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <ArrowUp className="w-7 h-7 text-white" />
                </div>
                <span className="font-bold">Withdraw</span>
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
                        {t.type === 'credit' ? '+' : '-'}₦{Number(t.amount || 0).toLocaleString('en-NG')}
                      </p>
                </div>
                  ))}
                    </div>
              )}
            </div>
          </div>
        )}

        {activeView === "profile" && (
          <div className="space-y-6">
            {/* Profile Header Card */}
            <div className="bg-gradient-to-br from-primary via-primary to-secondary rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-4 mb-4">
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
                  <h2 className="text-white font-bold text-2xl mb-1">{user?.fullName || "Driver"}</h2>
                  <div className="flex items-center space-x-2 text-white/90">
                    <Mail className="w-4 h-4" />
                    <p className="text-sm">{user?.email || ""}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-around pt-4 border-t border-white/20">
                  <div className="text-center">
                  <p className="text-white font-bold text-2xl">47</p>
                  <p className="text-white/80 text-sm">Loads</p>
                  </div>
                <div className="w-px h-12 bg-white/20"></div>
                  <div className="text-center">
                  <p className="text-white font-bold text-2xl">4.8</p>
                  <p className="text-white/80 text-sm">Rating</p>
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
                
                <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-secondary text-sm mb-1">Plate Number</p>
                    <p className="text-text-primary font-medium">{documents?.plateNumber || "Not provided"}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-secondary text-sm mb-1">Vehicle Type</p>
                    <p className="text-text-primary font-medium">{documents?.vehicleType || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Account Details (For Withdrawals) */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-text-primary font-bold text-lg flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <span>Bank Account Details (For Withdrawals)</span>
                </h3>
                {!editingBankAccount && (
                  <button
                    onClick={() => {
                      setEditingBankAccount(true)
                      setBankAccountForm({
                        bankAccountNumber: documents?.bankAccountNumber || '',
                        bankCode: documents?.bankCode || '',
                        bankName: documents?.bankName || ''
                      })
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    {documents?.bankAccountNumber ? 'Edit' : 'Add'}
                  </button>
                )}
              </div>
              
              {editingBankAccount ? (
                <div className="space-y-4">
            <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Bank Name</label>
                    <button
                      type="button"
                      onClick={() => {
                        if (banks.length > 0) {
                          setShowBankModal(true)
                          setBankSearchQuery('')
                        }
                      }}
                      disabled={loadingBanks || banks.length === 0}
                      className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-left text-text-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                    >
                      <span className={bankAccountForm.bankName ? 'text-text-primary' : 'text-text-secondary'}>
                        {loadingBanks ? 'Loading banks...' : bankAccountForm.bankName || 'Select your bank'}
                      </span>
                      <ChevronDown className="w-5 h-5 text-text-secondary" />
                    </button>
                    {!loadingBanks && banks.length === 0 && (
                      <p className="text-xs text-warning mt-1">Unable to load banks. Please refresh the page or contact support.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Account Number</label>
                    <input
                      type="text"
                      value={bankAccountForm.bankAccountNumber || ''}
                      onChange={(e) => setBankAccountForm(prev => ({ ...prev, bankAccountNumber: e.target.value.replace(/\D/g, "") }))}
                      className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-text-primary"
                      placeholder="Enter 10-digit account number"
                      maxLength="10"
                    />
                </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Bank Code</label>
                    <input
                      type="text"
                      value={bankAccountForm.bankCode || ''}
                      className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-text-primary"
                      placeholder="Auto-filled when bank is selected"
                      readOnly
                    />
                </div>

                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      onClick={async () => {
                        try {
                          if (!bankAccountForm.bankAccountNumber || !bankAccountForm.bankCode) {
                            toast.error("Please fill in all bank account details")
                            return
                          }
                          
                          setUpdatingBankAccount(true)
                          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
                          const token = localStorage.getItem('token')
                          
                          const response = await fetch(`${API_BASE_URL}/kyc/bank-account`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify(bankAccountForm)
                          })
                          
                          const data = await response.json()
                          
                          if (response.ok) {
                            toast.success(data.message || "Bank account updated successfully")
                            setEditingBankAccount(false)
                            // Refresh documents
                            const docsResponse = await fetch(`${API_BASE_URL}/kyc/documents`, {
                              headers: { 'Authorization': `Bearer ${token}` }
                            })
                            const docsData = await docsResponse.json()
                            if (docsData.success) {
                              setDocuments(docsData.documents)
                            }
                          } else {
                            toast.error(data.message || "Failed to update bank account")
                          }
                        } catch (error) {
                          console.error("Error updating bank account:", error)
                          toast.error("Failed to update bank account")
                        } finally {
                          setUpdatingBankAccount(false)
                        }
                      }}
                      disabled={updatingBankAccount}
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                    >
                      {updatingBankAccount ? 'Updating...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingBankAccount(false)
                        setBankAccountForm({
                          bankAccountNumber: '',
                          bankCode: '',
                          bankName: ''
                        })
                      }}
                      className="px-4 py-2 bg-muted border border-border rounded-lg hover:bg-muted/80 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents?.bankAccountNumber ? (
                    <>
                      <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-xl">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CreditCard className="w-5 h-5 text-primary" />
                </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-text-secondary text-sm mb-1">Account Number</p>
                          <p className="text-text-primary font-medium tracking-wider">{documents.bankAccountNumber}</p>
              </div>
                      </div>
                      
                      {documents?.bankName && (
                        <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-xl">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CreditCard className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-text-secondary text-sm mb-1">Bank Name</p>
                            <p className="text-text-primary font-medium">{documents.bankName}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-text-secondary text-sm text-center py-4">No bank account details added yet. Click "Add" to add your bank account.</p>
                  )}
                </div>
              )}
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

                  {/* Driver's License */}
                  <div className={`bg-card border-2 rounded-xl p-4 ${
                    documents?.driverLicense ? 'border-success/30' : 'border-border'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {documents?.driverLicense ? (
                          documents.driverLicense.toLowerCase().includes('.pdf') ? (
                            <div 
                              className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center cursor-pointer"
                              onClick={() => window.open(documents.driverLicense, '_blank')}
                            >
                              <FileText className="w-6 h-6 text-warning" />
                            </div>
                          ) : (
                            <img 
                              src={documents.driverLicense} 
                              alt="Driver's License" 
                              className="w-12 h-12 rounded-lg object-cover cursor-pointer"
                              onClick={() => window.open(documents.driverLicense, '_blank')}
                            />
                          )
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <Truck className="w-6 h-6 text-text-secondary" />
                          </div>
                        )}
                        <div>
                          <p className="text-text-primary font-bold">Driver's License</p>
                          <p className="text-text-secondary text-sm">
                            {documents?.driverLicense ? 'Uploaded ✓' : 'Optional'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => triggerFileUpload('driverLicense')}
                        disabled={uploadingDoc === 'driverLicense'}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
                          documents?.driverLicense 
                            ? 'bg-secondary/10 text-secondary hover:bg-secondary/20' 
                            : 'bg-primary text-white hover:bg-primary/90'
                        } disabled:opacity-50`}
                      >
                        {uploadingDoc === 'driverLicense' ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            <span className="text-sm">...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span className="text-sm">{documents?.driverLicense ? 'Update' : 'Upload'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Vehicle Registration */}
                  <div className={`bg-card border-2 rounded-xl p-4 ${
                    documents?.vehicleReg ? 'border-success/30' : 'border-border'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {documents?.vehicleReg ? (
                          documents.vehicleReg.toLowerCase().includes('.pdf') ? (
                            <div 
                              className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center cursor-pointer"
                              onClick={() => window.open(documents.vehicleReg, '_blank')}
                            >
                              <FileText className="w-6 h-6 text-accent" />
                            </div>
                          ) : (
                            <img 
                              src={documents.vehicleReg} 
                              alt="Vehicle Registration" 
                              className="w-12 h-12 rounded-lg object-cover cursor-pointer"
                              onClick={() => window.open(documents.vehicleReg, '_blank')}
                            />
                          )
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-text-secondary" />
                          </div>
                        )}
                        <div>
                          <p className="text-text-primary font-bold">Vehicle Registration</p>
                          <p className="text-text-secondary text-sm">
                            {documents?.vehicleReg ? 'Uploaded ✓' : 'Optional'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => triggerFileUpload('vehicleReg')}
                        disabled={uploadingDoc === 'vehicleReg'}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
                          documents?.vehicleReg 
                            ? 'bg-secondary/10 text-secondary hover:bg-secondary/20' 
                            : 'bg-primary text-white hover:bg-primary/90'
                        } disabled:opacity-50`}
                      >
                        {uploadingDoc === 'vehicleReg' ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            <span className="text-sm">...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span className="text-sm">{documents?.vehicleReg ? 'Update' : 'Upload'}</span>
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

      {/* Bottom Navigation - BIG ICONS */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
        <div className="grid grid-cols-5 gap-1 px-2 py-3">
          <button
            onClick={() => setActiveView("home")}
            className={`flex flex-col items-center space-y-1 py-2 rounded-xl transition-colors ${
              activeView === "home" ? "bg-primary/10" : ""
            }`}
          >
            <Truck className={`w-7 h-7 ${activeView === "home" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-xs font-medium ${activeView === "home" ? "text-primary" : "text-text-secondary"}`}>
              Home
            </span>
          </button>

          <button
            onClick={() => setActiveView("jobs")}
            className={`flex flex-col items-center space-y-1 py-2 rounded-xl transition-colors ${
              activeView === "jobs" ? "bg-primary/10" : ""
            }`}
          >
            <Package className={`w-7 h-7 ${activeView === "jobs" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-xs font-medium ${activeView === "jobs" ? "text-primary" : "text-text-secondary"}`}>
              Find Jobs
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
                          setBankAccountForm(prev => ({
                            ...prev,
                            bankName: bank.name,
                            bankCode: bank.code
                          }))
                          setShowBankModal(false)
                          setBankSearchQuery('')
                        }}
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20"
                      >
                        <div className="font-medium text-text-primary">{bank.name}</div>
                        <div className="text-xs text-text-secondary mt-0.5">Code: {bank.code}</div>
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

export default TruckerDashboard
