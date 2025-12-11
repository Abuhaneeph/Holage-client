import { useState, useMemo } from 'react'
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl'
import { Package, MapPin } from 'lucide-react'
import { isMapboxConfigured, getNigeriaMapCenter } from '../utils/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

/**
 * ShipmentMap Component
 * Displays shipments on an interactive map with markers and routes
 * 
 * @param {Array} shipments - Array of shipment objects
 * @param {Function} onShipmentClick - Callback when a shipment marker is clicked
 * @param {boolean} showRoutes - Whether to show route lines between pickup and destination
 * @param {string} height - Map height (default: '500px')
 * @param {Array} statesData - Optional states data with LGA coordinates for fallback
 */
const ShipmentMap = ({ 
  shipments = [], 
  onShipmentClick = null,
  showRoutes = false,
  height = '500px',
  statesData = null
}) => {
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [viewState, setViewState] = useState(getNigeriaMapCenter())

  // Check if Mapbox is configured
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN

  if (!isMapboxConfigured()) {
    return (
      <div className="w-full bg-muted rounded-xl p-8 flex flex-col items-center justify-center" style={{ height }}>
        <MapPin className="w-12 h-12 text-text-secondary mb-4" />
        <p className="text-text-secondary text-center">
          Mapbox is not configured. Please add VITE_MAPBOX_TOKEN to your .env file.
        </p>
        <p className="text-text-secondary text-sm mt-2 text-center">
          Get your free token at{' '}
          <a 
            href="https://account.mapbox.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            mapbox.com
          </a>
        </p>
      </div>
    )
  }

  // Calculate map bounds to fit all shipments
  const bounds = useMemo(() => {
    if (!shipments || shipments.length === 0) return null

    const coordinates = []
    
    shipments.forEach(shipment => {
      // Add pickup coordinates if available
      if (shipment.pickupLatitude && shipment.pickupLongitude) {
        coordinates.push([shipment.pickupLongitude, shipment.pickupLatitude])
      }
      // Add destination coordinates if available
      if (shipment.destinationLatitude && shipment.destinationLongitude) {
        coordinates.push([shipment.destinationLongitude, shipment.destinationLatitude])
      }
      // Fallback to LGA coordinates if available
      if (shipment.pickupLga && shipment.pickupState) {
        // You can add logic here to get LGA coordinates from your states data
      }
    })

    if (coordinates.length === 0) return null

    const lngs = coordinates.map(c => c[0])
    const lats = coordinates.map(c => c[1])

    return {
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats)
    }
  }, [shipments])

  // Adjust view to fit bounds on mount
  useMemo(() => {
    if (bounds && shipments.length > 0) {
      const centerLng = (bounds.minLng + bounds.maxLng) / 2
      const centerLat = (bounds.minLat + bounds.maxLat) / 2
      
      // Calculate zoom level based on bounds
      const lngDiff = bounds.maxLng - bounds.minLng
      const latDiff = bounds.maxLat - bounds.minLat
      const maxDiff = Math.max(lngDiff, latDiff)
      
      let zoom = 6
      if (maxDiff < 0.1) zoom = 12
      else if (maxDiff < 0.5) zoom = 10
      else if (maxDiff < 2) zoom = 8
      else zoom = 6

      setViewState({
        longitude: centerLng,
        latitude: centerLat,
        zoom: zoom
      })
    }
  }, [bounds, shipments.length])

  // Get status color for markers
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#f59e0b' // amber
      case 'picked up':
      case 'in transit':
        return '#3b82f6' // blue
      case 'delivered':
        return '#10b981' // green
      case 'cancelled':
        return '#ef4444' // red
      default:
        return '#6b7280' // gray
    }
  }

  // Get coordinates for a shipment
  const getShipmentCoordinates = (shipment) => {
    // Try to get from latitude/longitude fields first
    if (shipment.pickupLatitude && shipment.pickupLongitude) {
      return {
        pickup: { lat: shipment.pickupLatitude, lng: shipment.pickupLongitude },
        destination: shipment.destinationLatitude && shipment.destinationLongitude
          ? { lat: shipment.destinationLatitude, lng: shipment.destinationLongitude }
          : null
      }
    }
    
    // Fallback: Try to get coordinates from states data using LGA slugs
    if (statesData && shipment.pickupState && shipment.pickupLga) {
      const state = statesData.find(s => s.slug === shipment.pickupState)
      if (state) {
        const pickupLga = state.lgas?.find(l => l.slug === shipment.pickupLga)
        const destinationLga = shipment.destinationState && shipment.destinationLga
          ? statesData.find(s => s.slug === shipment.destinationState)?.lgas?.find(l => l.slug === shipment.destinationLga)
          : null
        
        if (pickupLga?.coordinates) {
          return {
            pickup: {
              lat: pickupLga.coordinates.lat,
              lng: pickupLga.coordinates.lng
            },
            destination: destinationLga?.coordinates
              ? {
                  lat: destinationLga.coordinates.lat,
                  lng: destinationLga.coordinates.lng
                }
              : null
          }
        }
      }
    }
    
    return null
  }

  const handleMarkerClick = (shipment) => {
    setSelectedShipment(shipment)
    if (onShipmentClick) {
      onShipmentClick(shipment)
    }
  }

  return (
    <div className="w-full rounded-xl overflow-hidden border border-border" style={{ height }}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={mapboxToken}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        reuseMaps
      >
        {shipments.map(shipment => {
          const coords = getShipmentCoordinates(shipment)
          if (!coords || !coords.pickup) return null

          const statusColor = getStatusColor(shipment.status)

          return (
            <div key={shipment.id}>
              {/* Pickup Marker */}
              <Marker
                longitude={coords.pickup.lng}
                latitude={coords.pickup.lat}
                anchor="bottom"
              >
                <div
                  onClick={() => handleMarkerClick(shipment)}
                  className="cursor-pointer transform hover:scale-110 transition-transform"
                >
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                    style={{ backgroundColor: statusColor }}
                  >
                    <Package className="w-4 h-4 text-white" />
                  </div>
                </div>
              </Marker>

              {/* Destination Marker (if available) */}
              {coords.destination && (
                <Marker
                  longitude={coords.destination.lng}
                  latitude={coords.destination.lat}
                  anchor="bottom"
                >
                  <div
                    onClick={() => handleMarkerClick(shipment)}
                    className="cursor-pointer transform hover:scale-110 transition-transform"
                  >
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                      style={{ backgroundColor: statusColor }}
                    >
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </Marker>
              )}

              {/* Route Line (if enabled and both points available) */}
              {showRoutes && coords.pickup && coords.destination && (
                <Source
                  id={`route-${shipment.id}`}
                  type="geojson"
                  data={{
                    type: 'Feature',
                    geometry: {
                      type: 'LineString',
                      coordinates: [
                        [coords.pickup.lng, coords.pickup.lat],
                        [coords.destination.lng, coords.destination.lat]
                      ]
                    }
                  }}
                >
                  <Layer
                    id={`route-layer-${shipment.id}`}
                    type="line"
                    paint={{
                      'line-color': statusColor,
                      'line-width': 3,
                      'line-opacity': 0.6
                    }}
                  />
                </Source>
              )}
            </div>
          )
        })}

        {/* Popup for selected shipment */}
        {selectedShipment && (
          <Popup
            longitude={
              getShipmentCoordinates(selectedShipment)?.pickup?.lng || viewState.longitude
            }
            latitude={
              getShipmentCoordinates(selectedShipment)?.pickup?.lat || viewState.latitude
            }
            onClose={() => setSelectedShipment(null)}
            closeButton={true}
            closeOnClick={false}
            anchor="top"
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-sm mb-1">
                Shipment #{selectedShipment.id}
              </h3>
              <p className="text-xs text-text-secondary mb-2">
                {selectedShipment.cargoType || 'Cargo'}
              </p>
              <div className="text-xs space-y-1">
                <p>
                  <span className="font-medium">From:</span>{' '}
                  {selectedShipment.pickupState || 'N/A'}
                  {selectedShipment.pickupLga && `, ${selectedShipment.pickupLga}`}
                </p>
                <p>
                  <span className="font-medium">To:</span>{' '}
                  {selectedShipment.destinationState || 'N/A'}
                  {selectedShipment.destinationLga && `, ${selectedShipment.destinationLga}`}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  <span
                    className="px-2 py-0.5 rounded text-xs"
                    style={{
                      backgroundColor: `${getStatusColor(selectedShipment.status)}20`,
                      color: getStatusColor(selectedShipment.status)
                    }}
                  >
                    {selectedShipment.status || 'Unknown'}
                  </span>
                </p>
                {selectedShipment.weight && (
                  <p>
                    <span className="font-medium">Weight:</span> {selectedShipment.weight}t
                  </p>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}

export default ShipmentMap

