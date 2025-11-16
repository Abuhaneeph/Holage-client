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

  // Fetch all complaints for stats on component mount
  useEffect(() => {
    fetchAllComplaintsForStats()
    fetchDieselRate()
  }, [])

  // Fetch KYC submissions when KYC view is active or status changes
  useEffect(() => {
    if (activeView === "kyc") {
      fetchKycSubmissions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, selectedKycStatus])

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
      toast.error('Error updating diesel rate')
    } finally {
      setUpdatingDieselRate(false)
    }
  }

  // Fetch filtered complaints when on complaints tab or status changes
  useEffect(() => {
    if (activeView === "complaints") {
      fetchComplaints()
    }
  }, [activeView, selectedStatus])

  // Fetch all complaints for stats calculation
  const fetchAllComplaintsForStats = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/complaints`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()

      if (response.ok && data.success) {
        calculateStats(data.complaints || [])
      }
    } catch (error) {
      console.error('Error fetching complaints for stats:', error)
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
    const stats = {
      total: complaintsList.length,
      pending: 0,
      in_progress: 0,
      resolved: 0,
    }

    complaintsList.forEach(complaint => {
      if (complaint.status === 'pending') stats.pending++
      else if (complaint.status === 'in_progress') stats.in_progress++
      else if (complaint.status === 'resolved' || complaint.status === 'closed') stats.resolved++
    })

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/80 text-sm">Admin Dashboard</p>
              <p className="text-white font-bold text-lg">{user?.fullName || "Admin"}</p>
            </div>
          </div>
          <button
            onClick={logoutUser}
            className="w-10 h-10 bg-error/20 rounded-full flex items-center justify-center hover:bg-error/30 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveView("home")}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeView === "home"
                ? "bg-white text-purple-700"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveView("complaints")}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeView === "complaints"
                ? "bg-white text-purple-700"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            Complaints
          </button>
          <button
            onClick={() => setActiveView("kyc")}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeView === "kyc"
                ? "bg-white text-purple-700"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            KYC
          </button>
          <button
            onClick={() => setActiveView("settings")}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
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
      <div className="container mx-auto px-4 py-6">
        {activeView === "home" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">Dashboard Overview</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">Total Complaints</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{stats.in_progress}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">Resolved</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{stats.resolved}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="text-lg font-semibold text-text-primary mb-4">System Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Diesel Cost Per Liter (₦)
                  </label>
                  {loadingDieselRate ? (
                    <div className="flex items-center space-x-2 text-text-secondary">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateDieselRate} className="flex items-center space-x-3">
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={dieselRateInput}
                        onChange={(e) => setDieselRateInput(e.target.value)}
                        className="flex-1 px-4 py-2 border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Enter diesel rate"
                        required
                      />
                      <button
                        type="submit"
                        disabled={updatingDieselRate || dieselRateInput === dieselRate.toString()}
                        className="px-6 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-primary">Customer Complaints</h2>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 bg-white border border-border rounded-xl text-text-primary"
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

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-text-primary">
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
                        className={`rounded-xl p-4 ${
                          msg.senderRole === 'admin'
                            ? 'bg-primary/10 border border-primary/20 ml-8'
                            : 'bg-muted/30 mr-8'
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
                  <div className="border-t border-border pt-4">
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply..."
                      className="w-full px-4 py-3 border border-border rounded-xl text-text-primary bg-input focus:outline-none focus:ring-2 focus:ring-primary mb-3"
                      rows={3}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <select
                          value={selectedComplaint.status}
                          onChange={(e) => handleStatusUpdate(selectedComplaint.id, e.target.value)}
                          className="px-4 py-2 border border-border rounded-xl text-text-primary bg-white"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                      <button
                        onClick={() => handleSendReply(selectedComplaint.id)}
                        disabled={sendingReply || !replyMessage.trim()}
                        className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
              <div className="space-y-4">
                {complaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-border cursor-pointer hover:shadow-md transition-shadow"
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

        {activeView === "kyc" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-primary">KYC Submissions</h2>
              <select
                value={selectedKycStatus}
                onChange={(e) => {
                  setSelectedKycStatus(e.target.value)
                  fetchKycSubmissions()
                }}
                className="px-4 py-2 bg-white border border-border rounded-xl text-text-primary"
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

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

                  <div className="border-t border-border pt-6">
                    <h4 className="text-lg font-semibold text-text-primary mb-4">Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="flex items-center space-x-3 mt-6 pt-6 border-t border-border">
                      <button
                        onClick={() => handleKycStatusUpdate(selectedKycSubmission.id, 'approved')}
                        disabled={updatingKycStatus}
                        className="flex-1 bg-green-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        <Check className="w-5 h-5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleKycStatusUpdate(selectedKycSubmission.id, 'rejected')}
                        disabled={updatingKycStatus}
                        className="flex-1 bg-red-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        <XCircle className="w-5 h-5" />
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
              <div className="space-y-4">
                {kycSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-border cursor-pointer hover:shadow-md transition-shadow"
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
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">System Settings</h2>

            {/* Diesel Rate Settings */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">Diesel Cost Per Liter</h3>
                  <p className="text-sm text-text-secondary">Update the diesel rate used for shipping cost calculations</p>
                </div>
              </div>
              
              {loadingDieselRate ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <form onSubmit={handleUpdateDieselRate} className="space-y-4">
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
                      className="w-full px-4 py-3 border border-border rounded-xl text-text-primary text-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                    className="w-full px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
                  
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                    <p className="text-sm text-text-primary">
                      <strong>Note:</strong> This rate is used in the shipping cost formula:
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      Total Cost = (Distance ÷ Fuel Efficiency × Diesel Rate) + (Tonnage × Distance × Rate per Ton-KM) + Base Fee
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard

