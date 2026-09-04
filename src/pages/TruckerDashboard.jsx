"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Truck,
  Wallet,
  Package,
  User,
  Eye,
  EyeOff,
  RefreshCw,
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
  X,
  Star,
  Gift,
  ChevronRight
} from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useToast } from "../context/ToastContext"
import StateSelect from "../components/StateSelect"
import NotificationCenter from "../components/NotificationCenter"
import ConfirmModal from "../components/ConfirmModal"
import PODCapture from "../components/PODCapture"
import SelectModal from "../components/SelectModal"
import SingleShipmentMap from "../components/SingleShipmentMap"
import ShipmentProgressTracker from "../components/ShipmentProgressTracker"
import ReferralPanel from "../components/ReferralPanel"
import BonusWallet from "../components/BonusWallet"
import WalletStatement from "../components/WalletStatement"
import EwaybillModal from "../components/EwaybillModal"
import { formatWithCommas, parseFormattedNumber } from "../utils/currencyFormat"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const TruckerDashboard = () => {
  const { user, logoutUser, navigateTo } = useAppContext()
  const toast = useToast()
  const [activeView, setActiveView] = useState("home")
  const [showBalance, setShowBalance] = useState(true)
  const [refreshingAll, setRefreshingAll] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [pendingConfirm, setPendingConfirm] = useState(null)
  const [ewaybillShipmentId, setEwaybillShipmentId] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [kycCheckDone, setKycCheckDone] = useState(false)
  
  // Wallet state
  const [walletBalance, setWalletBalance] = useState(0)
  const [bonusBalance, setBonusBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [transactionsPage, setTransactionsPage] = useState(1)
  const transactionsPerPage = 5
  
  // Documents state
  const [documents, setDocuments] = useState(null)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(null)
  
  // Identity edit state
  const [editingIdentity, setEditingIdentity] = useState(false)
  const [identityForm, setIdentityForm] = useState({ nin: '', bvn: '' })
  const [updatingIdentity, setUpdatingIdentity] = useState(false)

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
  const [resolvedAccountName, setResolvedAccountName] = useState(null)
  const [verifyingAccount, setVerifyingAccount] = useState(false)
  const [accountVerified, setAccountVerified] = useState(false)
  const [showBankModal, setShowBankModal] = useState(false)
  const [bankSearchQuery, setBankSearchQuery] = useState('')
  
  // Fund wallet modal state
  const [showFundModal, setShowFundModal] = useState(false)
  const [fundAmount, setFundAmount] = useState("")
  const [fundAccount, setFundAccount] = useState(null)
  const [fundReference, setFundReference] = useState("")
  const [fundLoading, setFundLoading] = useState(false)
  
  // Withdraw state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  
  // Available shipments state
  const [availableShipments, setAvailableShipments] = useState([])
  const [loadingShipments, setLoadingShipments] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [acceptingShipment, setAcceptingShipment] = useState(false)
  
  // Bidding state
  const [showBidModal, setShowBidModal] = useState(false)
  const [bidForm, setBidForm] = useState({
    bidAmount: '',
    message: ''
  })
  const [submittingBid, setSubmittingBid] = useState(false)
  const [editingBid, setEditingBid] = useState(null)
  const [myBids, setMyBids] = useState([])
  const [loadingMyBids, setLoadingMyBids] = useState(false)
  
  // Active loads (assigned shipments) state
  const [activeLoads, setActiveLoads] = useState([])
  const [loadingActiveLoads, setLoadingActiveLoads] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(null)
  const [showPODCapture, setShowPODCapture] = useState(false)
  const [selectedShipmentForPOD, setSelectedShipmentForPOD] = useState(null)
  const [selectedPODType, setSelectedPODType] = useState(null)
  
  // Filter state
  const [filters, setFilters] = useState({
    pickupState: "",
    destinationState: "",
    truckType: ""
  })
  const [states, setStates] = useState([])
  const [loadingStates, setLoadingStates] = useState(false)
  const [myRating, setMyRating] = useState({ average: 0, count: 0 })
  
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

  // Helper to format location (hide "00" and "0" LGA values)
  const toTitleCase = (value) => {
    if (!value) return ""
    return value
      .toString()
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  }

  const formatLocation = (stateSlug, lgaSlug) => {
    const stateName = toTitleCase(stateSlug)
    // Don't show LGA if it's "00" or "0" or empty/invalid
    if (lgaSlug && lgaSlug !== '00' && lgaSlug !== '0' && lgaSlug.trim() !== '') {
      return `${toTitleCase(lgaSlug)}, ${stateName}`
    }
    return stateName
  }

  // Helper to filter out "00" and "0" from displayed values
  const filterZeroZero = (value) => {
    if (value === null || value === undefined || value === '') return ''
    const str = String(value).trim()
    // If the value is just "0" or "00", return empty string
    if (str === '0' || str === '00') {
      return ''
    }
    // Remove ".00" from decimal numbers (e.g., "6.00" -> "6")
    let filtered = str.replace(/\.00$/, '').replace(/\.0$/, '')
    // Remove standalone "00" or "00" at the start/end
    filtered = filtered.replace(/\b00\b/g, '').replace(/^00\s*|\s*00$/g, '').trim()
    // If after filtering it becomes "0" or "00", return empty
    if (filtered === '0' || filtered === '00' || filtered === '') {
      return ''
    }
    // Return the filtered value, or empty string if filtered is falsy
    return filtered || ''
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
        // Load bonus wallet balance
        try {
          const br = await fetch(`${API_BASE_URL}/wallet/bonus`, { headers: { 'Authorization': `Bearer ${token}` } })
          const bd = await br.json()
          if (br.ok && bd.wallet) setBonusBalance(parseFloat(bd.wallet.balance || 0))
        } catch (e) {
          // ignore — card just shows the last known balance
        }
        // Fetch active loads
        fetchActiveLoads()
        // Fetch my rating (trucker)
        if (user?.id) {
          try {
            const rr = await fetch(`${API_BASE_URL}/ratings/ratee?rateeType=trucker&rateeId=${user.id}`)
            const rd = await rr.json()
            if (rr.ok && rd.success && (rd.count > 0)) setMyRating({ average: rd.average, count: rd.count })
          } catch (_) {}
        }
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

      const token = localStorage.getItem('authToken')
      // Profile photo isn't an identity document, so it uses its own endpoint that
      // stays editable even after KYC has been approved (unlike /kyc/submit, which locks).
      let response
      if (documentType === 'profilePhoto') {
        response = await fetch(`${API_BASE_URL}/kyc/profile-photo`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        })
      } else {
        // Add required fields from existing documents
        if (documents?.phone) formData.append('phone', documents.phone)
        if (documents?.address) formData.append('address', documents.address)
        if (documents?.nin) formData.append('nin', documents.nin)
        if (documents?.plateNumber) formData.append('plateNumber', documents.plateNumber)
        if (documents?.vehicleType) formData.append('vehicleType', documents.vehicleType)

        response = await fetch(`${API_BASE_URL}/kyc/submit`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })
      }

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

  // Vehicle photo upload (trucker-only endpoint)
  const handleVehiclePhotoUpload = async (file) => {
    if (!file) return
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
    setUploadingDoc('vehiclePhoto')
    try {
      const formData = new FormData()
      formData.append('vehiclePhoto', file)
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/kyc/vehicle-photo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      const data = await response.json()
      if (response.ok) {
        toast.success('Vehicle photo updated!')
        setDocuments((prev) => ({ ...prev, vehiclePhoto: data.vehiclePhoto }))
      } else {
        toast.error(data.message || 'Upload failed')
      }
    } catch (e) {
      toast.error('Error uploading vehicle photo')
    } finally {
      setUploadingDoc(null)
    }
  }

  // Handle withdraw
  const handleWithdraw = async () => {
    try {
      const amountNum = parseFloat(withdrawAmount)
      if (!amountNum || amountNum < 100) {
        toast.error('Enter a valid amount (minimum ₦100)')
        return
      }
      
      if (amountNum > walletBalance) {
        toast.error(`Insufficient balance. Your wallet balance is ₦${walletBalance.toLocaleString('en-NG')}`)
        return
      }
      
      setWithdrawLoading(true)
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
      const token = localStorage.getItem('authToken')
      
      const response = await fetch(`${API_BASE_URL}/wallet/withdraw`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ amount: amountNum })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success(data.message || 'Withdrawal successful!')
        setShowWithdrawModal(false)
        setWithdrawAmount("")
        
        // Refresh wallet balance
        const wr = await fetch(`${API_BASE_URL}/wallet`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        })
        const wd = await wr.json()
        if (wr.ok && wd.wallet) {
          setWalletBalance(parseFloat(wd.wallet.balance || 0))
        }
        
        // Refresh transactions
        const tr = await fetch(`${API_BASE_URL}/wallet/transactions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const td = await tr.json()
        if (tr.ok && td.transactions) {
          setTransactions(td.transactions)
        }
      } else {
        // Check if it's a Paystack account tier error
        if (data.requiresUpgrade || data.message?.includes("upgrade") || data.message?.includes("Registered Business")) {
          toast.error(data.message || 'Paystack account upgrade required', { duration: 6000 })
        } else {
          toast.error(data.message || 'Withdrawal failed')
        }
      }
    } catch (error) {
      console.error('Error withdrawing:', error)
      toast.error('Error processing withdrawal')
    } finally {
      setWithdrawLoading(false)
    }
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
      fetchMyBids()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, filters.pickupState, filters.destinationState, filters.truckType, kycCheckDone])

  // (Auto-refresh of active loads and bids removed; driver can now refresh manually)

  // Start trip to pick up
  const handleStartPickupTrip = async (shipmentId) => {
    setUpdatingStatus(shipmentId)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/shipping/shipments/${shipmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'picking_up' })
      })
      
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(data.message || 'Trip to pick up started successfully!')
        fetchActiveLoads()
      } else {
        toast.error(data.message || 'Failed to start trip')
      }
    } catch (error) {
      console.error('Error starting pickup trip:', error)
      toast.error('Error starting trip')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const updateShipmentStatusRequest = async (shipmentId, status, { skipConfirm = false, confirmMessage = null } = {}) => {
    const shipment = activeLoads.find((s) => s.id === shipmentId)
    if (shipment?.status === status) {
      return true
    }

    if (!skipConfirm && confirmMessage && !window.confirm(confirmMessage)) {
      return false
    }

    setUpdatingStatus(shipmentId)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/shipping/shipments/${shipmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(data.message || 'Shipment status updated.')
        fetchActiveLoads()
        return true
      }

      toast.error(data.message || 'Failed to update status')
      return false
    } catch (error) {
      console.error('Error updating shipment status:', error)
      toast.error('Error updating status')
      return false
    } finally {
      setUpdatingStatus(null)
    }
  }

  // Mark as picked up (manual fallback; POD upload auto-advances status)
  const handleMarkPickedUp = async (shipmentId, options = {}) => {
    return updateShipmentStatusRequest(shipmentId, 'picked_up', {
      ...options,
      confirmMessage: 'Mark shipment as picked up? Shipper will need to confirm before you can start trip to destination.'
    })
  }

  // Start trip to destination (after pickup confirmed)
  const handleStartDeliveryTrip = async (shipmentId) => {
    setUpdatingStatus(shipmentId)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/shipping/shipments/${shipmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'in_transit' })
      })
      
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(data.message || 'Trip to destination started successfully!')
        fetchActiveLoads()
      } else {
        toast.error(data.message || 'Failed to start trip')
      }
    } catch (error) {
      console.error('Error starting delivery trip:', error)
      toast.error('Error starting trip')
    } finally {
      setUpdatingStatus(null)
    }
  }

  // Mark as delivered (manual fallback; POD upload auto-advances status)
  const handleMarkDelivered = async (shipmentId, options = {}) => {
    return updateShipmentStatusRequest(shipmentId, 'delivered', {
      ...options,
      confirmMessage: 'Mark shipment as delivered? Shipper will need to confirm before final payment is released.'
    })
  }

  // Helper function to format number with commas
  const formatNumberWithCommas = (value) => {
    if (!value) return ""
    // Remove all non-digit characters except decimal point
    const numericValue = value.toString().replace(/[^\d.]/g, "")
    // Split by decimal point
    const parts = numericValue.split(".")
    // Format the integer part with commas
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    // Join back with decimal if it exists
    return parts.join(".")
  }

  // Helper function to remove commas and get numeric value
  const removeCommas = (value) => {
    if (!value) return ""
    return value.toString().replace(/,/g, "")
  }

  // Accept shipment
  const handleOpenBidModal = (shipment, existingBid = null) => {
    setSelectedShipment(shipment)
    setEditingBid(existingBid)
    const prefillAmount = existingBid ? existingBid.bidAmount : (shipment.estimatedCost || 0)
    setBidForm({
      bidAmount: prefillAmount ? formatNumberWithCommas(prefillAmount.toString()) : '',
      message: existingBid?.message || ''
    })
    setShowBidModal(true)
  }

  // A pending bid can be revised within 10 minutes of its original submission (server-enforced too)
  const BID_EDIT_WINDOW_MS = 10 * 60 * 1000
  const getBidEditMinutesLeft = (bid) => {
    if (!bid || bid.status !== 'pending' || !bid.createdAt) return 0
    const remainingMs = BID_EDIT_WINDOW_MS - (Date.now() - new Date(bid.createdAt).getTime())
    return Math.max(0, Math.ceil(remainingMs / 60000))
  }

  const handleSubmitBid = async (e) => {
    e.preventDefault()

    if (!selectedShipment) return

    // Remove commas before parsing
    const bidAmount = parseFloat(removeCommas(bidForm.bidAmount))
    const estimatedCost = parseFloat(selectedShipment.estimatedCost || 0)
    const maxBidAmount = estimatedCost + 200000

    if (isNaN(bidAmount) || bidAmount <= 0) {
      toast.error('Please enter a valid bid amount')
      return
    }

    if (bidAmount > maxBidAmount) {
      toast.error(`Bid amount cannot exceed ₦${maxBidAmount.toLocaleString('en-NG')} (Base: ₦${estimatedCost.toLocaleString('en-NG')} + Max addition: ₦200,000)`)
      return
    }

    setSubmittingBid(true)
    try {
      const token = localStorage.getItem('authToken')

      const response = await fetch(
        editingBid ? `${API_BASE_URL}/bids/${editingBid.id}` : `${API_BASE_URL}/bids`,
        {
          method: editingBid ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(
            editingBid
              ? { bidAmount: bidAmount, message: bidForm.message || null }
              : { shipmentId: selectedShipment.id, bidAmount: bidAmount, message: bidForm.message || null }
          )
        }
      )

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(editingBid ? 'Bid updated successfully!' : 'Bid submitted successfully!')
        setShowBidModal(false)
        setBidForm({ bidAmount: '', message: '' })
        setSelectedShipment(null)
        setEditingBid(null)
        fetchAvailableShipments()
        fetchMyBids()
      } else {
        toast.error(data.message || 'Failed to submit bid')
      }
    } catch (error) {
      console.error('Error submitting bid:', error)
      toast.error('Error submitting bid')
    } finally {
      setSubmittingBid(false)
    }
  }

  const fetchMyBids = async () => {
    setLoadingMyBids(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/bids/my-bids`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (response.ok && data.success) {
        setMyBids(data.bids || [])
        
        // Check if any bid was accepted - if so, refresh active loads and wallet
        const hasAcceptedBid = (data.bids || []).some(bid => bid.status === 'accepted')
        if (hasAcceptedBid) {
          // Refresh active loads to show newly accepted shipments, and refresh wallet
          fetchActiveLoads(true)
        }
      }
    } catch (error) {
      console.error('Error fetching my bids:', error)
    } finally {
      setLoadingMyBids(false)
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
  const fetchActiveLoads = async (refreshWallet = false) => {
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
        
        // Refresh wallet balance if requested (e.g., when new shipments are assigned)
        if (refreshWallet) {
          try {
            const wr = await fetch(`${API_BASE_URL}/wallet`, { 
              headers: { 'Authorization': `Bearer ${token}` } 
            })
            const wd = await wr.json()
            if (wr.ok && wd.wallet) {
              setWallet(wd.wallet)
              const refreshedBalance = parseFloat(wd.wallet.balance || 0)
              setWalletBalance(refreshedBalance)
              console.log('✅ Wallet balance refreshed after fetching active loads:', refreshedBalance)
            }
          } catch (e) {
            console.error('Error refreshing wallet after fetching active loads:', e)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching active loads:', error)
    } finally {
      setLoadingActiveLoads(false)
    }
  }

  // Systemic refresh — always visible in the header, reloads active loads, available
  // shipments, bids, and wallet regardless of which tab is active.
  const handleGlobalRefresh = async () => {
    setRefreshingAll(true)
    try {
      await Promise.all([fetchActiveLoads(true), fetchAvailableShipments(), fetchMyBids()])
      toast.success('Refreshed')
    } catch (error) {
      console.error('Error during global refresh:', error)
    } finally {
      setRefreshingAll(false)
    }
  }

  // Calculate monthly earnings from transactions
  const monthlyEarnings = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const earnings = transactions
      .filter(t => {
        if (!t.createdAt && !t.date) return false
        const tDate = new Date(t.createdAt || t.date)
        return t.type === 'credit' && 
               tDate.getMonth() === currentMonth && 
               tDate.getFullYear() === currentYear
      })
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
    return earnings
  }, [transactions])

  // Format monthly earnings for display
  const formattedMonthlyEarnings = useMemo(() => {
    if (monthlyEarnings >= 1000000) {
      return `${(monthlyEarnings / 1000000).toFixed(1)}M`
    } else if (monthlyEarnings >= 1000) {
      return `${(monthlyEarnings / 1000).toFixed(1)}k`
    } else {
      return monthlyEarnings.toLocaleString('en-NG')
    }
  }, [monthlyEarnings])

  if (!kycCheckDone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  // Pagination for transactions (wallet view)
  const totalTransactionsPages = Math.ceil(transactions.length / transactionsPerPage)
  const paginatedTransactions = transactions.slice(
    (transactionsPage - 1) * transactionsPerPage,
    transactionsPage * transactionsPerPage
  )

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Wallet Card - Always visible at top */}
      <div className="bg-gradient-to-br from-primary via-primary to-secondary p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 min-w-0">
            {documents?.profilePhoto ? (
              <img
                src={documents.profilePhoto}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover border-2 border-white flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-white/80 text-sm">Welcome</p>
              <p className="text-white font-bold text-lg truncate">{user?.fullName?.split(' ')[0] || "Driver"}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <NotificationCenter userId={user?.id} />
            <button
              onClick={handleGlobalRefresh}
              disabled={refreshingAll}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-white ${refreshingAll ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              {showBalance ? <EyeOff className="w-5 h-5 text-white" /> : <Eye className="w-5 h-5 text-white" />}
            </button>
            <button
              onClick={() => setShowLogoutConfirm(true)}
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
                  type="text"
                  inputMode="decimal"
                  value={formatWithCommas(fundAmount)}
                  onChange={(e) => setFundAmount(parseFormattedNumber(e.target.value))}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  placeholder="e.g., 5,000"
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

      <ConfirmModal
        open={showLogoutConfirm}
        title="Log out?"
        message="Are you sure you want to log out?"
        confirmLabel="Log out"
        destructive
        onConfirm={logoutUser}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      <ConfirmModal
        open={pendingConfirm !== null}
        title={pendingConfirm?.title}
        message={pendingConfirm?.message}
        confirmLabel={pendingConfirm?.confirmLabel}
        destructive={pendingConfirm?.destructive}
        onConfirm={() => {
          const action = pendingConfirm?.onConfirm
          setPendingConfirm(null)
          action?.()
        }}
        onCancel={() => setPendingConfirm(null)}
      />

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] flex flex-col">
            <div className="flex-shrink-0 bg-card border-b border-border p-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-text-primary font-bold text-xl">Withdraw to Bank</h3>
              <button 
                onClick={() => { 
                  if (!withdrawLoading) { 
                    setShowWithdrawModal(false)
                    setWithdrawAmount("") 
                  } 
                }} 
                className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"
                disabled={withdrawLoading}
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="bg-muted/30 rounded-xl p-4">
                <p className="text-text-secondary text-sm mb-1">Available Balance</p>
                <p className="text-text-primary font-bold text-2xl">₦{Number(walletBalance || 0).toLocaleString('en-NG')}</p>
              </div>

              {((user?.bankAccountNumber && user?.bankName) || (documents?.bankAccountNumber && documents?.bankName)) && (
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-text-secondary text-sm mb-1">Bank Account</p>
                  <p className="text-text-primary font-medium">{user?.bankAccountNumber || documents?.bankAccountNumber}</p>
                  <p className="text-text-secondary text-xs mt-1">{user?.bankName || documents?.bankName}</p>
                </div>
              )}

              <div>
                <label className="block text-text-primary font-medium mb-2">Withdrawal Amount (NGN)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formatWithCommas(withdrawAmount)}
                  onChange={(e) => setWithdrawAmount(parseFormattedNumber(e.target.value))}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  placeholder="e.g., 5,000"
                  disabled={withdrawLoading}
                />
                <p className="text-text-secondary text-xs mt-1">Minimum: ₦100 | Maximum: ₦{Number(walletBalance || 0).toLocaleString('en-NG')}</p>
              </div>

              <button 
                onClick={handleWithdraw} 
                disabled={withdrawLoading || !withdrawAmount || parseFloat(withdrawAmount) < 100 || parseFloat(withdrawAmount) > walletBalance} 
                className="w-full bg-secondary text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {withdrawLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Withdraw to Bank Account</span>
                )}
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
                <p className="text-white font-bold text-2xl sm:text-3xl">{activeLoads.length}</p>
              </div>

              <div className="bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl p-4 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-white/80 text-sm">This Month</p>
                <p className="text-white font-bold text-xl sm:text-2xl">₦{formattedMonthlyEarnings}</p>
              </div>
            </div>
            {myRating.count > 0 && (
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-text-primary font-medium">Your rating:</span>
                <span>{myRating.average} ({myRating.count} {myRating.count === 1 ? 'review' : 'reviews'})</span>
              </div>
            )}

            {/* Bonus Wallet */}
            <button
              type="button"
              onClick={() => setActiveView("referrals")}
              className="w-full text-left rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm hover:bg-amber-100/70 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2 text-amber-700">
                <span className="text-xl">🎁</span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide">Bonus Wallet</p>
                  <p className="text-2xl font-bold text-text-primary">₦{bonusBalance.toLocaleString('en-NG')}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-600" />
            </button>

            {/* Active Loads */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-text-primary font-bold text-lg">Active Loads</h3>
                <button
                  type="button"
                  onClick={() => fetchActiveLoads(true)}
                  disabled={loadingActiveLoads}
                  className="text-primary text-sm font-medium flex items-center gap-1 disabled:opacity-60"
                >
                  <Loader className={`w-4 h-4 ${loadingActiveLoads ? 'animate-spin' : ''}`} />
                  <span>{loadingActiveLoads ? 'Refreshing...' : 'Refresh'}</span>
                </button>
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
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            load.status === 'assigned' || load.status === 'in_transit' ? 'bg-primary/10' : 'bg-success/10'
                          }`}>
                            <Navigation className={`w-6 h-6 ${
                              load.status === 'assigned' || load.status === 'in_transit' ? 'text-primary' : 'text-success'
                            }`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-text-primary font-bold text-sm sm:text-base break-words">
                              {formatLocation(load.pickupState, load.pickupLga)} → {formatLocation(load.destinationState, load.destinationLga)}
                            </p>
                            <p className="text-text-secondary text-sm break-words">
                              {load.bookingReference || `#${filterZeroZero(load.id)}`} • {filterZeroZero(load.weight)} tons
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Route Map for this load */}
                      <div className="pt-3 border-t border-border mb-3">
                        <h4 className="text-text-primary font-bold text-sm mb-2">Route Map</h4>
                        <SingleShipmentMap
                          shipment={load}
                          height="300px"
                          statesData={states}
                        />
                      </div>
                      
                      <div className="pt-3 border-t border-border space-y-2">
                        <p className="text-success font-bold text-lg">
                          ₦{parseFloat(load.estimatedCost || 0).toLocaleString('en-NG')}
                        </p>
                        {load.status === 'assigned' && (
                          <button 
                            onClick={() => setPendingConfirm({ title: 'Start trip to pick up?', confirmLabel: 'Start trip', onConfirm: () => handleStartPickupTrip(load.id) })}
                            disabled={updatingStatus === load.id}
                            className="w-full bg-primary text-white py-2 rounded-xl font-medium text-sm disabled:opacity-50 flex items-center justify-center space-x-2"
                          >
                            {updatingStatus === load.id ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Truck className="w-4 h-4" />
                                <span>Start Trip to Pick Up</span>
                              </>
                            )}
                          </button>
                        )}
                        {load.status === 'picking_up' && (
                          <button 
                            onClick={() => {
                              setSelectedShipmentForPOD(load.id)
                              setSelectedPODType('pickup')
                              setShowPODCapture(true)
                            }}
                            disabled={updatingStatus === load.id}
                            className="w-full bg-warning text-white py-2 rounded-xl font-medium text-sm disabled:opacity-50 flex items-center justify-center space-x-2"
                          >
                            <Package className="w-4 h-4" />
                            <span>Capture Pickup POD</span>
                          </button>
                        )}
                        {load.status === 'picked_up' && Boolean(load.pickupConfirmed) && (
                          <button
                            onClick={() => setPendingConfirm({ title: 'Start trip to destination?', confirmLabel: 'Start trip', onConfirm: () => handleStartDeliveryTrip(load.id) })}
                            disabled={updatingStatus === load.id}
                            className="w-full bg-success text-white py-2 rounded-xl font-medium text-sm disabled:opacity-50 flex items-center justify-center space-x-2"
                          >
                            {updatingStatus === load.id ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Navigation className="w-4 h-4" />
                                <span>Start Trip to Destination</span>
                              </>
                            )}
                          </button>
                        )}
                        {Boolean(load.pickupConfirmed) && (
                          <button
                            onClick={() => setEwaybillShipmentId(load.id)}
                            className="w-full bg-muted text-text-primary py-2 rounded-xl font-medium text-sm flex items-center justify-center space-x-2 hover:bg-muted/80"
                          >
                            <FileText className="w-4 h-4" />
                            <span>View E-Waybill</span>
                          </button>
                        )}
                        {load.status === 'picked_up' && !Boolean(load.pickupConfirmed) && (
                          <div className="bg-warning/10 text-warning p-2 rounded-lg text-xs text-center">
                            Waiting for shipper to confirm pickup...
                          </div>
                        )}
                        {load.status === 'in_transit' && (
                          <button 
                            onClick={() => {
                              setSelectedShipmentForPOD(load.id)
                              setSelectedPODType('delivery')
                              setShowPODCapture(true)
                            }}
                            disabled={updatingStatus === load.id}
                            className="w-full bg-success text-white py-2 rounded-xl font-medium text-sm disabled:opacity-50 flex items-center justify-center space-x-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Capture Delivery POD</span>
                          </button>
                        )}
                        {load.status === 'delivered' && !Boolean(load.deliveryConfirmed) && (
                          <div className="bg-warning/10 text-warning p-2 rounded-lg text-xs text-center">
                            Waiting for shipper to confirm delivery...
                          </div>
                        )}
                        {load.status === 'delivered' && Boolean(load.deliveryConfirmed) && (
                          <div className="bg-success/10 text-success p-2 rounded-lg text-xs text-center font-medium">
                            ✓ Delivery confirmed! Trip completed.
                          </div>
                        )}

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

        {/* POD Capture Modal */}
        {showPODCapture && selectedShipmentForPOD && selectedPODType && (
          <PODCapture
            shipmentId={selectedShipmentForPOD}
            podType={selectedPODType}
            onSuccess={() => {
              setShowPODCapture(false)
              setSelectedShipmentForPOD(null)
              setSelectedPODType(null)
              fetchActiveLoads()
            }}
            onClose={() => {
              setShowPODCapture(false)
              setSelectedShipmentForPOD(null)
              setSelectedPODType(null)
            }}
          />
        )}

        {/* E-Waybill Modal */}
        {ewaybillShipmentId && (
          <EwaybillModal shipmentId={ewaybillShipmentId} onClose={() => setEwaybillShipmentId(null)} />
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
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Package className="w-7 h-7 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-text-primary font-bold text-sm sm:text-lg break-words">
                          {selectedShipment.pickupState} → {selectedShipment.destinationState}
                        </p>
                        <p className="text-text-secondary text-sm break-words">Shipment {selectedShipment.bookingReference || `#${selectedShipment.id}`}</p>
                      </div>
                    </div>
                    <div className="sm:text-right flex-shrink-0">
                      <p className="text-success font-bold text-xl">₦{parseFloat(selectedShipment.estimatedCost || 0).toLocaleString('en-NG')}</p>
                      <p className="text-text-secondary text-xs">{selectedShipment.distance ? `${selectedShipment.distance}km` : 'N/A'}</p>
                    </div>
                  </div>

                  {selectedShipment.status && (
                    <div className="mb-6 pt-6 border-t border-border">
                      <p className="text-text-secondary text-sm mb-3 font-medium">Progress Tracker</p>
                      <ShipmentProgressTracker shipment={selectedShipment} />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Pickup Location</p>
                      <p className="text-text-primary font-medium">{formatLocation(selectedShipment.pickupState, selectedShipment.pickupLga)}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Destination</p>
                      <p className="text-text-primary font-medium">{formatLocation(selectedShipment.destinationState, selectedShipment.destinationLga)}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Cargo Type</p>
                      <p className="text-text-primary font-medium">{selectedShipment.cargoType}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Weight</p>
                      <p className="text-text-primary font-medium">{selectedShipment.weight} tons</p>
                    </div>
                  </div>

                  {/* Route Map for this shipment */}
                  <div className="mb-6 pt-6 border-t border-border">
                    <h4 className="text-text-primary font-bold mb-3">Route Map</h4>
                    <SingleShipmentMap
                      shipment={selectedShipment}
                      height="400px"
                      statesData={states}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

                  {/* Check if user has already bid */}
                  {myBids.find(b => b.shipmentId === selectedShipment.id) ? (
                    <div className="w-full bg-muted text-text-primary py-3 px-4 rounded-xl font-bold flex items-center justify-between gap-2">
                      {(() => {
                        const existingBid = myBids.find(b => b.shipmentId === selectedShipment.id)
                        if (existingBid.status === 'accepted') {
                          return <span className="text-success">✓ Bid Accepted</span>
                        } else if (existingBid.status === 'rejected') {
                          return <span className="text-error">✗ Bid Rejected</span>
                        }
                        const minutesLeft = getBidEditMinutesLeft(existingBid)
                        return (
                          <>
                            <span>Bid Submitted: ₦{parseFloat(existingBid.bidAmount || 0).toLocaleString('en-NG')}</span>
                            {minutesLeft > 0 && (
                              <button
                                type="button"
                                onClick={() => handleOpenBidModal(selectedShipment, existingBid)}
                                className="text-primary text-sm font-semibold underline flex-shrink-0"
                              >
                                Edit ({minutesLeft}m left)
                              </button>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenBidModal(selectedShipment)}
                      className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Place Bid</span>
                    </button>
                  )}
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
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="w-7 h-7 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                          <p className="text-text-primary font-bold text-sm sm:text-lg break-words">
                            {shipment.pickupState} → {shipment.destinationState}
                          </p>
                          <p className="text-text-secondary text-sm break-words">{shipment.bookingReference || `#${shipment.id}`}</p>
                    </div>
                  </div>
                  <div className="sm:text-right flex-shrink-0">
                        <p className="text-success font-bold text-xl">
                          ₦{parseFloat(shipment.estimatedCost || 0).toLocaleString('en-NG')}
                        </p>
                        <p className="text-text-secondary text-xs">
                          {shipment.distance && filterZeroZero(shipment.distance) ? `${filterZeroZero(shipment.distance)}km` : 'N/A'}
                        </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mb-4 text-sm text-text-secondary">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                        <span>{formatLocation(shipment.pickupState, shipment.pickupLga)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Navigation className="w-4 h-4" />
                        <span>{formatLocation(shipment.destinationState, shipment.destinationLga)}</span>
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
                  {myBids.find(b => b.shipmentId === shipment.id) ? (
                    <div className="bg-muted text-text-primary py-3 px-3 rounded-xl font-medium flex items-center justify-center gap-2">
                      {(() => {
                        const existingBid = myBids.find(b => b.shipmentId === shipment.id)
                        if (existingBid.status === 'accepted') {
                          return <span className="text-success text-sm">✓ Accepted</span>
                        } else if (existingBid.status === 'rejected') {
                          return <span className="text-error text-sm">✗ Rejected</span>
                        }
                        const minutesLeft = getBidEditMinutesLeft(existingBid)
                        return (
                          <>
                            <span className="text-sm">Bid: ₦{parseFloat(existingBid.bidAmount || 0).toLocaleString('en-NG')}</span>
                            {minutesLeft > 0 && (
                              <button
                                type="button"
                                onClick={() => handleOpenBidModal(shipment, existingBid)}
                                className="text-primary text-xs font-semibold underline flex-shrink-0"
                              >
                                Edit ({minutesLeft}m)
                              </button>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  ) : (
                  <button 
                        onClick={() => handleOpenBidModal(shipment)}
                    className="bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
                  >
                        Place Bid
                  </button>
                  )}
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
                onClick={() => {
                  // Check both user context and documents for bank account details
                  const hasBankDetails = (user?.bankAccountNumber && user?.bankCode) || 
                                        (documents?.bankAccountNumber && documents?.bankCode)
                  
                  if (!hasBankDetails) {
                    toast.error('Please add your bank account details in your profile first')
                    setActiveView('profile')
                  } else {
                    setShowWithdrawModal(true)
                  }
                }}
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
                <>
                  <div className="space-y-2">
                    {paginatedTransactions.map((t) => (
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
                  {totalTransactionsPages > 1 && (
                    <div className="flex items-center justify-center space-x-2 mt-4">
                      <button onClick={() => setTransactionsPage(p => Math.max(1, p - 1))} disabled={transactionsPage === 1} className="px-3 py-1 bg-card border border-border rounded-lg text-sm disabled:opacity-50">Prev</button>
                      <span className="text-text-secondary text-sm">Page {transactionsPage} of {totalTransactionsPages}</span>
                      <button onClick={() => setTransactionsPage(p => Math.min(totalTransactionsPages, p + 1))} disabled={transactionsPage === totalTransactionsPages} className="px-3 py-1 bg-card border border-border rounded-lg text-sm disabled:opacity-50">Next</button>
                    </div>
                  )}
                </>
              )}
            </div>

            <WalletStatement variant="user" />
          </div>
        )}

        {activeView === "referrals" && (
          <div className="space-y-4">
            <h2 className="text-text-primary font-bold text-2xl">Refer & Earn</h2>
            <p className="text-text-secondary text-sm">
              Invite other shippers, truckers, fleet managers, or agents to Holage and earn a reward once they complete their first shipment.
            </p>
            <BonusWallet variant="user" />
            <ReferralPanel />
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
              
              {myRating.count > 0 && (
                <div className="flex items-center justify-center pt-4 border-t border-white/20">
                  <div className="text-center">
                    <p className="text-white font-bold text-2xl">{myRating.average}</p>
                    <p className="text-white/80 text-sm">Rating ({myRating.count} {myRating.count === 1 ? 'review' : 'reviews'})</p>
                  </div>
                </div>
              )}
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

            {/* Identity Verification (NIN & BVN) */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-text-primary font-bold text-lg flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <span>Identity Verification</span>
                </h3>
                {!editingIdentity && documents?.kycStatus !== 'approved' && (
                  <button
                    onClick={() => {
                      setEditingIdentity(true)
                      setIdentityForm({ nin: documents?.nin || '', bvn: documents?.bvn || '' })
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    {documents?.nin || documents?.bvn ? 'Edit' : 'Add'}
                  </button>
                )}
                {documents?.kycStatus === 'approved' && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-success/10 text-success text-xs font-medium rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" /> Approved
                  </span>
                )}
              </div>

              {editingIdentity ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">NIN (National Identification Number)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={identityForm.nin}
                      onChange={(e) => setIdentityForm(f => ({ ...f, nin: e.target.value.replace(/\D/g, '') }))}
                      maxLength="11"
                      placeholder="Enter 11-digit NIN"
                      className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-text-primary placeholder:text-text-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">BVN (Bank Verification Number)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={identityForm.bvn}
                      onChange={(e) => setIdentityForm(f => ({ ...f, bvn: e.target.value.replace(/\D/g, '') }))}
                      maxLength="11"
                      placeholder="Enter 11-digit BVN"
                      className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-text-primary placeholder:text-text-secondary"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        if (!identityForm.nin && !identityForm.bvn) {
                          toast.error('Enter at least NIN or BVN')
                          return
                        }
                        setUpdatingIdentity(true)
                        try {
                          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
                          const token = localStorage.getItem('authToken')
                          const res = await fetch(`${API_BASE_URL}/kyc/identity`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ nin: identityForm.nin || undefined, bvn: identityForm.bvn || undefined })
                          })
                          const data = await res.json()
                          if (res.ok && data.success) {
                            toast.success('Identity updated successfully')
                            setDocuments(d => ({ ...d, nin: identityForm.nin || d?.nin, bvn: identityForm.bvn || d?.bvn }))
                            setEditingIdentity(false)
                          } else {
                            toast.error(data.message || 'Failed to update identity')
                          }
                        } catch {
                          toast.error('Error updating identity')
                        } finally {
                          setUpdatingIdentity(false)
                        }
                      }}
                      disabled={updatingIdentity}
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {updatingIdentity ? <><Loader className="w-4 h-4 animate-spin" /> Saving...</> : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingIdentity(false)}
                      className="px-4 py-2 bg-muted text-text-primary rounded-xl font-medium hover:bg-muted/80 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-xl">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-secondary text-sm mb-1">NIN</p>
                      <div className="flex items-center gap-2">
                        <p className="text-text-primary font-medium">{documents?.nin || 'Not provided'}</p>
                        {!!documents?.ninVerified && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            <CheckCircle className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-xl">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-secondary text-sm mb-1">BVN</p>
                      <div className="flex items-center gap-2">
                        <p className="text-text-primary font-medium">{documents?.bvn || 'Not provided'}</p>
                        {!!documents?.bvnVerified && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            <CheckCircle className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {(!documents?.ninVerified && !documents?.bvnVerified) && (documents?.nin || documents?.bvn) && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Your identity is pending verification by an admin.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Safety net: lets an existing user reach the full KYC flow even after their
                basic info (phone/address/nin) is already complete, so newly-added
                verification requirements are never permanently unreachable. Locked once
                approved — approved KYC can no longer be edited. */}
            {documents?.kycStatus === 'approved' ? (
              <div className="w-full px-4 py-3 bg-success/10 border border-success/20 rounded-xl text-success font-medium text-sm text-center flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> KYC Approved
              </div>
            ) : (
              <button
                onClick={() => navigateTo('kyc')}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-text-primary font-medium hover:bg-muted transition-colors text-sm"
              >
                {documents?.kycStatus === 'rejected' ? 'Fix & Resubmit Verification (KYC)' : 'Update Full Verification (KYC)'}
              </button>
            )}

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
                      inputMode="numeric"
                      value={bankAccountForm.bankAccountNumber || ''}
                      onChange={(e) => {
                        setBankAccountForm(prev => ({ ...prev, bankAccountNumber: e.target.value.replace(/\D/g, "") }))
                        setResolvedAccountName(null)
                        setAccountVerified(false)
                      }}
                      className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-text-primary"
                      placeholder="Enter 10-digit account number"
                      maxLength="10"
                    />
                </div>

                  {/* Account Verification */}
                  {bankAccountForm.bankAccountNumber && bankAccountForm.bankCode && (
                    <div className="space-y-2">
                      {!accountVerified ? (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              if (!bankAccountForm.bankAccountNumber || !bankAccountForm.bankCode) {
                                toast.error("Please fill in account number and select a bank")
                                return
                              }
                              
                              setVerifyingAccount(true)
                              const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
                              
                              const response = await fetch(
                                `${API_BASE_URL}/wallet/paystack/resolve-account?account_number=${bankAccountForm.bankAccountNumber}&bank_code=${bankAccountForm.bankCode}`
                              )
                              
                              const data = await response.json()
                              
                              if (response.ok && data.success) {
                                setResolvedAccountName(data.account_name)
                                setAccountVerified(true)
                                toast.success(`Account verified: ${data.account_name}`)
                              } else {
                                // Show user-friendly error message
                                const errorMsg = data.message || "Failed to verify account. Please check your details."
                                toast.error(errorMsg)
                                setResolvedAccountName(null)
                                setAccountVerified(false)
                              }
                            } catch (error) {
                              console.error("Error verifying account:", error)
                              toast.error("Failed to verify account. Please try again.")
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

                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      onClick={async () => {
                        if (!bankAccountForm.bankAccountNumber || !bankAccountForm.bankCode) {
                          toast.error("Please fill in all bank account details")
                          return
                        }

                        const saveBankAccount = async () => {
                          try {
                            setUpdatingBankAccount(true)
                            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
                            const token = localStorage.getItem('authToken')

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
                        }

                        // Verification is optional - warn but allow saving
                        if (!accountVerified) {
                          setPendingConfirm({
                            title: 'Account not verified',
                            message: "Your account hasn't been verified. Do you want to save anyway? (You can verify it later)",
                            confirmLabel: 'Save anyway',
                            onConfirm: saveBankAccount,
                          })
                          return
                        }

                        saveBankAccount()
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
                        setResolvedAccountName(null)
                        setAccountVerified(false)
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

                  {/* Vehicle Photo (shown on bids when no driver assigned) */}
                  <div className={`bg-card border-2 rounded-xl p-4 ${
                    documents?.vehiclePhoto ? 'border-success/30' : 'border-border'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {documents?.vehiclePhoto ? (
                          <img
                            src={documents.vehiclePhoto}
                            alt="Vehicle"
                            className="w-12 h-12 rounded-lg object-cover cursor-pointer"
                            onClick={() => window.open(documents.vehiclePhoto, '_blank')}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <Truck className="w-6 h-6 text-text-secondary" />
                          </div>
                        )}
                        <div>
                          <p className="text-text-primary font-bold">Vehicle Photo</p>
                          <p className="text-text-secondary text-sm">
                            {documents?.vehiclePhoto ? 'Uploaded ✓' : 'Optional – shown on your bids'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = 'image/*'
                          input.onchange = (e) => {
                            const file = e.target.files?.[0]
                            if (file) handleVehiclePhotoUpload(file)
                          }
                          input.click()
                        }}
                        disabled={uploadingDoc === 'vehiclePhoto'}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
                          documents?.vehiclePhoto
                            ? 'bg-secondary/10 text-secondary hover:bg-secondary/20'
                            : 'bg-primary text-white hover:bg-primary/90'
                        } disabled:opacity-50`}
                      >
                        {uploadingDoc === 'vehiclePhoto' ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            <span className="text-sm">...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span className="text-sm">{documents?.vehiclePhoto ? 'Update' : 'Upload'}</span>
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
        <div className="flex gap-0.5 px-1.5 py-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveView("home")}
            className={`flex flex-col items-center space-y-1 py-1.5 rounded-xl transition-colors flex-shrink-0 min-w-[56px] flex-1 ${
              activeView === "home" ? "bg-primary/10" : ""
            }`}
          >
            <Truck className={`w-6 h-6 ${activeView === "home" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-[10px] font-medium whitespace-nowrap ${activeView === "home" ? "text-primary" : "text-text-secondary"}`}>
              Home
            </span>
          </button>

          <button
            onClick={() => setActiveView("jobs")}
            className={`flex flex-col items-center space-y-1 py-1.5 rounded-xl transition-colors flex-shrink-0 min-w-[56px] flex-1 ${
              activeView === "jobs" ? "bg-primary/10" : ""
            }`}
          >
            <Package className={`w-6 h-6 ${activeView === "jobs" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-[10px] font-medium whitespace-nowrap ${activeView === "jobs" ? "text-primary" : "text-text-secondary"}`}>
              Find Jobs
            </span>
          </button>

          <button
            onClick={() => setActiveView("wallet")}
            className={`flex flex-col items-center space-y-1 py-1.5 rounded-xl transition-colors flex-shrink-0 min-w-[56px] flex-1 ${
              activeView === "wallet" ? "bg-primary/10" : ""
            }`}
          >
            <Wallet className={`w-6 h-6 ${activeView === "wallet" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-[10px] font-medium whitespace-nowrap ${activeView === "wallet" ? "text-primary" : "text-text-secondary"}`}>
              Wallet
            </span>
          </button>

          <button
            onClick={() => setActiveView("referrals")}
            className={`flex flex-col items-center space-y-1 py-1.5 rounded-xl transition-colors flex-shrink-0 min-w-[56px] flex-1 ${
              activeView === "referrals" ? "bg-primary/10" : ""
            }`}
          >
            <Gift className={`w-6 h-6 ${activeView === "referrals" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-[10px] font-medium whitespace-nowrap ${activeView === "referrals" ? "text-primary" : "text-text-secondary"}`}>
              Refer
            </span>
          </button>

          <button
            onClick={() => navigateTo("complaint")}
            className="flex flex-col items-center space-y-1 py-2 rounded-xl transition-colors hover:bg-primary/10 flex-shrink-0 min-w-[64px] flex-1"
          >
            <AlertCircle className="w-6 h-6 text-text-secondary" />
            <span className="text-[10px] font-medium text-text-secondary whitespace-nowrap">
              Complaints
            </span>
          </button>

          <button
            onClick={() => setActiveView("profile")}
            className={`flex flex-col items-center space-y-1 py-1.5 rounded-xl transition-colors flex-shrink-0 min-w-[56px] flex-1 ${
              activeView === "profile" ? "bg-primary/10" : ""
            }`}
          >
            <User className={`w-6 h-6 ${activeView === "profile" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-[10px] font-medium whitespace-nowrap ${activeView === "profile" ? "text-primary" : "text-text-secondary"}`}>
              Profile
            </span>
          </button>
        </div>
      </div>

      {/* Bid Modal */}
      {showBidModal && selectedShipment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-text-primary font-bold text-lg">{editingBid ? 'Edit Bid' : 'Place Bid'}</h3>
              <button
                onClick={() => {
                  setShowBidModal(false)
                  setBidForm({ bidAmount: '', message: '' })
                  setEditingBid(null)
                }}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmitBid} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-muted/30 rounded-xl p-4 mb-4">
                <p className="text-text-secondary text-sm mb-2">Shipment Details</p>
                <p className="text-text-primary font-bold">
                  {selectedShipment.pickupState} → {selectedShipment.destinationState}
                </p>
                <p className="text-text-secondary text-sm">{selectedShipment.bookingReference || `#${selectedShipment.id}`}</p>
                <p className="text-text-secondary text-sm mt-2">
                  Base Cost: <span className="font-bold text-primary">₦{parseFloat(selectedShipment.estimatedCost || 0).toLocaleString('en-NG')}</span>
                </p>
                <p className="text-text-secondary text-xs mt-1">
                  Maximum Bid: ₦{(parseFloat(selectedShipment.estimatedCost || 0) + 200000).toLocaleString('en-NG')}
                </p>
                {editingBid && (
                  <p className="text-warning text-xs mt-2 font-medium">
                    You can edit this bid for {getBidEditMinutesLeft(editingBid)} more minute{getBidEditMinutesLeft(editingBid) === 1 ? '' : 's'}.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2">
                  Bid Amount (NGN) <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={bidForm.bidAmount}
                  onChange={(e) => {
                    const formatted = formatNumberWithCommas(e.target.value)
                    setBidForm({ ...bidForm, bidAmount: formatted })
                  }}
                  placeholder={`e.g. ₦${parseFloat(selectedShipment.estimatedCost || 0).toLocaleString('en-NG')}`}
                  required
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-text-primary"
                />
                <p className="text-text-secondary text-xs mt-1">
                  You can bid below the base cost, or add up to ₦200,000 above it
                </p>
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={bidForm.message}
                  onChange={(e) => setBidForm({ ...bidForm, message: e.target.value })}
                  placeholder="Add a message to the shipper..."
                  rows={4}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-text-primary resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBidModal(false)
                    setBidForm({ bidAmount: '', message: '' })
                    setEditingBid(null)
                  }}
                  className="flex-1 bg-muted text-text-secondary py-3 rounded-xl font-medium hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBid}
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {submittingBid ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>{editingBid ? 'Updating...' : 'Submitting...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>{editingBid ? 'Update Bid' : 'Submit Bid'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
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
