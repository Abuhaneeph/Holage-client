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
  AlertCircle
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
    } catch (error) {
      console.error('Error parsing driver info:', error)
      navigateTo('driver-login')
    }
  }, [])

  // Auto-refresh shipments every 30 seconds to catch new assignments
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAssignedShipments()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchFleetManagerInfo = async (fleetManagerId) => {
    try {
      // Fleet manager info is already in driverInfo from login
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

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 max-w-7xl mx-auto">
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
                            <p className="text-text-secondary text-xs sm:text-sm mb-1">Message from Fleet Manager</p>
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
                Your fleet manager will assign shipments to you when bids are accepted
              </p>
            </div>
          )}
          </div>
        </div>
      </div>

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

