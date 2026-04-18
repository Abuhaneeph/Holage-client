"use client"

import { useState, useEffect } from "react"
import {
  Truck,
  Package,
  User,
  Eye,
  EyeOff,
  LogOut,
  Loader,
  CheckCircle,
  Clock,
  MapPin,
  Navigation,
  Phone,
  Mail,
  AlertCircle,
  Star,
  Search,
  DollarSign,
  Wallet,
  ArrowUp,
  ArrowDown,
  Send
} from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useToast } from "../context/ToastContext"
import NotificationCenter from "../components/NotificationCenter"
import PODCapture from "../components/PODCapture"
import SingleShipmentMap from "../components/SingleShipmentMap"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const DriverDashboard = () => {
  const { navigateTo } = useAppContext()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState("jobs") // jobs | findwork | wallet
  const [driverInfo, setDriverInfo] = useState(null)
  const [fleetManagerInfo, setFleetManagerInfo] = useState(null)
  const [assignedShipments, setAssignedShipments] = useState([])
  const [loadingShipments, setLoadingShipments] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [assignedTrucks, setAssignedTrucks] = useState([])
  const [loadingTrucks, setLoadingTrucks] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(null)
  const [showPODCapture, setShowPODCapture] = useState(false)
  const [selectedShipmentForPOD, setSelectedShipmentForPOD] = useState(null)
  const [selectedPODType, setSelectedPODType] = useState(null)
  const [myRating, setMyRating] = useState({ average: 0, count: 0 })

  // Find Work / Bidding state
  const [availableShipments, setAvailableShipments] = useState([])
  const [loadingAvailable, setLoadingAvailable] = useState(false)
  const [myBids, setMyBids] = useState([])
  const [loadingMyBids, setLoadingMyBids] = useState(false)
  const [showBidModal, setShowBidModal] = useState(false)
  const [selectedBidShipment, setSelectedBidShipment] = useState(null)
  const [bidAmount, setBidAmount] = useState("")
  const [bidMessage, setBidMessage] = useState("")
  const [submittingBid, setSubmittingBid] = useState(false)
  const [availablePage, setAvailablePage] = useState(1)
  const [availableTotalPages, setAvailableTotalPages] = useState(1)
  const ITEMS_PER_PAGE = 10

  // Wallet state
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletTransactions, setWalletTransactions] = useState([])
  const [loadingWallet, setLoadingWallet] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [withdrawBankAccountNumber, setWithdrawBankAccountNumber] = useState("")
  const [withdrawBankCode, setWithdrawBankCode] = useState("")
  const [withdrawBankName, setWithdrawBankName] = useState("")
  const [resolvedAccountName, setResolvedAccountName] = useState(null)
  const [verifyingAccount, setVerifyingAccount] = useState(false)
  const [accountVerified, setAccountVerified] = useState(false)
  const [banks, setBanks] = useState([])
  const [loadingBanks, setLoadingBanks] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const driverData = localStorage.getItem('driverInfo')
    
    if (!token || !driverData) {
      navigateTo('driver-login')
      return
    }

    try {
      const driver = JSON.parse(driverData)
      setDriverInfo(driver)
      fetchFleetManagerInfo(driver.fleetManagerId)
      fetchAssignedShipments()
      fetchAssignedTrucks()

      const savedBankDetails = localStorage.getItem('driverBankDetails')
      if (savedBankDetails) {
        try {
          const parsed = JSON.parse(savedBankDetails)
          if (parsed.bankAccountNumber) setWithdrawBankAccountNumber(parsed.bankAccountNumber)
          if (parsed.bankCode) setWithdrawBankCode(parsed.bankCode)
          if (parsed.bankName) setWithdrawBankName(parsed.bankName)
          if (parsed.resolvedAccountName) {
            setResolvedAccountName(parsed.resolvedAccountName)
            setAccountVerified(true)
          }
        } catch (error) {
          console.warn('Unable to parse saved bank details', error)
        }
      }

      // Fetch driver rating
      if (driver.id) {
        fetch(`${API_BASE_URL}/ratings/ratee?rateeType=driver&rateeId=${driver.id}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.success && d.count > 0) setMyRating({ average: d.average, count: d.count })
          })
          .catch(() => {})
      }
    } catch (error) {
      console.error('Error parsing driver info:', error)
      navigateTo('driver-login')
    }
  }, [])

  // Auto-refresh shipments every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === "jobs") fetchAssignedShipments()
    }, 30000)
    return () => clearInterval(interval)
  }, [activeTab])

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === "findwork") {
      fetchAvailableShipments(1)
      fetchMyBids()
    } else if (activeTab === "wallet") {
      fetchWallet()
    }
  }, [activeTab])

  useEffect(() => {
    const fetchBanks = async () => {
      setLoadingBanks(true)
      try {
        const response = await fetch(`${API_BASE_URL}/wallet/paystack/banks`)
        const data = await response.json()
        if (data.success && Array.isArray(data.banks)) {
          const sortedBanks = data.banks.sort((a, b) => a.name.localeCompare(b.name))
          setBanks(sortedBanks)
        } else {
          console.error('Failed to fetch banks:', data.message)
          toast.error('Failed to load banks. Please refresh the page.')
        }
      } catch (error) {
        console.error('Error fetching banks:', error)
        toast.error('Error loading banks. Please check your connection.')
      } finally {
        setLoadingBanks(false)
      }
    }

    fetchBanks()
  }, [])

  // Reload available shipments on page change
  useEffect(() => {
    if (activeTab === "findwork") {
      fetchAvailableShipments(availablePage)
    }
  }, [availablePage])

  const fetchFleetManagerInfo = async (fleetManagerId) => {
    try {
      const driverData = JSON.parse(localStorage.getItem('driverInfo'))
      if (driverData.fleetManagerName) {
        setFleetManagerInfo({
          fullName: driverData.fleetManagerName,
          phone: driverData.fleetManagerPhone,
          email: driverData.fleetManagerEmail
        })
      }
    } catch (error) {
      console.error('Error fetching fleet manager info:', error)
    }
  }

  const fetchAvailableShipments = async (page = availablePage) => {
    setLoadingAvailable(true)
    try {
      const token = localStorage.getItem('authToken')
      const queryParams = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        offset: ((page - 1) * ITEMS_PER_PAGE).toString()
      })
      const response = await fetch(`${API_BASE_URL}/shipping/shipments/available?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setAvailableShipments(data.shipments || [])
        if ((data.shipments || []).length < ITEMS_PER_PAGE) {
          setAvailableTotalPages(page)
        } else {
          setAvailableTotalPages(page + 1)
        }
      } else {
        toast.error(data.message || 'Failed to fetch available shipments')
      }
    } catch (error) {
      console.error('Error fetching available shipments:', error)
      toast.error('Error fetching shipments')
    } finally {
      setLoadingAvailable(false)
    }
  }

  const fetchMyBids = async () => {
    setLoadingMyBids(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/bids/my-bids`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setMyBids(data.bids || [])
      }
    } catch (error) {
      console.error('Error fetching my bids:', error)
    } finally {
      setLoadingMyBids(false)
    }
  }

  const fetchWallet = async () => {
    setLoadingWallet(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/drivers/wallet`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setWalletBalance(parseFloat(data.wallet?.balance || 0))
        setWalletTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching wallet:', error)
    } finally {
      setLoadingWallet(false)
    }
  }

  const resolveBankAccount = async () => {
    if (!withdrawBankAccountNumber || !withdrawBankCode) {
      toast.error('Enter account number and select a bank first')
      return
    }

    setVerifyingAccount(true)
    setResolvedAccountName(null)
    setAccountVerified(false)

    try {
      const response = await fetch(
        `${API_BASE_URL}/wallet/paystack/resolve-account?account_number=${withdrawBankAccountNumber}&bank_code=${withdrawBankCode}`
      )
      const data = await response.json()
      if (response.ok && data.success && data.account_name) {
        setResolvedAccountName(data.account_name)
        setAccountVerified(true)
        toast.success(`Account verified: ${data.account_name}`)

        const bankDetailsToSave = {
          bankAccountNumber: withdrawBankAccountNumber,
          bankCode: withdrawBankCode,
          bankName: withdrawBankName,
          resolvedAccountName: data.account_name
        }
        localStorage.setItem('driverBankDetails', JSON.stringify(bankDetailsToSave))
      } else {
        const errorMsg = data.message || 'Failed to verify account'
        toast.error(errorMsg)
        setResolvedAccountName(null)
        setAccountVerified(false)
      }
    } catch (error) {
      console.error('Error verifying bank account:', error)
      toast.error('Failed to verify account. Please try again.')
      setResolvedAccountName(null)
      setAccountVerified(false)
    } finally {
      setVerifyingAccount(false)
    }
  }

  const handleWithdraw = async () => {
    const amountNum = parseFloat(withdrawAmount)
    if (!amountNum || amountNum < 100) {
      toast.error('Enter a valid amount (minimum ₦100)')
      return
    }

    if (amountNum > walletBalance) {
      toast.error(`Insufficient balance. Your wallet balance is ₦${walletBalance.toLocaleString('en-NG')}`)
      return
    }

    if (!withdrawBankAccountNumber || !withdrawBankCode) {
      toast.error('Provide bank account number and bank code')
      return
    }

    if (!accountVerified || !resolvedAccountName) {
      toast.error('Please verify the bank account before withdrawing')
      return
    }

    setWithdrawLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/drivers/wallet/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          amount: amountNum,
          bankAccountNumber: withdrawBankAccountNumber,
          bankCode: withdrawBankCode,
          bankName: withdrawBankName
        })
      })
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(data.message || 'Withdrawal successful')
        setShowWithdrawModal(false)
        setWithdrawAmount("")
        setWithdrawBankAccountNumber("")
        setWithdrawBankCode("")
        setWithdrawBankName("")
        fetchWallet()
      } else {
        const errorMsg = data.message || 'Withdrawal failed'
        toast.error(errorMsg)
      }
    } catch (error) {
      console.error('Withdrawal error:', error)
      toast.error(error.message || 'Withdrawal failed')
    } finally {
      setWithdrawLoading(false)
    }
  }

  const handleSubmitBid = async (e) => {
    e.preventDefault()
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      toast.error("Enter a valid bid amount")
      return
    }
    setSubmittingBid(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          shipmentId: selectedBidShipment.id,
          bidAmount: parseFloat(bidAmount),
          message: bidMessage || null
        })
      })
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('Bid submitted successfully!')
        setShowBidModal(false)
        setBidAmount("")
        setBidMessage("")
        setSelectedBidShipment(null)
        fetchMyBids()
        fetchAvailableShipments()
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

  const hasBidForShipment = (shipmentId) => myBids.some(b => b.shipmentId === shipmentId)
  const getBidForShipment = (shipmentId) => myBids.find(b => b.shipmentId === shipmentId)

  const fetchAssignedShipments = async () => {
    setLoadingShipments(true)
    try {
      const token = localStorage.getItem('authToken')
      
      // Fetch bids for this driver
      const response = await fetch(`${API_BASE_URL}/bids/my-bids`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (response.ok && data.success) {
        // Filter for accepted bids
        const acceptedBids = data.bids.filter(bid => bid.status === 'accepted')
        
        console.log('Driver accepted bids:', acceptedBids) // Debug log
        
        // Map bids to shipments (bids already contain shipment info from the query)
        const shipments = acceptedBids.map(bid => ({
          id: bid.shipmentId,
          pickupState: bid.pickupState,
          pickupLga: bid.pickupLga,
          destinationState: bid.destinationState,
          destinationLga: bid.destinationLga,
          cargoType: bid.cargoType,
          weight: bid.weight,
          truckType: bid.truckType,
          pickupDate: bid.pickupDate,
          distance: bid.distance || null,
          status: bid.shipmentStatus || bid.status || 'assigned', // Fallback to 'assigned' if status missing
          pickupConfirmed: bid.pickupConfirmed || false,
          deliveryConfirmed: bid.deliveryConfirmed || false,
          shipperName: bid.shipperName,
          shipperPhone: bid.shipperPhone,
          bidAmount: bid.bidAmount,
          bidMessage: bid.message,
          fleetManagerName: bid.fleetManagerName,
          fleetManagerPhone: bid.fleetManagerPhone,
          estimatedCost: bid.shipmentEstimatedCost || bid.bidAmount
        }))
        
        console.log('Driver mapped shipments:', shipments) // Debug log
        setAssignedShipments(shipments)
      } else {
        console.error('Failed to fetch bids:', data)
      }
    } catch (error) {
      console.error('Error fetching assigned shipments:', error)
      toast.error('Error fetching shipments')
    } finally {
      setLoadingShipments(false)
    }
  }

  const fetchAssignedTrucks = async () => {
    setLoadingTrucks(true)
    try {
      const token = localStorage.getItem('authToken')
      
      const response = await fetch(`${API_BASE_URL}/trucks/my-assigned`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (response.ok && data.success) {
        setAssignedTrucks(data.trucks || [])
      } else {
        toast.error(data.message || 'Failed to fetch assigned vehicles')
      }
    } catch (error) {
      console.error('Error fetching assigned trucks:', error)
      toast.error('Error fetching assigned vehicles')
    } finally {
      setLoadingTrucks(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('driverInfo')
    localStorage.removeItem('userRole')
    navigateTo('driver-login')
  }


  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'warning', bgColor: 'bg-warning/10', textColor: 'text-warning', label: 'Pending' }
      case 'assigned':
        return { icon: CheckCircle, color: 'primary', bgColor: 'bg-primary/10', textColor: 'text-primary', label: 'Assigned' }
      case 'picking_up':
        return { icon: Truck, color: 'primary', bgColor: 'bg-primary/10', textColor: 'text-primary', label: 'Going to Pick Up' }
      case 'picked_up':
        return { icon: Package, color: 'warning', bgColor: 'bg-warning/10', textColor: 'text-warning', label: 'Picked Up (Awaiting Confirmation)' }
      case 'in_transit':
        return { icon: Navigation, color: 'success', bgColor: 'bg-success/10', textColor: 'text-success', label: 'In Transit to Destination' }
      case 'delivered':
        return { icon: CheckCircle, color: 'warning', bgColor: 'bg-warning/10', textColor: 'text-warning', label: 'Delivered (Awaiting Confirmation)' }
      case 'cancelled':
        return { icon: AlertCircle, color: 'error', bgColor: 'bg-error/10', textColor: 'text-error', label: 'Cancelled' }
      default:
        return { icon: Clock, color: 'text-secondary', bgColor: 'bg-text-secondary/10', textColor: 'text-text-secondary', label: status }
    }
  }

  // Start trip to pick up
  const handleStartPickupTrip = async (shipmentId) => {
    if (!window.confirm('Start trip to pick up the shipment?')) {
      return
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
        body: JSON.stringify({ status: 'picking_up' })
      })
      
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(data.message || 'Trip to pick up started successfully!')
        fetchAssignedShipments()
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

  // Mark as picked up
  const handleMarkPickedUp = async (shipmentId) => {
    if (!window.confirm('Mark shipment as picked up? Shipper will need to confirm before you can start trip to destination.')) {
      return
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
        body: JSON.stringify({ status: 'picked_up' })
      })
      
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(data.message || 'Shipment marked as picked up. Waiting for shipper confirmation.')
        fetchAssignedShipments()
      } else {
        toast.error(data.message || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error marking as picked up:', error)
      toast.error('Error updating status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  // Start trip to destination (after pickup confirmed)
  const handleStartDeliveryTrip = async (shipmentId) => {
    if (!window.confirm('Start trip to destination?')) {
      return
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
        body: JSON.stringify({ status: 'in_transit' })
      })
      
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(data.message || 'Trip to destination started successfully!')
        fetchAssignedShipments()
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

  // Mark as delivered
  const handleMarkDelivered = async (shipmentId) => {
    if (!window.confirm('Mark shipment as delivered? Shipper will need to confirm before final payment is released.')) {
      return
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
        body: JSON.stringify({ status: 'delivered' })
      })
      
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(data.message || 'Shipment marked as delivered. Waiting for shipper confirmation.')
        fetchAssignedShipments()
      } else {
        toast.error(data.message || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error marking as delivered:', error)
      toast.error('Error updating status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  if (!driverInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-24">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-primary via-primary to-secondary p-4 sm:p-6 rounded-b-2xl sm:rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white/80 text-xs sm:text-sm">Driver</p>
              <p className="text-white font-bold text-base sm:text-lg truncate">{driverInfo.driverName || "Driver"}</p>
              {myRating.count > 0 && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span className="text-white/90 text-xs">{myRating.average} ({myRating.count} {myRating.count === 1 ? "review" : "reviews"})</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <NotificationCenter userId={driverInfo.id} />
            <button
              onClick={handleLogout}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-error/20 rounded-full flex items-center justify-center hover:bg-error/30 transition-colors flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </div>

        {fleetManagerInfo && (
          <div className="mt-3 sm:mt-4 p-3 bg-white/10 rounded-xl">
            <p className="text-white/80 text-xs sm:text-sm mb-1">Fleet Manager</p>
            <p className="text-white font-medium text-sm sm:text-base truncate">{fleetManagerInfo.fullName}</p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 mt-2">
            {fleetManagerInfo.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/80 flex-shrink-0" />
                  <p className="text-white/90 text-xs sm:text-sm truncate">{fleetManagerInfo.phone}</p>
              </div>
            )}
            {fleetManagerInfo.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/80 flex-shrink-0" />
                  <p className="text-white/90 text-xs sm:text-sm truncate">{fleetManagerInfo.email}</p>
              </div>
            )}
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 sm:px-6">
        <div className="flex max-w-7xl mx-auto">
          {[
            { id: "jobs", label: "My Jobs", icon: Package },
            { id: "findwork", label: "Find Work", icon: Search },
            { id: "wallet", label: "Wallet", icon: Wallet }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 max-w-7xl mx-auto">
        <div className="space-y-4 sm:space-y-6">

          {/* ========== FIND WORK TAB ========== */}
          {activeTab === "findwork" && (
            <div className="space-y-6">
              {/* My Active Bids */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-text-primary font-bold text-xl">My Bids</h2>
                  <button onClick={fetchMyBids} disabled={loadingMyBids} className="text-primary text-sm font-medium hover:text-primary/80 disabled:opacity-50">Refresh</button>
                </div>
                {loadingMyBids ? (
                  <div className="flex justify-center py-8"><Loader className="w-7 h-7 animate-spin text-primary" /></div>
                ) : myBids.length > 0 ? (
                  <div className="space-y-3">
                    {myBids.map(bid => (
                      <div key={bid.id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-text-primary font-semibold text-sm">
                            {bid.pickupState} → {bid.destinationState}
                          </p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            bid.status === 'accepted' ? 'bg-success/10 text-success'
                            : bid.status === 'rejected' ? 'bg-error/10 text-error'
                            : 'bg-warning/10 text-warning'
                          }`}>{bid.status}</span>
                        </div>
                        <p className="text-text-secondary text-xs mb-1">
                          #{bid.shipmentId} • {bid.cargoType} • {bid.weight}t
                        </p>
                        <p className="text-success font-bold">₦{parseFloat(bid.bidAmount).toLocaleString('en-NG')}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-secondary text-sm text-center py-6">No bids yet. Browse available shipments below.</p>
                )}
              </div>

              {/* Available Shipments */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-text-primary font-bold text-xl">Available Shipments</h2>
                  <button onClick={() => fetchAvailableShipments(availablePage)} disabled={loadingAvailable} className="text-primary text-sm font-medium hover:text-primary/80 disabled:opacity-50">Refresh</button>
                </div>
                {loadingAvailable ? (
                  <div className="flex justify-center py-12"><Loader className="w-8 h-8 animate-spin text-primary" /></div>
                ) : availableShipments.length > 0 ? (
                  <div className="space-y-3">
                    {availableShipments.map(shipment => {
                      const existingBid = getBidForShipment(shipment.id)
                      return (
                        <div key={shipment.id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-text-primary font-semibold">
                                {shipment.pickupState} → {shipment.destinationState}
                              </p>
                              <p className="text-text-secondary text-xs mt-0.5">
                                #{shipment.id} • {shipment.cargoType} • {shipment.weight}t • {shipment.truckType}
                              </p>
                              <p className="text-text-secondary text-xs">
                                Pickup: {new Date(shipment.pickupDate).toLocaleDateString()}
                              </p>
                              <p className="text-primary font-semibold text-sm mt-1">
                                Est. ₦{parseFloat(shipment.estimatedCost || 0).toLocaleString('en-NG')}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              {existingBid ? (
                                <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                                  existingBid.status === 'accepted' ? 'bg-success/10 text-success'
                                  : existingBid.status === 'rejected' ? 'bg-error/10 text-error'
                                  : 'bg-warning/10 text-warning'
                                }`}>
                                  Bid: {existingBid.status}
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedBidShipment(shipment)
                                    setBidAmount(String(Math.ceil(parseFloat(shipment.estimatedCost || 0))))
                                    setBidMessage("")
                                    setShowBidModal(true)
                                  }}
                                  className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                                >
                                  Bid
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {/* Pagination */}
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => setAvailablePage(p => Math.max(1, p - 1))}
                        disabled={availablePage === 1}
                        className="text-sm text-primary disabled:text-text-secondary disabled:opacity-50"
                      >← Prev</button>
                      <span className="text-sm text-text-secondary">Page {availablePage}</span>
                      <button
                        onClick={() => setAvailablePage(p => Math.min(availableTotalPages, p + 1))}
                        disabled={availablePage >= availableTotalPages}
                        className="text-sm text-primary disabled:text-text-secondary disabled:opacity-50"
                      >Next →</button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/30 rounded-xl p-10 text-center">
                    <Search className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                    <p className="text-text-primary font-medium">No available shipments</p>
                    <p className="text-text-secondary text-sm">Check back later for new shipments</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========== WALLET TAB ========== */}
          {activeTab === "wallet" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-5 text-white">
                <p className="text-white/80 text-sm mb-1">Available Balance</p>
                {loadingWallet ? (
                  <Loader className="w-6 h-6 animate-spin" />
                ) : (
                  <p className="text-3xl font-bold">₦{walletBalance.toLocaleString('en-NG')}</p>
                )}
                <p className="text-white/70 text-xs mt-1">Earnings are credited to your account as trips progress</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="rounded-2xl p-6 flex items-center justify-center space-x-2 text-white bg-secondary hover:bg-secondary/90 transition-colors"
                >
                  <ArrowUp className="w-5 h-5" />
                  <span className="font-bold">Withdraw</span>
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-text-primary font-bold text-lg">Transaction History</h3>
                  <button onClick={fetchWallet} disabled={loadingWallet} className="text-primary text-sm font-medium hover:text-primary/80 disabled:opacity-50">Refresh</button>
                </div>
                {loadingWallet ? (
                  <div className="flex justify-center py-8"><Loader className="w-7 h-7 animate-spin text-primary" /></div>
                ) : walletTransactions.length > 0 ? (
                  <div className="space-y-2">
                    {walletTransactions.map(tx => (
                      <div key={tx.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                            tx.type === 'credit' ? 'bg-success/10' : 'bg-error/10'
                          }`}>
                            {tx.type === 'credit'
                              ? <ArrowDown className="w-4 h-4 text-success" />
                              : <ArrowUp className="w-4 h-4 text-error" />
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-text-primary text-sm font-medium truncate">{tx.description || 'Transaction'}</p>
                            <p className="text-text-secondary text-xs">{new Date(tx.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <p className={`font-bold text-sm flex-shrink-0 ${tx.type === 'credit' ? 'text-success' : 'text-error'}`}>
                          {tx.type === 'credit' ? '+' : '-'}₦{parseFloat(tx.amount).toLocaleString('en-NG')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted/30 rounded-xl p-10 text-center">
                    <Wallet className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                    <p className="text-text-primary font-medium">No transactions yet</p>
                    <p className="text-text-secondary text-sm">Your earnings will appear here</p>
                  </div>
                )}
              </div>
            </div>
          )}

            {showWithdrawModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
                <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="text-text-primary font-bold text-xl">Withdraw to Bank</h3>
                    <button
                      onClick={() => {
                        if (!withdrawLoading) {
                          setShowWithdrawModal(false)
                        }
                      }}
                      className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"
                      disabled={withdrawLoading}
                    >
                      <span className="text-text-secondary text-lg">×</span>
                    </button>
                  </div>
                  <div className="p-4 space-y-4 overflow-y-auto">
                    <div className="bg-muted/30 rounded-xl p-4">
                      <p className="text-text-secondary text-sm mb-1">Available Balance</p>
                      <p className="text-text-primary font-bold text-2xl">₦{Number(walletBalance || 0).toLocaleString('en-NG')}</p>
                    </div>

                    <div>
                      <label className="block text-text-primary font-medium mb-2">Withdrawal Amount (NGN)</label>
                      <input
                        type="number"
                        min="100"
                        step="0.01"
                        max={walletBalance}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                        placeholder="e.g., 5000"
                        disabled={withdrawLoading}
                      />
                      <p className="text-text-secondary text-xs mt-1">Minimum: ₦100 | Maximum: ₦{Number(walletBalance || 0).toLocaleString('en-NG')}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-text-primary font-medium mb-2">Select Bank</label>
                        <select
                          value={withdrawBankCode}
                          onChange={(e) => {
                            const selectedCode = e.target.value
                            setWithdrawBankCode(selectedCode)
                            const selectedBank = banks.find((bank) => bank.code === selectedCode)
                            setWithdrawBankName(selectedBank?.name || "")
                            setResolvedAccountName(null)
                            setAccountVerified(false)
                          }}
                          className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                          disabled={withdrawLoading || loadingBanks}
                        >
                          <option value="">Select your bank</option>
                          {banks.map((bank) => (
                            <option key={bank.code} value={bank.code}>{bank.name}</option>
                          ))}
                        </select>
                        {loadingBanks && <p className="text-text-secondary text-xs mt-1">Loading banks...</p>}
                        {!loadingBanks && banks.length === 0 && (
                          <p className="text-warning text-xs mt-1">Unable to load banks. Please refresh.</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-text-primary font-medium mb-2">Account Number</label>
                        <input
                          type="text"
                          value={withdrawBankAccountNumber}
                          onChange={(e) => {
                            setWithdrawBankAccountNumber(e.target.value.replace(/\D/g, ""))
                            setResolvedAccountName(null)
                            setAccountVerified(false)
                          }}
                          className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                          placeholder="1234567890"
                          maxLength={10}
                          disabled={withdrawLoading}
                        />
                      </div>
                    </div>

                    {withdrawBankName && (
                      <div>
                        <p className="text-text-secondary text-sm">Selected bank: <span className="text-text-primary font-medium">{withdrawBankName}</span></p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <button
                        type="button"
                        onClick={resolveBankAccount}
                        disabled={withdrawLoading || loadingBanks || !withdrawBankAccountNumber || !withdrawBankCode}
                        className="w-full sm:w-auto px-4 py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {verifyingAccount ? 'Verifying…' : 'Verify Account'}
                      </button>
                      {accountVerified && resolvedAccountName && (
                        <p className="text-success text-sm sm:text-base">
                          Account name: <span className="font-semibold">{resolvedAccountName}</span>
                        </p>
                      )}
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

          {/* ========== MY JOBS TAB (existing vehicle + shipment content) ========== */}
          {activeTab === "jobs" && (
            <div className="space-y-4 sm:space-y-6">

          {/* Assigned Vehicles Section */}
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-text-primary font-bold text-xl sm:text-2xl">My Assigned Vehicle</h2>
              <button
                onClick={fetchAssignedTrucks}
                disabled={loadingTrucks}
                className="text-primary text-xs sm:text-sm font-medium hover:text-primary/80 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>

            {loadingTrucks ? (
              <div className="flex justify-center items-center py-8 sm:py-12">
                <Loader className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary" />
              </div>
            ) : assignedTrucks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {assignedTrucks.map((truck) => (
                  <div key={truck.id} className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                          <Truck className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-text-primary font-bold text-base sm:text-lg truncate">{truck.plateNumber}</p>
                          <p className="text-text-secondary text-xs sm:text-sm truncate">{truck.vehicleType}</p>
                        </div>
                      </div>
                      <div className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium flex-shrink-0 ml-2 ${
                        truck.status === 'active' 
                          ? 'bg-success/10 text-success' 
                          : truck.status === 'maintenance'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-error/10 text-error'
                      }`}>
                        {truck.status || 'active'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm pt-3 border-t border-border">
                      {truck.vehicleModel && (
                        <div>
                          <p className="text-text-secondary text-xs">Model</p>
                          <p className="text-text-primary font-medium truncate">{truck.vehicleModel}</p>
                        </div>
                      )}
                      {truck.vehicleYear && (
                        <div>
                          <p className="text-text-secondary text-xs">Year</p>
                          <p className="text-text-primary font-medium">{truck.vehicleYear}</p>
                        </div>
                      )}
                      {truck.capacity && (
                        <div>
                          <p className="text-text-secondary text-xs">Capacity</p>
                          <p className="text-text-primary font-medium truncate">{truck.capacity}</p>
                        </div>
                      )}
                      {truck.fleetManagerName && (
                        <div>
                          <p className="text-text-secondary text-xs">Fleet Manager</p>
                          <p className="text-text-primary font-medium truncate">{truck.fleetManagerName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-muted/30 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center">
                <Truck className="w-12 h-12 sm:w-16 sm:h-16 text-text-secondary mx-auto mb-3 sm:mb-4" />
                <p className="text-text-primary font-medium mb-2 text-sm sm:text-base">No vehicle assigned</p>
                <p className="text-text-secondary text-xs sm:text-sm">
                  Your fleet manager will assign a vehicle to you
                </p>
              </div>
            )}
          </div>

          {/* Shipments Section */}
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-text-primary font-bold text-xl sm:text-2xl">My Shipments</h2>
              <button
                onClick={fetchAssignedShipments}
                disabled={loadingShipments}
                className="text-primary text-xs sm:text-sm font-medium hover:text-primary/80 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>

          {loadingShipments ? (
            <div className="flex justify-center items-center py-8 sm:py-12">
              <Loader className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary" />
            </div>
          ) : assignedShipments.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {assignedShipments.map((shipment) => {
                const statusInfo = getStatusInfo(shipment.status)
                const StatusIcon = statusInfo.icon
                const isExpanded = selectedShipment?.id === shipment.id
                
                return (
                  <div key={shipment.id} className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2 sm:gap-3">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center ${statusInfo.bgColor} flex-shrink-0`}>
                          <StatusIcon className={`w-6 h-6 sm:w-7 sm:h-7 ${statusInfo.textColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-text-primary font-bold text-base sm:text-lg truncate">
                            {shipment.pickupState} → {shipment.destinationState}
                          </p>
                          <p className="text-text-secondary text-xs sm:text-sm truncate">
                            #{shipment.id} • {shipment.cargoType} • {shipment.weight}t
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedShipment(isExpanded ? null : shipment)}
                        className="bg-primary text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm flex-shrink-0"
                      >
                        {isExpanded ? 'Hide' : 'Details'}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                          <div>
                            <p className="text-text-secondary text-xs">Pickup Location</p>
                            <p className="text-text-primary font-medium text-sm sm:text-base break-words">
                              {shipment.pickupLga}, {shipment.pickupState}
                            </p>
                          </div>
                          <div>
                            <p className="text-text-secondary text-xs">Destination</p>
                            <p className="text-text-primary font-medium text-sm sm:text-base break-words">
                              {shipment.destinationLga}, {shipment.destinationState}
                            </p>
                          </div>
                          <div>
                            <p className="text-text-secondary text-xs">Distance</p>
                            <p className="text-text-primary font-medium text-sm sm:text-base">{shipment.distance}km</p>
                          </div>
                          <div>
                            <p className="text-text-secondary text-xs">Pickup Date</p>
                            <p className="text-text-primary font-medium text-sm sm:text-base">
                              {new Date(shipment.pickupDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-text-secondary text-xs">Vehicle Type</p>
                            <p className="text-text-primary font-medium text-sm sm:text-base break-words">{shipment.truckType}</p>
                          </div>
                          <div>
                            <p className="text-text-secondary text-xs">Status</p>
                            <p className={`${statusInfo.textColor} font-medium text-sm sm:text-base`}>{statusInfo.label}</p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-border">
                          <p className="text-text-secondary text-xs sm:text-sm mb-1">Bid Amount</p>
                          <p className="text-success font-bold text-lg sm:text-xl">
                            ₦{parseFloat(shipment.bidAmount || 0).toLocaleString('en-NG')}
                          </p>
                        </div>

                        {shipment.bidMessage && (
                          <div className="pt-3 border-t border-border">
                            <p className="text-text-secondary text-xs sm:text-sm mb-1">Bid Message</p>
                            <p className="text-text-primary italic text-sm sm:text-base break-words">"{shipment.bidMessage}"</p>
                          </div>
                        )}

                        {shipment.shipperName && (
                          <div className="pt-3 border-t border-border">
                            <p className="text-text-secondary text-xs sm:text-sm mb-1">Shipper Contact</p>
                            <p className="text-text-primary font-medium text-sm sm:text-base break-words">{shipment.shipperName}</p>
                            {shipment.shipperPhone && (
                              <p className="text-text-secondary text-xs sm:text-sm break-words">{shipment.shipperPhone}</p>
                            )}
                          </div>
                        )}

                        {/* Route Map for this shipment */}
                        <div className="pt-3 sm:pt-4 border-t border-border">
                          <h4 className="text-text-primary font-bold text-sm sm:text-base mb-3">Route Map</h4>
                          <SingleShipmentMap
                            shipment={shipment}
                            height="350px"
                            statesData={null}
                          />
                        </div>

                        {/* Action Buttons based on status */}
                        <div className="pt-3 sm:pt-4 border-t border-border space-y-2">
                          {shipment.status === 'assigned' && (
                            <button
                              onClick={() => handleStartPickupTrip(shipment.id)}
                              disabled={updatingStatus === shipment.id}
                              className="w-full bg-primary text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 text-sm sm:text-base"
                            >
                              {updatingStatus === shipment.id ? (
                                <>
                                  <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                  <span>Starting...</span>
                                </>
                              ) : (
                                <>
                                  <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                                  <span>Start Trip to Pick Up</span>
                                </>
                              )}
                            </button>
                          )}

                          {shipment.status === 'picking_up' && (
                            <button
                              onClick={() => {
                                setSelectedShipmentForPOD(shipment.id)
                                setSelectedPODType('pickup')
                                setShowPODCapture(true)
                              }}
                              disabled={updatingStatus === shipment.id}
                              className="w-full bg-warning text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:bg-warning/90 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 text-sm sm:text-base"
                            >
                              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                              <span>Capture Pickup POD</span>
                            </button>
                          )}

                          {shipment.status === 'picked_up' && Boolean(shipment.pickupConfirmed) && (
                            <button
                              onClick={() => handleStartDeliveryTrip(shipment.id)}
                              disabled={updatingStatus === shipment.id}
                              className="w-full bg-success text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:bg-success/90 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 text-sm sm:text-base"
                            >
                              {updatingStatus === shipment.id ? (
                                <>
                                  <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                  <span>Starting...</span>
                                </>
                              ) : (
                                <>
                                  <Navigation className="w-4 h-4 sm:w-5 sm:h-5" />
                                  <span>Start Trip to Destination</span>
                                </>
                              )}
                            </button>
                          )}

                          {shipment.status === 'picked_up' && !Boolean(shipment.pickupConfirmed) && (
                            <div className="bg-warning/10 text-warning p-3 rounded-lg text-xs sm:text-sm text-center">
                              Waiting for shipper to confirm pickup...
                            </div>
                          )}

                          {shipment.status === 'in_transit' && (
                            <button
                              onClick={() => {
                                setSelectedShipmentForPOD(shipment.id)
                                setSelectedPODType('delivery')
                                setShowPODCapture(true)
                              }}
                              disabled={updatingStatus === shipment.id}
                              className="w-full bg-success text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:bg-success/90 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 text-sm sm:text-base"
                            >
                              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                              <span>Capture Delivery POD</span>
                            </button>
                          )}

                          {shipment.status === 'delivered' && !Boolean(shipment.deliveryConfirmed) && (
                            <div className="bg-warning/10 text-warning p-3 rounded-lg text-xs sm:text-sm text-center">
                              Waiting for shipper to confirm delivery...
                            </div>
                          )}

                          {shipment.status === 'delivered' && Boolean(shipment.deliveryConfirmed) && (
                            <div className="bg-success/10 text-success p-3 rounded-lg text-xs sm:text-sm text-center font-medium">
                              ✓ Delivery confirmed! Trip completed.
                            </div>
                          )}

                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-muted/30 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 text-text-secondary mx-auto mb-3 sm:mb-4" />
              <p className="text-text-primary font-medium mb-2 text-sm sm:text-base">No assigned shipments</p>
              <p className="text-text-secondary text-xs sm:text-sm px-4">
                Go to "Find Work" to browse and bid on available shipments
              </p>
            </div>
          )}
          </div>
            </div>
          )}

        </div>
      </div>

      {/* Bid Modal */}
      {showBidModal && selectedBidShipment && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-text-primary font-bold text-lg">Submit Bid</h3>
              <button onClick={() => setShowBidModal(false)} className="text-text-secondary hover:text-text-primary">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-muted/30 rounded-xl p-4">
                <p className="text-text-primary font-semibold">
                  {selectedBidShipment.pickupState} → {selectedBidShipment.destinationState}
                </p>
                <p className="text-text-secondary text-sm">
                  {selectedBidShipment.cargoType} • {selectedBidShipment.weight}t • {selectedBidShipment.truckType}
                </p>
                <p className="text-primary font-semibold text-sm mt-1">
                  Estimated: ₦{parseFloat(selectedBidShipment.estimatedCost || 0).toLocaleString('en-NG')}
                </p>
              </div>
              <form onSubmit={handleSubmitBid} className="space-y-4">
                <div>
                  <label className="block text-text-secondary text-sm mb-1">Bid Amount (₦)</label>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={e => setBidAmount(e.target.value)}
                    min={selectedBidShipment.estimatedCost}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary"
                    placeholder="Enter your bid amount"
                    required
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm mb-1">Message (optional)</label>
                  <textarea
                    value={bidMessage}
                    onChange={e => setBidMessage(e.target.value)}
                    rows={3}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary resize-none"
                    placeholder="Any message for the shipper..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingBid}
                  className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingBid ? <><Loader className="w-5 h-5 animate-spin" /><span>Submitting...</span></> : <><Send className="w-5 h-5" /><span>Submit Bid</span></>}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* POD Capture Modal */}
      {showPODCapture && selectedShipmentForPOD && selectedPODType && (
        <PODCapture
          shipmentId={selectedShipmentForPOD}
          podType={selectedPODType}
          onSuccess={() => {
            // After POD is captured, update status
            if (selectedPODType === 'pickup') {
              handleMarkPickedUp(selectedShipmentForPOD)
            } else if (selectedPODType === 'delivery') {
              handleMarkDelivered(selectedShipmentForPOD)
            }
            setShowPODCapture(false)
            setSelectedShipmentForPOD(null)
            setSelectedPODType(null)
          }}
          onClose={() => {
            setShowPODCapture(false)
            setSelectedShipmentForPOD(null)
            setSelectedPODType(null)
          }}
        />
      )}
    </div>
  )
}

export default DriverDashboard

