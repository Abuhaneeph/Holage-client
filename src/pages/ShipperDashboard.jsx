"use client"

import { useState, useEffect } from "react"
import {
  Package,
  Wallet,
  Send,
  History,
  User,
  Eye,
  RefreshCw,
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
  ChevronDown,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Search,
  Star,
  Gift,
  UserCheck,
  PackageCheck,
  Navigation,
  BadgeCheck,
  XCircle,
  ChevronRight
} from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useToast } from "../context/ToastContext"
import StateSelect from "../components/StateSelect"
import SelectModal from "../components/SelectModal"
import { calculateDistance, estimateShippingCost } from "../utils/distanceCalculator"
import LgaSelect from "../components/LgaSelect"
import NotificationCenter from "../components/NotificationCenter"
import ConfirmModal from "../components/ConfirmModal"
import SingleShipmentMap from "../components/SingleShipmentMap"
import ShipmentProgressTracker from "../components/ShipmentProgressTracker"
import ReferralPanel from "../components/ReferralPanel"
import BonusWallet from "../components/BonusWallet"
import WalletStatement from "../components/WalletStatement"
import EwaybillModal from "../components/EwaybillModal"
import { formatWithCommas, parseFormattedNumber } from "../utils/currencyFormat"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const calculateStageAmount = (totalAmount, percentage) =>
  Math.round(parseFloat(totalAmount || 0) * (percentage / 100) * 100) / 100

const calculateBidAcceptUpfrontDue = (bidAmount, estimatedCost) => {
  const bidUpfront = calculateStageAmount(bidAmount, 5)
  const estimateUpfront = calculateStageAmount(estimatedCost, 5)
  return Math.max(0, Math.round((bidUpfront - estimateUpfront) * 100) / 100)
}

const ShipperDashboard = () => {
  const { user, logoutUser, navigateTo } = useAppContext()
  const toast = useToast()
  const [activeView, setActiveView] = useState("home")
  const [showBalance, setShowBalance] = useState(true)
  const [refreshingAll, setRefreshingAll] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  // Generic confirm-modal queue for actions that used to gate on window.confirm() — set
  // { title, message, confirmLabel, destructive, onConfirm } to open it for any action.
  const [pendingConfirm, setPendingConfirm] = useState(null)
  const [ewaybillShipmentId, setEwaybillShipmentId] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [kycCheckDone, setKycCheckDone] = useState(false)
  const [showCreateShipment, setShowCreateShipment] = useState(false)
  const [states, setStates] = useState([])
  const [locationsLoading, setLocationsLoading] = useState(true)
  const [locationsError, setLocationsError] = useState("")
  const [pickupLgaOptions, setPickupLgaOptions] = useState([])
  const [destinationLgaOptions, setDestinationLgaOptions] = useState([])
  const [pickupWardOptions, setPickupWardOptions] = useState([])
  const [destinationWardOptions, setDestinationWardOptions] = useState([])
  
  // Wallet state
  const [walletBalance, setWalletBalance] = useState(0)
  const [bonusBalance, setBonusBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  
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
  
  // Modal states
  const [showCargoModal, setShowCargoModal] = useState(false)
  const [showTruckModal, setShowTruckModal] = useState(false)
  const [showWeightModal, setShowWeightModal] = useState(false)
  
  // Shipments state
  const [shipments, setShipments] = useState([])
  const [loadingShipments, setLoadingShipments] = useState(false)
  const [creatingShipment, setCreatingShipment] = useState(false)
  const [expandedShipmentId, setExpandedShipmentId] = useState(null)
  const [deletingShipmentId, setDeletingShipmentId] = useState(null)
  
  // Bids state
  const [shipmentBids, setShipmentBids] = useState({}) // { shipmentId: [bids] }
  const [loadingBids, setLoadingBids] = useState({}) // { shipmentId: boolean }
  const [acceptingBidId, setAcceptingBidId] = useState(null)
  const [showBidAcceptModal, setShowBidAcceptModal] = useState(false)
  const [selectedBidForAccept, setSelectedBidForAccept] = useState(null)
  const [selectedShipmentForBid, setSelectedShipmentForBid] = useState(null)
  const [showBidAcceptSuccessModal, setShowBidAcceptSuccessModal] = useState(false)
  const [bidAcceptSuccessInfo, setBidAcceptSuccessInfo] = useState(null)
  const [shipmentDetails, setShipmentDetails] = useState({}) // { shipmentId: { acceptedBidWithRating, shipmentRatings } }
  const [loadingShipmentDetail, setLoadingShipmentDetail] = useState({})
  const [ratingForm, setRatingForm] = useState({ rating: 5, comment: '' })
  const [submittingRating, setSubmittingRating] = useState(null) // shipmentId-rateeType
  
  // Pagination
  const [activeShipmentsPage, setActiveShipmentsPage] = useState(1)
  const activeShipmentsPerPage = 3
  const [transactionsPage, setTransactionsPage] = useState(1)
  const transactionsPerPage = 3
  
  // Shipment form state
  const [shipmentForm, setShipmentForm] = useState({
    pickupState: '',
    pickupLga: '',
    pickupWard: '',
    destinationState: '',
    destinationLga: '',
    destinationWard: '',
    cargoType: '',
    cargoTypeOther: '',
    weight: '',
    truckType: '',
    pickupDate: '',
    insurance: false,
    declaredValue: ''
  })

  const [distanceInfo, setDistanceInfo] = useState(null)
  const [costEstimate, setCostEstimate] = useState(null)
  const [calculating, setCalculating] = useState(false)
  const [distanceError, setDistanceError] = useState(null)

  const slugifyValue = (value) => {
    if (!value) return ""
    return value
      .toString()
      .toLowerCase()
      .trim()
      .replace(/['’]/g, "")
      .replace(/&/g, "and")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_]+/g, "-")
  }

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
    // Don't show LGA if it's "00" or empty/invalid
    if (lgaSlug && lgaSlug !== '00' && lgaSlug.trim() !== '') {
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

  const getLgaOptionsForState = (stateSlug) => {
    if (!stateSlug || !states || states.length === 0) return []
    const match = states.find((state) => state.slug === stateSlug)
    if (!match || !Array.isArray(match.lgas)) return []
    return match.lgas
      .filter((lga) => lga.slug !== '00' && lga.slug !== '0' && lga.slug && lga.slug.trim() !== '')
      .map((lga) => ({
      label: lga.name,
      value: lga.slug,
      coordinates: lga.coordinates ? { lat: lga.coordinates.lat, lng: lga.coordinates.lng } : null
    }))
  }

  const getWardOptionsForLga = (stateSlug, lgaSlug) => {
    if (!stateSlug || !lgaSlug || !states || states.length === 0) return []
    const state = states.find((s) => s.slug === stateSlug)
    if (!state || !Array.isArray(state.lgas)) return []
    const lga = state.lgas.find((l) => l.slug === lgaSlug)
    if (!lga || !Array.isArray(lga.wards)) return []
    return lga.wards.map((ward) => ({
      label: ward.name,
      value: ward.slug,
      coordinates: ward.coordinates ? { lat: ward.coordinates.lat, lng: ward.coordinates.lng } : null
    }))
  }

  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLocationsLoading(true)
        setLocationsError("")

        // Loaded as its own chunk (1.3MB+ of ward/LGA data) instead of bundled into the
        // dashboard's main JS, so it downloads in parallel and caches independently.
        const { default: nigeriaStatesLgasData } = await import("../utils/nigeria-states-lgas.json")

        // Transform nigeria-states-lgas.json into states structure with wards
        if (nigeriaStatesLgasData && Array.isArray(nigeriaStatesLgasData) && nigeriaStatesLgasData.length > 0) {
          const statesArray = nigeriaStatesLgasData.map((stateData) => {
            const stateName = stateData.state
            const stateSlug = slugifyValue(stateName)
            
            const lgas = (stateData.lgas || []).map((lga) => {
              // Calculate LGA center coordinates from wards if available
              let lgaCoordinates = null
              if (lga.wards && Array.isArray(lga.wards) && lga.wards.length > 0) {
                const validWards = lga.wards.filter(w => w.latitude && w.longitude)
                if (validWards.length > 0) {
                  // Calculate average coordinates as LGA center
                  const avgLat = validWards.reduce((sum, w) => sum + w.latitude, 0) / validWards.length
                  const avgLng = validWards.reduce((sum, w) => sum + w.longitude, 0) / validWards.length
                  lgaCoordinates = { lat: avgLat, lng: avgLng }
                }
              }
              
              return {
                name: lga.name,
                slug: slugifyValue(lga.name),
                coordinates: lgaCoordinates,
                wards: (lga.wards || []).map((ward) => ({
                  name: ward.name,
                  slug: slugifyValue(ward.name),
                  coordinates: ward.latitude && ward.longitude ? {
                    lat: ward.latitude,
                    lng: ward.longitude
                  } : null
                }))
              }
            })
            
            return {
              name: stateName,
              slug: stateSlug,
              lgas: lgas.sort((a, b) => a.name.localeCompare(b.name))
            }
          }).sort((a, b) => a.name.localeCompare(b.name))
          
          setStates(statesArray)
          setLocationsLoading(false)
          return
        }
        
        // Fallback to API if local file is not available
        const fetchFromAPI = async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/shipping/locations/states`)
            const data = await response.json()
            if (data.success && data.data) {
              setStates(data.data || [])
            } else {
              throw new Error(data.message || "Unable to load locations")
            }
          } catch (apiError) {
            console.error("Error fetching from API:", apiError)
            throw new Error("Unable to load locations from API")
          } finally {
            setLocationsLoading(false)
          }
        }
        
        fetchFromAPI()
      } catch (error) {
        console.error("Error loading locations:", error)
        setLocationsError(error.message || "Unable to load locations")
        setStates([])
        setLocationsLoading(false)
      }
    }

    loadLocations()
  }, [])

  // Auto-populate pickup LGA options when pickup state changes
  useEffect(() => {
    if (shipmentForm.pickupState && states.length > 0) {
      let options = getLgaOptionsForState(shipmentForm.pickupState)
      
      // If same state is selected for both pickup and destination, exclude the selected destination LGA
      if (shipmentForm.pickupState === shipmentForm.destinationState && shipmentForm.destinationLga) {
        options = options.filter(lga => lga.value !== shipmentForm.destinationLga)
      }
      
      setPickupLgaOptions(options)
      
      // If the currently selected pickup LGA is now excluded, clear it
      if (shipmentForm.pickupLga && !options.find(lga => lga.value === shipmentForm.pickupLga)) {
        setShipmentForm(prev => ({ ...prev, pickupLga: '', pickupWard: '' }))
        setPickupWardOptions([])
      } else if (!shipmentForm.pickupLga) {
        // Only clear if LGA wasn't already set (to avoid clearing on every render)
        setPickupWardOptions([])
      }
    } else {
      setPickupLgaOptions([])
      setPickupWardOptions([])
    }
  }, [states, shipmentForm.pickupState, shipmentForm.destinationState, shipmentForm.destinationLga, shipmentForm.pickupLga])

  // Auto-populate destination LGA options when destination state changes
  useEffect(() => {
    if (shipmentForm.destinationState && states.length > 0) {
      let options = getLgaOptionsForState(shipmentForm.destinationState)
      
      // If same state is selected for both pickup and destination, exclude the selected pickup LGA
      if (shipmentForm.pickupState === shipmentForm.destinationState && shipmentForm.pickupLga) {
        options = options.filter(lga => lga.value !== shipmentForm.pickupLga)
      }
      
      setDestinationLgaOptions(options)
      
      // If the currently selected destination LGA is now excluded, clear it
      if (shipmentForm.destinationLga && !options.find(lga => lga.value === shipmentForm.destinationLga)) {
        setShipmentForm(prev => ({ ...prev, destinationLga: '', destinationWard: '' }))
        setDestinationWardOptions([])
      } else if (!shipmentForm.destinationLga) {
        // Only clear if LGA wasn't already set (to avoid clearing on every render)
        setDestinationWardOptions([])
      }
    } else {
      setDestinationLgaOptions([])
      setDestinationWardOptions([])
    }
  }, [states, shipmentForm.destinationState, shipmentForm.pickupState, shipmentForm.pickupLga, shipmentForm.destinationLga])

  // Auto-populate pickup ward options when pickup LGA changes
  useEffect(() => {
    if (shipmentForm.pickupState && shipmentForm.pickupLga && states.length > 0) {
      const options = getWardOptionsForLga(shipmentForm.pickupState, shipmentForm.pickupLga)
      setPickupWardOptions(options)
      // Clear ward when LGA changes
      setShipmentForm(prev => ({ ...prev, pickupWard: '' }))
    } else {
      setPickupWardOptions([])
    }
  }, [states, shipmentForm.pickupState, shipmentForm.pickupLga])

  // Auto-populate destination ward options when destination LGA changes
  useEffect(() => {
    if (shipmentForm.destinationState && shipmentForm.destinationLga && states.length > 0) {
      const options = getWardOptionsForLga(shipmentForm.destinationState, shipmentForm.destinationLga)
      setDestinationWardOptions(options)
      // Clear ward when LGA changes
      setShipmentForm(prev => ({ ...prev, destinationWard: '' }))
    } else {
      setDestinationWardOptions([])
    }
  }, [states, shipmentForm.destinationState, shipmentForm.destinationLga])

  // Bank transfer funding state
  const [showFundModal, setShowFundModal] = useState(false)
  const [fundAmount, setFundAmount] = useState("")
  const [fundLoading, setFundLoading] = useState(false)
  const [fundAccount, setFundAccount] = useState(null) // { account_number, bank_name, expiry_date_in_utc }
  const [fundReference, setFundReference] = useState("")
  
  // Fetch my shipments
  const fetchMyShipments = async () => {
    setLoadingShipments(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/shipping/shipments/my-shipments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      // Check for token expiration
      if (response.status === 401 || data.expired === true) {
        localStorage.removeItem("authToken")
        localStorage.removeItem("userInfo")
        localStorage.removeItem("userRole")
        navigateTo('login')
        return
      }
      
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
        const token = localStorage.getItem('authToken')
        
        if (!token) {
          navigateTo('login')
          return
        }
        
        const response = await fetch(`${API_BASE_URL}/kyc/documents`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()
        
        // Check for token expiration
        if (response.status === 401 || data.expired === true) {
          // Clear session and redirect
          localStorage.removeItem("authToken")
          localStorage.removeItem("userInfo")
          localStorage.removeItem("userRole")
          navigateTo('login')
          return
        }
        
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
          const token = localStorage.getItem('authToken')
          const wr = await fetch(`${API_BASE_URL}/wallet`, { headers: { 'Authorization': `Bearer ${token}` } })
          const wd = await wr.json()
          
          // Check for token expiration
          if (wr.status === 401 || wd.expired === true) {
            localStorage.removeItem("authToken")
            localStorage.removeItem("userInfo")
            localStorage.removeItem("userRole")
            navigateTo('login')
            return
          }
          
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
  
  // Get coordinates for selected LGAs or Wards (prefers ward coordinates if available)
  const getLgaCoordinates = (stateSlug, lgaSlug, wardSlug = null) => {
    if (!stateSlug || !lgaSlug || !states || states.length === 0) return null
    const state = states.find((s) => s.slug === stateSlug)
    if (!state || !Array.isArray(state.lgas)) return null
    const lga = state.lgas.find((l) => l.slug === lgaSlug)
    if (!lga) return null
    
    // If ward is selected and has coordinates, use ward coordinates
    if (wardSlug && Array.isArray(lga.wards)) {
      const ward = lga.wards.find((w) => w.slug === wardSlug)
      if (ward?.coordinates) {
        return ward.coordinates
      }
    }
    
    // Otherwise, use LGA coordinates
    return lga.coordinates || null
  }

  // Auto-calculate distance and cost
  useEffect(() => {
    const calculateShipmentDetails = async () => {
      const { pickupState, pickupLga, pickupWard, destinationState, destinationLga, destinationWard, truckType } = shipmentForm
      
      if (!pickupState || !pickupLga || !destinationState || !destinationLga) {
        setDistanceInfo(null)
        setCostEstimate(null)
        setDistanceError(null)
        return
      }

      setCalculating(true)
      setDistanceError(null)
      
      try {
        // Only send coordinates when user picked a ward (ward-level from nigeria-states-lgas).
        // When LGA-only, send null so backend uses lgas.json for true LGA lat/lng.
        const hasPickupWard = pickupWard && String(pickupWard).trim()
        const hasDestinationWard = destinationWard && String(destinationWard).trim()
        const pickupCoords = hasPickupWard ? getLgaCoordinates(pickupState, pickupLga, pickupWard) : null
        const destinationCoords = hasDestinationWard ? getLgaCoordinates(destinationState, destinationLga, destinationWard) : null

        const distance = await calculateDistance(
          pickupState,
          pickupLga,
          destinationState,
          destinationLga,
          pickupCoords,
          destinationCoords,
          hasPickupWard ? pickupWard : null,
          hasDestinationWard ? destinationWard : null
        )
        setDistanceInfo(distance)
        setDistanceError(null)
        
        if (truckType) {
          try {
            const cost = await estimateShippingCost(
              pickupState,
              pickupLga,
              destinationState,
              destinationLga,
              truckType,
              pickupCoords,
              destinationCoords,
              shipmentForm.insurance,
              hasPickupWard ? pickupWard : null,
              hasDestinationWard ? destinationWard : null
            )
            setCostEstimate(cost)
          } catch (costError) {
            console.error('Error calculating cost:', costError)
            setCostEstimate(null)
          }
        } else {
          setCostEstimate(null)
        }
      } catch (error) {
        console.error('Error calculating distance:', error)
        setDistanceInfo(null)
        setCostEstimate(null)
        setDistanceError(error.message || 'Failed to calculate distance. Please try again.')
      } finally {
        setCalculating(false)
      }
    }

    calculateShipmentDetails()
  }, [shipmentForm.pickupState, shipmentForm.pickupLga, shipmentForm.pickupWard, shipmentForm.destinationState, shipmentForm.destinationLga, shipmentForm.destinationWard, shipmentForm.truckType, shipmentForm.insurance, states])
  
  const handleFormChange = (field, value) => {
    setShipmentForm((prev) => {
      const next = { ...prev, [field]: value }
      
      // Prevent selecting same LGA when same state is selected
      if (field === "pickupLga" && prev.pickupState === prev.destinationState && value === prev.destinationLga) {
        // Don't allow selecting the same LGA as destination
        return prev
      }
      
      if (field === "destinationLga" && prev.pickupState === prev.destinationState && value === prev.pickupLga) {
        // Don't allow selecting the same LGA as pickup
        return prev
      }
      
      if (field === "pickupState") {
        next.pickupLga = ""
        next.pickupWard = ""
      }
      if (field === "pickupLga") {
        next.pickupWard = ""
      }
      if (field === "destinationState") {
        next.destinationLga = ""
        next.destinationWard = ""
      }
      if (field === "destinationLga") {
        next.destinationWard = ""
      }
      return next
    })

    if (field === "pickupState") {
      setPickupLgaOptions(getLgaOptionsForState(value))
    }

    if (field === "destinationState") {
      setDestinationLgaOptions(getLgaOptionsForState(value))
    }
  }
  
  const handleCreateShipment = async (e) => {
    e.preventDefault()
    
    if (!shipmentForm.pickupState || !shipmentForm.pickupLga || !shipmentForm.destinationState || !shipmentForm.destinationLga) {
      toast.error("Please select both state and LGA for pickup and destination.")
      return
    }
    
    // Filter out "00" and "0" from LGA values
    const cleanPickupLga = (shipmentForm.pickupLga === '00' || shipmentForm.pickupLga === '0' || !shipmentForm.pickupLga.trim()) ? null : shipmentForm.pickupLga
    const cleanDestinationLga = (shipmentForm.destinationLga === '00' || shipmentForm.destinationLga === '0' || !shipmentForm.destinationLga.trim()) ? null : shipmentForm.destinationLga
    
    if (!cleanPickupLga || !cleanDestinationLga) {
      toast.error("Invalid LGA selection. Please select a valid LGA for both pickup and destination.")
      return
    }

    // The weight/cargo-type/truck-type pickers are custom buttons backed by hidden inputs, so
    // the browser's own `required` validation never fires for them (hidden inputs are excluded
    // from constraint validation by spec) — has to be checked explicitly here.
    if (!shipmentForm.weight) {
      toast.error("Please select the estimated tons for this shipment.")
      return
    }

    if (!shipmentForm.cargoType) {
      toast.error("Please select a cargo type.")
      return
    }

    if (!shipmentForm.truckType) {
      toast.error("Please select a truck type.")
      return
    }

    if (shipmentForm.insurance && (!shipmentForm.declaredValue || parseFloat(shipmentForm.declaredValue) <= 0)) {
      toast.error("Please enter a declared cargo value to add insurance to this shipment.")
      return
    }

    if (shipmentForm.cargoType === 'other' && !shipmentForm.cargoTypeOther.trim()) {
      toast.error("Please specify the cargo type.")
      return
    }

    const estimatedTotal = costEstimate?.cost?.totalCost || 0
    const upfrontRequired = calculateStageAmount(estimatedTotal, 5)
    if (estimatedTotal > 0 && walletBalance < upfrontRequired) {
      toast.error(`Insufficient wallet balance. Required: ₦${upfrontRequired.toLocaleString('en-NG')} (5% upfront of ₦${estimatedTotal.toLocaleString('en-NG')}), Available: ₦${walletBalance.toLocaleString('en-NG')}`)
      return
    }
    
    const pickupSlug = `${slugifyValue(shipmentForm.pickupState)}-${slugifyValue(cleanPickupLga)}`
    const destinationSlug = `${slugifyValue(shipmentForm.destinationState)}-${slugifyValue(cleanDestinationLga)}`

    if (pickupSlug === destinationSlug) {
      toast.error("Pickup and destination locations cannot be the same.")
      return
    }

    const token = localStorage.getItem('authToken')
    
    setCreatingShipment(true)
    try {
      const response = await fetch(`${API_BASE_URL}/shipping/shipments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...shipmentForm,
          cargoType: shipmentForm.cargoType === 'other' ? shipmentForm.cargoTypeOther.trim() : shipmentForm.cargoType,
          pickupLga: cleanPickupLga,
          destinationLga: cleanDestinationLga
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create shipment')
      }
      
      // Update wallet balance from response
      if (data.walletBalance !== undefined) {
        const newBalance = parseFloat(data.walletBalance || 0)
        setWalletBalance(newBalance)
        console.log('✅ Wallet balance updated from shipment creation:', newBalance)
        
        // Also update wallet object if it exists
        if (wallet) {
          setWallet({ ...wallet, balance: newBalance })
        }
      }
      
      // Refresh wallet and transactions to ensure consistency
      try {
        const [wr, tr] = await Promise.all([
          fetch(`${API_BASE_URL}/wallet`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/wallet/transactions`, { headers: { 'Authorization': `Bearer ${token}` } })
        ])
        const wd = await wr.json()
        const td = await tr.json()
        
        if (wr.ok && wd.wallet) {
          setWallet(wd.wallet)
          const refreshedBalance = parseFloat(wd.wallet.balance || 0)
          setWalletBalance(refreshedBalance)
          console.log('✅ Wallet balance refreshed after shipment creation:', refreshedBalance)
        }
        if (tr.ok && td.transactions) {
          setTransactions(td.transactions)
        }
      } catch (walletError) {
        console.error('Error refreshing wallet after shipment creation:', walletError)
      }
      
      toast.success(`Shipment created successfully!${data.deductedAmount ? ` ₦${data.deductedAmount.toLocaleString('en-NG')} deducted from your wallet.` : ''}`)
      setShowCreateShipment(false)
      setShipmentForm({
        pickupState: '',
        pickupLga: '',
        destinationState: '',
        destinationLga: '',
        cargoType: '',
        cargoTypeOther: '',
        weight: '',
        truckType: '',
        pickupDate: '',
        insurance: false,
        declaredValue: ''
      })
      setPickupLgaOptions([])
      setDestinationLgaOptions([])
      
      fetchMyShipments()
    } catch (error) {
      console.error('Error creating shipment:', error)
      toast.error(error.message || 'Failed to create shipment')
    } finally {
      setCreatingShipment(false)
    }
  }

  // Handle document upload
  const handleDocumentUpload = async (documentType, file) => {
    if (!file) return
    
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

  // Delete shipment
  const handleDeleteShipment = async (shipmentId) => {
    setDeletingShipmentId(shipmentId)
    try {
      const token = localStorage.getItem('authToken')
      const resp = await fetch(`${API_BASE_URL}/shipping/shipments/${shipmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.message || 'Delete failed')
      toast.success('Shipment deleted')
      fetchMyShipments()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setDeletingShipmentId(null)
    }
  }

  // Fetch bids for a shipment
  const fetchShipmentBids = async (shipmentId) => {
    if (loadingBids[shipmentId]) return

    setLoadingBids(prev => ({ ...prev, [shipmentId]: true }))
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/bids/shipment/${shipmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setShipmentBids(prev => ({ ...prev, [shipmentId]: data.bids || [] }))
      } else {
        console.error('fetchShipmentBids error:', response.status, data?.error || data?.message)
        toast.error(data.message || 'Failed to load bids')
      }
    } catch (error) {
      console.error('Error fetching bids:', error)
      toast.error('Error loading bids. Please try again.')
    } finally {
      setLoadingBids(prev => ({ ...prev, [shipmentId]: false }))
    }
  }

  // Fetch shipment detail (for rating info when delivered)
  const fetchShipmentDetail = async (shipmentId) => {
    if (loadingShipmentDetail[shipmentId]) return
    setLoadingShipmentDetail(prev => ({ ...prev, [shipmentId]: true }))
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/shipping/shipments/${shipmentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setShipmentDetails(prev => ({
          ...prev,
          [shipmentId]: {
            acceptedBidWithRating: data.acceptedBidWithRating || null,
            shipmentRatings: data.shipmentRatings || []
          }
        }))
      }
    } catch (e) {
      console.error('Error fetching shipment detail:', e)
    } finally {
      setLoadingShipmentDetail(prev => ({ ...prev, [shipmentId]: false }))
    }
  }

  // When a delivered+confirmed shipment is expanded but we don't have rating detail yet, fetch it (e.g. after confirm or refresh)
  useEffect(() => {
    if (!expandedShipmentId || !shipments.length) return
    const shipment = shipments.find((s) => s.id === expandedShipmentId)
    if (!shipment || shipment.status !== 'delivered' || !shipment.deliveryConfirmed) return
    if (shipmentDetails[expandedShipmentId] != null || loadingShipmentDetail[expandedShipmentId]) return
    fetchShipmentDetail(expandedShipmentId)
  }, [expandedShipmentId, shipments, shipmentDetails, loadingShipmentDetail])

  const handleSubmitRating = async (shipmentId, rateeType, rateeId) => {
    const key = `${shipmentId}-${rateeType}`
    if (submittingRating) return
    setSubmittingRating(key)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shipmentId,
          rateeType,
          rateeId,
          rating: ratingForm.rating,
          comment: ratingForm.comment || undefined
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to submit rating')
      toast.success('Rating submitted. Thank you!')
      setRatingForm({ rating: 5, comment: '' })
      fetchShipmentDetail(shipmentId)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSubmittingRating(null)
    }
  }

  // Show bid acceptance confirmation modal
  const handleAcceptBidClick = (bid, shipment) => {
    setSelectedBidForAccept(bid)
    setSelectedShipmentForBid(shipment)
    setShowBidAcceptModal(true)
  }

  // Accept a bid (after confirmation)
  const handleAcceptBid = async () => {
    if (!selectedBidForAccept || !selectedShipmentForBid) return

    const bidId = selectedBidForAccept.id
    const bidAmount = parseFloat(selectedBidForAccept.bidAmount || 0)
    const estimatedCost = parseFloat(selectedShipmentForBid.estimatedCost || 0)
    const upfrontAdjustmentDue = calculateBidAcceptUpfrontDue(bidAmount, estimatedCost)

    if (upfrontAdjustmentDue > 0 && walletBalance < upfrontAdjustmentDue) {
      toast.error(`Insufficient wallet balance. Required: ₦${upfrontAdjustmentDue.toLocaleString('en-NG')} (5% upfront adjustment), Available: ₦${walletBalance.toLocaleString('en-NG')}. Please fund your wallet.`)
      setShowBidAcceptModal(false)
      setSelectedBidForAccept(null)
      setSelectedShipmentForBid(null)
      return
    }

    setShowBidAcceptModal(false)
    setAcceptingBidId(bidId)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/bids/${bidId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (response.ok && data.success) {
        const acceptedBid = selectedBidForAccept
        const acceptedShipment = selectedShipmentForBid
        setBidAcceptSuccessInfo({
          driverName: acceptedBid.driverName || acceptedBid.truckerName || "Driver",
          bidAmount: parseFloat(acceptedBid.bidAmount || 0),
          shipmentId: acceptedShipment.id,
          route: `${acceptedShipment.pickupState} → ${acceptedShipment.destinationState}`,
          upfrontAdjustmentDue,
          message: data.message,
        })
        setShowBidAcceptSuccessModal(true)
        // Refresh shipments and bids
        fetchMyShipments()
        if (data.shipment) {
          fetchShipmentBids(data.shipment.id)
        }
        // Refresh wallet balance and transactions
        try {
          const token = localStorage.getItem('authToken')
          const [wr, tr] = await Promise.all([
            fetch(`${API_BASE_URL}/wallet`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/wallet/transactions`, { headers: { 'Authorization': `Bearer ${token}` } })
          ])
          const wd = await wr.json()
          const td = await tr.json()
          
          if (wr.ok && wd.wallet) {
            setWallet(wd.wallet)
            const refreshedBalance = parseFloat(wd.wallet.balance || 0)
            setWalletBalance(refreshedBalance)
            console.log('✅ Wallet balance refreshed after bid acceptance:', refreshedBalance)
          }
          
          if (tr.ok && td.transactions) {
            setTransactions(td.transactions)
            console.log('✅ Transactions refreshed after bid acceptance:', td.transactions.length)
          }
        } catch (e) {
          console.error('Error refreshing wallet/transactions:', e)
        }
      } else {
        toast.error(data.message || 'Failed to accept bid')
      }
    } catch (error) {
      console.error('Error accepting bid:', error)
      toast.error('Error accepting bid')
    } finally {
      setAcceptingBidId(null)
      setSelectedBidForAccept(null)
      setSelectedShipmentForBid(null)
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
      const token = localStorage.getItem('authToken')
      
      // Get payment details from backend
      const resp = await fetch(`${API_BASE_URL}/wallet/paystack/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount: amountNum, currency: 'NGN' })
      })
      const data = await resp.json()
      if (!resp.ok) {
        throw new Error(data.message || 'Failed to initialize payment')
      }

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

  // Cargo and Truck options
  const cargoOptions = [
    { label: "Electronics", value: "electronics" },
    { label: "Food/perishables", value: "food" },
    { label: "Textiles", value: "textiles" },
    { label: "Agricultural Products", value: "agricultural" },
    { label: "Building Materials", value: "building_materials" },
    { label: "Machinery & Equipment", value: "machinery_equipment" },
    { label: "Chemicals", value: "chemicals" },
    { label: "Furniture", value: "furniture" },
    { label: "Automotive Parts", value: "automotive_parts" },
    { label: "Livestock", value: "livestock" },
    { label: "Fuel/Petroleum Products", value: "fuel_petroleum" },
    { label: "Consumer Goods", value: "consumer_goods" },
    { label: "Pharmaceuticals", value: "pharmaceuticals" },
    { label: "Other (Specify)", value: "other" }
  ]

  const weightOptions = [5, 10, 15, 20, 30, 40, 50, 60].map((w) => ({ label: `${w} tons`, value: String(w) }))

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

  const formatStateName = (stateSlug) => toTitleCase(stateSlug)

  // Helper function to get status info
  // Each status gets its own distinct icon (not a shared checkmark/truck) so the trip's
  // stage reads at a glance from the icon alone, without needing to check the color/label.
  const getStatusInfo = (status, deliveryConfirmed = false) => {
    const statusMap = {
      'pending': { icon: Clock, color: 'warning', label: 'Pending' },
      'assigned': { icon: UserCheck, color: 'info', label: 'Assigned' },
      'picking_up': { icon: Truck, color: 'primary', label: 'Going to Pick Up' },
      'picked_up': { icon: PackageCheck, color: 'warning', label: 'Picked Up (Awaiting Your Confirmation)' },
      'in_transit': { icon: Navigation, color: 'primary', label: 'In Transit to Destination' },
      'delivered': deliveryConfirmed
        ? { icon: BadgeCheck, color: 'success', label: 'Delivered' }
        : { icon: CheckCircle, color: 'warning', label: 'Delivered (Awaiting Your Confirmation)' },
      'cancelled': { icon: XCircle, color: 'error', label: 'Cancelled' }
    }
    return statusMap[status] || statusMap['pending']
  }

  // Refresh wallet balance + transaction list (used after actions that move money)
  const refreshWalletAndTransactions = async () => {
    try {
      const token = localStorage.getItem('authToken')
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
      if (tr.ok && td.transactions) {
        setTransactions(td.transactions)
      }
    } catch (error) {
      console.error('Error refreshing wallet/transactions:', error)
    }
  }

  // Systemic refresh — always visible in the header, reloads shipments + wallet regardless
  // of which tab is active (previously only the driver dashboard had any refresh affordance).
  const handleGlobalRefresh = async () => {
    setRefreshingAll(true)
    try {
      await Promise.all([fetchMyShipments(), refreshWalletAndTransactions()])
      toast.success('Refreshed')
    } catch (error) {
      console.error('Error during global refresh:', error)
    } finally {
      setRefreshingAll(false)
    }
  }

  // Confirm pickup
  const handleConfirmPickup = async (shipmentId) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/shipping/shipments/${shipmentId}/confirm-pickup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(data.message || 'Pickup confirmed! 60% payment has been released.')
        // Refresh shipments and wallet
        fetchMyShipments()
        refreshWalletAndTransactions()
      } else {
        toast.error(data.message || 'Failed to confirm pickup')
      }
    } catch (error) {
      console.error('Error confirming pickup:', error)
      toast.error('Error confirming pickup')
    }
  }

  // Confirm delivery
  const handleConfirmDelivery = async (shipmentId) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/shipping/shipments/${shipmentId}/confirm-delivery`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(data.message || 'Delivery confirmed! 30% has been released to the carrier.')
        // Refresh shipments and wallet
        fetchMyShipments()
        refreshWalletAndTransactions()
        // Load rating section for this shipment so it appears without re-expanding
        fetchShipmentDetail(shipmentId)
      } else {
        toast.error(data.message || 'Failed to confirm delivery')
      }
    } catch (error) {
      console.error('Error confirming delivery:', error)
      toast.error('Error confirming delivery')
    }
  }

  const activeShipments = shipments.filter(s => s.status === 'pending' || s.status === 'in_transit' || s.status === 'assigned')
  
  // Pagination for active shipments (home view only)
  const totalActivePages = Math.ceil(activeShipments.length / activeShipmentsPerPage)
  const paginatedActiveShipments = activeShipments.slice(
    (activeShipmentsPage - 1) * activeShipmentsPerPage,
    activeShipmentsPage * activeShipmentsPerPage
  )
  
  // Pagination for transactions (wallet view)
  const totalTransactionsPages = Math.ceil(transactions.length / transactionsPerPage)
  const paginatedTransactions = transactions.slice(
    (transactionsPage - 1) * transactionsPerPage,
    transactionsPage * transactionsPerPage
  )

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
              <p className="text-white font-bold text-lg">
                {(() => {
                  const firstName = user?.fullName?.split(' ')[0] || "User"
                  // Remove "00" from the beginning of the name
                  return firstName.replace(/^00\s*/, '').trim() || "User"
                })()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
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
            {showBalance ? `₦${Number(walletBalance || 0).toLocaleString('en-NG')}` : '₦ • • • • • •'}
          </p>
        </div>
        )}
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

            {/* Active Shipments */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-text-primary font-bold text-lg">Active Shipments</h3>
                <button onClick={() => setActiveView("shipments")} className="text-primary text-sm font-medium">See all</button>
              </div>
              
              {loadingShipments ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-text-secondary text-sm">Loading shipments...</p>
                </div>
              ) : activeShipments.length > 0 ? (
                <>
                <div className="space-y-3">
                    {paginatedActiveShipments.map((shipment) => {
                    const statusInfo = getStatusInfo(shipment.status, !!shipment.deliveryConfirmed)
                    return (
                      <div key={shipment.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                        <div className="space-y-2">
                          <p className="text-text-primary font-bold text-base">
                                {formatLocation(shipment.pickupState, shipment.pickupLga)} → {formatLocation(shipment.destinationState, shipment.destinationLga)}
                              </p>
                          <p className="text-text-secondary text-sm">
                            {shipment.bookingReference || `#${filterZeroZero(shipment.id)}`} • {filterZeroZero(shipment.weight)}t • {filterZeroZero(shipment.distance)}km
                          </p>
                          <div className="flex items-center justify-between pt-2">
                            <p className="text-success font-bold text-lg">₦{parseFloat(shipment.estimatedCost || 0).toLocaleString('en-NG')}</p>
                            <div className="flex items-center space-x-3">
                              <p className={`text-${statusInfo.color} font-medium text-sm`}>{statusInfo.label}</p>
                        {shipment.status === 'pending' && (
                                <button
                                  onClick={() => setPendingConfirm({ title: 'Delete this shipment?', message: "This can't be undone.", confirmLabel: 'Delete', destructive: true, onConfirm: () => handleDeleteShipment(shipment.id) })}
                                  disabled={deletingShipmentId === shipment.id}
                                  className="bg-error/10 text-error px-4 py-2 rounded-xl font-medium text-sm disabled:opacity-50"
                                >
                            {deletingShipmentId === shipment.id ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                  {totalActivePages > 1 && (
                    <div className="flex items-center justify-center space-x-2 mt-4">
                      <button onClick={() => setActiveShipmentsPage(p => Math.max(1, p - 1))} disabled={activeShipmentsPage === 1} className="px-3 py-1 bg-card border border-border rounded-lg text-sm disabled:opacity-50">Prev</button>
                      <span className="text-text-secondary text-sm">Page {activeShipmentsPage} of {totalActivePages}</span>
                      <button onClick={() => setActiveShipmentsPage(p => Math.min(totalActivePages, p + 1))} disabled={activeShipmentsPage === totalActivePages} className="px-3 py-1 bg-card border border-border rounded-lg text-sm disabled:opacity-50">Next</button>
                    </div>
                  )}
                </>
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
            <div className="flex items-center justify-between">
              <h2 className="text-text-primary font-bold text-2xl">My Shipments</h2>
              {!loadingShipments && (
                <span className="text-text-secondary text-sm">
                  {shipments.length} {shipments.length === 1 ? 'shipment' : 'shipments'}
                </span>
              )}
            </div>
            
            <>
            
            {loadingShipments ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-text-secondary text-sm">Loading shipments...</p>
              </div>
            ) : shipments.length > 0 ? (
              shipments.map((shipment) => {
                const statusInfo = getStatusInfo(shipment.status, !!shipment.deliveryConfirmed)
                const StatusIcon = statusInfo.icon
                const isExpanded = expandedShipmentId === shipment.id
                return (
                  <div key={shipment.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-${statusInfo.color}/10`}>
                          <StatusIcon className={`w-7 h-7 text-${statusInfo.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-text-primary font-bold text-lg">
                            {formatLocation(shipment.pickupState, shipment.pickupLga)} → {formatLocation(shipment.destinationState, shipment.destinationLga)}
                          </p>
                          <p className="text-text-secondary text-sm">
                            {shipment.bookingReference || `#${filterZeroZero(shipment.id)}`} • {shipment.cargoType} • {filterZeroZero(shipment.weight)}t
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => {
                            const newExpandedId = isExpanded ? null : shipment.id
                            setExpandedShipmentId(newExpandedId)
                            if (newExpandedId) {
                              if (shipment.status === 'pending') fetchShipmentBids(shipment.id)
                              if (['picked_up', 'delivered'].includes(shipment.status)) fetchShipmentDetail(shipment.id)
                            }
                          }}
                          className="bg-primary text-white px-6 py-3 rounded-xl font-medium text-base"
                        >
                          {isExpanded ? 'Hide Details' : 'View Details'}
                        </button>
                        {shipment.status === 'pending' && (
                          <button
                            onClick={() => setPendingConfirm({ title: 'Delete this shipment?', message: "This can't be undone.", confirmLabel: 'Delete', destructive: true, onConfirm: () => handleDeleteShipment(shipment.id) })}
                            disabled={deletingShipmentId === shipment.id}
                            className="bg-error/10 text-error px-4 py-3 rounded-xl font-medium text-sm disabled:opacity-50"
                          >
                            {deletingShipmentId === shipment.id ? '...' : 'Delete'}
                          </button>
                        )}
                    </div>
                    </div>
                    
                    {isExpanded && (
                      <>
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-text-secondary text-sm mb-3 font-medium">Progress Tracker</p>
                          <ShipmentProgressTracker shipment={shipment} />
                        </div>
                        <div className="mt-4 pt-4 border-t border-border">
                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                      <div>
                        <p className="text-text-secondary">Distance</p>
                        <p className="text-text-primary font-medium">{filterZeroZero(shipment.distance) ? `${filterZeroZero(shipment.distance)}km` : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Duration</p>
                        <p className="text-text-primary font-medium">{filterZeroZero(shipment.estimatedDuration) || 'N/A'}</p>
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
                          <div className="pt-3 border-t border-border">
                            <p className="text-text-secondary text-sm mb-1">Base Cost</p>
                      <p className="text-success font-bold text-xl">₦{parseFloat(shipment.estimatedCost || 0).toLocaleString('en-NG')}</p>
                      </div>
                    </div>

                    {/* Route Map for this shipment */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <h4 className="text-text-primary font-bold mb-3">Route Map</h4>
                      <SingleShipmentMap
                        shipment={shipment}
                        height="400px"
                        statesData={states}
                      />
                    </div>

                    {/* Confirmation Buttons */}
                    {shipment.status === 'picked_up' && !Boolean(shipment.pickupConfirmed) && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-3">
                          <p className="text-warning font-medium mb-2">Driver has marked shipment as picked up</p>
                          <p className="text-text-secondary text-sm">Please confirm pickup to charge and release 60% payment, then allow the driver to start the trip to destination.</p>
                          {(() => {
                            const bidAmt = parseFloat(shipmentDetails[shipment.id]?.acceptedBidWithRating?.bidAmount || shipment.estimatedCost || 0)
                            if (bidAmt <= 0) return null
                            return (
                              <div className="flex items-center justify-between pt-2 mt-2 border-t border-warning/20 text-sm">
                                <span className="text-text-secondary">Amount to be charged (60%)</span>
                                <span className="text-text-primary font-semibold">₦{calculateStageAmount(bidAmt, 60).toLocaleString('en-NG')}</span>
                              </div>
                            )
                          })()}
                        </div>
                        <button
                          onClick={() => setPendingConfirm({ title: 'Confirm pickup?', message: 'This will charge 60% from your wallet and release it to the trucker/driver.', confirmLabel: 'Confirm pickup', onConfirm: () => handleConfirmPickup(shipment.id) })}
                          className="w-full bg-warning text-white py-3 rounded-xl font-bold hover:bg-warning/90 transition-colors flex items-center justify-center space-x-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          <span>Confirm Pickup (Release 60% Payment)</span>
                        </button>
                      </div>
                    )}

                    {shipment.status === 'delivered' && !Boolean(shipment.deliveryConfirmed) && Boolean(shipment.pickupConfirmed) && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-3">
                          <p className="text-warning font-medium mb-2">Driver has marked shipment as delivered</p>
                          <p className="text-text-secondary text-sm">Please confirm delivery to charge and release the remaining 30%.</p>
                          {(() => {
                            const bidAmt = parseFloat(shipmentDetails[shipment.id]?.acceptedBidWithRating?.bidAmount || shipment.estimatedCost || 0)
                            if (bidAmt <= 0) return null
                            const carrierAmt = calculateStageAmount(bidAmt, 30)
                            const platformAmt = calculateStageAmount(bidAmt, 5)
                            return (
                              <div className="space-y-1 pt-2 mt-2 border-t border-warning/20 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-text-secondary">Carrier payment (30%)</span>
                                  <span className="text-text-primary font-medium">₦{carrierAmt.toLocaleString('en-NG')}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-text-secondary">Platform fee (5%)</span>
                                  <span className="text-text-primary font-medium">₦{platformAmt.toLocaleString('en-NG')}</span>
                                </div>
                                <div className="flex items-center justify-between pt-1 border-t border-warning/30">
                                  <span className="text-text-secondary font-medium">Total to be charged</span>
                                  <span className="text-text-primary font-bold">₦{(carrierAmt + platformAmt).toLocaleString('en-NG')}</span>
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                        <button
                          onClick={() => setPendingConfirm({ title: 'Confirm delivery?', message: 'This will charge the remaining 30% from your wallet.', confirmLabel: 'Confirm delivery', onConfirm: () => handleConfirmDelivery(shipment.id) })}
                          className="w-full bg-success text-white py-3 rounded-xl font-bold hover:bg-success/90 transition-colors flex items-center justify-center space-x-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          <span>Confirm Delivery (Release 30% + 5% Fee)</span>
                        </button>
                      </div>
                    )}

                    {Boolean(shipment.pickupConfirmed) && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="bg-success/10 text-success p-3 rounded-lg text-sm">
                          ✓ Pickup confirmed on {shipment.pickupConfirmedAt ? new Date(shipment.pickupConfirmedAt).toLocaleString() : 'N/A'}
                        </div>
                        <button
                          onClick={() => setEwaybillShipmentId(shipment.id)}
                          className="mt-2 w-full bg-muted text-text-primary py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted/80"
                        >
                          <FileText className="w-4 h-4" /> View E-Waybill
                        </button>
                      </div>
                    )}

                    {Boolean(shipment.deliveryConfirmed) && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="bg-success/10 text-success p-3 rounded-lg text-sm">
                          ✓ Delivery confirmed on {shipment.deliveryConfirmedAt ? new Date(shipment.deliveryConfirmedAt).toLocaleString() : 'N/A'}
                        </div>
                      </div>
                    )}

                    {/* Ratings: show accepted driver/trucker rating and allow shipper to rate after delivery */}
                    {Boolean(shipment.deliveryConfirmed) && (() => {
                      const detail = shipmentDetails[shipment.id]
                      const accepted = detail?.acceptedBidWithRating
                      const ratings = detail?.shipmentRatings || []
                      if (loadingShipmentDetail[shipment.id]) {
                        return (
                          <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-text-secondary text-sm">
                            <Loader className="w-4 h-4 animate-spin" /> Loading rating options...
                          </div>
                        )
                      }
                      if (!accepted) return null
                      const canRateTrucker = accepted.canRateTrucker
                      const canRateDriver = accepted.canRateDriver
                      const showRateForm = canRateTrucker || canRateDriver
                      return (
                        <div className="mt-4 pt-4 border-t border-border">
                          <h4 className="text-text-primary font-bold mb-2">Ratings</h4>
                          {(accepted.vehicleImageUrl || accepted.vehiclePlateNumber) && (
                            <div className="mb-3 flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                              {accepted.vehicleImageUrl ? (
                                <img
                                  src={accepted.vehicleImageUrl}
                                  alt="Vehicle"
                                  className="w-20 h-20 object-cover rounded-lg border border-border"
                                />
                              ) : (
                                <div className="w-20 h-20 rounded-lg border border-border bg-muted flex items-center justify-center">
                                  <Truck className="w-8 h-8 text-text-secondary" />
                                </div>
                              )}
                              <div>
                                {accepted.vehiclePlateNumber && (
                                  <p className="text-text-primary font-medium">Vehicle: {accepted.vehiclePlateNumber}</p>
                                )}
                                <p className="text-text-secondary text-xs">Assigned vehicle for this delivery</p>
                              </div>
                            </div>
                          )}
                          <div className="space-y-2 mb-3">
                            {accepted.truckerName && (
                              <p className="text-text-secondary text-sm flex items-center gap-2">
                                <span>{accepted.truckerName}</span>
                                {accepted.truckerRating?.count > 0 ? (
                                  <span className="flex items-center gap-0.5 text-amber-500">
                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                    {accepted.truckerRating.average} ({accepted.truckerRating.count} reviews)
                                  </span>
                                ) : (
                                  <span className="text-text-secondary/70 text-xs">No ratings yet</span>
                                )}
                              </p>
                            )}
                            {accepted.driverName && (
                              <p className="text-text-secondary text-sm flex items-center gap-2">
                                <span>Driver: {accepted.driverName}</span>
                                {accepted.driverRating?.count > 0 ? (
                                  <span className="flex items-center gap-0.5 text-amber-500">
                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                    {accepted.driverRating.average} ({accepted.driverRating.count} reviews)
                                  </span>
                                ) : (
                                  <span className="text-text-secondary/70 text-xs">No ratings yet</span>
                                )}
                              </p>
                            )}
                          </div>
                          {ratings.length > 0 && (
                            <p className="text-success text-sm mb-2">You rated this delivery.</p>
                          )}
                          {showRateForm && (
                            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                              <p className="text-text-primary text-sm font-medium">Rate your experience</p>
                              <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => setRatingForm(prev => ({ ...prev, rating: n }))}
                                    className={`p-1 rounded transition-colors ${ratingForm.rating >= n ? 'text-amber-400' : 'text-text-secondary hover:text-amber-400/70'}`}
                                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                                  >
                                    <Star className={`w-5 h-5 ${ratingForm.rating >= n ? 'fill-amber-400' : ''}`} />
                                  </button>
                                ))}
                              </div>
                              <input
                                type="text"
                                placeholder="Optional comment"
                                value={ratingForm.comment}
                                onChange={(e) => setRatingForm(prev => ({ ...prev, comment: e.target.value }))}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary text-sm"
                              />
                              <div className="flex flex-wrap gap-2">
                                {canRateTrucker && accepted.truckerId && (
                                  <button
                                    onClick={() => handleSubmitRating(shipment.id, 'trucker', accepted.truckerId)}
                                    disabled={!!submittingRating}
                                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                                  >
                                    {submittingRating === `${shipment.id}-trucker` ? 'Submitting...' : 'Rate Trucker'}
                                  </button>
                                )}
                                {canRateDriver && accepted.driverId && (
                                  <button
                                    onClick={() => handleSubmitRating(shipment.id, 'driver', accepted.driverId)}
                                    disabled={!!submittingRating}
                                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                                  >
                                    {submittingRating === `${shipment.id}-driver` ? 'Submitting...' : 'Rate Driver'}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {/* Bidding Dashboard - Only show for pending shipments */}
                    {shipment.status === 'pending' && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-text-primary font-bold">Bidding Dashboard</h4>
                          <button
                            onClick={() => fetchShipmentBids(shipment.id)}
                            disabled={loadingBids[shipment.id]}
                            className="text-primary text-sm font-medium hover:text-primary/80 disabled:opacity-50"
                          >
                            {loadingBids[shipment.id] ? 'Loading...' : 'Refresh'}
                          </button>
                        </div>
                        
                        {loadingBids[shipment.id] ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader className="w-5 h-5 animate-spin text-primary" />
                          </div>
                        ) : shipmentBids[shipment.id] && shipmentBids[shipment.id].length > 0 ? (
                          <div className="space-y-3">
                            {shipmentBids[shipment.id]
                              .sort((a, b) => parseFloat(a.bidAmount) - parseFloat(b.bidAmount))
                              .map((bid) => {
                                const driverName = bid.driverName || bid.truckerName || 'Driver'
                                const bidRating = bid.rating || bid.driverRating || bid.truckerRating
                                const capacityLabel = bid.carryingCapacity
                                  ? `${bid.carryingCapacity} tons`
                                  : bid.capacityRange || (bid.driverId ? '3 – 30 tons' : '5 – 60 tons')

                                return (
                                <div
                                  key={bid.id}
                                  className={`bg-muted/30 border rounded-xl p-4 ${
                                    bid.status === 'accepted' ? 'border-success' : 
                                    bid.status === 'rejected' ? 'border-error/30' : 
                                    'border-border'
                                  }`}
                                >
                                  <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                      {bid.vehicleImageUrl ? (
                                        <img
                                          src={bid.vehicleImageUrl}
                                          alt="Truck"
                                          className="w-20 h-20 object-cover rounded-lg border border-border"
                                        />
                                      ) : (
                                        <div className="w-20 h-20 rounded-lg border border-border bg-muted flex items-center justify-center">
                                          <Truck className="w-8 h-8 text-text-secondary" />
                                        </div>
                                      )}
                                      {bid.vehiclePlateNumber && (
                                        <p className="text-text-secondary text-xs font-medium text-center mt-1">{bid.vehiclePlateNumber}</p>
                                      )}
                                    </div>

                                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                      <div>
                                        <p className="text-text-secondary text-xs">Name of Driver</p>
                                        <p className="text-text-primary font-semibold text-sm">{driverName}</p>
                                      </div>
                                      <div>
                                        <p className="text-text-secondary text-xs">Amount (Bidding)</p>
                                        <p className="text-text-primary font-bold text-lg">
                                          ₦{parseFloat(bid.bidAmount || 0).toLocaleString('en-NG')}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-text-secondary text-xs">Carrying Capacity</p>
                                        <p className="text-text-primary text-sm font-medium">{capacityLabel}</p>
                                      </div>
                                      <div>
                                        <p className="text-text-secondary text-xs">Km Away</p>
                                        <p className="text-text-primary text-sm font-medium flex items-center gap-1">
                                          <MapPin className="w-3.5 h-3.5 text-primary" />
                                          {bid.kmAway != null ? `${bid.kmAway} km` : '—'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-text-secondary text-xs">Rating (Driver)</p>
                                        <p className="text-text-primary text-sm font-medium flex items-center gap-1">
                                          {bidRating?.count > 0 ? (
                                            <>
                                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                              {bidRating.average} ({bidRating.count})
                                            </>
                                          ) : (
                                            'No ratings yet'
                                          )}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-text-secondary text-xs">Mileage Covered / Trips Completed</p>
                                        <p className="text-text-primary text-sm font-medium">
                                          {(bid.mileageCovered ?? 0).toLocaleString('en-NG')} km / {bid.tripsCompleted ?? 0} trips
                                        </p>
                                      </div>
                                    </div>

                                    <div className="text-right flex-shrink-0">
                                      {bid.status === 'accepted' && (
                                        <span className="inline-block bg-success/10 text-success px-3 py-1 rounded-lg text-xs font-medium">
                                          Accepted
                                        </span>
                                      )}
                                      {bid.status === 'rejected' && (
                                        <span className="inline-block bg-error/10 text-error px-3 py-1 rounded-lg text-xs font-medium">
                                          Rejected
                                        </span>
                                      )}
                                      {bid.status === 'pending' && (
                                        <button
                                          onClick={() => handleAcceptBidClick(bid, shipment)}
                                          disabled={acceptingBidId === bid.id}
                                          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {acceptingBidId === bid.id ? (
                                            <>
                                              <Loader className="w-4 h-4 animate-spin inline mr-1" />
                                              Accepting...
                                            </>
                                          ) : (
                                            'Accept Bid'
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {bid.message && (
                                    <p className="text-text-secondary text-sm mt-3 italic border-t border-border pt-2">
                                      "{bid.message}"
                                    </p>
                                  )}
                                  <p className="text-text-secondary text-xs mt-2">
                                    Submitted: {new Date(bid.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              )})}
                          </div>
                        ) : (
                          <div className="bg-muted/30 rounded-xl p-6 text-center">
                            <Truck className="w-8 h-8 text-text-secondary mx-auto mb-2" />
                            <p className="text-text-secondary text-sm">No bids yet</p>
                            <p className="text-text-secondary text-xs mt-1">Drivers and truckers can bid on this shipment</p>
                          </div>
                        )}
                      </div>
                    )}
                      </>
                    )}
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
            </>
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
                className="rounded-2xl p-6 flex flex-col items-center space-y-3 text-white bg-primary hover:bg-primary/90 transition-colors"
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
                  <h2 className="text-white font-bold text-2xl mb-1">{user?.fullName || "User"}</h2>
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
                placeholder={locationsLoading ? "Loading states..." : "Select state"}
                name="pickupState"
                value={shipmentForm.pickupState}
                onChange={(e) => handleFormChange('pickupState', e.target.value)}
                options={states.map((state) => ({ label: state.name, value: state.slug }))}
                disabled={locationsLoading || !!locationsError}
              />

              <LgaSelect
                label="Pickup LGA"
                placeholder={
                  shipmentForm.pickupState
                    ? locationsLoading
                      ? "Loading LGAs..."
                      : pickupLgaOptions.length > 0
                        ? "Select LGA"
                        : "No LGAs available"
                    : "Select a state first"
                }
                name="pickupLga"
                value={shipmentForm.pickupLga}
                onChange={(e) => handleFormChange('pickupLga', e.target.value)}
                options={pickupLgaOptions}
                disabled={!shipmentForm.pickupState || pickupLgaOptions.length === 0 || locationsLoading}
                required
              />

              {pickupWardOptions.length > 0 && (
                <LgaSelect
                  label="Pickup Ward (Optional)"
                  placeholder="Select ward"
                  name="pickupWard"
                  value={shipmentForm.pickupWard}
                  onChange={(e) => handleFormChange('pickupWard', e.target.value)}
                  options={pickupWardOptions}
                  disabled={!shipmentForm.pickupLga || pickupWardOptions.length === 0 || locationsLoading}
                />
              )}

              <StateSelect 
                label="To (Destination State)" 
                placeholder={locationsLoading ? "Loading states..." : "Select state"}
                name="destinationState"
                value={shipmentForm.destinationState}
                onChange={(e) => handleFormChange('destinationState', e.target.value)}
                options={states.map((state) => ({ label: state.name, value: state.slug }))}
                disabled={locationsLoading || !!locationsError}
              />

              <LgaSelect
                label="Destination LGA"
                placeholder={
                  shipmentForm.destinationState
                    ? locationsLoading
                      ? "Loading LGAs..."
                      : destinationLgaOptions.length > 0
                        ? "Select LGA"
                        : "No LGAs available"
                    : "Select a state first"
                }
                name="destinationLga"
                value={shipmentForm.destinationLga}
                onChange={(e) => handleFormChange('destinationLga', e.target.value)}
                options={destinationLgaOptions}
                disabled={!shipmentForm.destinationState || destinationLgaOptions.length === 0 || locationsLoading}
                required
              />

              {destinationWardOptions.length > 0 && (
                <LgaSelect
                  label="Destination Ward (Optional)"
                  placeholder="Select ward"
                  name="destinationWard"
                  value={shipmentForm.destinationWard}
                  onChange={(e) => handleFormChange('destinationWard', e.target.value)}
                  options={destinationWardOptions}
                  disabled={!shipmentForm.destinationLga || destinationWardOptions.length === 0 || locationsLoading}
                />
              )}

              {locationsError && (
                <p className="text-destructive text-sm bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
                  {locationsError}. You can try again later or contact support.
                </p>
              )}

              <div>
                <label className="block text-text-primary font-medium mb-2">Estimated Tons</label>
                <input type="hidden" name="weight" value={shipmentForm.weight} required />
                <button
                  type="button"
                  onClick={() => setShowWeightModal(true)}
                  className="w-full px-4 py-4 bg-input border border-border rounded-xl text-left flex items-center justify-between text-lg hover:bg-muted/50 transition-colors"
                >
                  <span className={shipmentForm.weight ? 'text-text-primary' : 'text-text-secondary'}>
                    {shipmentForm.weight ? `${shipmentForm.weight} tons` : 'Select estimated tons'}
                  </span>
                  <ChevronDown className="w-5 h-5 text-text-secondary" />
                </button>
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
                {shipmentForm.cargoType === 'other' && (
                  <input
                    type="text"
                    value={shipmentForm.cargoTypeOther}
                    onChange={(e) => handleFormChange('cargoTypeOther', e.target.value)}
                    className="w-full mt-2 px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                    placeholder="Please specify the cargo type"
                    required
                  />
                )}
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

              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-xl">
                  <input
                    type="checkbox"
                    id="insurance"
                    checked={shipmentForm.insurance}
                    onChange={(e) => handleFormChange('insurance', e.target.checked)}
                    className="w-6 h-6 rounded border-border text-primary"
                  />
                  <label htmlFor="insurance" className="text-text-primary font-medium">
                    Insurance (+₦200,000)
                  </label>
                </div>

                {shipmentForm.insurance && (
                  <div className="p-4 bg-muted/30 rounded-xl">
                    <label className="block text-text-primary font-medium mb-2">
                      Declared Cargo Value (₦) <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formatWithCommas(shipmentForm.declaredValue)}
                      onChange={(e) => handleFormChange('declaredValue', parseFormattedNumber(e.target.value))}
                      className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                      placeholder="e.g., 1,500,000"
                      required
                    />
                    <p className="text-text-secondary text-xs mt-1">
                      Required for insured shipments — this is the value the cargo would be covered for.
                    </p>
                  </div>
                )}
              </div>

              {/* Distance and Cost Estimate */}
              {calculating && (
                <div className="bg-muted/30 rounded-xl p-4 text-center">
                  <Loader className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-text-secondary text-sm">Calculating distance...</p>
                </div>
              )}

              {distanceError && !calculating && (
                <div className="bg-error/10 border border-error/20 rounded-xl p-4">
                  <p className="text-error text-sm">{distanceError}</p>
                </div>
              )}

              {distanceInfo && !calculating && !distanceError && (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                  {distanceInfo.route && (
                    <p className="text-text-secondary text-xs uppercase tracking-[0.25em] mb-2">
                      {distanceInfo.route}
                    </p>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-text-secondary text-sm">Estimated Distance</p>
                    <p className="text-primary font-bold text-2xl">{distanceInfo.distance} km</p>
                  </div>
                  {distanceInfo.estimatedDuration && (
                    <p className="text-text-secondary text-sm">
                      Estimated Duration: {distanceInfo.estimatedDuration}
                    </p>
                  )}
                </div>
              )}

              {costEstimate && !calculating && (
                <div className="bg-success/10 border border-success/20 rounded-xl p-4">
                  <p className="text-text-secondary text-sm mb-1">Estimated Cost</p>
                  <p className="text-success font-bold text-3xl">{costEstimate.cost.formattedCost}</p>
                  <p className="text-text-primary text-sm font-medium mt-2">
                    5% upfront required now: ₦{calculateStageAmount(costEstimate.cost.totalCost, 5).toLocaleString('en-NG')}
                  </p>
                  <p className="text-text-secondary text-xs mt-1">
                    60% + 5% commission charged at pickup • 30% at delivery
                  </p>
                  <p className="text-text-secondary text-xs mt-1">
                    Total you'll pay: ₦{parseFloat(costEstimate.cost.totalCost || 0).toLocaleString('en-NG')} (no extra platform fee on top)
                  </p>
                  <p className="text-text-secondary text-xs mt-2">
                    {shipmentForm.truckType ? `${truckOptions.find(opt => opt.value === shipmentForm.truckType)?.label || shipmentForm.truckType}` : 'Truck type not selected'} • {distanceInfo?.distance} km
                  </p>
                  {costEstimate.cost.insuranceFee > 0 && (
                    <div className="mt-3 pt-3 border-t border-success/20 space-y-1">
                      <p className="text-text-secondary text-xs">
                        Insurance Fee: +₦{costEstimate.cost.insuranceFee.toLocaleString('en-NG')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={creatingShipment}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {creatingShipment ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin mr-2" />
                      Creating shipment...
                    </>
                  ) : (
                    'Create Shipment'
                  )}
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
              <h3 className="text-text-primary font-bold text-xl">Top Up Wallet</h3>
              <button onClick={() => { if (!fundLoading) { setShowFundModal(false); setFundAmount("") } }} className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <X className="w-5 h-5 text-text-secondary" />
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

      {/* E-Waybill Modal */}
      {ewaybillShipmentId && (
        <EwaybillModal shipmentId={ewaybillShipmentId} onClose={() => setEwaybillShipmentId(null)} />
      )}

      {/* Weight Modal */}
      <SelectModal
        isOpen={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        title="Select Estimated Tons"
        options={weightOptions}
        value={shipmentForm.weight}
        onChange={(value) => handleFormChange('weight', value)}
        searchable={false}
      />

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

      {/* Bid Acceptance Confirmation Modal */}
      {showBidAcceptModal && selectedBidForAccept && selectedShipmentForBid && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-text-primary font-bold text-xl">Accept Bid Confirmation</h3>
                <button
                  onClick={() => {
                    setShowBidAcceptModal(false)
                    setSelectedBidForAccept(null)
                    setSelectedShipmentForBid(null)
                  }}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Bid Details */}
                <div className="bg-muted/30 rounded-xl p-4 border border-border">
                  <p className="text-text-secondary text-sm mb-2">Bid Amount</p>
                  <p className="text-text-primary font-bold text-2xl">
                    ₦{parseFloat(selectedBidForAccept.bidAmount || 0).toLocaleString('en-NG')}
                  </p>
                  <p className="text-text-secondary text-xs mt-1">
                    From: {selectedBidForAccept.driverName || selectedBidForAccept.truckerName || 'Driver'}
                  </p>
                </div>

                {/* Payment Breakdown */}
                {(() => {
                  const bidAmount = parseFloat(selectedBidForAccept.bidAmount || 0)
                  const estimatedCost = parseFloat(selectedShipmentForBid.estimatedCost || 0)
                  const upfrontAdjustmentDue = calculateBidAcceptUpfrontDue(bidAmount, estimatedCost)
                  const alreadyPaidUpfront = calculateStageAmount(estimatedCost, 5)
                  const totalUpfrontOnBid = calculateStageAmount(bidAmount, 5)
                  return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-text-secondary text-sm">Estimated Shipment Cost</span>
                    <span className="text-text-primary font-medium">
                      ₦{estimatedCost.toLocaleString('en-NG')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-text-secondary text-sm">Accepted Bid Amount</span>
                    <span className="text-text-primary font-medium">
                      ₦{bidAmount.toLocaleString('en-NG')}
                    </span>
                  </div>
                  {upfrontAdjustmentDue > 0 && (
                    <>
                      <div className="flex items-center justify-between py-1 px-3 text-xs text-text-secondary">
                        <span>Already paid at order creation (5% of estimate)</span>
                        <span>₦{alreadyPaidUpfront.toLocaleString('en-NG')}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 px-3 text-xs text-text-secondary">
                        <span>Full 5% of the accepted bid amount</span>
                        <span>₦{totalUpfrontOnBid.toLocaleString('en-NG')}</span>
                      </div>
                    </>
                  )}
                  {upfrontAdjustmentDue > 0 && (
                    <div className="flex items-center justify-between py-2 border-b border-error/30 bg-error/5 rounded-lg px-3">
                      <span className="text-error text-sm font-medium">Top-up due now (bid was higher than the estimate)</span>
                      <span className="text-error font-bold">
                        ₦{upfrontAdjustmentDue.toLocaleString('en-NG')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-text-secondary text-sm">Includes Platform Commission (5%, charged at pickup)</span>
                    <span className="text-text-primary font-medium">
                      ₦{calculateStageAmount(bidAmount, 5).toLocaleString('en-NG')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-text-primary text-sm font-semibold">Total Cost (Bid Amount)</span>
                    <span className="text-primary font-bold">
                      ₦{bidAmount.toLocaleString('en-NG')}
                    </span>
                  </div>
                </div>
                  )
                })()}

                {/* Wallet Balance Info */}
                {(() => {
                  const upfrontAdjustmentDue = calculateBidAcceptUpfrontDue(
                    parseFloat(selectedBidForAccept.bidAmount || 0),
                    parseFloat(selectedShipmentForBid.estimatedCost || 0)
                  )
                  return (
                <div className="bg-muted/30 rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-text-secondary text-sm">Current Wallet Balance</span>
                    <span className="text-text-primary font-semibold">
                      ₦{walletBalance.toLocaleString('en-NG')}
                    </span>
                  </div>
                  
                  {upfrontAdjustmentDue > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
                      <span className="text-text-secondary text-sm">Balance After Deduction</span>
                      <span className={`font-semibold ${
                        (walletBalance - upfrontAdjustmentDue) < 0
                          ? 'text-error' 
                          : 'text-text-primary'
                      }`}>
                        ₦{Math.max(0, walletBalance - upfrontAdjustmentDue).toLocaleString('en-NG')}
                      </span>
                    </div>
                  )}
                </div>
                  )
                })()}

                {/* Payment Stages Info */}
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                  <p className="text-text-primary text-sm font-medium mb-2">Payment Schedule:</p>
                  <ul className="space-y-1 text-xs text-text-secondary">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong className="text-text-primary">5%</strong> already paid at order creation; credited to driver upon acceptance</span>
                    </li>
                    <li className="flex items-start">
                      <Clock className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong className="text-text-primary">60%</strong> charged from your wallet and credited to the carrier at pickup confirmation</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong className="text-text-primary">5%</strong> platform commission charged from your wallet at pickup confirmation (same charge as the 60% above)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong className="text-text-primary">30%</strong> charged from your wallet and credited to the carrier at delivery confirmation</span>
                    </li>
                  </ul>
                </div>

                {/* Warning if insufficient balance */}
                {(() => {
                  const upfrontAdjustmentDue = calculateBidAcceptUpfrontDue(
                    parseFloat(selectedBidForAccept.bidAmount || 0),
                    parseFloat(selectedShipmentForBid.estimatedCost || 0)
                  )
                  return upfrontAdjustmentDue > 0 && walletBalance < upfrontAdjustmentDue ? (
                  <div className="bg-error/10 border border-error/30 rounded-xl p-4">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-error mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-error font-medium text-sm mb-1">Insufficient Balance</p>
                        <p className="text-error/80 text-xs">
                          You need ₦{upfrontAdjustmentDue.toLocaleString('en-NG')} more in your wallet to accept this bid. Please fund your wallet first.
                        </p>
                      </div>
                    </div>
                  </div>
                  ) : null
                })()}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowBidAcceptModal(false)
                    setSelectedBidForAccept(null)
                    setSelectedShipmentForBid(null)
                  }}
                  className="flex-1 bg-muted text-text-secondary py-3 rounded-xl font-medium hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAcceptBid}
                  disabled={
                    acceptingBidId === selectedBidForAccept.id ||
                    walletBalance < calculateBidAcceptUpfrontDue(
                      parseFloat(selectedBidForAccept.bidAmount || 0),
                      parseFloat(selectedShipmentForBid.estimatedCost || 0)
                    )
                  }
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {acceptingBidId === selectedBidForAccept.id ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Accepting...
                    </>
                  ) : (
                    'Accept Bid'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bid Accepted Success Modal */}
      {showBidAcceptSuccessModal && bidAcceptSuccessInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full border border-border">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-9 h-9 text-success" />
              </div>
              <h3 className="text-text-primary font-bold text-xl mb-2">Bid Accepted Successfully!</h3>
              <p className="text-text-secondary text-sm mb-4">
                You have assigned <span className="text-text-primary font-semibold">{bidAcceptSuccessInfo.driverName}</span> to
                shipment <span className="font-semibold text-text-primary">#{bidAcceptSuccessInfo.shipmentId}</span>
                {bidAcceptSuccessInfo.route && (
                  <span className="block mt-1 text-xs">{bidAcceptSuccessInfo.route}</span>
                )}
              </p>

              <div className="bg-muted/30 rounded-xl p-4 border border-border text-left mb-4">
                <p className="text-text-secondary text-xs mb-1">Accepted bid amount</p>
                <p className="text-success font-bold text-2xl">
                  ₦{bidAcceptSuccessInfo.bidAmount.toLocaleString("en-NG")}
                </p>
                {bidAcceptSuccessInfo.upfrontAdjustmentDue > 0 && (
                  <p className="text-text-secondary text-xs mt-2">
                    ₦{bidAcceptSuccessInfo.upfrontAdjustmentDue.toLocaleString("en-NG")} (5% upfront adjustment) deducted from your wallet.
                  </p>
                )}
              </div>

              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 text-left mb-6">
                <p className="text-text-primary text-sm font-medium mb-2">What happens next?</p>
                <ul className="space-y-2 text-xs text-text-secondary">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span><strong className="text-text-primary">5%</strong> has been credited to the driver. They will head to your pickup location.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>When you <strong className="text-text-primary">confirm pickup</strong>, <strong className="text-text-primary">60%</strong> is charged from your wallet and paid to the driver, plus a <strong className="text-text-primary">5%</strong> platform commission.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>When you <strong className="text-text-primary">confirm delivery</strong>, the remaining <strong className="text-text-primary">30%</strong> is charged from your wallet and paid to the driver.</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowBidAcceptSuccessModal(false)
                  setBidAcceptSuccessInfo(null)
                }}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation - BIG ICONS */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
        <div className="grid grid-cols-6 gap-1 px-2 py-3">
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
            onClick={() => setActiveView("referrals")}
            className={`flex flex-col items-center space-y-1 py-2 rounded-xl transition-colors ${
              activeView === "referrals" ? "bg-primary/10" : ""
            }`}
          >
            <Gift className={`w-7 h-7 ${activeView === "referrals" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-xs font-medium ${activeView === "referrals" ? "text-primary" : "text-text-secondary"}`}>
              Refer
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

export default ShipperDashboard
