/**
 * Mapbox utility functions for geocoding, routing, and map operations
 */

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

/**
 * Geocode an address to coordinates
 * @param {string} address - Address to geocode
 * @param {string} country - Country code (default: 'NG' for Nigeria)
 * @returns {Promise<{latitude: number, longitude: number, address: string}>}
 */
export const geocodeAddress = async (address, country = 'NG') => {
  if (!MAPBOX_TOKEN) {
    throw new Error('Mapbox token not configured. Please set VITE_MAPBOX_TOKEN in your .env file.')
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=${country}&limit=1`
    )
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.features || data.features.length === 0) {
      throw new Error('No results found for this address')
    }

    const feature = data.features[0]
    return {
      latitude: feature.center[1],
      longitude: feature.center[0],
      address: feature.place_name,
      context: feature.context || []
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    throw error
  }
}

/**
 * Reverse geocode coordinates to address
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<string>} Address string
 */
export const reverseGeocode = async (latitude, longitude) => {
  if (!MAPBOX_TOKEN) {
    throw new Error('Mapbox token not configured. Please set VITE_MAPBOX_TOKEN in your .env file.')
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    )
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.features || data.features.length === 0) {
      return 'Address not found'
    }

    return data.features[0].place_name
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    throw error
  }
}

/**
 * Search for address suggestions (autocomplete)
 * @param {string} query - Search query
 * @param {string} country - Country code (default: 'NG')
 * @param {number} limit - Maximum number of results (default: 5)
 * @returns {Promise<Array<{id: string, address: string, coordinates: {lat: number, lng: number}}>>}
 */
export const searchAddresses = async (query, country = 'NG', limit = 5) => {
  if (!MAPBOX_TOKEN) {
    throw new Error('Mapbox token not configured. Please set VITE_MAPBOX_TOKEN in your .env file.')
  }

  if (!query || query.trim().length < 2) {
    return []
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=${country}&limit=${limit}`
    )
    
    if (!response.ok) {
      throw new Error(`Address search failed: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.features) {
      return []
    }

    return data.features.map(feature => ({
      id: feature.id,
      address: feature.place_name,
      coordinates: {
        lat: feature.center[1],
        lng: feature.center[0]
      },
      context: feature.context || []
    }))
  } catch (error) {
    console.error('Address search error:', error)
    return []
  }
}

/**
 * Get route between two points
 * @param {Object} start - {latitude, longitude}
 * @param {Object} end - {latitude, longitude}
 * @param {string} profile - Route profile: 'driving', 'walking', 'cycling' (default: 'driving')
 * @returns {Promise<{distance: number, duration: number, geometry: Object}>}
 */
export const getRoute = async (start, end, profile = 'driving') => {
  if (!MAPBOX_TOKEN) {
    throw new Error('Mapbox token not configured. Please set VITE_MAPBOX_TOKEN in your .env file.')
  }

  try {
    const coordinates = `${start.longitude},${start.latitude};${end.longitude},${end.latitude}`
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
    )
    
    if (!response.ok) {
      throw new Error(`Routing failed: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found')
    }

    const route = data.routes[0]
    return {
      distance: route.distance / 1000, // Convert to km
      duration: route.duration / 60, // Convert to minutes
      geometry: route.geometry, // GeoJSON geometry for drawing on map
      legs: route.legs || []
    }
  } catch (error) {
    console.error('Routing error:', error)
    throw error
  }
}

/**
 * Check if Mapbox is configured
 * @returns {boolean}
 */
export const isMapboxConfigured = () => {
  return !!MAPBOX_TOKEN && MAPBOX_TOKEN.trim() !== ''
}

/**
 * Get default map center for Nigeria
 * @returns {{longitude: number, latitude: number, zoom: number}}
 */
export const getNigeriaMapCenter = () => {
  return {
    longitude: 8.6753, // Center of Nigeria
    latitude: 9.0820,
    zoom: 6
  }
}

