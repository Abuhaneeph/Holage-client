import { useState, useEffect, useMemo } from 'react'
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl'
import { Package, MapPin } from 'lucide-react'
import { isMapboxConfigured, getNigeriaMapCenter, geocodeAddress } from '../utils/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

/**
 * SingleShipmentMap Component
 * Displays a single shipment on an interactive map with pickup and destination
 * 
 * @param {Object} shipment - Single shipment object
 * @param {string} height - Map height (default: '400px')
 * @param {Array} statesData - Optional states data with LGA coordinates for fallback
 */
const SingleShipmentMap = ({ 
  shipment,
  height = '400px',
  statesData = null
}) => {
  const [viewState, setViewState] = useState(getNigeriaMapCenter())
  const [geocodedCoords, setGeocodedCoords] = useState(null)
  const [geocoding, setGeocoding] = useState(false)

  // Check if Mapbox is configured
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN

  if (!isMapboxConfigured()) {
    return (
      <div className="w-full bg-muted rounded-xl p-6 flex flex-col items-center justify-center" style={{ height }}>
        <MapPin className="w-10 h-10 text-text-secondary mb-3" />
        <p className="text-text-secondary text-center text-sm">
          Mapbox is not configured. Please add VITE_MAPBOX_TOKEN to your .env file.
        </p>
      </div>
    )
  }

  // Helper function to slugify a string
  const slugify = (str) => {
    if (!str) return ''
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // Helper function to normalize string for comparison
  const normalizeString = (str) => {
    if (!str) return ''
    return str.toLowerCase().trim().replace(/\s+/g, '-')
  }

  // Get coordinates for the shipment
  const getShipmentCoordinates = useMemo(() => {
    if (!shipment) return null
    
    // Try to get from latitude/longitude fields first
    if (shipment.pickupLatitude && shipment.pickupLongitude) {
      return {
        pickup: { lat: shipment.pickupLatitude, lng: shipment.pickupLongitude },
        destination: shipment.destinationLatitude && shipment.destinationLongitude
          ? { lat: shipment.destinationLatitude, lng: shipment.destinationLongitude }
          : null
      }
    }
    
    // Fallback: Try to get coordinates from states data using LGA slugs/names
    if (statesData && shipment.pickupState && shipment.pickupLga) {
      // Normalize state name/slug for matching
      const pickupStateSlug = slugify(shipment.pickupState)
      const pickupLgaSlug = slugify(shipment.pickupLga)
      
      const state = statesData.find(s => 
        s.slug === pickupStateSlug || 
        normalizeString(s.name) === normalizeString(shipment.pickupState) ||
        s.slug === shipment.pickupState
      )
      
      if (state) {
        // Try multiple matching strategies for LGA
        const pickupLga = state.lgas?.find(l => 
          l.slug === pickupLgaSlug ||
          l.slug === shipment.pickupLga ||
          normalizeString(l.name) === normalizeString(shipment.pickupLga) ||
          l.name === shipment.pickupLga
        )
        
        // Try to find destination LGA
        let destinationLga = null
        if (shipment.destinationState && shipment.destinationLga) {
          const destStateSlug = slugify(shipment.destinationState)
          const destLgaSlug = slugify(shipment.destinationLga)
          
          const destState = statesData.find(s => 
            s.slug === destStateSlug || 
            normalizeString(s.name) === normalizeString(shipment.destinationState) ||
            s.slug === shipment.destinationState
          )
          
          if (destState) {
            destinationLga = destState.lgas?.find(l => 
              l.slug === destLgaSlug ||
              l.slug === shipment.destinationLga ||
              normalizeString(l.name) === normalizeString(shipment.destinationLga) ||
              l.name === shipment.destinationLga
            )
          }
        }
        
        // If we found pickup LGA coordinates, use them
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
        
        // Fallback: Calculate state center from LGA coordinates if available
        // This ensures we always have coordinates to display
        const lgasWithCoords = state.lgas?.filter(l => l.coordinates) || []
        if (lgasWithCoords.length > 0) {
          const avgLat = lgasWithCoords.reduce((sum, l) => sum + l.coordinates.lat, 0) / lgasWithCoords.length
          const avgLng = lgasWithCoords.reduce((sum, l) => sum + l.coordinates.lng, 0) / lgasWithCoords.length
          
          let destCoords = null
          if (shipment.destinationState) {
            const destStateSlug = slugify(shipment.destinationState)
            const destState = statesData.find(s => 
              s.slug === destStateSlug || 
              normalizeString(s.name) === normalizeString(shipment.destinationState) ||
              s.slug === shipment.destinationState
            )
            
            if (destState?.lgas) {
              const destLgasWithCoords = destState.lgas.filter(l => l.coordinates)
              if (destLgasWithCoords.length > 0) {
                const destAvgLat = destLgasWithCoords.reduce((sum, l) => sum + l.coordinates.lat, 0) / destLgasWithCoords.length
                const destAvgLng = destLgasWithCoords.reduce((sum, l) => sum + l.coordinates.lng, 0) / destLgasWithCoords.length
                destCoords = { lat: destAvgLat, lng: destAvgLng }
              }
            }
          }
          
          return {
            pickup: { lat: avgLat, lng: avgLng },
            destination: destCoords
          }
        }
      }
    }
    
    // Final fallback: Use Nigeria center coordinates (always return something)
    return {
      pickup: {
        lat: 9.0820, // Nigeria approximate center
        lng: 8.6753
      },
      destination: shipment.destinationState ? {
        lat: 9.0820,
        lng: 8.6753
      } : null
    }
  }, [shipment, statesData])
  
  // Try geocoding as a fallback if coordinates not found and Mapbox is available
  useEffect(() => {
    if (!geocodedCoords && !geocoding && getShipmentCoordinates && 
        getShipmentCoordinates.pickup && 
        getShipmentCoordinates.pickup.lat === 9.0820 && 
        getShipmentCoordinates.pickup.lng === 8.6753 &&
        isMapboxConfigured() && 
        shipment?.pickupState && shipment?.pickupLga) {
      setGeocoding(true)
      const pickupAddress = `${shipment.pickupLga}, ${shipment.pickupState}, Nigeria`.trim()
      
      geocodeAddress(pickupAddress)
        .then(result => {
          const coords = {
            pickup: { lat: result.latitude, lng: result.longitude },
            destination: null
          }
          
          if (shipment.destinationState && shipment.destinationLga) {
            const destAddress = `${shipment.destinationLga}, ${shipment.destinationState}, Nigeria`.trim()
            return geocodeAddress(destAddress)
              .then(destResult => {
                coords.destination = { lat: destResult.latitude, lng: destResult.longitude }
                setGeocodedCoords(coords)
                setGeocoding(false)
              })
              .catch(() => {
                setGeocodedCoords(coords)
                setGeocoding(false)
              })
          } else {
            setGeocodedCoords(coords)
            setGeocoding(false)
          }
        })
        .catch(() => {
          setGeocoding(false)
        })
    }
  }, [shipment, getShipmentCoordinates, geocodedCoords, geocoding])
  
  // Use geocoded coordinates if available, otherwise use calculated coordinates
  const finalCoordinates = geocodedCoords || getShipmentCoordinates

  // Calculate map center and zoom based on coordinates
  useEffect(() => {
    if (finalCoordinates && finalCoordinates.pickup) {
      if (finalCoordinates.destination) {
        // Center between pickup and destination
        const centerLat = (finalCoordinates.pickup.lat + finalCoordinates.destination.lat) / 2
        const centerLng = (finalCoordinates.pickup.lng + finalCoordinates.destination.lng) / 2
        
        // Calculate distance to determine zoom
        const latDiff = Math.abs(finalCoordinates.pickup.lat - finalCoordinates.destination.lat)
        const lngDiff = Math.abs(finalCoordinates.pickup.lng - finalCoordinates.destination.lng)
        const maxDiff = Math.max(latDiff, lngDiff)
        
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
      } else {
        // Only pickup available, center on it
        setViewState({
          longitude: finalCoordinates.pickup.lng,
          latitude: finalCoordinates.pickup.lat,
          zoom: 12
        })
      }
    }
  }, [finalCoordinates])

  // Get status color
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

  if (!finalCoordinates || !finalCoordinates.pickup) {
    return (
      <div className="w-full bg-muted rounded-xl p-6 flex flex-col items-center justify-center" style={{ height }}>
        <MapPin className="w-10 h-10 text-text-secondary mb-3" />
        <p className="text-text-secondary text-center text-sm">
          {geocoding ? 'Loading location data...' : 'Location data not available for this shipment'}
        </p>
      </div>
    )
  }

  const statusColor = getStatusColor(shipment?.status)
  const coords = finalCoordinates

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
        {/* Pickup Marker */}
        <Marker
          longitude={coords.pickup.lng}
          latitude={coords.pickup.lat}
          anchor="bottom"
        >
          <div className="cursor-pointer">
            <div
              className="w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
              style={{ backgroundColor: statusColor }}
            >
              <Package className="w-5 h-5 text-white" />
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
            <div className="cursor-pointer">
              <div
                className="w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                style={{ backgroundColor: statusColor }}
              >
                <MapPin className="w-5 h-5 text-white" />
              </div>
            </div>
          </Marker>
        )}

        {/* Route Line */}
        {coords.pickup && coords.destination && (
          <Source
            id="route"
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
              id="route-layer"
              type="line"
              paint={{
                'line-color': statusColor,
                'line-width': 4,
                'line-opacity': 0.7
              }}
            />
          </Source>
        )}

        {/* Pickup Popup */}
        <Popup
          longitude={coords.pickup.lng}
          latitude={coords.pickup.lat}
          closeButton={true}
          closeOnClick={false}
          anchor="top"
        >
          <div className="p-2 min-w-[180px]">
            <h3 className="font-bold text-sm mb-1">Pickup Location</h3>
            <p className="text-xs text-text-secondary">
              {shipment?.pickupState || 'N/A'}
              {shipment?.pickupLga && `, ${shipment.pickupLga}`}
            </p>
          </div>
        </Popup>

        {/* Destination Popup */}
        {coords.destination && (
          <Popup
            longitude={coords.destination.lng}
            latitude={coords.destination.lat}
            closeButton={true}
            closeOnClick={false}
            anchor="top"
          >
            <div className="p-2 min-w-[180px]">
              <h3 className="font-bold text-sm mb-1">Destination</h3>
              <p className="text-xs text-text-secondary">
                {shipment?.destinationState || 'N/A'}
                {shipment?.destinationLga && `, ${shipment.destinationLga}`}
              </p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}

export default SingleShipmentMap

