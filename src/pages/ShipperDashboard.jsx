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
  ChevronDown,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Search
} from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useToast } from "../context/ToastContext"
import StateSelect from "../components/StateSelect"
import SelectModal from "../components/SelectModal"
import { calculateDistance, estimateShippingCost } from "../utils/distanceCalculator"
import LgaSelect from "../components/LgaSelect"
import nigeriaStatesLgasData from "../utils/nigeria-states-lgas.json"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const ShipperDashboard = () => {
  const { user, logoutUser, navigateTo } = useAppContext()
  const toast = useToast()
  const [activeView, setActiveView] = useState("home")
  const [showBalance, setShowBalance] = useState(true)
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
  
  // Modal states
  const [showCargoModal, setShowCargoModal] = useState(false)
  const [showTruckModal, setShowTruckModal] = useState(false)
  
  // Shipments state
  const [shipments, setShipments] = useState([])
  const [loadingShipments, setLoadingShipments] = useState(false)
  const [creatingShipment, setCreatingShipment] = useState(false)
  
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
    weight: '',
    truckType: '',
    pickupDate: '',
    fragileItems: false,
    insurance: false
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
    if (lgaSlug) {
      return `${toTitleCase(lgaSlug)}, ${stateName}`
    }
    return stateName
  }

  const getLgaOptionsForState = (stateSlug) => {
    if (!stateSlug || !states || states.length === 0) return []
    const match = states.find((state) => state.slug === stateSlug)
    if (!match || !Array.isArray(match.lgas)) return []
    return match.lgas.map((lga) => ({
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
    const loadLocations = () => {
      try {
        setLocationsLoading(true)
        setLocationsError("")
        
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
  
  // Delete shipment state
  const [deletingShipmentId, setDeletingShipmentId] = useState(null)
  const [expandedShipmentId, setExpandedShipmentId] = useState(null)
  
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
      const { pickupState, pickupLga, pickupWard, destinationState, destinationLga, destinationWard, weight } = shipmentForm
      
      if (!pickupState || !pickupLga || !destinationState || !destinationLga) {
        setDistanceInfo(null)
        setCostEstimate(null)
        setDistanceError(null)
        return
      }

      setCalculating(true)
      setDistanceError(null)
      
      try {
        // Get coordinates from selected LGAs/Wards (prefers ward coordinates if available)
        const pickupCoords = getLgaCoordinates(pickupState, pickupLga, pickupWard)
        const destinationCoords = getLgaCoordinates(destinationState, destinationLga, destinationWard)
        
        const distance = await calculateDistance(
          pickupState, 
          pickupLga, 
          destinationState, 
          destinationLga,
          pickupCoords,
          destinationCoords
        )
        setDistanceInfo(distance)
        setDistanceError(null)
        
        if (weight && parseFloat(weight) > 0) {
          try {
            const cost = await estimateShippingCost(
              pickupState, 
              pickupLga,
              destinationState, 
              destinationLga,
              parseFloat(weight),
              pickupCoords,
              destinationCoords,
              shipmentForm.fragileItems,
              shipmentForm.insurance
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
  }, [shipmentForm.pickupState, shipmentForm.pickupLga, shipmentForm.pickupWard, shipmentForm.destinationState, shipmentForm.destinationLga, shipmentForm.destinationWard, shipmentForm.weight, shipmentForm.fragileItems, shipmentForm.insurance, states])
  
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
    
    const pickupSlug = `${slugifyValue(shipmentForm.pickupState)}-${slugifyValue(shipmentForm.pickupLga)}`
    const destinationSlug = `${slugifyValue(shipmentForm.destinationState)}-${slugifyValue(shipmentForm.destinationLga)}`

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
        pickupLga: '',
        destinationState: '',
        destinationLga: '',
        cargoType: '',
        weight: '',
        truckType: '',
        pickupDate: '',
        fragileItems: false,
        insurance: false
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

  // Delete shipment
  const handleDeleteShipment = async (shipmentId) => {
    if (!window.confirm('Delete this shipment?')) return
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

  // Cargo and Truck options
  const cargoOptions = [
    { label: "Electronics", value: "electronics" },
    { label: "Food/perishables", value: "food" },
    { label: "Textiles", value: "textiles" },
    { label: "Agricultural Products", value: "agricultural" },
    { label: "Building Materials", value: "building_materials" },
    { label: "Other", value: "other" }
  ]

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
                    const statusInfo = getStatusInfo(shipment.status)
                    return (
                      <div key={shipment.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                        <div className="space-y-2">
                          <p className="text-text-primary font-bold text-base">
                                {formatLocation(shipment.pickupState, shipment.pickupLga)} → {formatLocation(shipment.destinationState, shipment.destinationLga)}
                              </p>
                          <p className="text-text-secondary text-sm">
                            #{shipment.id} • {shipment.weight}t • {shipment.distance}km
                          </p>
                          <div className="flex items-center justify-between pt-2">
                            <p className="text-success font-bold text-lg">₦{parseFloat(shipment.estimatedCost || 0).toLocaleString('en-NG')}</p>
                            <div className="flex items-center space-x-3">
                              <p className={`text-${statusInfo.color} font-medium text-sm`}>{statusInfo.label}</p>
                        {shipment.status === 'pending' && (
                                <button 
                                  onClick={() => handleDeleteShipment(shipment.id)} 
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
                            #{shipment.id} • {shipment.cargoType} • {shipment.weight}t
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => setExpandedShipmentId(isExpanded ? null : shipment.id)}
                          className="bg-primary text-white px-6 py-3 rounded-xl font-medium text-base"
                        >
                          {isExpanded ? 'Hide Details' : 'View Details'}
                        </button>
                        {shipment.status === 'pending' && (
                          <button 
                            onClick={() => handleDeleteShipment(shipment.id)} 
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
                          <div className="pt-3 border-t border-border">
                            <p className="text-text-secondary text-sm mb-1">Total Cost</p>
                      <p className="text-success font-bold text-xl">₦{parseFloat(shipment.estimatedCost || 0).toLocaleString('en-NG')}</p>
                      </div>
                    </div>
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

              <div className="space-y-3">
              <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-xl">
                <input
                  type="checkbox"
                  id="fragileItems"
                  checked={shipmentForm.fragileItems}
                  onChange={(e) => handleFormChange('fragileItems', e.target.checked)}
                  className="w-6 h-6 rounded border-border text-primary"
                />
                <label htmlFor="fragileItems" className="text-text-primary font-medium">
                    Fragile/Perishable Items (+₦300,000)
                </label>
                </div>

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
                  <p className="text-text-secondary text-xs mt-2">
                    Based on {shipmentForm.weight || 1} ton(s) • {distanceInfo?.distance} km
                  </p>
                  {(costEstimate.cost.fragileFee > 0 || costEstimate.cost.insuranceFee > 0) && (
                    <div className="mt-3 pt-3 border-t border-success/20 space-y-1">
                      {costEstimate.cost.fragileFee > 0 && (
                        <p className="text-text-secondary text-xs">
                          Fragile/Perishable Fee: +₦{costEstimate.cost.fragileFee.toLocaleString('en-NG')}
                        </p>
                      )}
                      {costEstimate.cost.insuranceFee > 0 && (
                        <p className="text-text-secondary text-xs">
                          Insurance Fee: +₦{costEstimate.cost.insuranceFee.toLocaleString('en-NG')}
                        </p>
                      )}
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
        <div className="grid grid-cols-5 gap-1 px-2 py-3">
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

export default ShipperDashboard
