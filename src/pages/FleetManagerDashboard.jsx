"use client"

import { useState, useEffect } from "react"
import {
  Truck,
  Wallet,
  User,
  Eye,
  EyeOff,
  RefreshCw,
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
  CreditCard,
  Package,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronDown,
  Navigation,
  Star,
  Gift,
  FileText,
  UserCheck,
  PackageCheck,
  BadgeCheck,
  XCircle,
  Camera,
  Upload,
  ChevronRight
} from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useToast } from "../context/ToastContext"
import NotificationCenter from "../components/NotificationCenter"
import ConfirmModal from "../components/ConfirmModal"
import ReferralPanel from "../components/ReferralPanel"
import BonusWallet from "../components/BonusWallet"
import { formatWithCommas, parseFormattedNumber } from "../utils/currencyFormat"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const FleetManagerDashboard = () => {
  const { user, logoutUser, navigateTo, handleSessionExpired } = useAppContext()
  const toast = useToast()
  const [activeView, setActiveView] = useState("home")
  const [showBalance, setShowBalance] = useState(true)
  const [wallet, setWallet] = useState(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [bonusBalance, setBonusBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [transactionsPage, setTransactionsPage] = useState(1)
  const transactionsPerPage = 5
  const [kycCheckDone, setKycCheckDone] = useState(false)
  const [documents, setDocuments] = useState(null)
  const [uploadingDoc, setUploadingDoc] = useState(null)

  // Trucks state
  const [trucks, setTrucks] = useState([])
  const [loadingTrucks, setLoadingTrucks] = useState(false)
  const [showAddTruckModal, setShowAddTruckModal] = useState(false)
  const [showEditTruckModal, setShowEditTruckModal] = useState(false)
  const [showEnrollDriverModal, setShowEnrollDriverModal] = useState(false)
  const [enrollForm, setEnrollForm] = useState({ driverCodeOrUsername: "" })
  const [submittingEnroll, setSubmittingEnroll] = useState(false)
  const [addTruckStep, setAddTruckStep] = useState(1)
  const [selectedTruck, setSelectedTruck] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingTruckPhotoId, setUploadingTruckPhotoId] = useState(null)
  
  // Truck form state
  const [truckForm, setTruckForm] = useState({
    plateNumber: "",
    vehicleType: "",
    capacity: "",
    product: "",
    description: "",
    type: "",
    color: "",
    notes: "",
    driverLicense: "",
    vehicleReg: "",
    status: "active",
    quantity: 1,
    driverId: "",
    imageFront: null,
    imageSide: null,
    imageBack: null,
    capacityTier: "",
    insuranceCert: null,
    manufacturer: "",
    vehicleLicense: null,
  })

  const VEHICLE_MANUFACTURERS = [
    "DAF", "MAN DIESEL", "SINOTRUCK/HOWO", "BENZ", "VOLVO", "HINO",
    "MITSUBISHI", "UD TRUCKS", "JAC", "SHACMAN", "DONGFEN", "FOTON", "MACK"
  ]

  // Single source of truth for the carrying-capacity picker — selecting a tier sets both the
  // verification band (capacityTier) and the numeric tonnage (capacity) used elsewhere for
  // display/bid matching, so there's only one "carrying capacity" field to fill in.
  const CAPACITY_TIERS = [
    { tier: "5-10", tons: 10 },
    { tier: "5-15", tons: 15 },
    { tier: "5-20", tons: 20 },
    { tier: "5-30", tons: 30 },
    { tier: "5-40", tons: 40 },
    { tier: "5-50", tons: 50 },
    { tier: "5-60", tons: 60 },
  ]

  // Drivers state
  const [drivers, setDrivers] = useState([])
  const [joinRequests, setJoinRequests] = useState([])
  const [loadingJoinRequests, setLoadingJoinRequests] = useState(false)
  const [processingRequestId, setProcessingRequestId] = useState(null)
  const [loadingDrivers, setLoadingDrivers] = useState(false)
  const [showEditDriverModal, setShowEditDriverModal] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [submittingDriver, setSubmittingDriver] = useState(false)
  const [driverRatings, setDriverRatings] = useState({}) // { driverId: { average, count } }
  
  // Driver form state
  const [driverForm, setDriverForm] = useState({
    driverName: "",
    phoneNumber: "",
    driverLicense: "",
    password: "",
    confirmPassword: ""
  })
  
  // Fleet trips oversight state (replaces bidding)
  const [fleetTrips, setFleetTrips] = useState([])
  const [loadingFleetTrips, setLoadingFleetTrips] = useState(false)
  const [fleetTripStatusFilter, setFleetTripStatusFilter] = useState("")
  const [fleetOverview, setFleetOverview] = useState([])
  const [loadingFleetOverview, setLoadingFleetOverview] = useState(false)
  const [togglingDriverId, setTogglingDriverId] = useState(null)
  
  const truckOptions = [
    { label: "Flatbed trucks", value: "Flatbed trucks" },
    { label: "Box trucks", value: "Box trucks" },
    { label: "Refrigerated trucks", value: "Refrigerated trucks" },
    { label: "Tanker trucks", value: "Tanker trucks" },
    { label: "Container trucks", value: "Container trucks" }
  ]

  const cargoOptions = [
    { label: "Electronics", value: "electronics" },
    { label: "Food/perishables", value: "food" },
    { label: "Textiles", value: "textiles" },
    { label: "Agricultural Products", value: "agricultural" },
    { label: "Building Materials", value: "building_materials" },
    { label: "Other", value: "other" }
  ]

  // Driver payment routing setting
  const [updatingPaymentRouting, setUpdatingPaymentRouting] = useState(false)
  const [refreshingAll, setRefreshingAll] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [pendingConfirm, setPendingConfirm] = useState(null)

  // Wallet state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  
  // Bank account state
  // Identity edit state
  const [editingIdentity, setEditingIdentity] = useState(false)
  const [identityForm, setIdentityForm] = useState({ nin: '', bvn: '' })
  const [updatingIdentity, setUpdatingIdentity] = useState(false)

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
  const [loadingDocs, setLoadingDocs] = useState(false)

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
      if (response.status === 401 || data.expired === true) {
        handleSessionExpired?.()
        return
      }
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
        if (response.status === 401 || data.expired === true) {
          handleSessionExpired?.()
          return
        }
        if (data.success) {
          setDocuments(data.documents)
          
          if (!data.documents.phone || !data.documents.address || !data.documents.nin) {
            navigateTo('kyc')
            return
          }
        }
        
        setKycCheckDone(true)
        fetchTrucks()
        fetchDrivers()
        fetchJoinRequests()
        
        // Fetch wallet
        try {
          const wr = await fetch(`${API_BASE_URL}/wallet`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const wd = await wr.json()
          if (wr.status === 401 || wd.expired === true) {
            handleSessionExpired?.()
            return
          }
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

        // Fetch bonus wallet balance
        try {
          const br = await fetch(`${API_BASE_URL}/wallet/bonus`, { headers: { 'Authorization': `Bearer ${token}` } })
          const bd = await br.json()
          if (br.ok && bd.wallet) setBonusBalance(parseFloat(bd.wallet.balance || 0))
        } catch (e) {
          // ignore — card just shows the last known balance
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
        const response = await fetch(`${API_BASE_URL}/wallet/paystack/banks`)
        const data = await response.json()
        if (data.success && data.banks && Array.isArray(data.banks)) {
          const sortedBanks = data.banks.sort((a, b) => a.name.localeCompare(b.name))
          setBanks(sortedBanks)
        } else {
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
        const token = localStorage.getItem('authToken')
        const response = await fetch(`${API_BASE_URL}/kyc/documents`, {
          headers: { 'Authorization': `Bearer ${token}` }
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

  // Upload/update profile photo — its own endpoint, stays editable even after KYC approval
  const handleProfilePhotoUpload = async (file) => {
    if (!file) return
    setUploadingDoc('profilePhoto')
    try {
      const formData = new FormData()
      formData.append('profilePhoto', file)

      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/kyc/profile-photo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('Profile photo updated!')
        setDocuments(d => ({ ...(d || {}), profilePhoto: data.profilePhoto }))
      } else {
        toast.error(data.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Error uploading profile photo:', error)
      toast.error('Error uploading profile photo')
    } finally {
      setUploadingDoc(null)
    }
  }

  const handlePaymentRoutingChange = async (routing) => {
    setUpdatingPaymentRouting(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/kyc/driver-payment-routing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ routing })
      })
      const data = await response.json()
      if (response.ok) {
        toast.success('Driver payment routing updated!')
        setDocuments(d => ({ ...(d || {}), driverPaymentRouting: routing }))
      } else {
        toast.error(data.message || 'Update failed')
      }
    } catch (error) {
      console.error('Error updating payment routing:', error)
      toast.error('Error updating payment routing')
    } finally {
      setUpdatingPaymentRouting(false)
    }
  }

  const triggerProfilePhotoUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        handleProfilePhotoUpload(file)
      }
    }
    input.click()
  }

  // Load fleet trips when shipments view is active
  useEffect(() => {
    if (activeView === "shipments") {
      fetchFleetTrips()
    }
  }, [activeView, fleetTripStatusFilter])

  // Load fleet overview when home or drivers view is active
  useEffect(() => {
    if (activeView === "home" || activeView === "drivers") {
      fetchFleetOverview()
    }
  }, [activeView])

  // Auto-refresh fleet trips every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeView === "shipments") fetchFleetTrips()
      if (activeView === "home") fetchFleetOverview()
    }, 30000)
    return () => clearInterval(interval)
  }, [activeView, fleetTripStatusFilter])

  // Reset truck form
  const resetTruckForm = () => {
    setTruckForm({
      plateNumber: "",
      vehicleType: "",
      capacity: "",
      product: "",
      description: "",
      type: "",
      color: "",
      notes: "",
      driverLicense: "",
      vehicleReg: "",
      status: "active",
      quantity: 1,
      driverId: "",
      imageFront: null,
      imageSide: null,
      imageBack: null,
      capacityTier: "",
      insuranceCert: null,
      manufacturer: "",
      vehicleLicense: null,
    })
    setAddTruckStep(1)
  }
  
  // Reset driver form
  const resetDriverForm = () => {
    setDriverForm({
      driverName: "",
      phoneNumber: "",
      driverLicense: "",
      password: "",
      confirmPassword: ""
    })
  }
  
  // Fetch drivers
  const fetchDrivers = async () => {
    setLoadingDrivers(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/drivers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (response.status === 401 || data.expired === true) {
        handleSessionExpired?.()
        return
      }
      if (response.ok && data.success) {
        const list = data.drivers || []
        setDrivers(list)
        // Fetch driver ratings in batch
        if (list.length > 0) {
          const ids = list.map((d) => d.id).filter(Boolean)
          try {
            const rr = await fetch(`${API_BASE_URL}/ratings/ratee/batch?rateeType=driver&rateeIds=${ids.join(",")}`)
            const rd = await rr.json()
            if (rr.ok && rd.success && rd.ratings) setDriverRatings(rd.ratings)
          } catch (_) {
            setDriverRatings({})
          }
        } else {
          setDriverRatings({})
        }
      } else {
        toast.error(data.message || 'Failed to fetch drivers')
      }
    } catch (error) {
      console.error('Error fetching drivers:', error)
      toast.error('Error fetching drivers')
    } finally {
      setLoadingDrivers(false)
    }
  }

  // Driver-initiated fleet join requests (reverse of Enroll Driver above — a driver
  // applies using this fleet manager's own code, rather than being enrolled instantly).
  const fetchJoinRequests = async () => {
    setLoadingJoinRequests(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/drivers/fleet-join-requests?status=pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setJoinRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error fetching fleet join requests:', error)
    } finally {
      setLoadingJoinRequests(false)
    }
  }

  const approveJoinRequest = async (requestId, driverName) => {
    setProcessingRequestId(requestId)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/drivers/fleet-join-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(`${driverName || 'Driver'} enrolled into your fleet.`)
        fetchJoinRequests()
        fetchDrivers()
        fetchFleetOverview()
      } else {
        toast.error(data.message || 'Failed to approve request')
      }
    } catch (error) {
      console.error('Error approving fleet join request:', error)
      toast.error('Error approving request. Please check your connection.')
    } finally {
      setProcessingRequestId(null)
    }
  }

  const rejectJoinRequest = async (requestId) => {
    setProcessingRequestId(requestId)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/drivers/fleet-join-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('Request rejected.')
        fetchJoinRequests()
      } else {
        toast.error(data.message || 'Failed to reject request')
      }
    } catch (error) {
      console.error('Error rejecting fleet join request:', error)
      toast.error('Error rejecting request. Please check your connection.')
    } finally {
      setProcessingRequestId(null)
    }
  }

  // Fetch fleet trips (all accepted trips by this fleet's drivers)
  const fetchFleetTrips = async () => {
    setLoadingFleetTrips(true)
    try {
      const token = localStorage.getItem('authToken')
      const params = new URLSearchParams({ limit: '50' })
      if (fleetTripStatusFilter) params.append('status', fleetTripStatusFilter)
      const response = await fetch(`${API_BASE_URL}/drivers/fleet-trips?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.status === 401 || data.expired === true) { handleSessionExpired?.(); return }
      if (response.ok && data.success) {
        setFleetTrips(data.trips || [])
      }
    } catch (error) {
      console.error('Error fetching fleet trips:', error)
    } finally {
      setLoadingFleetTrips(false)
    }
  }

  // Systemic refresh — always visible in the header, reloads trucks, drivers, and fleet
  // trips regardless of which tab is active.
  const handleGlobalRefresh = async () => {
    setRefreshingAll(true)
    try {
      await Promise.all([fetchTrucks(), fetchDrivers(), fetchFleetTrips()])
      toast.success('Refreshed')
    } catch (error) {
      console.error('Error during global refresh:', error)
    } finally {
      setRefreshingAll(false)
    }
  }

  // Fetch fleet overview (driver stats)
  const fetchFleetOverview = async () => {
    setLoadingFleetOverview(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/drivers/fleet-overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.status === 401 || data.expired === true) { handleSessionExpired?.(); return }
      if (response.ok && data.success) {
        setFleetOverview(data.drivers || [])
      }
    } catch (error) {
      console.error('Error fetching fleet overview:', error)
    } finally {
      setLoadingFleetOverview(false)
    }
  }

  // Toggle driver active/inactive
  const handleToggleDriverActive = async (driverId) => {
    setTogglingDriverId(driverId)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/drivers/${driverId}/toggle-active`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(data.message)
        // Update local state without refetching
        setFleetOverview(prev => prev.map(d =>
          d.id === driverId ? { ...d, isActive: data.isActive } : d
        ))
        setDrivers(prev => prev.map(d =>
          d.id === driverId ? { ...d, isActive: data.isActive } : d
        ))
      } else {
        toast.error(data.message || 'Failed to update driver status')
      }
    } catch (error) {
      toast.error('Error updating driver status')
    } finally {
      setTogglingDriverId(null)
    }
  }

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
    if (!stateSlug) return ''
    const stateName = toTitleCase(stateSlug)
    // Don't show LGA if it's "00" or "0" or empty/invalid
    if (lgaSlug && typeof lgaSlug === 'string' && lgaSlug !== '00' && lgaSlug !== '0' && lgaSlug.trim() !== '') {
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

  // Helper function to get status info
  // Each status gets its own distinct icon (not a shared checkmark) so the trip's stage
  // reads at a glance from the icon alone, without needing to check the color/label.
  const getStatusInfo = (status, deliveryConfirmed = false) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'warning', label: 'Pending' }
      case 'assigned':
        return { icon: UserCheck, color: 'primary', label: 'Assigned' }
      case 'picking_up':
        return { icon: Truck, color: 'primary', label: 'Going to Pick Up' }
      case 'picked_up':
        return { icon: PackageCheck, color: 'warning', label: 'Picked Up' }
      case 'in_transit':
        return { icon: Navigation, color: 'success', label: 'In Transit' }
      case 'delivered':
        return deliveryConfirmed
          ? { icon: BadgeCheck, color: 'success', label: 'Delivered' }
          : { icon: CheckCircle, color: 'warning', label: 'Delivered (Awaiting Confirmation)' }
      case 'cancelled':
        return { icon: XCircle, color: 'error', label: 'Cancelled' }
      default:
        return { icon: Clock, color: 'text-secondary', label: status }
    }
  }

  // Stub to avoid reference errors from remaining JSX (replaces old fetchAssignedShipments)
  const fetchAssignedShipments = () => {
    fetchFleetOverview()

  }

  const handleEnrollDriver = async (e) => {
    e.preventDefault()
    if (!enrollForm.driverCodeOrUsername.trim()) {
      toast.error("Enter the driver's code or username (phone number)")
      return
    }
    setSubmittingEnroll(true)
    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch(`${API_BASE_URL}/drivers/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          driverCode: enrollForm.driverCodeOrUsername.trim(),
        }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(data.message || "Driver enrolled successfully")
        setShowEnrollDriverModal(false)
        setEnrollForm({ driverCodeOrUsername: "" })
        fetchDrivers()
        fetchFleetOverview()
      } else {
        toast.error(data.message || "Failed to enroll driver")
      }
    } catch (error) {
      console.error("Error enrolling driver:", error)
      toast.error("Error enrolling driver")
    } finally {
      setSubmittingEnroll(false)
    }
  }

  // Handle add truck (details + images, no driver registration)
  const handleAddTruck = async (e) => {
    e.preventDefault()

    if (addTruckStep === 1) {
      if (!truckForm.plateNumber || !truckForm.vehicleType) {
        toast.error("Plate number and vehicle type are required")
        return
      }
      if (!truckForm.capacity || parseFloat(truckForm.capacity) <= 0) {
        toast.error("Carrying capacity (tons) is required")
        return
      }
      if (!truckForm.manufacturer) {
        toast.error("Vehicle manufacturer is required")
        return
      }
      if (!truckForm.vehicleReg) {
        toast.error("Vehicle registration is required")
        return
      }
      setAddTruckStep(2)
      return
    }

    if (!truckForm.imageFront || !truckForm.imageSide || !truckForm.imageBack) {
      toast.error("Front, side, and back vehicle photos are all required")
      return
    }
    if (!truckForm.vehicleLicense) {
      toast.error("A photo of the vehicle license is required")
      return
    }

    const submitAddTruck = async () => {
      setSubmitting(true)
      try {
        const token = localStorage.getItem("authToken")
        const formData = new FormData()
        formData.append("plateNumber", truckForm.plateNumber)
        formData.append("vehicleType", truckForm.vehicleType)
        formData.append("capacity", truckForm.capacity)
        formData.append("manufacturer", truckForm.manufacturer)
        formData.append("vehicleReg", truckForm.vehicleReg)
        if (truckForm.product) formData.append("product", truckForm.product)
        if (truckForm.description) formData.append("description", truckForm.description)
        if (truckForm.type) formData.append("type", truckForm.type)
        if (truckForm.color) formData.append("color", truckForm.color)
        if (truckForm.notes) formData.append("notes", truckForm.notes)
        if (truckForm.driverId) formData.append("driverId", truckForm.driverId)
        if (truckForm.capacityTier) formData.append("capacityTier", truckForm.capacityTier)
        if (truckForm.imageFront) formData.append("imageFront", truckForm.imageFront)
        if (truckForm.imageSide) formData.append("imageSide", truckForm.imageSide)
        if (truckForm.imageBack) formData.append("imageBack", truckForm.imageBack)
        if (truckForm.vehicleLicense) formData.append("vehicleLicense", truckForm.vehicleLicense)

        const response = await fetch(`${API_BASE_URL}/trucks/with-images`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })

        const data = await response.json()

        if (response.ok && data.success) {
          // Insurance cert goes through its own endpoint since it needs the new truck's ID
          if (truckForm.insuranceCert && data.truck?.id) {
            const certForm = new FormData()
            certForm.append("insuranceCert", truckForm.insuranceCert)
            try {
              await fetch(`${API_BASE_URL}/trucks/${data.truck.id}/insurance-cert`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: certForm,
              })
            } catch (certError) {
              console.error("Error uploading insurance certificate:", certError)
              toast.error("Truck added, but the insurance certificate upload failed — you can retry it from Edit Truck.")
            }
          }
          toast.success("Truck added successfully!")
          setShowAddTruckModal(false)
          resetTruckForm()
          fetchTrucks()
        } else {
          toast.error(data.message || "Failed to add truck")
        }
      } catch (error) {
        console.error("Error adding truck:", error)
        toast.error("Error adding truck")
      } finally {
        setSubmitting(false)
      }
    }

    if (truckForm.driverId) {
      setPendingConfirm({
        title: "Assign this driver?",
        message: "You're about to assign a driver to this vehicle. The driver will be notified and expected to operate this vehicle on future trips — make sure you've selected the right one before continuing.",
        confirmLabel: "Assign driver",
        onConfirm: submitAddTruck,
      })
      return
    }

    submitAddTruck()
  }

  // Upload vehicle photo for truck (Edit Truck modal)
  const handleTruckPhotoUpload = async (truckId, file, view = "front") => {
    if (!file || file.size > 5 * 1024 * 1024) {
      toast.error("Please select an image under 5MB")
      return
    }
    setUploadingTruckPhotoId(truckId)
    try {
      const token = localStorage.getItem("authToken")
      const formData = new FormData()
      formData.append("truckImage", file)
      formData.append("view", view)
      const res = await fetch(`${API_BASE_URL}/trucks/${truckId}/photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (res.ok && data.truck) {
        toast.success("Vehicle photo updated.")
        setSelectedTruck((prev) => (prev?.id === truckId ? { ...prev, ...data.truck } : prev))
        fetchTrucks()
      } else {
        toast.error(data.message || "Failed to upload photo")
      }
    } catch (e) {
      toast.error("Failed to upload vehicle photo")
    } finally {
      setUploadingTruckPhotoId(null)
    }
  }

  // Upload/replace insurance certificate for truck (Edit Truck modal)
  const handleTruckInsuranceCertUpload = async (truckId, file) => {
    if (!file || file.size > 5 * 1024 * 1024) {
      toast.error("Please select an image or PDF under 5MB")
      return
    }
    setUploadingTruckPhotoId(truckId)
    try {
      const token = localStorage.getItem("authToken")
      const formData = new FormData()
      formData.append("insuranceCert", file)
      const res = await fetch(`${API_BASE_URL}/trucks/${truckId}/insurance-cert`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (res.ok && data.truck) {
        toast.success("Insurance certificate updated.")
        setSelectedTruck((prev) => (prev?.id === truckId ? { ...prev, ...data.truck } : prev))
        fetchTrucks()
      } else {
        toast.error(data.message || "Failed to upload insurance certificate")
      }
    } catch (e) {
      toast.error("Failed to upload insurance certificate")
    } finally {
      setUploadingTruckPhotoId(null)
    }
  }

  // Handle edit truck
  const handleEditTruck = (truck) => {
    setSelectedTruck(truck)
    setTruckForm({
      plateNumber: truck.plateNumber,
      vehicleType: truck.vehicleType,
      capacity: truck.capacity != null ? String(truck.capacity) : "",
      product: truck.product || "",
      description: truck.description || "",
      type: truck.type || "",
      color: truck.color || "",
      notes: truck.notes || "",
      driverLicense: truck.driverLicense || "",
      vehicleReg: truck.vehicleReg || "",
      status: truck.status || "active",
      quantity: 1,
      driverId: truck.driverId ? String(truck.driverId) : "",
      imageFront: null,
      imageSide: null,
      imageBack: null,
      capacityTier: truck.capacityTier || "",
      insuranceCert: null,
      manufacturer: truck.manufacturer || "",
      vehicleLicense: null,
    })
    setShowEditTruckModal(true)
  }
  
  // Handle edit driver
  const handleEditDriver = (driver) => {
    setSelectedDriver(driver)
    setDriverForm({
      driverName: driver.driverName,
      phoneNumber: driver.phoneNumber,
      driverLicense: driver.driverLicense,
      password: "",
      confirmPassword: ""
    })
    setShowEditDriverModal(true)
  }
  
  // Handle update driver
  const handleUpdateDriver = async (e) => {
    e.preventDefault()
    
    if (!driverForm.driverName || !driverForm.phoneNumber || !driverForm.driverLicense) {
      toast.error("Name, phone number, and license are required")
      return
    }
    
    if (driverForm.password && driverForm.password !== driverForm.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    
    if (driverForm.password && driverForm.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    
    setSubmittingDriver(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/drivers/${selectedDriver.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          driverName: driverForm.driverName,
          phoneNumber: driverForm.phoneNumber,
          driverLicense: driverForm.driverLicense,
          password: driverForm.password || null
        })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('Driver updated successfully!')
        setShowEditDriverModal(false)
        setSelectedDriver(null)
        resetDriverForm()
        fetchDrivers()
      } else {
        toast.error(data.message || 'Failed to update driver')
      }
    } catch (error) {
      console.error('Error updating driver:', error)
      toast.error('Error updating driver')
    } finally {
      setSubmittingDriver(false)
    }
  }
  
  // Handle delete driver
  const handleDeleteDriver = async (driverId) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/drivers/${driverId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('Driver deleted successfully!')
        fetchDrivers()
      } else {
        toast.error(data.message || 'Failed to delete driver')
      }
    } catch (error) {
      console.error('Error deleting driver:', error)
      toast.error('Error deleting driver')
    }
  }
  
  // Handle update truck
  const handleUpdateTruck = async (e) => {
    e.preventDefault()
    
    if (!truckForm.plateNumber || !truckForm.vehicleType) {
      toast.error("Plate number and vehicle type are required")
      return
    }
    if (!truckForm.manufacturer) {
      toast.error("Vehicle manufacturer is required")
      return
    }
    if (!truckForm.vehicleReg) {
      toast.error("Vehicle registration is required")
      return
    }

    const submitUpdateTruck = async () => {
      setSubmitting(true)
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch(`${API_BASE_URL}/trucks/${selectedTruck.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...truckForm,
            capacity: truckForm.capacity ? parseFloat(truckForm.capacity) : null,
            driverId: truckForm.driverId || null
          })
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

    const previousDriverId = selectedTruck?.driverId ? String(selectedTruck.driverId) : ""
    if (truckForm.driverId && truckForm.driverId !== previousDriverId) {
      setPendingConfirm({
        title: "(Re)assign this driver?",
        message: "You're about to (re)assign a driver to this vehicle. The driver will be notified and expected to operate this vehicle on future trips — make sure you've selected the right one before continuing.",
        confirmLabel: "Assign driver",
        onConfirm: submitUpdateTruck,
      })
      return
    }

    submitUpdateTruck()
  }

  // Handle delete truck
  const handleDeleteTruck = async (truckId) => {
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
      case 'out_of_service':
        return <AlertCircle className="w-5 h-5 text-error" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  // Note: fleet manager wallets are earnings-only (populated by completed shipments) and
  // cannot be funded directly — the backend rejects it (paystackInitiatePayment), so there is
  // intentionally no top-up flow here, unlike the other roles' dashboards.

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
        
        const wr = await fetch(`${API_BASE_URL}/wallet`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        })
        const wd = await wr.json()
        if (wr.ok && wd.wallet) {
          setWalletBalance(parseFloat(wd.wallet.balance || 0))
        }
        
        const tr = await fetch(`${API_BASE_URL}/wallet/transactions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const td = await tr.json()
        if (tr.ok && td.transactions) {
          setTransactions(td.transactions)
        }
      } else {
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
      {/* Header Card */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 p-6 rounded-b-3xl shadow-lg">
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
            <div className="min-w-0">
              <p className="text-white/80 text-sm">Fleet Manager</p>
              <p className="text-white font-extrabold text-xl leading-tight flex items-center gap-1.5">
                {user?.fullName || "Fleet Manager"}
                {documents?.cacVerified && (
                  <CheckCircle className="w-4 h-4 text-emerald-300 flex-shrink-0" title="CAC verified" />
                )}
              </p>
              {user?.fleetManagerCode && (
                <p className="text-white/70 text-xs mt-0.5 font-mono tracking-wide">ID: {user.fleetManagerCode}</p>
              )}
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
              {showBalance ? `₦${walletBalance.toLocaleString()}` : '₦ • • • • • •'}
            </p>
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
                <p className="text-white font-bold text-2xl sm:text-3xl">{trucks.length}</p>
              </div>

              <div className="bg-gradient-to-br from-success to-success/80 rounded-2xl p-4 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-white/80 text-sm">Total Drivers</p>
                <p className="text-white font-bold text-2xl sm:text-3xl">{drivers.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setEnrollForm({ driverCodeOrUsername: "" })
                  setShowEnrollDriverModal(true)
                }}
                className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-4 shadow-lg flex flex-col items-center justify-center space-y-2 hover:shadow-xl transition-all"
              >
                <Users className="w-6 h-6 text-white" />
                <span className="text-white font-bold text-sm text-center">Enroll Driver</span>
              </button>
              <button
                onClick={() => {
                  resetTruckForm()
                  setShowAddTruckModal(true)
                }}
                className="bg-gradient-to-r from-success to-success/80 rounded-2xl p-4 shadow-lg flex flex-col items-center justify-center space-y-2 hover:shadow-xl transition-all"
              >
                <Truck className="w-6 h-6 text-white" />
                <span className="text-white font-bold text-sm text-center">Add Truck</span>
              </button>
            </div>

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
                  <p className="text-xl sm:text-2xl font-bold text-text-primary">₦{bonusBalance.toLocaleString('en-NG')}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-600" />
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
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Truck className="w-6 h-6 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-text-primary font-bold">{truck.plateNumber}</p>
                            <p className="text-text-secondary text-sm">{truck.vehicleType}</p>
                            {truck.capacity != null && (
                              <p className="text-text-secondary text-xs mt-0.5">
                                Capacity: {truck.capacity} tons
                              </p>
                            )}
                            {truck.driverName && (
                              <p className="text-text-secondary text-xs mt-1 flex items-center space-x-1 min-w-0">
                                <User className="w-3 h-3 flex-shrink-0" />
                                <span className="min-w-0 break-words">Driver: {truck.driverName}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {getStatusIcon(truck.isOutOfService ? 'out_of_service' : truck.status)}
                          <span className={`text-xs capitalize ${truck.isOutOfService ? 'text-error font-medium' : 'text-text-secondary'}`}>
                            {truck.isOutOfService ? 'Out of Service (Inactive 6mo+)' : truck.status}
                          </span>
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
                          onClick={() => setPendingConfirm({ title: 'Delete this truck?', message: "This can't be undone.", confirmLabel: 'Delete', destructive: true, onConfirm: () => handleDeleteTruck(truck.id) })}
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

            {/* Fleet Overview Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-text-primary font-bold text-lg">Fleet Overview</h3>
                <button
                  onClick={fetchFleetOverview}
                  disabled={loadingFleetOverview}
                  className="text-primary text-sm font-medium hover:text-primary/80 disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>

              {loadingFleetOverview ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-text-secondary text-sm">Loading fleet...</p>
                </div>
              ) : fleetOverview.length > 0 ? (
                <div className="space-y-3">
                  {/* Summary stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-card border border-border rounded-xl p-3 text-center">
                      <p className="text-xl sm:text-2xl font-bold text-text-primary">{fleetOverview.length}</p>
                      <p className="text-text-secondary text-xs">Total Drivers</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-3 text-center">
                      <p className="text-xl sm:text-2xl font-bold text-success">{fleetOverview.filter(d => d.isActive).length}</p>
                      <p className="text-text-secondary text-xs">Active</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-3 text-center">
                      <p className="text-xl sm:text-2xl font-bold text-primary">{fleetOverview.filter(d => d.currentTrip).length}</p>
                      <p className="text-text-secondary text-xs">On Trip</p>
                    </div>
                  </div>

                  {fleetOverview.map(driver => (
                    <div key={driver.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${driver.isActive ? 'bg-success/10' : 'bg-muted'}`}>
                            <User className={`w-5 h-5 ${driver.isActive ? 'text-success' : 'text-text-secondary'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-text-primary font-semibold truncate">{driver.driverName}</p>
                            <p className="text-text-secondary text-xs">{driver.phoneNumber}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${driver.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                          {driver.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
                        <div className="text-center">
                          <p className="text-text-primary font-bold">{driver.tripsCompleted}</p>
                          <p className="text-text-secondary text-xs">Completed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-text-primary font-bold">{driver.currentTrip ? '1' : '0'}</p>
                          <p className="text-text-secondary text-xs">On Trip</p>
                        </div>
                        <div className="text-center">
                          <p className="text-success font-bold text-sm">₦{(driver.totalEarned || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}</p>
                          <p className="text-text-secondary text-xs">Earned</p>
                        </div>
                      </div>
                      {driver.currentTrip && (
                        <div className="mt-2 pt-2 border-t border-border text-xs text-text-secondary">
                          Current: {driver.currentTrip.pickupState} → {driver.currentTrip.destinationState}
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${
                            driver.currentTrip.status === 'in_transit' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
                          }`}>{driver.currentTrip.status?.replace('_', ' ')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-muted/30 rounded-2xl p-8 text-center">
                  <Users className="w-12 h-12 text-text-secondary mx-auto mb-2" />
                  <p className="text-text-secondary">No drivers yet</p>
                  <p className="text-text-secondary text-sm mt-1">Register drivers to track fleet activity</p>
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
                {/* Balance itself is shown in the persistent header above — avoid repeating it here */}
                <p className="text-text-secondary text-xs">
                  Sum of everything your fleet has earned from completed shipments. Fleet managers don't fund this wallet directly — only withdrawals apply.
                </p>

                <button
                  onClick={() => {
                    const hasBankDetails = (user?.bankAccountNumber && user?.bankCode) ||
                                          (documents?.bankAccountNumber && documents?.bankCode)

                    if (!hasBankDetails) {
                      toast.error('Please add your bank account details in your profile first')
                      setActiveView('profile')
                    } else {
                      setShowWithdrawModal(true)
                    }
                  }}
                  className="w-full bg-secondary text-white rounded-2xl p-6 flex flex-col items-center space-y-3"
                >
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                    <ArrowUp className="w-7 h-7 text-white" />
                  </div>
                  <span className="font-bold">Withdraw</span>
                </button>

                <div>
                  <h3 className="text-text-primary font-bold mb-3">Recent Transactions</h3>
                  {transactions.length === 0 ? (
                    <div className="bg-muted/30 rounded-2xl p-6 text-center text-text-secondary">
                      No transactions yet
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {paginatedTransactions.map((t) => (
                          <div
                            key={t.id || t.reference}
                            className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div
                                className={`w-10 h-10 flex-shrink-0 ${
                                  t.type === 'credit' ? 'bg-success/10' : 'bg-error/10'
                                } rounded-full flex items-center justify-center`}
                              >
                                {t.type === 'credit' ? (
                                  <ArrowDown className="w-5 h-5 text-success" />
                                ) : (
                                  <ArrowUp className="w-5 h-5 text-error" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-text-primary font-medium">
                                  {t.description || (t.type === 'credit' ? 'Wallet Funding' : 'Wallet Debit')}
                                </p>
                                <p className="text-text-secondary text-xs break-all">Ref: {t.reference}</p>
                              </div>
                            </div>
                            <p className={`${t.type === 'credit' ? 'text-success' : 'text-error'} font-bold flex-shrink-0`}>
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
              </>
            )}
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

        {activeView === "drivers" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-text-primary font-bold text-2xl">Drivers</h2>
              <button
                onClick={() => {
                  setEnrollForm({ driverCodeOrUsername: "" })
                  setShowEnrollDriverModal(true)
                }}
                className="bg-primary text-white px-4 py-2 rounded-xl font-medium flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Enroll Driver</span>
              </button>
            </div>

            {joinRequests.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-text-primary font-bold text-lg">Join Requests</h3>
                {joinRequests.map((r) => (
                  <div key={r.id} className="bg-card border border-warning/40 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-text-secondary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-text-primary font-bold break-words">{r.driverName || '—'}</p>
                          {r.phoneNumber && <p className="text-text-secondary text-sm">{r.phoneNumber}</p>}
                          {r.driverCode && <p className="text-primary text-xs font-semibold">Code: {r.driverCode}</p>}
                        </div>
                      </div>
                      <span className="bg-warning/10 text-warning text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0">Pending</span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => approveJoinRequest(r.id, r.driverName)}
                        disabled={processingRequestId === r.id}
                        className="flex-1 bg-primary text-white text-sm font-semibold rounded-xl py-2 disabled:opacity-60 flex items-center justify-center gap-1.5"
                      >
                        {processingRequestId === r.id ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Approve
                      </button>
                      <button
                        onClick={() => rejectJoinRequest(r.id)}
                        disabled={processingRequestId === r.id}
                        className="flex-1 border border-border text-text-primary text-sm font-semibold rounded-xl py-2 disabled:opacity-60 flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {loadingDrivers ? (
              <div className="flex justify-center items-center py-12">
                <Loader className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : drivers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drivers.map((driver) => {
                  const overview = fleetOverview.find(d => d.id === driver.id)
                  return (
                    <div key={driver.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${driver.isActive ? 'bg-success/10' : 'bg-muted'}`}>
                            <User className={`w-6 h-6 ${driver.isActive ? 'text-success' : 'text-text-secondary'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-text-primary font-bold text-base sm:text-lg break-words">{driver.driverName}</p>
                            <p className="text-text-secondary text-sm">{driver.phoneNumber}</p>
                            {driver.driverCode && (
                              <p className="text-primary text-xs font-medium mt-0.5">Code: {driver.driverCode}</p>
                            )}
                            {driverRatings[driver.id]?.count > 0 && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400 flex-shrink-0" />
                                <span className="text-text-secondary text-xs">{driverRatings[driver.id].average} ({driverRatings[driver.id].count} {driverRatings[driver.id].count === 1 ? "review" : "reviews"})</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleDriverActive(driver.id)}
                          disabled={togglingDriverId === driver.id}
                          className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                            driver.isActive
                              ? 'bg-success/10 text-success hover:bg-error/10 hover:text-error'
                              : 'bg-error/10 text-error hover:bg-success/10 hover:text-success'
                          }`}
                        >
                          {togglingDriverId === driver.id ? (
                            <Loader className="w-3 h-3 animate-spin" />
                          ) : (
                            driver.isActive ? 'Active' : 'Inactive'
                          )}
                        </button>
                      </div>

                      {/* Stats from fleet overview */}
                      {overview && (
                        <div className="grid grid-cols-3 gap-2 mb-3 py-3 border-y border-border">
                          <div className="text-center">
                            <p className="text-text-primary font-bold text-base sm:text-lg">{overview.tripsCompleted}</p>
                            <p className="text-text-secondary text-xs">Completed</p>
                          </div>
                          <div className="text-center">
                            <p className="text-text-primary font-bold text-base sm:text-lg">{overview.currentTrip ? '1' : '0'}</p>
                            <p className="text-text-secondary text-xs">On Trip</p>
                          </div>
                          <div className="text-center">
                            <p className="text-success font-bold text-sm">₦{(overview.totalEarned || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}</p>
                            <p className="text-text-secondary text-xs">Earned</p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1 mb-3">
                        <div className="flex items-center space-x-2 text-text-secondary text-sm min-w-0">
                          <CreditCard className="w-4 h-4 flex-shrink-0" />
                          <span className="min-w-0 break-all">License: {driver.driverLicense}</span>
                        </div>
                        {driver.assignedTrucksCount > 0 && (
                          <div className="flex items-center space-x-2 text-text-secondary text-sm">
                            <Truck className="w-4 h-4" />
                            <span>{driver.assignedTrucksCount} truck(s) assigned</span>
                          </div>
                        )}
                        {overview?.currentTrip && (
                          <div className="flex items-center space-x-2 text-xs">
                            <Navigation className="w-3 h-3 text-primary" />
                            <span className="text-primary font-medium">
                              On trip: {overview.currentTrip.pickupState} → {overview.currentTrip.destinationState}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 pt-3 border-t border-border">
                        <button
                          onClick={() => handleEditDriver(driver)}
                          className="flex-1 bg-primary text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setPendingConfirm({ title: 'Delete this driver?', message: "This can't be undone.", confirmLabel: 'Delete', destructive: true, onConfirm: () => handleDeleteDriver(driver.id) })}
                          className="flex-1 bg-error/10 text-error px-4 py-2 rounded-xl font-medium text-sm hover:bg-error/20 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-muted/30 rounded-2xl p-8 text-center">
                <Users className="w-12 h-12 text-text-secondary mx-auto mb-2" />
                <p className="text-text-secondary">No drivers yet</p>
                <p className="text-text-secondary text-sm mt-1">Register your first driver to get started</p>
              </div>
            )}
          </div>
        )}

        {activeView === "shipments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-text-primary font-bold text-2xl">Fleet Trips</h2>
              <button
                onClick={fetchFleetTrips}
                disabled={loadingFleetTrips}
                className="bg-primary text-white px-4 py-2 rounded-xl font-medium flex items-center space-x-2 disabled:opacity-50"
              >
                {loadingFleetTrips ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Package className="w-5 h-5" />
                    <span>Refresh</span>
                  </>
                )}
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              {[
                { label: 'All', value: '' },
                { label: 'Assigned', value: 'assigned' },
                { label: 'In Transit', value: 'in_transit' },
                { label: 'Delivered', value: 'delivered' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFleetTripStatusFilter(opt.value)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    fleetTripStatusFilter === opt.value
                      ? 'bg-primary text-white'
                      : 'bg-card border border-border text-text-secondary hover:border-primary/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {loadingFleetTrips ? (
              <div className="flex justify-center items-center py-12">
                <Loader className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : fleetTrips.length > 0 ? (
              <div className="space-y-3">
                {fleetTrips.map((trip) => {
                  const statusInfo = getStatusInfo(trip.shipmentStatus, !!trip.deliveryConfirmed)
                  const StatusIcon = statusInfo.icon
                  const statusColorMap = {
                    warning: { bg: 'bg-warning/10', text: 'text-warning' },
                    primary: { bg: 'bg-primary/10', text: 'text-primary' },
                    success: { bg: 'bg-success/10', text: 'text-success' },
                    error: { bg: 'bg-error/10', text: 'text-error' },
                  }
                  const colors = statusColorMap[statusInfo.color] || { bg: 'bg-muted/30', text: 'text-text-secondary' }
                  return (
                    <div key={trip.bidId} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                            <StatusIcon className={`w-5 h-5 ${colors.text}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-text-primary font-semibold truncate">
                              {formatLocation(trip.pickupState, trip.pickupLga)} → {formatLocation(trip.destinationState, trip.destinationLga)}
                            </p>
                            <p className="text-text-secondary text-xs">
                              #{filterZeroZero(trip.shipmentId)} • {trip.cargoType}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-success font-bold">₦{parseFloat(trip.bidAmount || 0).toLocaleString('en-NG')}</p>
                          <span className={`text-xs font-medium ${colors.text}`}>{statusInfo.label}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 border-t border-border text-xs text-text-secondary">
                        <div className="flex items-center space-x-1 min-w-0">
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="min-w-0 break-words">{trip.driverName || 'Unknown driver'}</span>
                        </div>
                        <div className="flex items-center space-x-1 min-w-0">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span className="min-w-0 break-words">{trip.driverPhone || ''}</span>
                        </div>
                        <div className="min-w-0 break-words">
                          Shipper: {trip.shipperName || '—'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-muted/30 rounded-2xl p-8 text-center">
                <Package className="w-12 h-12 text-text-secondary mx-auto mb-2" />
                <p className="text-text-secondary">No trips found</p>
                <p className="text-text-secondary text-sm mt-1">
                  {fleetTripStatusFilter ? 'Try a different status filter' : 'Trips will appear here once drivers accept shipments'}
                </p>
              </div>
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
                    className="w-20 h-20 rounded-full object-cover border-4 border-white/30 shadow-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30 shadow-lg flex-shrink-0">
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-bold text-2xl mb-1 break-words">{user?.fullName || "Fleet Manager"}</h2>
                  <div className="flex items-center space-x-2 text-white/90 min-w-0">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <p className="text-sm min-w-0 break-all">{user?.email || ""}</p>
                  </div>
                  {user?.fleetManagerCode && (
                    <div className="mt-2 inline-flex items-center bg-white/15 rounded-lg px-3 py-1">
                      <p className="text-white font-mono font-bold text-sm tracking-wide">Special ID: {user.fleetManagerCode}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Driver Payment Routing Setting */}
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-text-primary font-bold mb-1">Driver Payment Routing</p>
              <p className="text-text-secondary text-sm mb-3">
                Choose whether your drivers' trip earnings pay out straight to their own wallet, or come to your fleet wallet instead so you can pay them separately (e.g. a fixed salary).
              </p>
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/30">
                  <input
                    type="radio"
                    name="paymentRouting"
                    checked={(documents?.driverPaymentRouting || 'driver_direct') === 'driver_direct'}
                    onChange={() => handlePaymentRoutingChange('driver_direct')}
                    disabled={updatingPaymentRouting}
                    className="mt-1 w-6 h-6 flex-shrink-0"
                  />
                  <span>
                    <span className="block text-text-primary font-medium">Driver-direct (default)</span>
                    <span className="block text-text-secondary text-xs">Each driver's trip earnings go straight to their own wallet.</span>
                  </span>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/30">
                  <input
                    type="radio"
                    name="paymentRouting"
                    checked={documents?.driverPaymentRouting === 'fleet_manager_direct'}
                    onChange={() => handlePaymentRoutingChange('fleet_manager_direct')}
                    disabled={updatingPaymentRouting}
                    className="mt-1 w-6 h-6 flex-shrink-0"
                  />
                  <span>
                    <span className="block text-text-primary font-medium">Fleet-manager-direct</span>
                    <span className="block text-text-secondary text-xs">Trip earnings come to your fleet wallet instead; you pay your drivers separately.</span>
                  </span>
                </label>
              </div>
            </div>

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
                  onClick={triggerProfilePhotoUpload}
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

            {/* Business Registration (CAC/TIN) */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-text-primary font-bold text-lg flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span>Business Registration</span>
                </h3>
                {documents?.kycStatus === 'approved' ? (
                  <span className="flex items-center gap-1 px-3 py-1 bg-success/10 text-success text-xs font-medium rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" /> Approved
                  </span>
                ) : (
                  <button
                    onClick={() => navigateTo('kyc')}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    {documents?.cacNumber ? 'Update' : 'Add'}
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-secondary text-sm mb-1">CAC Number</p>
                    <div className="flex items-center gap-2">
                      <p className="text-text-primary font-medium">{documents?.cacNumber || 'Not provided'}</p>
                      {!!documents?.cacVerified && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-secondary text-sm mb-1">TIN</p>
                    <p className="text-text-primary font-medium">{documents?.tin || 'Not provided'}</p>
                  </div>
                </div>
                {!documents?.cacNumber && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Company registration (CAC/TIN) is required for fleet managers. Tap "Add" to submit it.
                  </p>
                )}
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
                              
                              const response = await fetch(
                                `${API_BASE_URL}/wallet/paystack/resolve-account?account_number=${bankAccountForm.bankAccountNumber}&bank_code=${bankAccountForm.bankCode}`
                              )
                              
                              const data = await response.json()
                              
                              if (response.ok && data.success) {
                                setResolvedAccountName(data.account_name)
                                setAccountVerified(true)
                                toast.success(`Account verified: ${data.account_name}`)
                              } else {
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
          </div>
        )}
      </div>

      <ConfirmModal
        open={showLogoutConfirm}
        title="Log out?"
        message="You'll need to sign in again to access your account."
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

      {/* Enroll Driver Modal */}
      {showEnrollDriverModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] flex flex-col">
            <div className="flex-shrink-0 bg-card border-b border-border p-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-text-primary font-bold text-xl">Enroll Existing Driver</h3>
              <button
                onClick={() => {
                  setShowEnrollDriverModal(false)
                  setEnrollForm({ driverCodeOrUsername: "" })
                }}
                className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <form onSubmit={handleEnrollDriver} className="flex-1 overflow-y-auto p-4 space-y-4">
              <p className="text-text-secondary text-sm">
                Enter the driver&apos;s unique code or username (phone number) to add them to your fleet. This does not create a new driver account.
              </p>
              <div>
                <label className="block text-text-primary font-medium mb-2">Driver Code or Username *</label>
                <input
                  type="text"
                  value={enrollForm.driverCodeOrUsername}
                  onChange={(e) => setEnrollForm({ driverCodeOrUsername: e.target.value })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  placeholder="e.g. DRV-ABC123 or 08012345678"
                  required
                  disabled={submittingEnroll}
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submittingEnroll}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submittingEnroll ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin mr-2" />
                      Enrolling...
                    </>
                  ) : (
                    "Enroll Driver"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Truck Modal */}
      {showAddTruckModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] flex flex-col">
            <div className="flex-shrink-0 bg-card border-b border-border p-4 flex items-center justify-between rounded-t-3xl">
              <div>
                <h3 className="text-text-primary font-bold text-xl">Add New Truck</h3>
                <p className="text-text-secondary text-xs mt-1">Step {addTruckStep} of 2 — {addTruckStep === 1 ? "Truck details" : "Vehicle photos"}</p>
              </div>
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
              {addTruckStep === 1 ? (
                <>
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
                    <label className="block text-text-primary font-medium mb-2">Carrying Capacity *</label>
                    <select
                      value={truckForm.capacityTier}
                      onChange={(e) => {
                        const tier = e.target.value
                        const match = CAPACITY_TIERS.find((t) => t.tier === tier)
                        setTruckForm({ ...truckForm, capacityTier: tier, capacity: match ? String(match.tons) : "" })
                      }}
                      className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                      required
                      disabled={submitting}
                    >
                      <option value="">Select capacity tier</option>
                      {CAPACITY_TIERS.map(({ tier, tons }) => (
                        <option key={tier} value={tier}>{tier} ({tons} tons)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-text-primary font-medium mb-2">Manufacturer *</label>
                    <select
                      value={truckForm.manufacturer}
                      onChange={(e) => setTruckForm({ ...truckForm, manufacturer: e.target.value })}
                      className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                      required
                      disabled={submitting}
                    >
                      <option value="">Select manufacturer</option>
                      {VEHICLE_MANUFACTURERS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-text-primary font-medium mb-2">Vehicle Registration Number *</label>
                    <input
                      type="text"
                      value={truckForm.vehicleReg}
                      onChange={(e) => setTruckForm({ ...truckForm, vehicleReg: e.target.value })}
                      className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                      placeholder="e.g., registration/particulars number"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-text-primary font-medium mb-2">Assign Driver (Optional)</label>
                    <select
                      value={truckForm.driverId}
                      onChange={(e) => setTruckForm({ ...truckForm, driverId: e.target.value })}
                      className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                      disabled={submitting}
                    >
                      <option value="">No driver assigned</option>
                      {drivers.filter(d => d.isActive && !trucks.some(t => String(t.driverId) === String(d.id))).map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.driverName} - {driver.phoneNumber}
                        </option>
                      ))}
                    </select>
                    <p className="text-text-secondary text-xs mt-1">Drivers already assigned to a truck aren't listed — a driver can only have one truck at a time.</p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-text-secondary text-sm">Upload front, side, and back views of the truck, plus a photo of the vehicle license — all required.</p>
                  {[
                    { key: "imageFront", label: "Front View *", field: "imageFront" },
                    { key: "imageSide", label: "Side View *", field: "imageSide" },
                    { key: "imageBack", label: "Back View *", field: "imageBack" },
                    { key: "vehicleLicense", label: "Vehicle License *", field: "vehicleLicense" },
                  ].map(({ key, label, field }) => (
                    <div key={key}>
                      <label className="block text-text-primary font-medium mb-2">{label}</label>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={submitting}
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          setTruckForm({ ...truckForm, [field]: file })
                          e.target.value = ""
                        }}
                        className="w-full text-sm text-text-secondary file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white file:text-sm"
                      />
                      {truckForm[field] && (
                        <p className="text-success text-xs mt-1">{truckForm[field].name} selected</p>
                      )}
                    </div>
                  ))}

                  <div>
                    <label className="block text-text-primary font-medium mb-2">Insurance Certificate (Optional)</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      disabled={submitting}
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setTruckForm({ ...truckForm, insuranceCert: file })
                        e.target.value = ""
                      }}
                      className="w-full text-sm text-text-secondary file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white file:text-sm"
                    />
                    {truckForm.insuranceCert && (
                      <p className="text-success text-xs mt-1">{truckForm.insuranceCert.name} selected</p>
                    )}
                  </div>
                </>
              )}

              <div className="pt-4 flex gap-3">
                {addTruckStep === 2 && (
                  <button
                    type="button"
                    onClick={() => setAddTruckStep(1)}
                    disabled={submitting}
                    className="flex-1 bg-muted text-text-primary py-4 rounded-xl font-bold text-lg hover:bg-muted/80 transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin mr-2" />
                      Adding...
                    </>
                  ) : addTruckStep === 1 ? (
                    "Next: Photos"
                  ) : (
                    "Add Truck"
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
                <label className="block text-text-primary font-medium mb-2">Carrying Capacity *</label>
                <select
                  value={truckForm.capacityTier}
                  onChange={(e) => {
                    const tier = e.target.value
                    const match = CAPACITY_TIERS.find((t) => t.tier === tier)
                    setTruckForm({ ...truckForm, capacityTier: tier, capacity: match ? String(match.tons) : "" })
                  }}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  required
                  disabled={submitting}
                >
                  <option value="">Select capacity tier</option>
                  {CAPACITY_TIERS.map(({ tier, tons }) => (
                    <option key={tier} value={tier}>{tier} ({tons} tons)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2">Manufacturer *</label>
                <select
                  value={truckForm.manufacturer}
                  onChange={(e) => setTruckForm({ ...truckForm, manufacturer: e.target.value })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  required
                  disabled={submitting}
                >
                  <option value="">Select manufacturer</option>
                  {VEHICLE_MANUFACTURERS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2">Vehicle Registration Number *</label>
                <input
                  type="text"
                  value={truckForm.vehicleReg}
                  onChange={(e) => setTruckForm({ ...truckForm, vehicleReg: e.target.value })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  placeholder="e.g., registration/particulars number"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2">Insurance Certificate</label>
                <div className="flex items-center gap-3">
                  {selectedTruck?.insuranceCertUrl ? (
                    <a
                      href={selectedTruck.insuranceCertUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary text-sm underline flex-shrink-0"
                    >
                      View current
                    </a>
                  ) : (
                    <span className="text-text-secondary text-xs flex-shrink-0">Not uploaded</span>
                  )}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    disabled={uploadingTruckPhotoId === selectedTruck?.id}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file && selectedTruck?.id) handleTruckInsuranceCertUpload(selectedTruck.id, file)
                      e.target.value = ""
                    }}
                    className="flex-1 text-sm text-text-secondary file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white file:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2">Assign Driver (Optional)</label>
                <select
                  value={truckForm.driverId}
                  onChange={(e) => setTruckForm({ ...truckForm, driverId: e.target.value })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  disabled={submitting}
                >
                  <option value="">No driver assigned</option>
                  {drivers
                    .filter(d => d.isActive && !trucks.some(t => String(t.driverId) === String(d.id) && String(t.id) !== String(selectedTruck?.id)))
                    .map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.driverName} - {driver.phoneNumber}
                      </option>
                    ))}
                </select>
                <p className="text-text-secondary text-xs mt-1">Select a driver to assign to this truck. Drivers already assigned elsewhere aren't listed.</p>
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

              {/* Vehicle photos — front, side, back */}
              <div className="space-y-4">
                <label className="block text-text-primary font-medium">Vehicle Photos</label>
                {[
                  { view: "front", label: "Front View", url: selectedTruck?.imageFrontUrl || selectedTruck?.imageUrl },
                  { view: "side", label: "Side View", url: selectedTruck?.imageSideUrl },
                  { view: "back", label: "Back View", url: selectedTruck?.imageBackUrl },
                ].map(({ view, label, url }) => (
                  <div key={view}>
                    <p className="text-text-secondary text-sm mb-2">{label}</p>
                    <div className="flex items-center gap-3">
                      {url ? (
                        <img
                          src={url}
                          alt={label}
                          className="w-20 h-20 rounded-lg object-cover border border-border"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg border border-border bg-muted flex items-center justify-center">
                          <Truck className="w-8 h-8 text-text-secondary" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingTruckPhotoId === selectedTruck?.id}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file && selectedTruck?.id) handleTruckPhotoUpload(selectedTruck.id, file, view)
                            e.target.value = ""
                          }}
                          className="w-full text-sm text-text-secondary file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white file:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {uploadingTruckPhotoId === selectedTruck?.id && (
                  <p className="text-primary text-xs flex items-center gap-1">
                    <Loader className="w-3 h-3 animate-spin" /> Uploading...
                  </p>
                )}
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
        <div className="flex gap-1 px-2 py-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveView("home")}
            className={`flex flex-col items-center space-y-1 py-2 rounded-xl transition-colors flex-shrink-0 min-w-[64px] flex-1 ${
              activeView === "home" ? "bg-primary/10" : ""
            }`}
          >
            <Truck className={`w-7 h-7 ${activeView === "home" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-xs font-medium whitespace-nowrap ${activeView === "home" ? "text-primary" : "text-text-secondary"}`}>
              Fleet
            </span>
          </button>

          <button
            onClick={() => {
              setActiveView("drivers")
              fetchDrivers()
            }}
            className={`flex flex-col items-center space-y-1 py-2 rounded-xl transition-colors flex-shrink-0 min-w-[64px] flex-1 ${
              activeView === "drivers" ? "bg-primary/10" : ""
            }`}
          >
            <Users className={`w-7 h-7 ${activeView === "drivers" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-xs font-medium whitespace-nowrap ${activeView === "drivers" ? "text-primary" : "text-text-secondary"}`}>
              Drivers
            </span>
          </button>

          <button
            onClick={() => setActiveView("shipments")}
            className={`flex flex-col items-center space-y-1 py-2 rounded-xl transition-colors flex-shrink-0 min-w-[64px] flex-1 ${
              activeView === "shipments" ? "bg-primary/10" : ""
            }`}
          >
            <Package className={`w-7 h-7 ${activeView === "shipments" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-xs font-medium whitespace-nowrap ${activeView === "shipments" ? "text-primary" : "text-text-secondary"}`}>
              Trips
            </span>
          </button>

          <button
            onClick={() => setActiveView("wallet")}
            className={`flex flex-col items-center space-y-1 py-2 rounded-xl transition-colors flex-shrink-0 min-w-[64px] flex-1 ${
              activeView === "wallet" ? "bg-primary/10" : ""
            }`}
          >
            <Wallet className={`w-7 h-7 ${activeView === "wallet" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-xs font-medium whitespace-nowrap ${activeView === "wallet" ? "text-primary" : "text-text-secondary"}`}>
              Wallet
            </span>
          </button>

          <button
            onClick={() => setActiveView("referrals")}
            className={`flex flex-col items-center space-y-1 py-2 rounded-xl transition-colors flex-shrink-0 min-w-[64px] flex-1 ${
              activeView === "referrals" ? "bg-primary/10" : ""
            }`}
          >
            <Gift className={`w-7 h-7 ${activeView === "referrals" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-xs font-medium whitespace-nowrap ${activeView === "referrals" ? "text-primary" : "text-text-secondary"}`}>
              Refer
            </span>
          </button>

          <button
            onClick={() => setActiveView("profile")}
            className={`flex flex-col items-center space-y-1 py-2 rounded-xl transition-colors flex-shrink-0 min-w-[64px] flex-1 ${
              activeView === "profile" ? "bg-primary/10" : ""
            }`}
          >
            <User className={`w-7 h-7 ${activeView === "profile" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-xs font-medium whitespace-nowrap ${activeView === "profile" ? "text-primary" : "text-text-secondary"}`}>
              Profile
            </span>
          </button>
        </div>
      </div>

      {/* Edit Driver Modal */}
      {showEditDriverModal && selectedDriver && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] flex flex-col">
            <div className="flex-shrink-0 bg-card border-b border-border p-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-text-primary font-bold text-xl">Edit Driver</h3>
              <button
                onClick={() => {
                  setShowEditDriverModal(false)
                  setSelectedDriver(null)
                  resetDriverForm()
                }}
                className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <form onSubmit={handleUpdateDriver} className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-text-primary font-medium mb-2">Driver Name *</label>
                <input
                  type="text"
                  value={driverForm.driverName}
                  onChange={(e) => setDriverForm({ ...driverForm, driverName: e.target.value })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  required
                  disabled={submittingDriver}
                />
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={driverForm.phoneNumber}
                  onChange={(e) => setDriverForm({ ...driverForm, phoneNumber: e.target.value })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  required
                  disabled={submittingDriver}
                />
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2">Driver's License *</label>
                <input
                  type="text"
                  value={driverForm.driverLicense}
                  onChange={(e) => setDriverForm({ ...driverForm, driverLicense: e.target.value })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  required
                  disabled={submittingDriver}
                />
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2">New Password (Optional)</label>
                <input
                  type="password"
                  value={driverForm.password}
                  onChange={(e) => setDriverForm({ ...driverForm, password: e.target.value })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  placeholder="Leave blank to keep current password"
                  disabled={submittingDriver}
                />
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={driverForm.confirmPassword}
                  onChange={(e) => setDriverForm({ ...driverForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  placeholder="Required if changing password"
                  disabled={submittingDriver}
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submittingDriver}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submittingDriver ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    'Update Driver'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Bank Selection Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
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

export default FleetManagerDashboard

