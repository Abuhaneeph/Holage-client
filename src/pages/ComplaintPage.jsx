"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Send, CheckCircle, Clock, ArrowLeft, User, FileText, MessageSquare } from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useToast } from "../context/ToastContext"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const ComplaintPage = () => {
  const { user, navigateTo, userRole } = useAppContext()
  const toast = useToast()
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    shipmentId: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [myComplaints, setMyComplaints] = useState([])
  const [activeView, setActiveView] = useState("submit") // "submit" or "history"
  const [documents, setDocuments] = useState(null)
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [replyMessage, setReplyMessage] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  const [shipments, setShipments] = useState([])
  const [loadingShipments, setLoadingShipments] = useState(false)

  useEffect(() => {
    fetchMyComplaints()
    fetchUserDocuments()
    // Fetch shipments for shippers, truckers, and fleet managers
    if (['shipper', 'trucker', 'fleet_manager'].includes(userRole)) {
      fetchShipments()
    }
  }, [userRole])

  const fetchUserDocuments = async () => {
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
      console.error('Error fetching documents:', error)
    }
  }

  const fetchShipments = async () => {
    // All roles can link complaints to shipments they're involved in
    if (!['shipper', 'trucker', 'fleet_manager'].includes(userRole)) return
    
    setLoadingShipments(true)
    try {
      const token = localStorage.getItem('authToken')
      let endpoint = ''
      
      // Use appropriate endpoint based on role
      if (userRole === 'shipper') {
        endpoint = `${API_BASE_URL}/shipping/shipments/my-shipments?limit=100`
      } else if (userRole === 'trucker' || userRole === 'fleet_manager') {
        endpoint = `${API_BASE_URL}/shipping/shipments/my-jobs?limit=100`
      }
      
      if (!endpoint) return
      
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setShipments(data.shipments || [])
      }
    } catch (error) {
      console.error('Error fetching shipments:', error)
    } finally {
      setLoadingShipments(false)
    }
  }

  const fetchMyComplaints = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/complaints/my-complaints`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()

      if (response.ok && data.success) {
        setMyComplaints(data.complaints || [])
      }
    } catch (error) {
      console.error('Error fetching complaints:', error)
    }
  }

  const fetchComplaintDetails = async (complaintId) => {
    try {
      // Refresh complaints to get latest messages
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/complaints/my-complaints`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (response.ok && data.success) {
        const complaint = data.complaints.find(c => c.id === complaintId)
        if (complaint) {
          setSelectedComplaint(complaint)
          setMyComplaints(data.complaints || [])
        }
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
        fetchMyComplaints()
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.subject || !formData.message) {
      toast.error("Please fill in all fields")
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/complaints/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          shipmentId: formData.shipmentId || undefined
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(data.message || 'Complaint submitted successfully')
        setFormData({ subject: "", message: "", shipmentId: "" })
        fetchMyComplaints()
        setActiveView("history")
      } else {
        toast.error(data.message || 'Failed to submit complaint')
      }
    } catch (error) {
      console.error('Error submitting complaint:', error)
      toast.error('Error submitting complaint')
    } finally {
      setSubmitting(false)
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
        return <AlertCircle className="w-4 h-4" />
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getDashboardRoute = () => {
    if (userRole === 'trucker') return 'trucker-dashboard'
    if (userRole === 'shipper') return 'shipper-dashboard'
    if (userRole === 'fleet_manager') return 'fleet-manager-dashboard'
    return 'landing'
  }

  const getRoleLabel = () => {
    if (userRole === 'trucker') return 'Trucker'
    if (userRole === 'shipper') return 'Shipper'
    if (userRole === 'fleet_manager') return 'Fleet Manager'
    return 'User'
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Card - Matching Dashboard Style */}
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
              <p className="text-white/80 text-sm">{getRoleLabel()}</p>
              <p className="text-white font-bold text-lg">{user?.fullName?.split(' ')[0] || "User"}</p>
            </div>
          </div>
          <button
            onClick={() => navigateTo(getDashboardRoute())}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => setActiveView("submit")}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeView === "submit"
                ? "bg-white text-primary"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            Submit Complaint
          </button>
          <button
            onClick={() => setActiveView("history")}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeView === "history"
                ? "bg-white text-primary"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            My Complaints ({myComplaints.length})
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 mt-6">
        {activeView === "submit" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                  Submit a Complaint
                </h2>
                <p className="text-text-secondary">
                  Have an issue or concern? We're here to help. Submit your complaint and our team will review it.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3.5 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all duration-200 text-text-primary placeholder:text-text-secondary/70"
                    placeholder="Brief description of your complaint"
                    required
                    disabled={submitting}
                  />
                </div>

                {['shipper', 'trucker', 'fleet_manager'].includes(userRole) && shipments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Related Shipment (Optional)
                    </label>
                    <select
                      value={formData.shipmentId}
                      onChange={(e) => setFormData({ ...formData, shipmentId: e.target.value })}
                      className="w-full px-4 py-3.5 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all duration-200 text-text-primary"
                      disabled={submitting || loadingShipments}
                    >
                      <option value="">Select a shipment (optional)</option>
                      {shipments.map((shipment) => (
                        <option key={shipment.id} value={shipment.id}>
                          Shipment #{shipment.id} - {shipment.pickupState} to {shipment.destinationState} ({shipment.status})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-text-secondary mt-1">
                      Link this complaint to a specific shipment for faster resolution
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Message *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3.5 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all duration-200 text-text-primary placeholder:text-text-secondary/70 resize-none"
                    placeholder="Please provide details about your complaint..."
                    required
                    disabled={submitting}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3.5 rounded-xl font-semibold hover:from-primary/90 hover:to-secondary/90 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Submit Complaint</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeView === "history" && (
          <div className="space-y-4">
            {selectedComplaint ? (
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setSelectedComplaint(null)
                    setReplyMessage("")
                  }}
                  className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Complaints</span>
                </button>

                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-primary mb-1">
                        {selectedComplaint.subject}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 w-fit ${getStatusColor(
                          selectedComplaint.status
                        )}`}
                      >
                        {getStatusIcon(selectedComplaint.status)}
                        <span className="capitalize">{selectedComplaint.status.replace('_', ' ')}</span>
                      </span>
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
                            <p className="text-sm font-medium text-text-primary">You</p>
                            <p className="text-xs text-text-secondary">{new Date(selectedComplaint.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-text-primary">{selectedComplaint.message}</p>
                      {selectedComplaint.shipmentId && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-xs text-text-secondary mb-1">Related Shipment:</p>
                          <p className="text-sm font-medium text-text-primary">
                            Shipment #{selectedComplaint.shipmentId}
                            {selectedComplaint.pickupState && (
                              <span className="text-text-secondary ml-2">
                                - {selectedComplaint.pickupState} to {selectedComplaint.destinationState}
                              </span>
                            )}
                          </p>
                        </div>
                      )}
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
                                <AlertCircle className="w-4 h-4 text-primary" />
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
                    <button
                      onClick={() => handleSendReply(selectedComplaint.id)}
                      disabled={sendingReply || !replyMessage.trim()}
                      className="w-full px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {sendingReply ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Reply</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-text-primary">My Complaints</h2>
                  <button
                    onClick={() => setActiveView("submit")}
                    className="px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors text-sm"
                  >
                    + New Complaint
                  </button>
                </div>

                {myComplaints.length === 0 ? (
                  <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <AlertCircle className="w-16 h-16 text-text-secondary mx-auto mb-4" />
                    <p className="text-text-secondary text-lg mb-2">No complaints yet</p>
                    <p className="text-text-secondary text-sm mb-6">Submit your first complaint to get started</p>
                    <button
                      onClick={() => setActiveView("submit")}
                      className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Submit Complaint
                    </button>
                  </div>
                ) : (
                  myComplaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      className="bg-card border border-border rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => fetchComplaintDetails(complaint.id)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                              <FileText className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-text-primary mb-1">
                                {complaint.subject}
                              </h3>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 w-fit ${getStatusColor(
                                  complaint.status
                                )}`}
                              >
                                {getStatusIcon(complaint.status)}
                                <span className="capitalize">{complaint.status.replace('_', ' ')}</span>
                              </span>
                            </div>
                          </div>
                          <p className="text-text-primary mb-4 ml-14 line-clamp-2">{complaint.message}</p>
                          <p className="text-xs text-text-secondary mt-4 ml-14">
                            Submitted: {new Date(complaint.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ComplaintPage

