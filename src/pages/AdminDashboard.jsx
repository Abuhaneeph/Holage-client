"use client"

import { useState, useEffect } from "react"
import {
  Shield,
  AlertCircle,
  Users,
  FileText,
  LogOut,
  CheckCircle,
  Clock,
  X,
  MessageSquare,
  Settings,
  User,
  Eye,
  Check,
  XCircle,
  Download,
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  CreditCard,
  Calendar,
} from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useToast } from "../context/ToastContext"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const AdminDashboard = () => {
  const { user, logoutUser, navigateTo } = useAppContext()
  const toast = useToast()
  const [activeView, setActiveView] = useState("home")
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(false)
  const [staffRequests, setStaffRequests] = useState([])
  const [loadingStaffRequests, setLoadingStaffRequests] = useState(false)
  const [staffRequestStatus, setStaffRequestStatus] = useState("pending")
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
  })
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [dieselRate, setDieselRate] = useState(1200)
  const [loadingDieselRate, setLoadingDieselRate] = useState(false)
  const [updatingDieselRate, setUpdatingDieselRate] = useState(false)
  const [dieselRateInput, setDieselRateInput] = useState("")
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [replyMessage, setReplyMessage] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  const [kycSubmissions, setKycSubmissions] = useState([])
  const [loadingKyc, setLoadingKyc] = useState(false)
  const [selectedKycStatus, setSelectedKycStatus] = useState("pending")
  const [selectedKycSubmission, setSelectedKycSubmission] = useState(null)
  const [updatingKycStatus, setUpdatingKycStatus] = useState(false)
  const [shipmentTranscript, setShipmentTranscript] = useState(null)
  const [loadingTranscript, setLoadingTranscript] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const defaultTruckPricing = {
    '10 ton truck': 1285,
    '15 ton truck': 1428,
    '20 ton truck': 1571,
    '30 ton truck': 1714,
    '40 ton truck': 1928,
    '50 ton truck': 2142,
    '60 ton truck/flatbed/Container': 2857
  }
  const [truckPricing, setTruckPricing] = useState(defaultTruckPricing)
  const [truckPricingInputs, setTruckPricingInputs] = useState(defaultTruckPricing)
  const [loadingTruckPricing, setLoadingTruckPricing] = useState(false)
  const [updatingTruckPricing, setUpdatingTruckPricing] = useState({})

  // Fetch all complaints for stats on component mount
  useEffect(() => {
    fetchAllComplaintsForStats()
    fetchDieselRate()
    fetchTruckPricing()
  }, [])

  // Fetch KYC submissions when KYC view is active or status changes
  useEffect(() => {
    if (activeView === "kyc") {
      fetchKycSubmissions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, selectedKycStatus])

  // Fetch staff requests when staff-requests view is active or filter changes
  useEffect(() => {
    if (activeView === "staff-requests") {
      fetchStaffRequests()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, staffRequestStatus])

  // Fetch diesel rate
  const fetchDieselRate = async () => {
    setLoadingDieselRate(true)
    try {
      const response = await fetch(`${API_BASE_URL}/settings/diesel-rate`)
      const data = await response.json()

      if (response.ok && data.success) {
        setDieselRate(data.dieselRate)
        setDieselRateInput(data.dieselRate.toString())
      }
    } catch (error) {
      console.error('Error fetching diesel rate:', error)
    } finally {
      setLoadingDieselRate(false)
    }
  }

  // Update diesel rate
  const handleUpdateDieselRate = async (e) => {
    e.preventDefault()
    
    const rate = parseFloat(dieselRateInput)
    if (isNaN(rate) || rate <= 0) {
      toast.error('Please enter a valid diesel rate (positive number)')
      return
    }

    setUpdatingDieselRate(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/settings/diesel-rate/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ dieselRate: rate })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Diesel rate updated successfully')
        setDieselRate(data.dieselRate)
        setDieselRateInput(data.dieselRate.toString())
      } else {
        toast.error(data.message || 'Failed to update diesel rate')
      }
    } catch (error) {
      console.error('Error updating diesel rate:', error)
      toast.error('Failed to update diesel rate')
    } finally {
      setUpdatingDieselRate(false)
    }
  }

  // Fetch truck pricing
  const fetchTruckPricing = async () => {
    setLoadingTruckPricing(true)
    try {
      const response = await fetch(`${API_BASE_URL}/settings/truck-pricing`)
      const data = await response.json()

      if (response.ok && data.success && data.pricing) {
        setTruckPricing(data.pricing)
        // Initialize input values with fetched pricing
        setTruckPricingInputs(data.pricing)
      } else {
        // If API fails, use default values
        console.warn('Failed to fetch truck pricing, using defaults:', data.message)
        setTruckPricing(defaultTruckPricing)
        setTruckPricingInputs(defaultTruckPricing)
      }
    } catch (error) {
      console.error('Error fetching truck pricing:', error)
      // Use default values on error
      setTruckPricing(defaultTruckPricing)
      setTruckPricingInputs(defaultTruckPricing)
    } finally {
      setLoadingTruckPricing(false)
    }
  }

  // Update truck pricing
  const handleUpdateTruckPricing = async (truckType) => {
    const pricePerKm = truckPricingInputs[truckType]
    const price = parseFloat(pricePerKm)
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price per KM (positive number)')
      return
    }

    if (price === truckPricing[truckType]) {
      return // No change
    }

    setUpdatingTruckPricing(prev => ({ ...prev, [truckType]: true }))
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/settings/truck-pricing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ truckType, pricePerKm: price })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(`${truckType} pricing updated successfully`)
        setTruckPricing(prev => ({ ...prev, [truckType]: price }))
      } else {
        toast.error(data.message || 'Failed to update truck pricing')
        // Revert input on error
        setTruckPricingInputs(prev => ({ ...prev, [truckType]: truckPricing[truckType] }))
      }
    } catch (error) {
      console.error('Error updating truck pricing:', error)
      toast.error('Failed to update truck pricing')
      // Revert input on error
      setTruckPricingInputs(prev => ({ ...prev, [truckType]: truckPricing[truckType] }))
    } finally {
      setUpdatingTruckPricing(prev => ({ ...prev, [truckType]: false }))
    }
  }

  // Fetch filtered complaints when on complaints tab or status changes
  useEffect(() => {
    if (activeView === "complaints") {
      fetchComplaints()
    }
  }, [activeView, selectedStatus])

  // Fetch complaint statistics
  const fetchAllComplaintsForStats = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.error('No auth token found')
        return
      }
      
      // Use dedicated stats endpoint for better performance
      const response = await fetch(`${API_BASE_URL}/complaints/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()

      if (response.ok && data.success) {
        console.log('Fetched complaint stats:', data.stats)
        setStats({
          total: data.stats.total || 0,
          pending: data.stats.pending || 0,
          in_progress: data.stats.in_progress || 0,
          resolved: data.stats.resolved || 0,
        })
      } else {
        console.error('Failed to fetch complaint stats:', data.message || 'Unknown error')
        // Set stats to zero if fetch fails
        setStats({
          total: 0,
          pending: 0,
          in_progress: 0,
          resolved: 0,
        })
      }
    } catch (error) {
      console.error('Error fetching complaint stats:', error)
      // Set stats to zero on error
      setStats({
        total: 0,
        pending: 0,
        in_progress: 0,
        resolved: 0,
      })
    }
  }

  // Fetch complaints for the complaints tab (with optional filtering)
  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const statusParam = selectedStatus !== "all" ? `?status=${selectedStatus}` : ""
      const response = await fetch(`${API_BASE_URL}/complaints${statusParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()

      if (response.ok && data.success) {
        setComplaints(data.complaints || [])
        // Also update stats when fetching complaints (in case new complaints were added)
        fetchAllComplaintsForStats()
      } else {
        toast.error(data.message || 'Failed to fetch complaints')
      }
    } catch (error) {
      console.error('Error fetching complaints:', error)
      toast.error('Error fetching complaints')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (complaintsList) => {
    if (!Array.isArray(complaintsList)) {
      console.error('calculateStats: complaintsList is not an array:', complaintsList)
      setStats({
        total: 0,
        pending: 0,
        in_progress: 0,
        resolved: 0,
      })
      return
    }

    const stats = {
      total: complaintsList.length,
      pending: 0,
      in_progress: 0,
      resolved: 0,
    }

    complaintsList.forEach(complaint => {
      const status = complaint.status?.toLowerCase() || ''
      if (status === 'pending') {
        stats.pending++
      } else if (status === 'in_progress') {
        stats.in_progress++
      } else if (status === 'resolved' || status === 'closed') {
        stats.resolved++
      }
    })

    console.log('Calculated stats:', stats)
    setStats(stats)
  }

  const handleStatusUpdate = async (complaintId, newStatus) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Complaint status updated successfully')
        fetchComplaints()
        fetchAllComplaintsForStats()
        if (selectedComplaint?.id === complaintId) {
          fetchComplaintDetails(complaintId)
        }
      } else {
        toast.error(data.message || 'Failed to update complaint status')
      }
    } catch (error) {
      console.error('Error updating complaint status:', error)
      toast.error('Error updating complaint status')
    }
  }

  const fetchComplaintDetails = async (complaintId) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setSelectedComplaint(data.complaint)
      }
    } catch (error) {
      console.error('Error fetching complaint details:', error)
      toast.error('Error loading complaint details')
    }
  }

  const handleSendReply = async (complaintId) => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a message')
      return
    }

    try {
      setSendingReply(true)
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: replyMessage })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Reply sent successfully')
        setReplyMessage("")
        fetchComplaintDetails(complaintId)
        fetchComplaints()
        fetchAllComplaintsForStats()
      } else {
        toast.error(data.message || 'Failed to send reply')
      }
    } catch (error) {
      console.error('Error sending reply:', error)
      toast.error('Error sending reply')
    } finally {
      setSendingReply(false)
    }
  }

  // KYC Management Functions
  const fetchKycSubmissions = async () => {
    setLoadingKyc(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/kyc/admin/submissions?status=${selectedKycStatus}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setKycSubmissions(data.submissions || [])
      }
    } catch (error) {
      console.error('Error fetching KYC submissions:', error)
      toast.error('Error loading KYC submissions')
    } finally {
      setLoadingKyc(false)
    }
  }

  const fetchKycSubmissionDetails = async (userId) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/kyc/admin/submissions/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setSelectedKycSubmission(data.submission)
      }
    } catch (error) {
      console.error('Error fetching KYC submission details:', error)
      toast.error('Error loading KYC submission details')
    }
  }

  const handleKycStatusUpdate = async (userId, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this KYC submission?`)) {
      return
    }

    try {
      setUpdatingKycStatus(true)
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/kyc/admin/submissions/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`KYC ${status} successfully`)
        fetchKycSubmissions()
        if (selectedKycSubmission?.id === userId) {
          fetchKycSubmissionDetails(userId)
        }
      } else {
        toast.error(data.message || `Failed to ${status} KYC`)
      }
    } catch (error) {
      console.error('Error updating KYC status:', error)
      toast.error('Error updating KYC status')
    } finally {
      setUpdatingKycStatus(false)
    }
  }

  const getKycStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getKycStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'approved':
        return <CheckCircle className="w-4 h-4" />
      case 'rejected':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'trucker':
        return 'Trucker'
      case 'shipper':
        return 'Shipper'
      case 'fleet_manager':
        return 'Fleet Manager'
      default:
        return role
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'in_progress':
        return <MessageSquare className="w-4 h-4" />
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />
      case 'closed':
        return <X className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const fetchShipmentTranscript = async (shipmentId) => {
    setLoadingTranscript(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/shipping/shipments/${shipmentId}/transcript`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (response.ok && data.success) {
        setShipmentTranscript(data)
        setShowTranscript(true)
      } else {
        toast.error(data.message || 'Failed to load shipment transcript')
      }
    } catch (error) {
      console.error('Error fetching shipment transcript:', error)
      toast.error('Error loading shipment transcript')
    } finally {
      setLoadingTranscript(false)
    }
  }

  const fetchStaffRequests = async () => {
    setLoadingStaffRequests(true)
    try {
      const token = localStorage.getItem("authToken")
      const q = staffRequestStatus ? `?status=${staffRequestStatus}` : ""
      const response = await fetch(`${API_BASE_URL}/staff-requests${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setStaffRequests(data.requests || [])
      } else {
        toast.error(data.message || "Failed to fetch staff requests")
      }
    } catch (error) {
      console.error("Error fetching staff requests:", error)
      toast.error("Error fetching staff requests")
    } finally {
      setLoadingStaffRequests(false)
    }
  }

  const approveStaffRequest = async (requestId) => {
    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch(`${API_BASE_URL}/staff-requests/${requestId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success("Approved. Staff account created.")
        fetchStaffRequests()
      } else {
        toast.error(data.message || "Approval failed")
      }
    } catch (error) {
      console.error("Error approving staff request:", error)
      toast.error("Approval failed")
    }
  }

  const rejectStaffRequest = async (requestId) => {
    const reason = window.prompt("Reason for rejection (optional):") || ""
    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch(`${API_BASE_URL}/staff-requests/${requestId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success("Rejected.")
        fetchStaffRequests()
      } else {
        toast.error(data.message || "Rejection failed")
      }
    } catch (error) {
      console.error("Error rejecting staff request:", error)
      toast.error("Rejection failed")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 p-4 sm:p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white/80 text-xs sm:text-sm truncate">Admin Dashboard</p>
              <p className="text-white font-bold text-base sm:text-lg truncate">{user?.fullName || "Admin"}</p>
            </div>
          </div>
          <button
            onClick={logoutUser}
            className="w-9 h-9 sm:w-10 sm:h-10 bg-error/20 rounded-full flex items-center justify-center hover:bg-error/30 transition-colors flex-shrink-0 ml-2"
            title="Logout"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
          <button
            onClick={() => setActiveView("home")}
            className={`px-3 sm:px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeView === "home"
                ? "bg-white text-purple-700"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveView("complaints")}
            className={`px-3 sm:px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeView === "complaints"
                ? "bg-white text-purple-700"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            Complaints
          </button>
          <button
            onClick={() => setActiveView("staff-requests")}
            className={`px-3 sm:px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeView === "staff-requests"
                ? "bg-white text-purple-700"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            Staff Requests
          </button>
          <button
            onClick={() => setActiveView("kyc")}
            className={`px-3 sm:px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeView === "kyc"
                ? "bg-white text-purple-700"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            KYC
          </button>
          <button
            onClick={() => setActiveView("settings")}
            className={`px-3 sm:px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeView === "settings"
                ? "bg-white text-purple-700"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-7xl">
        {activeView === "home" && (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Dashboard Overview</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-text-secondary text-xs sm:text-sm truncate">Total Complaints</p>
                    <p className="text-xl sm:text-2xl font-bold text-text-primary mt-1">{stats.total}</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-text-secondary text-xs sm:text-sm truncate">Pending</p>
                    <p className="text-xl sm:text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-text-secondary text-xs sm:text-sm truncate">In Progress</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">{stats.in_progress}</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-text-secondary text-xs sm:text-sm truncate">Resolved</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">{stats.resolved}</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-border">
              <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-3 sm:mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={() => setActiveView("complaints")}
                  className="flex items-center space-x-3 p-4 bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors text-left"
                >
                  <AlertCircle className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-medium text-text-primary">View Complaints</p>
                    <p className="text-sm text-text-secondary">Manage customer complaints</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Diesel Rate Settings */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-border">
              <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-3 sm:mb-4">System Settings</h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Diesel Cost Per Liter (₦)
                  </label>
                  {loadingDieselRate ? (
                    <div className="flex items-center space-x-2 text-text-secondary">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm">Loading...</span>
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateDieselRate} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={dieselRateInput}
                        onChange={(e) => setDieselRateInput(e.target.value)}
                        className="flex-1 px-3 sm:px-4 py-2 border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                        placeholder="Enter diesel rate"
                        required
                      />
                      <button
                        type="submit"
                        disabled={updatingDieselRate || dieselRateInput === dieselRate.toString()}
                        className="px-4 sm:px-6 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
                      >
                        {updatingDieselRate ? 'Updating...' : 'Update'}
                      </button>
                    </form>
                  )}
                  <p className="text-xs text-text-secondary mt-2">
                    Current rate: ₦{dieselRate.toLocaleString()} per liter
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    This rate is used to calculate shipping costs for all shipments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === "complaints" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Customer Complaints</h2>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 sm:px-4 py-2 bg-white border border-border rounded-xl text-text-primary text-sm sm:text-base w-full sm:w-auto"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : complaints.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-border">
                <AlertCircle className="w-16 h-16 text-text-secondary mx-auto mb-4" />
                <p className="text-text-secondary">No complaints found</p>
              </div>
            ) : selectedComplaint ? (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                  <span>Back to Complaints</span>
                </button>

                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-border">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-text-primary break-words">
                          {selectedComplaint.subject}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getStatusColor(
                            selectedComplaint.status
                          )}`}
                        >
                          {getStatusIcon(selectedComplaint.status)}
                          <span className="capitalize">{selectedComplaint.status.replace('_', ' ')}</span>
                        </span>
                      </div>
                      <p className="text-text-secondary text-sm mb-4">
                        From: <span className="font-medium">{selectedComplaint.userName}</span> ({selectedComplaint.userEmail}) - {selectedComplaint.userRole}
                      </p>
                      {selectedComplaint.shipmentId && (
                        <button
                          onClick={() => fetchShipmentTranscript(selectedComplaint.shipmentId)}
                          disabled={loadingTranscript}
                          className="mt-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm"
                        >
                          {loadingTranscript ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Loading...</span>
                            </>
                          ) : (
                            <>
                              <Package className="w-4 h-4" />
                              <span>View Shipment Journey Transcript</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Conversation Thread */}
                  <div className="space-y-4 mb-6">
                    {/* Original Message */}
                    <div className="bg-muted/30 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">{selectedComplaint.userName}</p>
                            <p className="text-xs text-text-secondary">{new Date(selectedComplaint.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-text-primary">{selectedComplaint.message}</p>
                    </div>

                    {/* Replies */}
                    {selectedComplaint.messages && selectedComplaint.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`rounded-xl p-3 sm:p-4 ${
                          msg.senderRole === 'admin'
                            ? 'bg-primary/10 border border-primary/20 sm:ml-8'
                            : 'bg-muted/30 sm:mr-8'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              msg.senderRole === 'admin' ? 'bg-primary/20' : 'bg-muted'
                            }`}>
                              {msg.senderRole === 'admin' ? (
                                <Shield className="w-4 h-4 text-primary" />
                              ) : (
                                <User className="w-4 h-4 text-text-secondary" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text-primary">
                                {msg.senderName} {msg.senderRole === 'admin' && '(Admin)'}
                              </p>
                              <p className="text-xs text-text-secondary">{new Date(msg.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                        <p className="text-text-primary">{msg.message}</p>
                      </div>
                    ))}
                  </div>

                  {/* Reply Form */}
                  <div className="border-t border-border pt-3 sm:pt-4">
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply..."
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-border rounded-xl text-text-primary bg-input focus:outline-none focus:ring-2 focus:ring-primary mb-3 text-sm sm:text-base"
                      rows={3}
                    />
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <select
                        value={selectedComplaint.status}
                        onChange={(e) => handleStatusUpdate(selectedComplaint.id, e.target.value)}
                        className="px-3 sm:px-4 py-2 border border-border rounded-xl text-text-primary bg-white text-sm sm:text-base w-full sm:w-auto"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      <button
                        onClick={() => handleSendReply(selectedComplaint.id)}
                        disabled={sendingReply || !replyMessage.trim()}
                        className="px-4 sm:px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base w-full sm:w-auto"
                      >
                        {sendingReply ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-4 h-4" />
                            <span>Send Reply</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {complaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-border cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => fetchComplaintDetails(complaint.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-text-primary">
                            {complaint.subject}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getStatusColor(
                              complaint.status
                            )}`}
                          >
                            {getStatusIcon(complaint.status)}
                            <span className="capitalize">{complaint.status.replace('_', ' ')}</span>
                          </span>
                        </div>
                        <p className="text-text-secondary text-sm mb-2">
                          From: <span className="font-medium">{complaint.userName}</span> ({complaint.userEmail}) - {complaint.userRole}
                        </p>
                        <p className="text-text-primary line-clamp-2">{complaint.message}</p>
                        <p className="text-xs text-text-secondary mt-4">
                          Submitted: {new Date(complaint.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === "staff-requests" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Staff Registration Requests</h2>
              <select
                value={staffRequestStatus}
                onChange={(e) => setStaffRequestStatus(e.target.value)}
                className="px-3 sm:px-4 py-2 bg-white border border-border rounded-xl text-text-primary text-sm sm:text-base w-full sm:w-auto"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {loadingStaffRequests ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : staffRequests.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-border">
                <Users className="w-16 h-16 text-text-secondary mx-auto mb-4" />
                <p className="text-text-secondary">No staff requests found</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {staffRequests.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-border"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-lg font-semibold text-text-primary truncate">{r.fullName}</p>
                        <p className="text-sm text-text-secondary break-all">{r.email}</p>
                        <p className="text-xs text-text-secondary mt-2">
                          Status: <span className="font-medium">{r.status}</span> · Submitted:{" "}
                          {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                        </p>
                        {r.rejectionReason && (
                          <p className="text-xs text-error mt-1">Reason: {r.rejectionReason}</p>
                        )}
                      </div>

                      {r.status === "pending" ? (
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <button
                            onClick={() => approveStaffRequest(r.id)}
                            className="px-4 py-2 bg-success text-white rounded-xl font-medium hover:bg-success/90 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectStaffRequest(r.id)}
                            className="px-4 py-2 bg-error text-white rounded-xl font-medium hover:bg-error/90 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-text-secondary">
                          Reviewed: {r.reviewedAt ? new Date(r.reviewedAt).toLocaleString() : "—"}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === "kyc" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary">KYC Submissions</h2>
              <select
                value={selectedKycStatus}
                onChange={(e) => {
                  setSelectedKycStatus(e.target.value)
                  fetchKycSubmissions()
                }}
                className="px-3 sm:px-4 py-2 bg-white border border-border rounded-xl text-text-primary text-sm sm:text-base w-full sm:w-auto"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="">All</option>
              </select>
            </div>

            {loadingKyc ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : selectedKycSubmission ? (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedKycSubmission(null)}
                  className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Submissions</span>
                </button>

                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-border">
                  <div className="flex items-start justify-between mb-4 sm:mb-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                        {selectedKycSubmission.profilePhoto ? (
                          <img
                            src={selectedKycSubmission.profilePhoto}
                            alt="Profile"
                            className="w-16 h-16 rounded-full object-cover border-2 border-border"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-primary" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-text-primary">{selectedKycSubmission.fullName}</h3>
                          <p className="text-text-secondary text-sm">{selectedKycSubmission.email}</p>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 w-fit mt-2 ${getKycStatusColor(selectedKycSubmission.kycStatus)}`}>
                            {getKycStatusIcon(selectedKycSubmission.kycStatus)}
                            <span className="capitalize">{selectedKycSubmission.kycStatus}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Role</p>
                      <p className="text-text-primary font-medium">{getRoleLabel(selectedKycSubmission.role)}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Phone</p>
                      <p className="text-text-primary font-medium">{selectedKycSubmission.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Address</p>
                      <p className="text-text-primary font-medium">{selectedKycSubmission.address || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-sm mb-1">NIN</p>
                      <p className="text-text-primary font-medium">{selectedKycSubmission.nin || 'N/A'}</p>
                    </div>
                    {selectedKycSubmission.role === 'trucker' && (
                      <>
                        <div>
                          <p className="text-text-secondary text-sm mb-1">Plate Number</p>
                          <p className="text-text-primary font-medium">{selectedKycSubmission.plateNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-text-secondary text-sm mb-1">Vehicle Type</p>
                          <p className="text-text-primary font-medium">{selectedKycSubmission.vehicleType || 'N/A'}</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="border-t border-border pt-4 sm:pt-6">
                    <h4 className="text-base sm:text-lg font-semibold text-text-primary mb-3 sm:mb-4">Documents</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {selectedKycSubmission.profilePhoto && (
                        <div className="border border-border rounded-xl p-4">
                          <p className="text-text-secondary text-sm mb-2">Profile Photo</p>
                          <a href={selectedKycSubmission.profilePhoto} target="_blank" rel="noopener noreferrer" className="block">
                            <img src={selectedKycSubmission.profilePhoto} alt="Profile" className="w-full h-48 object-cover rounded-lg mb-2" />
                            <button className="flex items-center space-x-2 text-primary hover:text-primary/80">
                              <Download className="w-4 h-4" />
                              <span className="text-sm">View Full Size</span>
                            </button>
                          </a>
                        </div>
                      )}
                      {selectedKycSubmission.driverLicense && (
                        <div className="border border-border rounded-xl p-4">
                          <p className="text-text-secondary text-sm mb-2">Driver License</p>
                          <a href={selectedKycSubmission.driverLicense} target="_blank" rel="noopener noreferrer" className="block">
                            <img src={selectedKycSubmission.driverLicense} alt="Driver License" className="w-full h-48 object-cover rounded-lg mb-2" />
                            <button className="flex items-center space-x-2 text-primary hover:text-primary/80">
                              <Download className="w-4 h-4" />
                              <span className="text-sm">View Full Size</span>
                            </button>
                          </a>
                        </div>
                      )}
                      {selectedKycSubmission.vehicleReg && (
                        <div className="border border-border rounded-xl p-4">
                          <p className="text-text-secondary text-sm mb-2">Vehicle Registration</p>
                          <a href={selectedKycSubmission.vehicleReg} target="_blank" rel="noopener noreferrer" className="block">
                            <img src={selectedKycSubmission.vehicleReg} alt="Vehicle Registration" className="w-full h-48 object-cover rounded-lg mb-2" />
                            <button className="flex items-center space-x-2 text-primary hover:text-primary/80">
                              <Download className="w-4 h-4" />
                              <span className="text-sm">View Full Size</span>
                            </button>
                          </a>
                        </div>
                      )}
                      {selectedKycSubmission.utilityBill && (
                        <div className="border border-border rounded-xl p-4">
                          <p className="text-text-secondary text-sm mb-2">Utility Bill</p>
                          <a href={selectedKycSubmission.utilityBill} target="_blank" rel="noopener noreferrer" className="block">
                            <img src={selectedKycSubmission.utilityBill} alt="Utility Bill" className="w-full h-48 object-cover rounded-lg mb-2" />
                            <button className="flex items-center space-x-2 text-primary hover:text-primary/80">
                              <Download className="w-4 h-4" />
                              <span className="text-sm">View Full Size</span>
                            </button>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedKycSubmission.kycStatus === 'pending' && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
                      <button
                        onClick={() => handleKycStatusUpdate(selectedKycSubmission.id, 'approved')}
                        disabled={updatingKycStatus}
                        className="flex-1 bg-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
                      >
                        <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleKycStatusUpdate(selectedKycSubmission.id, 'rejected')}
                        disabled={updatingKycStatus}
                        className="flex-1 bg-red-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
                      >
                        <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : kycSubmissions.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-border">
                <FileText className="w-16 h-16 text-text-secondary mx-auto mb-4" />
                <p className="text-text-secondary">No KYC submissions found</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {kycSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-border cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => fetchKycSubmissionDetails(submission.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {submission.profilePhoto ? (
                          <img
                            src={submission.profilePhoto}
                            alt="Profile"
                            className="w-12 h-12 rounded-full object-cover border-2 border-border"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-text-primary mb-1">{submission.fullName}</h3>
                          <p className="text-text-secondary text-sm mb-2">{submission.email}</p>
                          <div className="flex items-center space-x-3">
                            <span className="text-text-secondary text-xs">{getRoleLabel(submission.role)}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 w-fit ${getKycStatusColor(submission.kycStatus)}`}>
                              {getKycStatusIcon(submission.kycStatus)}
                              <span className="capitalize">{submission.kycStatus}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <Eye className="w-5 h-5 text-text-secondary" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === "settings" && (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary">System Settings</h2>

            {/* Diesel Rate Settings */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-border">
              <div className="flex items-start sm:items-center space-x-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-text-primary">Diesel Cost Per Liter</h3>
                  <p className="text-xs sm:text-sm text-text-secondary mt-1">Update the diesel rate used for shipping cost calculations</p>
                </div>
              </div>
              
              {loadingDieselRate ? (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <form onSubmit={handleUpdateDieselRate} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Diesel Rate (₦ per liter)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={dieselRateInput}
                      onChange={(e) => setDieselRateInput(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-border rounded-xl text-text-primary text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter diesel rate"
                      required
                    />
                    <p className="text-xs text-text-secondary mt-2">
                      Current rate: ₦{dieselRate.toLocaleString()} per liter
                    </p>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={updatingDieselRate || dieselRateInput === dieselRate.toString()}
                    className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    {updatingDieselRate ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Update Diesel Rate</span>
                    )}
                  </button>
                  
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-text-primary">
                      <strong>Note:</strong> This rate is used in the shipping cost formula:
                    </p>
                    <p className="text-xs text-text-secondary mt-1 break-words">
                      Total Cost = (Distance × Price per KM) + Base Fee + Additional Fees (Fragile/Insurance)
                    </p>
                  </div>
                </form>
              )}
            </div>

            {/* Truck Pricing Settings */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-border">
              <div className="flex items-start sm:items-center space-x-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-text-primary">Truck Pricing Per KM</h3>
                  <p className="text-xs sm:text-sm text-text-secondary mt-1">Update pricing per kilometer for each truck type</p>
                </div>
              </div>
              
              {loadingTruckPricing ? (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(truckPricing).map(([truckType, price]) => (
                    <div key={truckType} className="border border-border rounded-xl p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <label className="block text-sm font-medium text-text-primary mb-1">
                            {truckType}
                          </label>
                          <p className="text-xs text-text-secondary">
                            Current: ₦{price.toLocaleString()} per KM
                          </p>
                        </div>
                        <div className="flex items-center gap-2 sm:w-64">
                          <input
                            type="number"
                            min="1"
                            step="0.01"
                            value={truckPricingInputs[truckType] !== undefined ? truckPricingInputs[truckType] : price}
                            onChange={(e) => {
                              setTruckPricingInputs(prev => ({
                                ...prev,
                                [truckType]: e.target.value
                              }))
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateTruckPricing(truckType)
                              }
                            }}
                            className="flex-1 px-3 py-2 border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Price per KM"
                          />
                          <button
                            onClick={() => handleUpdateTruckPricing(truckType)}
                            disabled={updatingTruckPricing[truckType] || (truckPricingInputs[truckType] && parseFloat(truckPricingInputs[truckType]) === price)}
                            className="px-3 sm:px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm whitespace-nowrap"
                          >
                            {updatingTruckPricing[truckType] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              'Update'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 sm:p-4 mt-4">
                    <p className="text-xs sm:text-sm text-text-primary">
                      <strong>Note:</strong> Pricing is calculated as: Total Cost = (Distance × Price per KM) + Base Fee + Additional Fees
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Shipment Transcript Modal */}
      {showTranscript && shipmentTranscript && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-border p-4 sm:p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Shipment Journey Transcript</h2>
                <p className="text-sm text-text-secondary mt-1">Shipment #{shipmentTranscript.shipment.id}</p>
              </div>
              <button
                onClick={() => {
                  setShowTranscript(false)
                  setShipmentTranscript(null)
                }}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <X className="w-5 h-5 text-text-primary" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* Shipment Summary */}
              <div className="bg-muted/30 rounded-xl p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Shipment Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Shipper</p>
                    <p className="text-sm font-medium text-text-primary">{shipmentTranscript.shipment.shipper.name}</p>
                  </div>
                  {shipmentTranscript.shipment.trucker && (
                    <div>
                      <p className="text-xs text-text-secondary mb-1">Trucker</p>
                      <p className="text-sm font-medium text-text-primary">{shipmentTranscript.shipment.trucker.name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Pickup Location</p>
                    <p className="text-sm font-medium text-text-primary">
                      {shipmentTranscript.shipment.pickupLocation.lga}, {shipmentTranscript.shipment.pickupLocation.state}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Destination</p>
                    <p className="text-sm font-medium text-text-primary">
                      {shipmentTranscript.shipment.destinationLocation.lga}, {shipmentTranscript.shipment.destinationLocation.state}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Status</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(shipmentTranscript.shipment.status)}`}>
                      {shipmentTranscript.shipment.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Total Cost</p>
                    <p className="text-sm font-medium text-text-primary">₦{parseFloat(shipmentTranscript.shipment.costDetails.estimatedCost || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-primary/10 rounded-xl p-3 sm:p-4">
                  <p className="text-xs text-text-secondary mb-1">Total Bids</p>
                  <p className="text-lg font-bold text-primary">{shipmentTranscript.summary.totalBids}</p>
                </div>
                <div className="bg-green-100 rounded-xl p-3 sm:p-4">
                  <p className="text-xs text-text-secondary mb-1">Total Credited</p>
                  <p className="text-lg font-bold text-green-700">₦{parseFloat(shipmentTranscript.summary.totalCredited || 0).toLocaleString()}</p>
                </div>
                <div className="bg-red-100 rounded-xl p-3 sm:p-4">
                  <p className="text-xs text-text-secondary mb-1">Total Debited</p>
                  <p className="text-lg font-bold text-red-700">₦{parseFloat(shipmentTranscript.summary.totalDebited || 0).toLocaleString()}</p>
                </div>
                <div className="bg-blue-100 rounded-xl p-3 sm:p-4">
                  <p className="text-xs text-text-secondary mb-1">POD Documents</p>
                  <p className="text-lg font-bold text-blue-700">{shipmentTranscript.summary.podDocumentsCount}</p>
                </div>
              </div>

              {/* POD Documents */}
              {shipmentTranscript.podDocuments && shipmentTranscript.podDocuments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">POD Documents</h3>
                  <div className="space-y-4">
                    {shipmentTranscript.podDocuments.map((pod) => (
                      <div key={pod.id} className="bg-muted/30 rounded-xl p-4 border border-border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Package className="w-5 h-5 text-primary" />
                            <h4 className="text-base font-semibold text-text-primary capitalize">
                              {pod.type} POD
                            </h4>
                          </div>
                          <span className="text-xs text-text-secondary">
                            {new Date(pod.createdAt).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          {pod.hasPhotos && (
                            <div>
                              <p className="text-text-secondary mb-1">Photos ({pod.photoCount})</p>
                              <div className="flex flex-wrap gap-2">
                                {pod.photos && pod.photos.map((photo, idx) => (
                                  <a
                                    key={idx}
                                    href={photo.startsWith('http') ? photo : `${API_BASE_URL.replace('/api', '')}${photo}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline text-xs"
                                  >
                                    Photo {idx + 1}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {pod.hasSignature && (
                            <div>
                              <p className="text-text-secondary mb-1">Signature</p>
                              <p className="text-text-primary font-medium">
                                {pod.signatureName || 'N/A'}
                                {pod.signaturePhone && ` (${pod.signaturePhone})`}
                              </p>
                            </div>
                          )}
                          
                          {pod.location && (
                            <div>
                              <p className="text-text-secondary mb-1">Location</p>
                              <p className="text-text-primary">{pod.location}</p>
                            </div>
                          )}
                          
                          {pod.notes && (
                            <div>
                              <p className="text-text-secondary mb-1">Notes</p>
                              <p className="text-text-primary">{pod.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Timeline</h3>
                <div className="space-y-3">
                  {shipmentTranscript.timeline.map((event, index) => (
                    <div key={index} className="flex items-start space-x-3 bg-muted/30 rounded-xl p-4">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-text-primary">{event.description}</p>
                          <p className="text-xs text-text-secondary flex-shrink-0 ml-2">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {event.details && Object.keys(event.details).length > 0 && (
                          <div className="mt-2 text-xs text-text-secondary space-y-1">
                            {Object.entries(event.details).map(([key, value]) => (
                              value && (
                                <p key={key}>
                                  <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span> {String(value)}
                                </p>
                              )
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard

