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
  Navigation,
  Star
} from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useToast } from "../context/ToastContext"
import NotificationCenter from "../components/NotificationCenter"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const FleetManagerDashboard = () => {
  const { user, logoutUser, navigateTo, handleSessionExpired } = useAppContext()
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

  // Wallet state
  const [showFundModal, setShowFundModal] = useState(false)
  const [fundAmount, setFundAmount] = useState("")
  const [fundLoading, setFundLoading] = useState(false)
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
      setAddTruckStep(2)
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem("authToken")
      const formData = new FormData()
      formData.append("plateNumber", truckForm.plateNumber)
      formData.append("vehicleType", truckForm.vehicleType)
      formData.append("capacity", truckForm.capacity)
      if (truckForm.product) formData.append("product", truckForm.product)
      if (truckForm.description) formData.append("description", truckForm.description)
      if (truckForm.type) formData.append("type", truckForm.type)
      if (truckForm.color) formData.append("color", truckForm.color)
      if (truckForm.notes) formData.append("notes", truckForm.notes)
      if (truckForm.driverId) formData.append("driverId", truckForm.driverId)
      if (truckForm.imageFront) formData.append("imageFront", truckForm.imageFront)
      if (truckForm.imageSide) formData.append("imageSide", truckForm.imageSide)
      if (truckForm.imageBack) formData.append("imageBack", truckForm.imageBack)

      const response = await fetch(`${API_BASE_URL}/trucks/with-images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.success) {
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
                            {truck.capacity != null && (
                              <p className="text-text-secondary text-xs mt-0.5">
                                Capacity: {truck.capacity} tons
                              </p>
                            )}
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
                      <p className="text-2xl font-bold text-text-primary">{fleetOverview.length}</p>
                      <p className="text-text-secondary text-xs">Total Drivers</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-success">{fleetOverview.filter(d => d.isActive).length}</p>
                      <p className="text-text-secondary text-xs">Active</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-primary">{fleetOverview.filter(d => d.currentTrip).length}</p>
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
                  setEnrollForm({ driverCodeOrUsername: "" })
                  setShowEnrollDriverModal(true)
                }}
                className="bg-primary text-white px-4 py-2 rounded-xl font-medium flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Enroll Driver</span>
              </button>
            </div>

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
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${driver.isActive ? 'bg-success/10' : 'bg-muted'}`}>
                            <User className={`w-6 h-6 ${driver.isActive ? 'text-success' : 'text-text-secondary'}`} />
                          </div>
                          <div>
                            <p className="text-text-primary font-bold text-lg">{driver.driverName}</p>
                            <p className="text-text-secondary text-sm">{driver.phoneNumber}</p>
                            {driver.driverCode && (
                              <p className="text-primary text-xs font-medium mt-0.5">Code: {driver.driverCode}</p>
                            )}
                            {driverRatings[driver.id]?.count > 0 && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                <span className="text-text-secondary text-xs">{driverRatings[driver.id].average} ({driverRatings[driver.id].count} {driverRatings[driver.id].count === 1 ? "review" : "reviews"})</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleDriverActive(driver.id)}
                          disabled={togglingDriverId === driver.id}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
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
                            <p className="text-text-primary font-bold text-lg">{overview.tripsCompleted}</p>
                            <p className="text-text-secondary text-xs">Completed</p>
                          </div>
                          <div className="text-center">
                            <p className="text-text-primary font-bold text-lg">{overview.currentTrip ? '1' : '0'}</p>
                            <p className="text-text-secondary text-xs">On Trip</p>
                          </div>
                          <div className="text-center">
                            <p className="text-success font-bold text-sm">₦{(overview.totalEarned || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}</p>
                            <p className="text-text-secondary text-xs">Earned</p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1 mb-3">
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
                          onClick={() => handleDeleteDriver(driver.id)}
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
                  const statusInfo = getStatusInfo(trip.shipmentStatus)
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
                      <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-text-secondary">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{trip.driverName || 'Unknown driver'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>{trip.driverPhone || ''}</span>
                        </div>
                        <div>
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
                
              </div>
            </div>

            {/* Identity Verification (NIN & BVN) */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-text-primary font-bold text-lg flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <span>Identity Verification</span>
                </h3>
                {!editingIdentity && (
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
                    <label className="block text-text-primary font-medium mb-2">Carrying Capacity (tons) *</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={truckForm.capacity}
                      onChange={(e) => setTruckForm({ ...truckForm, capacity: e.target.value })}
                      className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                      placeholder="e.g. 30"
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
                      {drivers.filter(d => d.isActive).map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.driverName} - {driver.phoneNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-text-secondary text-sm">Upload front, side, and back views of the truck (optional but recommended).</p>
                  {[
                    { key: "imageFront", label: "Front View", field: "imageFront" },
                    { key: "imageSide", label: "Side View", field: "imageSide" },
                    { key: "imageBack", label: "Back View", field: "imageBack" },
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
                <label className="block text-text-primary font-medium mb-2">Carrying Capacity (tons) *</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={truckForm.capacity}
                  onChange={(e) => setTruckForm({ ...truckForm, capacity: e.target.value })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary"
                  placeholder="e.g. 30"
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
            onClick={() => setActiveView("shipments")}
            className={`flex flex-col items-center space-y-1 py-2 rounded-xl transition-colors ${
              activeView === "shipments" ? "bg-primary/10" : ""
            }`}
          >
            <Package className={`w-7 h-7 ${activeView === "shipments" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-xs font-medium ${activeView === "shipments" ? "text-primary" : "text-text-secondary"}`}>
              Trips
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

      {/* Register Driver & Truck Modal — deprecated; use Enroll Driver + Add Truck */}
      {false && showRegisterDriverTruckModal && (
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

