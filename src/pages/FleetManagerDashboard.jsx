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
  CreditCard,
  Package,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronDown,
  Navigation
} from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useToast } from "../context/ToastContext"
import StateSelect from "../components/StateSelect"
import NotificationCenter from "../components/NotificationCenter"

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
  const [showRegisterDriverTruckModal, setShowRegisterDriverTruckModal] = useState(false)
  const [selectedTruck, setSelectedTruck] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  
  // Truck form state
  const [truckForm, setTruckForm] = useState({
    plateNumber: "",
    vehicleType: "",
    driverLicense: "",
    vehicleReg: "",
    status: "active",
    quantity: 1,
    driverId: ""
  })
  
  // Combined driver/truck registration form state
  const [driverTruckForm, setDriverTruckForm] = useState({
    // Driver fields
    driverId: "", // If empty, create new driver
    driverName: "",
    phoneNumber: "",
    driverLicense: "",
    password: "",
    confirmPassword: "",
    // Truck fields
    plateNumber: "",
    vehicleType: "",
    product: "",
    description: "",
    type: "",
    color: "",
    notes: "",
    truckImage: null
  })
  const [submittingDriverTruck, setSubmittingDriverTruck] = useState(false)
  const [currentStep, setCurrentStep] = useState(1) // 1: Driver, 2: Truck Details, 3: Image, 4: Review
  
  // Drivers state
  const [drivers, setDrivers] = useState([])
  const [loadingDrivers, setLoadingDrivers] = useState(false)
  const [showAddDriverModal, setShowAddDriverModal] = useState(false)
  const [showEditDriverModal, setShowEditDriverModal] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [submittingDriver, setSubmittingDriver] = useState(false)
  
  // Driver form state
  const [driverForm, setDriverForm] = useState({
    driverName: "",
    phoneNumber: "",
    driverLicense: "",
    password: "",
    confirmPassword: ""
  })
  
  // Available shipments and bidding state
  const [availableShipments, setAvailableShipments] = useState([])
  const [loadingShipments, setLoadingShipments] = useState(false)
  const [showBidModal, setShowBidModal] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [bidForm, setBidForm] = useState({
    bidAmount: "",
    message: "",
    driverId: ""
  })
  const [submittingBid, setSubmittingBid] = useState(false)
  const [myBids, setMyBids] = useState([])
  const [loadingMyBids, setLoadingMyBids] = useState(false)
  const [assignedShipments, setAssignedShipments] = useState([])
  const [loadingAssignedShipments, setLoadingAssignedShipments] = useState(false)
  
  // Filter and pagination state
  const [filters, setFilters] = useState({
    pickupState: "",
    destinationState: "",
    truckType: "",
    cargoType: "",
    weight: ""
  })
  const [states, setStates] = useState([])
  const [loadingStates, setLoadingStates] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalShipments, setTotalShipments] = useState(0)
  const itemsPerPage = 10
  
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

  // Wallet state
  const [showFundModal, setShowFundModal] = useState(false)
  const [fundAmount, setFundAmount] = useState("")
  const [fundLoading, setFundLoading] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  
  // Bank account state
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
        fetchDrivers()
        
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

  // Fetch bids and assigned shipments when shipments view is active
  useEffect(() => {
    if (activeView === "shipments") {
      fetchMyBids()
      fetchAssignedShipments()
    }
  }, [activeView])

  // Fetch assigned shipments when home view is active
  useEffect(() => {
    if (activeView === "home") {
      fetchAssignedShipments()
    }
  }, [activeView])

  // Auto-refresh bids and assigned shipments every 30 seconds to catch new acceptances
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeView === "shipments") {
        fetchMyBids()
        fetchAssignedShipments()
      }
      if (activeView === "home") {
        fetchAssignedShipments()
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [activeView])

  // Reset page when filters change
  useEffect(() => {
    if (activeView === "shipments") {
      setCurrentPage(1)
    }
  }, [activeView, filters.pickupState, filters.destinationState, filters.truckType, filters.cargoType, filters.weight])

  // Fetch shipments when page changes or filters change
  useEffect(() => {
    if (activeView === "shipments") {
      fetchAvailableShipments(currentPage)
    }
  }, [activeView, currentPage, filters.pickupState, filters.destinationState, filters.truckType, filters.cargoType, filters.weight])

  // Reset truck form
  const resetTruckForm = () => {
    setTruckForm({
      plateNumber: "",
      vehicleType: "",
      driverLicense: "",
      vehicleReg: "",
      status: "active",
      quantity: 1,
      driverId: ""
    })
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
  
  // Reset combined driver/truck form
  const resetDriverTruckForm = () => {
    setDriverTruckForm({
      driverId: "",
      driverName: "",
      phoneNumber: "",
      driverLicense: "",
      password: "",
      confirmPassword: "",
      plateNumber: "",
      vehicleType: "",
      product: "",
      description: "",
      type: "",
      color: "",
      notes: "",
      truckImage: null
    })
    setCurrentStep(1)
  }
  
  // Handle combined driver/truck registration
  const handleRegisterDriverTruck = async (e) => {
    e.preventDefault()
    
    // Validate based on step
    if (currentStep === 1) {
      // Step 1: Driver selection/creation
      if (!driverTruckForm.driverId) {
        // Creating new driver - validate all fields
        if (!driverTruckForm.driverName || !driverTruckForm.phoneNumber || 
            !driverTruckForm.driverLicense || !driverTruckForm.password) {
          toast.error("All driver fields are required")
          return
        }
        if (driverTruckForm.password !== driverTruckForm.confirmPassword) {
          toast.error("Passwords do not match")
          return
        }
        if (driverTruckForm.password.length < 6) {
          toast.error("Password must be at least 6 characters")
          return
        }
      }
      // If using existing driver, just move to next step
      setCurrentStep(2)
      return
    }
    
    if (currentStep === 2) {
      // Step 2: Truck details
      if (!driverTruckForm.plateNumber || !driverTruckForm.vehicleType) {
        toast.error("Plate number and vehicle type are required")
        return
      }
      setCurrentStep(3)
      return
    }
    
    if (currentStep === 3) {
      // Step 3: Image (optional, can skip)
      setCurrentStep(4)
      return
    }
    
    if (currentStep === 4) {
      // Step 4: Submit
      setSubmittingDriverTruck(true)
      try {
        const token = localStorage.getItem('authToken')
        const formData = new FormData()
        
        // Add driver fields (only if creating new driver)
        if (!driverTruckForm.driverId) {
          formData.append('driverName', driverTruckForm.driverName)
          formData.append('phoneNumber', driverTruckForm.phoneNumber)
          formData.append('driverLicense', driverTruckForm.driverLicense)
          formData.append('password', driverTruckForm.password)
        } else {
          formData.append('driverId', driverTruckForm.driverId)
        }
        
        // Add truck fields
        formData.append('plateNumber', driverTruckForm.plateNumber)
        formData.append('vehicleType', driverTruckForm.vehicleType)
        if (driverTruckForm.product) formData.append('product', driverTruckForm.product)
        if (driverTruckForm.description) formData.append('description', driverTruckForm.description)
        if (driverTruckForm.type) formData.append('type', driverTruckForm.type)
        if (driverTruckForm.color) formData.append('color', driverTruckForm.color)
        if (driverTruckForm.notes) formData.append('notes', driverTruckForm.notes)
        
        // Add truck image if provided
        if (driverTruckForm.truckImage) {
          formData.append('truckImage', driverTruckForm.truckImage)
        }
        
        const response = await fetch(`${API_BASE_URL}/drivers/register-with-truck`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })
        
        const data = await response.json()
        
        if (response.ok && data.success) {
          toast.success('Driver and truck registered successfully!')
          setShowRegisterDriverTruckModal(false)
          resetDriverTruckForm()
          fetchDrivers()
          fetchTrucks()
        } else {
          toast.error(data.message || 'Failed to register driver and truck')
        }
      } catch (error) {
        console.error('Error registering driver and truck:', error)
        toast.error('Error registering driver and truck')
      } finally {
        setSubmittingDriverTruck(false)
      }
    }
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
      
      if (response.ok && data.success) {
        setDrivers(data.drivers || [])
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
  
  // Fetch states for filters
  useEffect(() => {
    const fetchStates = async () => {
      setLoadingStates(true)
      try {
        const response = await fetch(`${API_BASE_URL}/shipping/locations/states`)
        const data = await response.json()
        if (data.success && data.data) {
          const stateOptions = data.data.map(state => ({
            label: state.name || state.state,
            value: state.name || state.state
          }))
          setStates(stateOptions)
        } else {
          // Fallback: use local states data if API fails
          console.warn('States API returned unsuccessful response, using fallback')
        }
      } catch (error) {
        console.error('Error fetching states:', error)
        // Error is logged but not critical - component will work without states filter
      } finally {
        setLoadingStates(false)
      }
    }
    fetchStates()
  }, [])

  // Fetch available shipments with filters and pagination
  const fetchAvailableShipments = async (page = currentPage) => {
    setLoadingShipments(true)
    try {
      const token = localStorage.getItem('authToken')
      
      const queryParams = new URLSearchParams()
      if (filters.pickupState) queryParams.append('pickupState', filters.pickupState)
      if (filters.destinationState) queryParams.append('destinationState', filters.destinationState)
      if (filters.truckType) queryParams.append('truckType', filters.truckType)
      if (filters.cargoType) queryParams.append('cargoType', filters.cargoType)
      if (filters.weight) queryParams.append('weight', filters.weight)
      queryParams.append('limit', itemsPerPage.toString())
      queryParams.append('offset', ((page - 1) * itemsPerPage).toString())
      
      const response = await fetch(`${API_BASE_URL}/shipping/shipments/available?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (response.ok && data.success) {
        setAvailableShipments(data.shipments || [])
        // Calculate total pages (assuming we get total count from backend or estimate)
        // For now, if we get less than itemsPerPage, we're on the last page
        if (data.shipments && data.shipments.length < itemsPerPage) {
          setTotalPages(page)
        } else if (data.shipments && data.shipments.length === 0) {
          setTotalPages(1) // At least show page 1 even if no results
        } else {
          // Estimate: if we got a full page, there might be more
          setTotalPages(page + 1)
        }
        setTotalShipments(data.shipments?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching shipments:', error)
    } finally {
      setLoadingShipments(false)
    }
  }

  // Fetch my bids
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

  // Helper function to check if a shipment has a bid
  const hasBidForShipment = (shipmentId) => {
    return myBids.some(bid => bid.shipmentId === shipmentId)
  }

  // Helper function to get bid for a shipment
  const getBidForShipment = (shipmentId) => {
    return myBids.find(bid => bid.shipmentId === shipmentId)
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
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'warning', label: 'Pending' }
      case 'assigned':
        return { icon: CheckCircle, color: 'primary', label: 'Assigned' }
      case 'in_transit':
        return { icon: Navigation, color: 'success', label: 'In Transit' }
      case 'delivered':
        return { icon: CheckCircle, color: 'success', label: 'Delivered' }
      case 'cancelled':
        return { icon: AlertCircle, color: 'error', label: 'Cancelled' }
      default:
        return { icon: Clock, color: 'text-secondary', label: status }
    }
  }

  // Fetch assigned shipments (where fleet manager's bid was accepted)
  const fetchAssignedShipments = async () => {
    setLoadingAssignedShipments(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/shipping/shipments/my-jobs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (response.ok && data.success) {
        setAssignedShipments(data.shipments || [])
      }
    } catch (error) {
      console.error('Error fetching assigned shipments:', error)
    } finally {
      setLoadingAssignedShipments(false)
    }
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
        body: JSON.stringify({
          ...truckForm,
          quantity: parseInt(truckForm.quantity) || 1,
          driverId: truckForm.driverId || null
        })
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
      quantity: 1,
      driverId: truck.driverId ? String(truck.driverId) : ""
    })
    setShowEditTruckModal(true)
  }
  
  // Handle add driver
  const handleAddDriver = async (e) => {
    e.preventDefault()
    
    if (!driverForm.driverName || !driverForm.phoneNumber || !driverForm.driverLicense || !driverForm.password) {
      toast.error("All fields are required")
      return
    }
    
    if (driverForm.password !== driverForm.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    
    if (driverForm.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    
    setSubmittingDriver(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/drivers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          driverName: driverForm.driverName,
          phoneNumber: driverForm.phoneNumber,
          driverLicense: driverForm.driverLicense,
          password: driverForm.password
        })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('Driver registered successfully!')
        setShowAddDriverModal(false)
        resetDriverForm()
        fetchDrivers()
      } else {
        toast.error(data.message || 'Failed to register driver')
      }
    } catch (error) {
      console.error('Error registering driver:', error)
      toast.error('Error registering driver')
    } finally {
      setSubmittingDriver(false)
    }
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
    if (!window.confirm('Are you sure you want to delete this driver?')) return
    
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

  // Handle open bid modal
  const handleOpenBidModal = (shipment) => {
    setSelectedShipment(shipment)
    const estimatedCost = shipment.estimatedCost || 0
    setBidForm({
      bidAmount: estimatedCost ? formatNumberWithCommas(estimatedCost.toString()) : "",
      message: "",
      driverId: ""
    })
    setShowBidModal(true)
  }
  
  // Handle submit bid
  const handleSubmitBid = async (e) => {
    e.preventDefault()
    
    if (!selectedShipment) return
    
    if (!bidForm.driverId) {
      toast.error("Please select a driver")
      return
    }
    
    // Remove commas before parsing
    const bidAmount = parseFloat(removeCommas(bidForm.bidAmount))
    const estimatedCost = parseFloat(selectedShipment.estimatedCost || 0)
    const maxBidAmount = estimatedCost + 200000
    
    if (isNaN(bidAmount) || bidAmount <= 0) {
      toast.error('Please enter a valid bid amount')
      return
    }
    
    if (bidAmount < estimatedCost) {
      toast.error(`Bid amount cannot be less than the estimated cost of ₦${estimatedCost.toLocaleString('en-NG')}`)
      return
    }
    
    if (bidAmount > maxBidAmount) {
      toast.error(`Bid amount cannot exceed ₦${maxBidAmount.toLocaleString('en-NG')}`)
      return
    }

    setSubmittingBid(true)
    try {
      const token = localStorage.getItem('authToken')
      
      const response = await fetch(`${API_BASE_URL}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shipmentId: selectedShipment.id,
          bidAmount: bidAmount,
          message: bidForm.message || null,
          driverId: bidForm.driverId
        })
      })
      
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('Bid submitted successfully!')
        setShowBidModal(false)
        setBidForm({ bidAmount: '', message: '', driverId: '' })
        setSelectedShipment(null)
        // Refresh available shipments and my bids
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
        body: JSON.stringify({
          ...truckForm,
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
      
      const resp = await fetch(`${API_BASE_URL}/wallet/paystack/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount: amountNum, currency: 'NGN' })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.message || 'Failed to initialize payment')

      if (!window.PaystackPop) {
        throw new Error('Paystack payment gateway is not loaded. Please refresh the page.')
      }

      if (!data.publicKey || !data.reference || !data.amount || !data.email) {
        throw new Error('Invalid payment data received from server')
      }

      const handler = window.PaystackPop.setup({
        key: data.publicKey,
        email: data.email,
        amount: data.amount,
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
          setFundLoading(false)
          
          if (response.status === 'success') {
            const creditToken = token || localStorage.getItem('authToken')
            const creditApiUrl = API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
            
            ;(async () => {
              try {
                const creditResp = await fetch(`${creditApiUrl}/wallet/paystack/credit`, {
                  method: 'POST',
                  headers: { 
                    'Authorization': `Bearer ${creditToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ reference: response.reference })
                })
                
                if (!creditResp.ok) {
                  const errorText = await creditResp.text()
                  throw new Error(`Credit failed: ${creditResp.status} ${errorText}`)
                }
                
                const creditData = await creditResp.json()
                
                if (creditData.success) {
                  toast.success(`Payment successful! ₦${creditData.transaction.amount.toLocaleString('en-NG')} credited to your wallet.`)
                  
                  if (creditData.balance !== undefined) {
                    const newBalance = parseFloat(creditData.balance || 0)
                    setWalletBalance(newBalance)
                  }
                  
                  const [wr, tr] = await Promise.all([
                    fetch(`${creditApiUrl}/wallet`, { headers: { 'Authorization': `Bearer ${creditToken}` } }),
                    fetch(`${creditApiUrl}/wallet/transactions`, { headers: { 'Authorization': `Bearer ${creditToken}` } })
                  ])
                  const wd = await wr.json()
                  const td = await tr.json()
                  
                  if (wr.ok && wd.wallet) {
                    setWallet(wd.wallet)
                    const refreshedBalance = parseFloat(wd.wallet.balance || 0)
                    setWalletBalance(refreshedBalance)
                  }
                  if (tr.ok && td.transactions) {
                    setTransactions(td.transactions)
                  }
                } else {
                  toast.error(creditData.message || 'Failed to credit wallet. Please contact support.')
                }
              } catch (error) {
                console.error('Error crediting wallet:', error)
                toast.error('Error crediting wallet. Please check your balance or contact support.')
              }
            })()
          } else {
            toast.error('Payment was not successful. Please try again.')
          }
          
          setShowFundModal(false)
          setFundAmount("")
        },
        onClose: function () {
          setFundLoading(false)
          toast.info('Payment cancelled')
        }
      })

      handler.openIframe()
    } catch (e) {
      setFundLoading(false)
      console.error('Error in initiatePaystackPayment:', e)
      toast.error(e.message || 'Failed to initialize payment')
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
            <NotificationCenter userId={user?.id} />
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
                    <Users className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-white/80 text-sm">Total Drivers</p>
                <p className="text-white font-bold text-3xl">{drivers.length}</p>
              </div>
            </div>

            {/* Register Driver & Truck Button */}
            <button
              onClick={() => {
                resetDriverTruckForm()
                setShowRegisterDriverTruckModal(true)
              }}
              className="w-full bg-gradient-to-r from-primary to-primary/80 rounded-3xl p-6 shadow-lg flex items-center justify-center space-x-3 hover:shadow-xl transition-all"
            >
              <Plus className="w-6 h-6 text-white" />
              <span className="text-white font-bold text-lg">Register Driver & Truck</span>
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
                            {truck.driverName && (
                              <p className="text-text-secondary text-xs mt-1 flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>Driver: {truck.driverName}</span>
                              </p>
                            )}
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

            {/* Assigned Shipments Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-text-primary font-bold text-lg">Assigned Shipments</h3>
                <button
                  onClick={fetchAssignedShipments}
                  disabled={loadingAssignedShipments}
                  className="text-primary text-sm font-medium hover:text-primary/80 disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>

              {loadingAssignedShipments ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-text-secondary text-sm">Loading shipments...</p>
                </div>
              ) : assignedShipments.length > 0 ? (
                <div className="space-y-3">
                  {assignedShipments.map((shipment) => {
                    const statusInfo = getStatusInfo(shipment.status)
                    const StatusIcon = statusInfo.icon
                    const statusColorClass = statusInfo.color === 'warning' ? 'warning' : 
                                            statusInfo.color === 'primary' ? 'primary' :
                                            statusInfo.color === 'success' ? 'success' :
                                            statusInfo.color === 'error' ? 'error' : 'text-secondary'
                    return (
                      <div key={shipment.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              statusColorClass === 'warning' ? 'bg-warning/10' :
                              statusColorClass === 'primary' ? 'bg-primary/10' :
                              statusColorClass === 'success' ? 'bg-success/10' :
                              statusColorClass === 'error' ? 'bg-error/10' :
                              'bg-muted/30'
                            }`}>
                              <StatusIcon className={`w-6 h-6 ${
                                statusColorClass === 'warning' ? 'text-warning' :
                                statusColorClass === 'primary' ? 'text-primary' :
                                statusColorClass === 'success' ? 'text-success' :
                                statusColorClass === 'error' ? 'text-error' :
                                'text-text-secondary'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <p className="text-text-primary font-bold">
                                {formatLocation(shipment.pickupState, shipment.pickupLga)} → {formatLocation(shipment.destinationState, shipment.destinationLga)}
                              </p>
                              <p className="text-text-secondary text-sm">
                                #{filterZeroZero(shipment.id)} • {shipment.cargoType} • {filterZeroZero(shipment.weight)}t
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-success font-bold text-lg">
                              ₦{parseFloat(shipment.estimatedCost || 0).toLocaleString('en-NG')}
                            </p>
                            <p className={`text-xs font-medium ${
                              statusColorClass === 'warning' ? 'text-warning' :
                              statusColorClass === 'primary' ? 'text-primary' :
                              statusColorClass === 'success' ? 'text-success' :
                              statusColorClass === 'error' ? 'text-error' :
                              'text-text-secondary'
                            }`}>{statusInfo.label}</p>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-border">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-text-secondary">Pickup</p>
                              <p className="text-text-primary font-medium">{formatLocation(shipment.pickupState, shipment.pickupLga)}</p>
                            </div>
                            <div>
                              <p className="text-text-secondary">Destination</p>
                              <p className="text-text-primary font-medium">{formatLocation(shipment.destinationState, shipment.destinationLga)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-muted/30 rounded-2xl p-8 text-center">
                  <Package className="w-12 h-12 text-text-secondary mx-auto mb-2" />
                  <p className="text-text-secondary">No assigned shipments</p>
                  <p className="text-text-secondary text-sm mt-1">Your accepted bids will appear here</p>
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
                    <div className="bg-muted/30 rounded-2xl p-6 text-center text-text-secondary">
                      No transactions yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {transactions.map((t) => (
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
                                <ArrowDown className="w-5 h-5 text-success" />
                              ) : (
                                <ArrowUp className="w-5 h-5 text-error" />
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
                            {t.type === 'credit' ? '+' : '-'}₦{Number(t.amount || 0).toLocaleString('en-NG')}
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

        {activeView === "drivers" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-text-primary font-bold text-2xl">Drivers</h2>
              <button
                onClick={() => {
                  resetDriverTruckForm()
                  setShowRegisterDriverTruckModal(true)
                }}
                className="bg-primary text-white px-4 py-2 rounded-xl font-medium flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Register Driver & Truck</span>
              </button>
            </div>

            {loadingDrivers ? (
              <div className="flex justify-center items-center py-12">
                <Loader className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : drivers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drivers.map((driver) => (
                  <div key={driver.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-text-primary font-bold text-lg">{driver.driverName}</p>
                          <p className="text-text-secondary text-sm">{driver.phoneNumber}</p>
                        </div>
                      </div>
                      {driver.isActive ? (
                        <span className="bg-success/10 text-success px-3 py-1 rounded-lg text-xs font-medium">Active</span>
                      ) : (
                        <span className="bg-error/10 text-error px-3 py-1 rounded-lg text-xs font-medium">Inactive</span>
                      )}
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2 text-text-secondary text-sm">
                        <CreditCard className="w-4 h-4" />
                        <span>License: {driver.driverLicense}</span>
                      </div>
                      {driver.assignedTrucksCount > 0 && (
                        <div className="flex items-center space-x-2 text-text-secondary text-sm">
                          <Truck className="w-4 h-4" />
                          <span>{driver.assignedTrucksCount} truck(s) assigned</span>
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
                        onClick={() => handleDeleteDriver(driver.id)}
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
              <h2 className="text-text-primary font-bold text-2xl">Available Shipments</h2>
              <button
                onClick={() => fetchAvailableShipments(currentPage)}
                disabled={loadingShipments}
                className="bg-primary text-white px-4 py-2 rounded-xl font-medium flex items-center space-x-2 disabled:opacity-50"
              >
                {loadingShipments ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Truck className="w-5 h-5" />
                    <span>Refresh</span>
                  </>
                )}
              </button>
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
                <div>
                  <label className="block text-text-primary font-medium mb-2">Cargo Type</label>
                  <select
                    value={filters.cargoType}
                    onChange={(e) => setFilters({ ...filters, cargoType: e.target.value })}
                    className="w-full px-4 py-4 bg-input border border-border rounded-xl text-text-primary"
                  >
                    <option value="">All cargo types</option>
                    {cargoOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-text-primary font-medium mb-2">Tonnage (Weight in tons)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={filters.weight}
                    onChange={(e) => setFilters({ ...filters, weight: e.target.value })}
                    className="w-full px-4 py-4 bg-input border border-border rounded-xl text-text-primary"
                    placeholder="e.g., 2.5"
                  />
                </div>
              </div>
              {(filters.pickupState || filters.destinationState || filters.truckType || filters.cargoType || filters.weight) && (
                <button
                  onClick={() => setFilters({ pickupState: "", destinationState: "", truckType: "", cargoType: "", weight: "" })}
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {loadingShipments ? (
              <div className="flex justify-center items-center py-12">
                <Loader className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : availableShipments.length > 0 ? (
              <div className="space-y-4">
                {availableShipments.map((shipment) => (
                  <div key={shipment.id} className="bg-card border-2 border-border rounded-2xl p-5 shadow-sm hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Truck className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <p className="text-text-primary font-bold text-lg">
                            {formatLocation(shipment.pickupState, shipment.pickupLga)} → {formatLocation(shipment.destinationState, shipment.destinationLga)}
                          </p>
                          <p className="text-text-secondary text-sm">#{filterZeroZero(shipment.id)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-success font-bold text-xl">
                          ₦{parseFloat(shipment.estimatedCost || 0).toLocaleString('en-NG')}
                        </p>
                        <p className="text-text-secondary text-xs">
                          {shipment.distance && filterZeroZero(shipment.distance) ? `${filterZeroZero(shipment.distance)}km` : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-text-secondary text-sm">
                        <span className="font-medium">Cargo:</span> {shipment.cargoType} | 
                        <span className="font-medium"> Vehicle:</span> {shipment.truckType} |
                        <span className="font-medium"> Weight:</span> {filterZeroZero(shipment.weight)} tons
                      </p>
                    </div>

                    {hasBidForShipment(shipment.id) ? (
                      <div className="w-full bg-muted/50 text-text-secondary py-3 rounded-xl font-bold text-center flex items-center justify-center space-x-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>Bid Placed - ₦{parseFloat(getBidForShipment(shipment.id)?.bidAmount || 0).toLocaleString('en-NG')}</span>
                      </div>
                    ) : (
                    <button
                      onClick={() => handleOpenBidModal(shipment)}
                      className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
                    >
                      Place Bid
                    </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-muted/30 rounded-2xl p-8 text-center">
                <Truck className="w-12 h-12 text-text-secondary mx-auto mb-2" />
                <p className="text-text-secondary">No available shipments</p>
                <p className="text-text-secondary text-sm mt-2">Try adjusting your filters</p>
              </div>
            )}

            {/* Pagination */}
            {availableShipments.length > 0 && (
              <div className="flex items-center justify-between bg-card border border-border rounded-2xl p-4">
                <div className="text-text-secondary text-sm">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalShipments)} of {totalShipments > 0 ? totalShipments : availableShipments.length} shipments
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || loadingShipments}
                    className="px-4 py-2 bg-primary text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-text-primary font-medium px-4">
                    Page {currentPage || 1} of {totalPages || 1}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage >= totalPages || loadingShipments || availableShipments.length < itemsPerPage}
                    className="px-4 py-2 bg-primary text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                  >
                    Next
                  </button>
                </div>
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
                        try {
                          if (!bankAccountForm.bankAccountNumber || !bankAccountForm.bankCode) {
                            toast.error("Please fill in all bank account details")
                            return
                          }
                          
                          if (!accountVerified) {
                            const proceed = window.confirm("Your account hasn't been verified. Do you want to save anyway? (You can verify it later)")
                            if (!proceed) {
                              return
                            }
                          }
                          
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

      {/* Add Truck Modal - DEPRECATED: Use "Register Driver & Truck" flow instead */}
      {false && showAddTruckModal && (
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

              <div>
                <label className="block text-text-primary font-medium mb-2">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={truckForm.quantity}
                  onChange={(e) => setTruckForm({ ...truckForm, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  placeholder="Number of units"
                  required
                  disabled={submitting}
                />
                <p className="text-text-secondary text-xs mt-1">Multiple trucks will be created with sequential plate numbers</p>
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
                  {drivers.filter(d => d.isActive).map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.driverName} - {driver.phoneNumber}
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
                <label className="block text-text-primary font-medium mb-2">Assign Driver (Optional)</label>
                <select
                  value={truckForm.driverId}
                  onChange={(e) => setTruckForm({ ...truckForm, driverId: e.target.value })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  disabled={submitting}
                >
                  <option value="">No driver assigned</option>
                  {drivers.filter(d => d.isActive).map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.driverName} - {driver.phoneNumber}
                    </option>
                  ))}
                </select>
                <p className="text-text-secondary text-xs mt-1">Select a driver to assign to this truck</p>
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
        <div className="grid grid-cols-5 gap-1 px-2 py-3 overflow-x-auto scrollbar-hide">
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
            onClick={() => {
              setActiveView("drivers")
              fetchDrivers()
            }}
            className={`flex flex-col items-center space-y-1 py-2 rounded-xl transition-colors ${
              activeView === "drivers" ? "bg-primary/10" : ""
            }`}
          >
            <Users className={`w-7 h-7 ${activeView === "drivers" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-xs font-medium ${activeView === "drivers" ? "text-primary" : "text-text-secondary"}`}>
              Drivers
            </span>
          </button>

          <button
            onClick={() => {
              setActiveView("shipments")
              fetchAvailableShipments()
            }}
            className={`flex flex-col items-center space-y-1 py-2 rounded-xl transition-colors ${
              activeView === "shipments" ? "bg-primary/10" : ""
            }`}
          >
            <Package className={`w-7 h-7 ${activeView === "shipments" ? "text-primary" : "text-text-secondary"}`} />
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

      {/* Add Driver Modal - DEPRECATED: Use "Register Driver & Truck" flow instead */}
      {false && showAddDriverModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] flex flex-col">
            <div className="flex-shrink-0 bg-card border-b border-border p-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-text-primary font-bold text-xl">Register Driver</h3>
              <button
                onClick={() => {
                  setShowAddDriverModal(false)
                  resetDriverForm()
                }}
                className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <form onSubmit={handleAddDriver} className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-text-primary font-medium mb-2">Driver Name *</label>
                <input
                  type="text"
                  value={driverForm.driverName}
                  onChange={(e) => setDriverForm({ ...driverForm, driverName: e.target.value })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  placeholder="Enter driver full name"
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
                  placeholder="08012345678"
                  required
                  disabled={submittingDriver}
                />
                <p className="text-text-secondary text-xs mt-1">This will be used as the driver's login username</p>
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2">Driver's License *</label>
                <input
                  type="text"
                  value={driverForm.driverLicense}
                  onChange={(e) => setDriverForm({ ...driverForm, driverLicense: e.target.value })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  placeholder="Enter license number"
                  required
                  disabled={submittingDriver}
                />
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2">Password *</label>
                <input
                  type="password"
                  value={driverForm.password}
                  onChange={(e) => setDriverForm({ ...driverForm, password: e.target.value })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  placeholder="Minimum 6 characters"
                  required
                  disabled={submittingDriver}
                />
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2">Confirm Password *</label>
                <input
                  type="password"
                  value={driverForm.confirmPassword}
                  onChange={(e) => setDriverForm({ ...driverForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  placeholder="Confirm password"
                  required
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
                      Registering...
                    </>
                  ) : (
                    'Register Driver'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Bid Modal */}
      {showBidModal && selectedShipment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-text-primary font-bold text-lg">Place Bid</h3>
              <button
                onClick={() => {
                  setShowBidModal(false)
                  setBidForm({ bidAmount: '', message: '', driverId: '' })
                  setSelectedShipment(null)
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <form onSubmit={handleSubmitBid} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-muted/30 rounded-xl p-4 mb-4">
                <p className="text-text-secondary text-sm mb-2">Shipment Details</p>
                <p className="text-text-primary font-bold">
                  {selectedShipment.pickupState} → {selectedShipment.destinationState}
                </p>
                <p className="text-text-secondary text-sm">#{selectedShipment.id}</p>
                <p className="text-text-secondary text-sm mt-2">
                  Base Cost: <span className="font-bold text-primary">₦{parseFloat(selectedShipment.estimatedCost || 0).toLocaleString('en-NG')}</span>
                </p>
                <p className="text-text-secondary text-xs mt-1">
                  Maximum Bid: ₦{(parseFloat(selectedShipment.estimatedCost || 0) + 200000).toLocaleString('en-NG')}
                </p>
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2">
                  Select Driver * <span className="text-error">*</span>
                </label>
                <select
                  value={bidForm.driverId}
                  onChange={(e) => setBidForm({ ...bidForm, driverId: e.target.value })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-text-primary"
                  required
                  disabled={submittingBid}
                >
                  <option value="">Select a driver</option>
                  {drivers.filter(d => d.isActive).map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.driverName} - {driver.phoneNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text-primary font-medium mb-2">
                  Bid Amount (NGN) <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={bidForm.bidAmount}
                  onChange={(e) => {
                    const formatted = formatNumberWithCommas(e.target.value)
                    setBidForm({ ...bidForm, bidAmount: formatted })
                  }}
                  placeholder={`Minimum: ₦${parseFloat(selectedShipment.estimatedCost || 0).toLocaleString('en-NG')}`}
                  required
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all text-text-primary"
                  disabled={submittingBid}
                />
                <p className="text-text-secondary text-xs mt-1">
                  You can add up to ₦200,000 to the base cost
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
                  disabled={submittingBid}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBidModal(false)
                    setBidForm({ bidAmount: '', message: '', driverId: '' })
                    setSelectedShipment(null)
                  }}
                  className="flex-1 bg-muted text-text-secondary py-3 rounded-xl font-medium hover:bg-muted/80 transition-colors"
                  disabled={submittingBid}
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
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Submit Bid</span>
                    </>
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

      {/* Register Driver & Truck Modal */}
      {showRegisterDriverTruckModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 bg-card border-b border-border p-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-text-primary font-bold text-xl">Register Driver & Truck</h3>
              <button
                onClick={() => {
                  setShowRegisterDriverTruckModal(false)
                  resetDriverTruckForm()
                }}
                className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"
                disabled={submittingDriverTruck}
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <form onSubmit={handleRegisterDriverTruck} className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-6">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      currentStep >= step ? 'bg-primary text-white' : 'bg-muted text-text-secondary'
                    }`}>
                      {step}
                    </div>
                    {step < 4 && (
                      <div className={`flex-1 h-1 mx-2 ${
                        currentStep > step ? 'bg-primary' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Driver Selection/Creation */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-text-primary font-bold text-lg mb-4">Step 1: Driver Information</h4>
                  
                  <div>
                    <label className="block text-text-primary font-medium mb-2">Use Existing Driver</label>
                    <select
                      value={driverTruckForm.driverId}
                      onChange={(e) => {
                        const selectedId = e.target.value
                        setDriverTruckForm({ ...driverTruckForm, driverId: selectedId })
                        if (selectedId) {
                          // Clear new driver fields when selecting existing
                          setDriverTruckForm(prev => ({
                            ...prev,
                            driverId: selectedId,
                            driverName: "",
                            phoneNumber: "",
                            driverLicense: "",
                            password: "",
                            confirmPassword: ""
                          }))
                        }
                      }}
                      className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                      disabled={submittingDriverTruck}
                    >
                      <option value="">Create New Driver</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.driverName} - {driver.phoneNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!driverTruckForm.driverId && (
                    <>
                      <div>
                        <label className="block text-text-primary font-medium mb-2">Driver Name *</label>
                        <input
                          type="text"
                          value={driverTruckForm.driverName}
                          onChange={(e) => setDriverTruckForm({ ...driverTruckForm, driverName: e.target.value })}
                          className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                          placeholder="Enter driver name"
                          required
                          disabled={submittingDriverTruck}
                        />
                      </div>

                      <div>
                        <label className="block text-text-primary font-medium mb-2">Phone Number *</label>
                        <input
                          type="tel"
                          value={driverTruckForm.phoneNumber}
                          onChange={(e) => setDriverTruckForm({ ...driverTruckForm, phoneNumber: e.target.value })}
                          className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                          placeholder="e.g., 08123456789"
                          required
                          disabled={submittingDriverTruck}
                        />
                      </div>

                      <div>
                        <label className="block text-text-primary font-medium mb-2">Driver License *</label>
                        <input
                          type="text"
                          value={driverTruckForm.driverLicense}
                          onChange={(e) => setDriverTruckForm({ ...driverTruckForm, driverLicense: e.target.value })}
                          className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                          placeholder="Enter license number"
                          required
                          disabled={submittingDriverTruck}
                        />
                      </div>

                      <div>
                        <label className="block text-text-primary font-medium mb-2">Password *</label>
                        <input
                          type="password"
                          value={driverTruckForm.password}
                          onChange={(e) => setDriverTruckForm({ ...driverTruckForm, password: e.target.value })}
                          className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                          placeholder="Minimum 6 characters"
                          required
                          disabled={submittingDriverTruck}
                        />
                      </div>

                      <div>
                        <label className="block text-text-primary font-medium mb-2">Confirm Password *</label>
                        <input
                          type="password"
                          value={driverTruckForm.confirmPassword}
                          onChange={(e) => setDriverTruckForm({ ...driverTruckForm, confirmPassword: e.target.value })}
                          className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                          placeholder="Confirm password"
                          required
                          disabled={submittingDriverTruck}
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submittingDriverTruck}
                  >
                    Next: Truck Details
                  </button>
                </div>
              )}

              {/* Step 2: Truck Details */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-text-primary font-bold text-lg mb-4">Step 2: Truck Details</h4>
                  
                  <div>
                    <label className="block text-text-primary font-medium mb-2">Plate Number *</label>
                    <input
                      type="text"
                      value={driverTruckForm.plateNumber}
                      onChange={(e) => setDriverTruckForm({ ...driverTruckForm, plateNumber: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                      placeholder="e.g., ABC 123 XY"
                      required
                      disabled={submittingDriverTruck}
                    />
                  </div>

                  <div>
                    <label className="block text-text-primary font-medium mb-2">Vehicle Type *</label>
                    <select
                      value={driverTruckForm.vehicleType}
                      onChange={(e) => setDriverTruckForm({ ...driverTruckForm, vehicleType: e.target.value })}
                      className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                      required
                      disabled={submittingDriverTruck}
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
                    <label className="block text-text-primary font-medium mb-2">Product (What it usually carries)</label>
                    <input
                      type="text"
                      value={driverTruckForm.product}
                      onChange={(e) => setDriverTruckForm({ ...driverTruckForm, product: e.target.value })}
                      className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                      placeholder="e.g., Cement, Containers, Fuel, General Cargo"
                      disabled={submittingDriverTruck}
                    />
                  </div>

                  <div>
                    <label className="block text-text-primary font-medium mb-2">Description</label>
                    <textarea
                      value={driverTruckForm.description}
                      onChange={(e) => setDriverTruckForm({ ...driverTruckForm, description: e.target.value })}
                      className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                      placeholder="Describe the truck..."
                      rows="3"
                      disabled={submittingDriverTruck}
                    />
                  </div>

                  <div>
                    <label className="block text-text-primary font-medium mb-2">Type of Truck</label>
                    <input
                      type="text"
                      value={driverTruckForm.type}
                      onChange={(e) => setDriverTruckForm({ ...driverTruckForm, type: e.target.value })}
                      className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                      placeholder="e.g., Flatbed, Tanker, Trailer, Tipper"
                      disabled={submittingDriverTruck}
                    />
                  </div>

                  <div>
                    <label className="block text-text-primary font-medium mb-2">Color</label>
                    <input
                      type="text"
                      value={driverTruckForm.color}
                      onChange={(e) => setDriverTruckForm({ ...driverTruckForm, color: e.target.value })}
                      className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                      placeholder="e.g., Red, Blue, White"
                      disabled={submittingDriverTruck}
                    />
                  </div>

                  <div>
                    <label className="block text-text-primary font-medium mb-2">Notes</label>
                    <textarea
                      value={driverTruckForm.notes}
                      onChange={(e) => setDriverTruckForm({ ...driverTruckForm, notes: e.target.value })}
                      className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                      placeholder="Additional notes about the truck..."
                      rows="3"
                      disabled={submittingDriverTruck}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 bg-muted text-text-primary py-3 rounded-xl font-semibold"
                      disabled={submittingDriverTruck}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={submittingDriverTruck}
                    >
                      Next: Upload Image
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Truck Image */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-text-primary font-bold text-lg mb-4">Step 3: Truck Picture</h4>
                  
                  <div>
                    <label className="block text-text-primary font-medium mb-2">Truck Picture (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error("Image size must be less than 5MB")
                            return
                          }
                          setDriverTruckForm({ ...driverTruckForm, truckImage: file })
                        }
                      }}
                      className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                      disabled={submittingDriverTruck}
                    />
                    {driverTruckForm.truckImage && (
                      <div className="mt-2">
                        <p className="text-text-secondary text-sm">Selected: {driverTruckForm.truckImage.name}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="flex-1 bg-muted text-text-primary py-3 rounded-xl font-semibold"
                      disabled={submittingDriverTruck}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={submittingDriverTruck}
                    >
                      Next: Review
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <h4 className="text-text-primary font-bold text-lg mb-4">Step 4: Review & Submit</h4>
                  
                  <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                    <h5 className="font-bold text-text-primary">Driver Information</h5>
                    {driverTruckForm.driverId ? (
                      <p className="text-text-secondary">
                        Using existing driver: {drivers.find(d => d.id === parseInt(driverTruckForm.driverId))?.driverName || 'N/A'}
                      </p>
                    ) : (
                      <>
                        <p className="text-text-secondary">Name: {driverTruckForm.driverName}</p>
                        <p className="text-text-secondary">Phone: {driverTruckForm.phoneNumber}</p>
                        <p className="text-text-secondary">License: {driverTruckForm.driverLicense}</p>
                      </>
                    )}
                  </div>

                  <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                    <h5 className="font-bold text-text-primary">Truck Information</h5>
                    <p className="text-text-secondary">Plate Number: {driverTruckForm.plateNumber}</p>
                    <p className="text-text-secondary">Vehicle Type: {driverTruckForm.vehicleType}</p>
                    {driverTruckForm.product && <p className="text-text-secondary">Product: {driverTruckForm.product}</p>}
                    {driverTruckForm.type && <p className="text-text-secondary">Type: {driverTruckForm.type}</p>}
                    {driverTruckForm.color && <p className="text-text-secondary">Color: {driverTruckForm.color}</p>}
                    {driverTruckForm.description && <p className="text-text-secondary">Description: {driverTruckForm.description}</p>}
                    {driverTruckForm.notes && <p className="text-text-secondary">Notes: {driverTruckForm.notes}</p>}
                    {driverTruckForm.truckImage && <p className="text-text-secondary">Image: {driverTruckForm.truckImage.name}</p>}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="flex-1 bg-muted text-text-primary py-3 rounded-xl font-semibold"
                      disabled={submittingDriverTruck}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      disabled={submittingDriverTruck}
                    >
                      {submittingDriverTruck ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          <span>Registering...</span>
                        </>
                      ) : (
                        <span>Register Driver & Truck</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
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
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
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

