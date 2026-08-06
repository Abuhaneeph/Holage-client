"use client"

import { useState, useEffect } from "react"
import {
  Shield,
  AlertCircle,
  Users,
  FileText,
  LogOut,
  RefreshCw,
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

// CAC Certificate, Utility Bill, Driver's License, and Vehicle Registration all accept PDF
// uploads (not just images) — an <img> tag can't render a PDF, so those need a distinct preview.
const isPdfUrl = (url) => typeof url === 'string' && /\.pdf(\?|$)/i.test(url)

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
  const [fetchingNin, setFetchingNin] = useState(false)
  const [fetchingBvn, setFetchingBvn] = useState(false)
  const [confirmingNin, setConfirmingNin] = useState(false)
  const [confirmingBvn, setConfirmingBvn] = useState(false)
  const [confirmingCac, setConfirmingCac] = useState(false)
  const [ninFetchedData, setNinFetchedData] = useState(null)
  const [bvnFetchedData, setBvnFetchedData] = useState(null)
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

  // Data Archive state
  const [archiveTab, setArchiveTab] = useState('shipments')
  const [archiveFilters, setArchiveFilters] = useState({ dateFrom: '', dateTo: '' })
  const [archiveSummary, setArchiveSummary] = useState(null)
  const [archiveShipments, setArchiveShipments] = useState([])
  const [archiveShipmentsPagination, setArchiveShipmentsPagination] = useState(null)
  const [archiveShipmentsPage, setArchiveShipmentsPage] = useState(1)
  const [archiveTransactions, setArchiveTransactions] = useState([])
  const [archiveTransactionsPagination, setArchiveTransactionsPagination] = useState(null)
  const [archiveTransactionsPage, setArchiveTransactionsPage] = useState(1)
  const [loadingArchive, setLoadingArchive] = useState(false)
  const [agents, setAgents] = useState([])
  const [loadingAgents, setLoadingAgents] = useState(false)
  const [agentSearchQuery, setAgentSearchQuery] = useState("")
  const [refreshingAll, setRefreshingAll] = useState(false)

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

  // Fetch archive data when the archive view is active, or its page/filters change
  useEffect(() => {
    if (activeView === "archive") {
      fetchArchiveData(archiveShipmentsPage, archiveTransactionsPage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, archiveShipmentsPage, archiveTransactionsPage])

  // Fetch the agent directory when the agents view is active
  useEffect(() => {
    if (activeView === "agents") {
      fetchAgentDirectory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView])

  const fetchAgentDirectory = async () => {
    setLoadingAgents(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/agents/admin/directory`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (response.ok && data.agents) {
        setAgents(data.agents)
      } else {
        toast.error(data.message || 'Failed to load agent directory')
      }
    } catch (error) {
      console.error('Error fetching agent directory:', error)
      toast.error('Error loading agent directory')
    } finally {
      setLoadingAgents(false)
    }
  }

  const fetchArchiveData = async (shipmentsPage = archiveShipmentsPage, transactionsPage = archiveTransactionsPage) => {
    setLoadingArchive(true)
    try {
      const token = localStorage.getItem('authToken')
      const dateParams = new URLSearchParams()
      if (archiveFilters.dateFrom) dateParams.append('dateFrom', archiveFilters.dateFrom)
      if (archiveFilters.dateTo) dateParams.append('dateTo', archiveFilters.dateTo)

      const [summaryRes, shipmentsRes, transactionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/archive/summary?${dateParams.toString()}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/archive/shipments?${dateParams.toString()}&page=${shipmentsPage}&limit=20`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/archive/transactions?${dateParams.toString()}&page=${transactionsPage}&limit=20`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      const summaryData = await summaryRes.json()
      const shipmentsData = await shipmentsRes.json()
      const transactionsData = await transactionsRes.json()

      if (summaryRes.ok && summaryData.success) setArchiveSummary(summaryData.summary)
      if (shipmentsRes.ok && shipmentsData.success) {
        setArchiveShipments(shipmentsData.shipments)
        setArchiveShipmentsPagination(shipmentsData.pagination)
      }
      if (transactionsRes.ok && transactionsData.success) {
        setArchiveTransactions(transactionsData.transactions)
        setArchiveTransactionsPagination(transactionsData.pagination)
      }
    } catch (error) {
      console.error('Error fetching archive data:', error)
      toast.error('Failed to load archive data')
    } finally {
      setLoadingArchive(false)
    }
  }

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

  const handleFetchNin = async (userId) => {
    setFetchingNin(true)
    setNinFetchedData(null)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/kyc/admin/submissions/${userId}/fetch-nin`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setNinFetchedData(data.data)
      } else {
        toast.error(data.message || 'NIN lookup failed')
      }
    } catch (error) {
      console.error('Error fetching NIN:', error)
      toast.error('Error fetching NIN data')
    } finally {
      setFetchingNin(false)
    }
  }

  const handleConfirmNin = async (userId) => {
    setConfirmingNin(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/kyc/admin/submissions/${userId}/confirm-nin`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: ninFetchedData })
      })
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('NIN confirmed and marked as verified')
        setNinFetchedData(null)
        fetchKycSubmissionDetails(userId)
      } else {
        toast.error(data.message || 'Failed to confirm NIN')
      }
    } catch (error) {
      console.error('Error confirming NIN:', error)
      toast.error('Error confirming NIN')
    } finally {
      setConfirmingNin(false)
    }
  }

  const handleConfirmCac = async (userId) => {
    setConfirmingCac(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/kyc/admin/submissions/${userId}/confirm-cac`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('CAC verified successfully')
        fetchKycSubmissionDetails(userId)
      } else {
        toast.error(data.message || 'Failed to confirm CAC')
      }
    } catch (error) {
      console.error('Error confirming CAC:', error)
      toast.error('Error confirming CAC')
    } finally {
      setConfirmingCac(false)
    }
  }

  const handleFetchBvn = async (userId) => {
    setFetchingBvn(true)
    setBvnFetchedData(null)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/kyc/admin/submissions/${userId}/fetch-bvn`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setBvnFetchedData(data.data)
      } else {
        toast.error(data.message || 'BVN lookup failed')
      }
    } catch (error) {
      console.error('Error fetching BVN:', error)
      toast.error('Error fetching BVN data')
    } finally {
      setFetchingBvn(false)
    }
  }

  const handleConfirmBvn = async (userId) => {
    setConfirmingBvn(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/kyc/admin/submissions/${userId}/confirm-bvn`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: bvnFetchedData })
      })
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('BVN confirmed and marked as verified')
        setBvnFetchedData(null)
        fetchKycSubmissionDetails(userId)
      } else {
        toast.error(data.message || 'Failed to confirm BVN')
      }
    } catch (error) {
      console.error('Error confirming BVN:', error)
      toast.error('Error confirming BVN')
    } finally {
      setConfirmingBvn(false)
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

  const getMissingDocuments = (submission) => {
    const missing = []
    if (!submission.profilePhoto) missing.push('Profile Photo')
    if (!submission.utilityBill) missing.push('Utility Bill')
    if (submission.role === 'trucker') {
      if (!submission.driverLicense) missing.push('Driver License')
      if (!submission.vehicleReg) missing.push('Vehicle Registration')
    }
    if (submission.role === 'fleet_manager') {
      if (!submission.cacNumber) missing.push('CAC Number')
      if (!submission.cacCertificateUrl) missing.push('CAC Certificate')
    }
    return missing
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

  // Systemic refresh — always visible in the header, reloads whichever view is currently
  // active (previously no admin view had any refresh affordance at all).
  const handleGlobalRefresh = async () => {
    setRefreshingAll(true)
    try {
      if (activeView === "complaints") {
        await Promise.all([fetchComplaints(), fetchAllComplaintsForStats()])
      } else if (activeView === "kyc") {
        await fetchKycSubmissions()
      } else if (activeView === "staff-requests") {
        await fetchStaffRequests()
      } else if (activeView === "archive") {
        await fetchArchiveData(archiveShipmentsPage, archiveTransactionsPage)
      } else if (activeView === "agents") {
        await fetchAgentDirectory()
      } else {
        await fetchAllComplaintsForStats()
      }
      toast.success('Refreshed')
    } catch (error) {
      console.error('Error during global refresh:', error)
    } finally {
      setRefreshingAll(false)
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
            onClick={handleGlobalRefresh}
            disabled={refreshingAll}
            className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0 ml-2 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 text-white ${refreshingAll ? 'animate-spin' : ''}`} />
          </button>
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
          <button
            onClick={() => setActiveView("archive")}
            className={`px-3 sm:px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeView === "archive"
                ? "bg-white text-purple-700"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            Archive
          </button>
          <button
            onClick={() => setActiveView("agents")}
            className={`px-3 sm:px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeView === "agents"
                ? "bg-white text-purple-700"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            Agents
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
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-text-primary font-medium">{selectedKycSubmission.nin || 'N/A'}</p>
                        {!!selectedKycSubmission.ninVerified ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full border border-green-200">
                            <CheckCircle className="w-3 h-3" /> Verified
                          </span>
                        ) : selectedKycSubmission.nin && !ninFetchedData ? (
                          <button
                            onClick={() => handleFetchNin(selectedKycSubmission.id)}
                            disabled={fetchingNin}
                            className="px-3 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full border border-blue-200 hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {fetchingNin ? 'Fetching...' : 'Fetch NIN Data'}
                          </button>
                        ) : null}
                      </div>
                      {!!selectedKycSubmission.ninVerified && selectedKycSubmission.ninVerificationData && (() => {
                        const raw = typeof selectedKycSubmission.ninVerificationData === 'string'
                          ? JSON.parse(selectedKycSubmission.ninVerificationData)
                          : selectedKycSubmission.ninVerificationData
                        const d = raw?.data?.data || raw?.data || raw
                        const skip = new Set(['nin', 'bvn', 'id', 'photo', 'signature', 'status', 'base64image', 'watchlisted', 'enrollmentbank', 'levelofaccount', 'registrationdate'])
                        const entries = Object.entries(d).filter(([k, v]) => v && !skip.has(k.toLowerCase()) && String(v).length < 200)
                        return (
                          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 space-y-1">
                            {entries.length > 0 ? entries.map(([key, val]) => (
                              <p key={key}>
                                <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> {String(val)}
                              </p>
                            )) : <p>Verified</p>}
                          </div>
                        )
                      })()}
                      {ninFetchedData && !selectedKycSubmission.ninVerified && (() => {
                        const skip = new Set(['nin', 'bvn', 'id', 'photo', 'signature', 'status', 'base64image', 'watchlisted', 'enrollmentbank', 'levelofaccount', 'registrationdate'])
                        const entries = Object.entries(ninFetchedData).filter(([k, v]) => v && !skip.has(k.toLowerCase()) && String(v).length < 200)
                        return (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                            <p className="font-semibold text-blue-800 mb-1">NIN Data — does this match?</p>
                            {entries.map(([key, val]) => (
                              <p key={key}>
                                <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> {String(val)}
                              </p>
                            ))}
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleConfirmNin(selectedKycSubmission.id)}
                                disabled={confirmingNin}
                                className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                              >
                                {confirmingNin ? 'Confirming...' : 'Confirm Verified'}
                              </button>
                              <button
                                onClick={() => setNinFetchedData(null)}
                                className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200 transition-colors"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                    <div>
                      <p className="text-text-secondary text-sm mb-1">BVN</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-text-primary font-medium">{selectedKycSubmission.bvn || 'N/A'}</p>
                        {!!selectedKycSubmission.bvnVerified ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full border border-green-200">
                            <CheckCircle className="w-3 h-3" /> Verified
                          </span>
                        ) : selectedKycSubmission.bvn && !bvnFetchedData ? (
                          <button
                            onClick={() => handleFetchBvn(selectedKycSubmission.id)}
                            disabled={fetchingBvn}
                            className="px-3 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full border border-blue-200 hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {fetchingBvn ? 'Fetching...' : 'Fetch BVN Data'}
                          </button>
                        ) : null}
                      </div>
                      {!!selectedKycSubmission.bvnVerified && selectedKycSubmission.bvnVerificationData && (() => {
                        const raw = typeof selectedKycSubmission.bvnVerificationData === 'string'
                          ? JSON.parse(selectedKycSubmission.bvnVerificationData)
                          : selectedKycSubmission.bvnVerificationData
                        const d = raw?.data?.data || raw?.data || raw
                        const skip = new Set(['nin', 'bvn', 'id', 'photo', 'signature', 'status', 'base64image', 'watchlisted', 'enrollmentbank', 'levelofaccount', 'registrationdate'])
                        const entries = Object.entries(d).filter(([k, v]) => v && !skip.has(k.toLowerCase()) && String(v).length < 200)
                        return (
                          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 space-y-1">
                            {entries.length > 0 ? entries.map(([key, val]) => (
                              <p key={key}>
                                <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> {String(val)}
                              </p>
                            )) : <p>Verified</p>}
                          </div>
                        )
                      })()}
                      {bvnFetchedData && !selectedKycSubmission.bvnVerified && (() => {
                        const skip = new Set(['nin', 'bvn', 'id', 'photo', 'signature', 'status', 'base64image', 'watchlisted', 'enrollmentbank', 'levelofaccount', 'registrationdate'])
                        const entries = Object.entries(bvnFetchedData).filter(([k, v]) => v && !skip.has(k.toLowerCase()) && String(v).length < 200)
                        return (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                            <p className="font-semibold text-blue-800 mb-1">BVN Data — does this match?</p>
                            {entries.map(([key, val]) => (
                              <p key={key}>
                                <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> {String(val)}
                              </p>
                            ))}
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleConfirmBvn(selectedKycSubmission.id)}
                                disabled={confirmingBvn}
                                className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                              >
                                {confirmingBvn ? 'Confirming...' : 'Confirm Verified'}
                              </button>
                              <button
                                onClick={() => setBvnFetchedData(null)}
                                className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200 transition-colors"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        )
                      })()}
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
                    {selectedKycSubmission.role === 'fleet_manager' && (
                      <>
                        <div>
                          <p className="text-text-secondary text-sm mb-1">CAC Registration Number</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-text-primary font-medium">{selectedKycSubmission.cacNumber || 'N/A'}</p>
                            {!!selectedKycSubmission.cacVerified ? (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full border border-green-200">
                                <CheckCircle className="w-3 h-3" /> Verified
                              </span>
                            ) : (selectedKycSubmission.cacNumber || selectedKycSubmission.cacCertificateUrl) ? (
                              <button
                                onClick={() => handleConfirmCac(selectedKycSubmission.id)}
                                disabled={confirmingCac}
                                className="px-3 py-0.5 bg-green-500 text-white text-xs rounded-full hover:bg-green-600 transition-colors disabled:opacity-50"
                              >
                                {confirmingCac ? 'Confirming...' : 'Verify CAC'}
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <div>
                          <p className="text-text-secondary text-sm mb-1">TIN</p>
                          <p className="text-text-primary font-medium">{selectedKycSubmission.tin || 'N/A'}</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="border-t border-border pt-4 sm:pt-6">
                    <h4 className="text-base sm:text-lg font-semibold text-text-primary mb-3 sm:mb-4">Documents</h4>

                    {getMissingDocuments(selectedKycSubmission).length > 0 && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-yellow-800">Missing Required Documents</p>
                          <p className="text-xs text-yellow-700 mt-0.5">
                            {getMissingDocuments(selectedKycSubmission).join(' · ')}
                          </p>
                          <p className="text-xs text-yellow-600 mt-1">Approval is disabled until all required documents are uploaded.</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {selectedKycSubmission.profilePhoto ? (
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
                      ) : (
                        <div className="border border-dashed border-yellow-300 bg-yellow-50 rounded-xl p-4 flex flex-col items-center justify-center h-32">
                          <AlertCircle className="w-6 h-6 text-yellow-500 mb-1" />
                          <p className="text-yellow-700 text-sm font-medium">Profile Photo</p>
                          <p className="text-yellow-600 text-xs">Not uploaded</p>
                        </div>
                      )}
                      {selectedKycSubmission.role === 'trucker' && (
                        selectedKycSubmission.driverLicense ? (
                          <div className="border border-border rounded-xl p-4">
                            <p className="text-text-secondary text-sm mb-2">Driver License</p>
                            <a href={selectedKycSubmission.driverLicense} target="_blank" rel="noopener noreferrer" className="block">
                              {isPdfUrl(selectedKycSubmission.driverLicense) ? (
                                <div className="w-full h-48 rounded-lg mb-2 bg-muted/50 border border-border flex flex-col items-center justify-center gap-2">
                                  <FileText className="w-10 h-10 text-text-secondary" />
                                  <span className="text-text-secondary text-xs">PDF document</span>
                                </div>
                              ) : (
                                <img src={selectedKycSubmission.driverLicense} alt="Driver License" className="w-full h-48 object-cover rounded-lg mb-2" />
                              )}
                              <button className="flex items-center space-x-2 text-primary hover:text-primary/80">
                                <Download className="w-4 h-4" />
                                <span className="text-sm">{isPdfUrl(selectedKycSubmission.driverLicense) ? 'Open PDF' : 'View Full Size'}</span>
                              </button>
                            </a>
                          </div>
                        ) : (
                          <div className="border border-dashed border-yellow-300 bg-yellow-50 rounded-xl p-4 flex flex-col items-center justify-center h-32">
                            <AlertCircle className="w-6 h-6 text-yellow-500 mb-1" />
                            <p className="text-yellow-700 text-sm font-medium">Driver License</p>
                            <p className="text-yellow-600 text-xs">Not uploaded</p>
                          </div>
                        )
                      )}
                      {selectedKycSubmission.role === 'trucker' && (
                        selectedKycSubmission.vehicleReg ? (
                          <div className="border border-border rounded-xl p-4">
                            <p className="text-text-secondary text-sm mb-2">Vehicle Registration</p>
                            <a href={selectedKycSubmission.vehicleReg} target="_blank" rel="noopener noreferrer" className="block">
                              {isPdfUrl(selectedKycSubmission.vehicleReg) ? (
                                <div className="w-full h-48 rounded-lg mb-2 bg-muted/50 border border-border flex flex-col items-center justify-center gap-2">
                                  <FileText className="w-10 h-10 text-text-secondary" />
                                  <span className="text-text-secondary text-xs">PDF document</span>
                                </div>
                              ) : (
                                <img src={selectedKycSubmission.vehicleReg} alt="Vehicle Registration" className="w-full h-48 object-cover rounded-lg mb-2" />
                              )}
                              <button className="flex items-center space-x-2 text-primary hover:text-primary/80">
                                <Download className="w-4 h-4" />
                                <span className="text-sm">{isPdfUrl(selectedKycSubmission.vehicleReg) ? 'Open PDF' : 'View Full Size'}</span>
                              </button>
                            </a>
                          </div>
                        ) : (
                          <div className="border border-dashed border-yellow-300 bg-yellow-50 rounded-xl p-4 flex flex-col items-center justify-center h-32">
                            <AlertCircle className="w-6 h-6 text-yellow-500 mb-1" />
                            <p className="text-yellow-700 text-sm font-medium">Vehicle Registration</p>
                            <p className="text-yellow-600 text-xs">Not uploaded</p>
                          </div>
                        )
                      )}
                      {selectedKycSubmission.role === 'fleet_manager' && (
                        selectedKycSubmission.cacCertificateUrl ? (
                          <div className="border border-border rounded-xl p-4">
                            <p className="text-text-secondary text-sm mb-2">CAC Certificate</p>
                            <a href={selectedKycSubmission.cacCertificateUrl} target="_blank" rel="noopener noreferrer" className="block">
                              {isPdfUrl(selectedKycSubmission.cacCertificateUrl) ? (
                                <div className="w-full h-48 rounded-lg mb-2 bg-muted/50 border border-border flex flex-col items-center justify-center gap-2">
                                  <FileText className="w-10 h-10 text-text-secondary" />
                                  <span className="text-text-secondary text-xs">PDF document</span>
                                </div>
                              ) : (
                                <img src={selectedKycSubmission.cacCertificateUrl} alt="CAC Certificate" className="w-full h-48 object-cover rounded-lg mb-2" />
                              )}
                              <button className="flex items-center space-x-2 text-primary hover:text-primary/80">
                                <Download className="w-4 h-4" />
                                <span className="text-sm">{isPdfUrl(selectedKycSubmission.cacCertificateUrl) ? 'Open PDF' : 'View Full Size'}</span>
                              </button>
                            </a>
                          </div>
                        ) : (
                          <div className="border border-dashed border-yellow-300 bg-yellow-50 rounded-xl p-4 flex flex-col items-center justify-center h-32">
                            <AlertCircle className="w-6 h-6 text-yellow-500 mb-1" />
                            <p className="text-yellow-700 text-sm font-medium">CAC Certificate</p>
                            <p className="text-yellow-600 text-xs">Not uploaded</p>
                          </div>
                        )
                      )}
                      {selectedKycSubmission.utilityBill ? (
                        <div className="border border-border rounded-xl p-4">
                          <p className="text-text-secondary text-sm mb-2">Utility Bill</p>
                          <a href={selectedKycSubmission.utilityBill} target="_blank" rel="noopener noreferrer" className="block">
                            {isPdfUrl(selectedKycSubmission.utilityBill) ? (
                              <div className="w-full h-48 rounded-lg mb-2 bg-muted/50 border border-border flex flex-col items-center justify-center gap-2">
                                <FileText className="w-10 h-10 text-text-secondary" />
                                <span className="text-text-secondary text-xs">PDF document</span>
                              </div>
                            ) : (
                              <img src={selectedKycSubmission.utilityBill} alt="Utility Bill" className="w-full h-48 object-cover rounded-lg mb-2" />
                            )}
                            <button className="flex items-center space-x-2 text-primary hover:text-primary/80">
                              <Download className="w-4 h-4" />
                              <span className="text-sm">{isPdfUrl(selectedKycSubmission.utilityBill) ? 'Open PDF' : 'View Full Size'}</span>
                            </button>
                          </a>
                        </div>
                      ) : (
                        <div className="border border-dashed border-yellow-300 bg-yellow-50 rounded-xl p-4 flex flex-col items-center justify-center h-32">
                          <AlertCircle className="w-6 h-6 text-yellow-500 mb-1" />
                          <p className="text-yellow-700 text-sm font-medium">Utility Bill</p>
                          <p className="text-yellow-600 text-xs">Not uploaded</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedKycSubmission.kycStatus === 'pending' && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
                      <button
                        onClick={() => handleKycStatusUpdate(selectedKycSubmission.id, 'approved')}
                        disabled={updatingKycStatus || getMissingDocuments(selectedKycSubmission).length > 0}
                        title={getMissingDocuments(selectedKycSubmission).length > 0 ? `Missing: ${getMissingDocuments(selectedKycSubmission).join(', ')}` : ''}
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
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-text-secondary text-xs">{getRoleLabel(submission.role)}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 w-fit ${getKycStatusColor(submission.kycStatus)}`}>
                              {getKycStatusIcon(submission.kycStatus)}
                              <span className="capitalize">{submission.kycStatus}</span>
                            </span>
                            {!!submission.ninVerified ? (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full border border-green-200">
                                <CheckCircle className="w-3 h-3" /> NIN
                              </span>
                            ) : null}
                            {!!submission.bvnVerified ? (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full border border-green-200">
                                <CheckCircle className="w-3 h-3" /> BVN
                              </span>
                            ) : null}
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
                      Total Cost = (Distance × Price per KM) + Base Fee + Insurance Fee (if selected)
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

        {activeView === "archive" && (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Data Archive</h2>
            <p className="text-text-secondary text-sm">
              Historical shipments and wallet activity across shippers, truckers, fleet managers, and drivers — for review and forecasting.
            </p>

            {/* Summary stats */}
            {archiveSummary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 shadow-sm border border-border">
                  <p className="text-text-secondary text-xs sm:text-sm">Total Shipments</p>
                  <p className="text-xl sm:text-2xl font-bold text-text-primary mt-1">{archiveSummary.shipments.total}</p>
                </div>
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 shadow-sm border border-border">
                  <p className="text-text-secondary text-xs sm:text-sm">Completed</p>
                  <p className="text-xl sm:text-2xl font-bold text-success mt-1">{archiveSummary.shipments.completed}</p>
                </div>
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 shadow-sm border border-border">
                  <p className="text-text-secondary text-xs sm:text-sm">Cancelled</p>
                  <p className="text-xl sm:text-2xl font-bold text-error mt-1">{archiveSummary.shipments.cancelled}</p>
                </div>
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 shadow-sm border border-border">
                  <p className="text-text-secondary text-xs sm:text-sm">Gross Shipment Value</p>
                  <p className="text-lg sm:text-xl font-bold text-primary mt-1">₦{archiveSummary.shipments.completedRevenue.toLocaleString('en-NG')}</p>
                </div>
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 shadow-sm border border-border">
                  <p className="text-text-secondary text-xs sm:text-sm">Platform Earnings (5% Fee)</p>
                  <p className="text-lg sm:text-xl font-bold text-success mt-1">₦{(archiveSummary.platformEarnings || 0).toLocaleString('en-NG')}</p>
                </div>
                {Object.entries(archiveSummary.usersByRole).map(([role, count]) => (
                  <div key={role} className="bg-white rounded-xl sm:rounded-2xl p-4 shadow-sm border border-border">
                    <p className="text-text-secondary text-xs sm:text-sm capitalize">{role.replace('_', ' ')}s</p>
                    <p className="text-xl sm:text-2xl font-bold text-text-primary mt-1">{count}</p>
                  </div>
                ))}
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 shadow-sm border border-border">
                  <p className="text-text-secondary text-xs sm:text-sm">Drivers</p>
                  <p className="text-xl sm:text-2xl font-bold text-text-primary mt-1">{archiveSummary.driverCount}</p>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 shadow-sm border border-border flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">From</label>
                <input
                  type="date"
                  value={archiveFilters.dateFrom}
                  onChange={(e) => setArchiveFilters({ ...archiveFilters, dateFrom: e.target.value })}
                  className="px-3 py-2 border border-border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">To</label>
                <input
                  type="date"
                  value={archiveFilters.dateTo}
                  onChange={(e) => setArchiveFilters({ ...archiveFilters, dateTo: e.target.value })}
                  className="px-3 py-2 border border-border rounded-lg text-sm"
                />
              </div>
              <button
                onClick={() => { setArchiveShipmentsPage(1); setArchiveTransactionsPage(1); fetchArchiveData(1, 1) }}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
              >
                Apply Filters
              </button>
              {(archiveFilters.dateFrom || archiveFilters.dateTo) && (
                <button
                  onClick={() => { setArchiveFilters({ dateFrom: '', dateTo: '' }); setArchiveShipmentsPage(1); setArchiveTransactionsPage(1) }}
                  className="px-4 py-2 bg-muted text-text-secondary rounded-lg text-sm font-medium hover:bg-muted/80"
                >
                  Clear
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setArchiveTab('shipments')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${archiveTab === 'shipments' ? 'bg-primary text-white' : 'bg-muted text-text-secondary'}`}
                >
                  Shipments
                </button>
                <button
                  onClick={() => setArchiveTab('transactions')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${archiveTab === 'transactions' ? 'bg-primary text-white' : 'bg-muted text-text-secondary'}`}
                >
                  Transactions
                </button>
              </div>
            </div>

            {loadingArchive ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : archiveTab === 'shipments' ? (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-text-secondary text-xs uppercase">
                      <th className="p-3">Date</th>
                      <th className="p-3">Route</th>
                      <th className="p-3">Shipper</th>
                      <th className="p-3">Carrier</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Cost</th>
                      <th className="p-3">Declared Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archiveShipments.map((s) => (
                      <tr key={s.id} className="border-b border-border/50 last:border-0">
                        <td className="p-3 whitespace-nowrap">{new Date(s.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 whitespace-nowrap">{s.pickupState} → {s.destinationState}</td>
                        <td className="p-3">{s.shipperName || 'N/A'}</td>
                        <td className="p-3">{s.carrierName ? `${s.carrierName} (${s.carrierRole})` : 'Unassigned'}</td>
                        <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(s.status)}`}>{s.status}</span></td>
                        <td className="p-3 whitespace-nowrap">₦{parseFloat(s.estimatedCost || 0).toLocaleString('en-NG')}</td>
                        <td className="p-3 whitespace-nowrap">{s.declaredValue ? `₦${parseFloat(s.declaredValue).toLocaleString('en-NG')}` : '—'}</td>
                      </tr>
                    ))}
                    {archiveShipments.length === 0 && (
                      <tr><td colSpan={7} className="p-6 text-center text-text-secondary">No shipments found for this range.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-text-secondary text-xs uppercase">
                      <th className="p-3">Date</th>
                      <th className="p-3">Party</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archiveTransactions.map((t) => (
                      <tr key={`${t.partyType}-${t.id}`} className="border-b border-border/50 last:border-0">
                        <td className="p-3 whitespace-nowrap">{new Date(t.createdAt).toLocaleDateString()}</td>
                        <td className="p-3">{t.partyName || 'N/A'} <span className="text-text-secondary text-xs">({t.partyRole})</span></td>
                        <td className="p-3 capitalize">{t.type}</td>
                        <td className={`p-3 whitespace-nowrap font-medium ${t.type === 'credit' ? 'text-success' : 'text-error'}`}>
                          {t.type === 'credit' ? '+' : '-'}₦{parseFloat(t.amount || 0).toLocaleString('en-NG')}
                        </td>
                        <td className="p-3 capitalize">{t.status}</td>
                        <td className="p-3">{t.description}</td>
                      </tr>
                    ))}
                    {archiveTransactions.length === 0 && (
                      <tr><td colSpan={6} className="p-6 text-center text-text-secondary">No transactions found for this range.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {(() => {
              const pagination = archiveTab === 'shipments' ? archiveShipmentsPagination : archiveTransactionsPagination
              const currentPage = archiveTab === 'shipments' ? archiveShipmentsPage : archiveTransactionsPage
              const setPage = archiveTab === 'shipments' ? setArchiveShipmentsPage : setArchiveTransactionsPage
              if (!pagination || pagination.totalPages <= 1) return null
              return (
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-muted rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <p className="text-text-secondary text-sm">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</p>
                  <button
                    onClick={() => setPage(Math.min(pagination.totalPages, currentPage + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="px-4 py-2 bg-muted rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )
            })()}
          </div>
        )}

        {activeView === "agents" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Agent Directory</h2>
              <input
                type="text"
                value={agentSearchQuery}
                onChange={(e) => setAgentSearchQuery(e.target.value)}
                placeholder="Search by name, email, or phone..."
                className="px-4 py-2 bg-input border border-border rounded-xl text-sm w-full sm:w-72"
              />
            </div>
            <p className="text-text-secondary text-sm">All registered agents, for outreach and case-tracking.</p>

            {loadingAgents ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="px-4 py-3 font-medium">Agent</th>
                      <th className="px-4 py-3 font-medium">Contact</th>
                      <th className="px-4 py-3 font-medium">Referral Code</th>
                      <th className="px-4 py-3 font-medium">KYC</th>
                      <th className="px-4 py-3 font-medium">Referred Truckers</th>
                      <th className="px-4 py-3 font-medium">Disputes (resolved/assigned)</th>
                      <th className="px-4 py-3 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents
                      .filter((a) => {
                        const q = agentSearchQuery.trim().toLowerCase()
                        if (!q) return true
                        return (
                          (a.fullName || '').toLowerCase().includes(q) ||
                          (a.email || '').toLowerCase().includes(q) ||
                          (a.phone || '').toLowerCase().includes(q)
                        )
                      })
                      .map((a) => (
                        <tr key={a.id} className="border-b border-border/60 last:border-0">
                          <td className="px-4 py-3 font-medium text-text-primary">{a.fullName}</td>
                          <td className="px-4 py-3">
                            <p className="text-text-secondary text-xs">{a.email}</p>
                            <p className="text-text-secondary text-xs">{a.phone || '—'}</p>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{a.referralCode || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                              a.kycStatus === 'approved' ? 'bg-success/10 text-success' : 'bg-muted text-text-secondary'
                            }`}>
                              {a.kycStatus || 'pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3">{a.referredTruckers}</td>
                          <td className="px-4 py-3">{a.resolvedDisputes} / {a.assignedDisputes}</td>
                          <td className="px-4 py-3 text-text-secondary text-xs">
                            {a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-NG') : '—'}
                          </td>
                        </tr>
                      ))}
                    {agents.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                          No agents registered yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
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

