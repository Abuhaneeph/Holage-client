const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Calculate distance between two Nigerian states/LGAs
 * @param {string} pickupState - Pickup state code (e.g., 'lagos')
 * @param {string} pickupLga - Pickup LGA slug
 * @param {string} destinationState - Destination state code
 * @param {string} destinationLga - Destination LGA slug
 * @param {object} pickupCoordinates - Optional: {lat, lng} for pickup location
 * @param {object} destinationCoordinates - Optional: {lat, lng} for destination location
 * @returns {Promise<object>} Distance calculation result
 */
export const calculateDistance = async (pickupState, pickupLga, destinationState, destinationLga, pickupCoordinates = null, destinationCoordinates = null) => {
  try {
    const body = {
      pickupState,
      pickupLga,
      destinationState,
      destinationLga,
    }

    // Add coordinates if available
    if (pickupCoordinates && pickupCoordinates.lat && pickupCoordinates.lng) {
      body.pickupCoordinates = {
        lat: pickupCoordinates.lat,
        lng: pickupCoordinates.lng
      }
    }

    if (destinationCoordinates && destinationCoordinates.lat && destinationCoordinates.lng) {
      body.destinationCoordinates = {
        lat: destinationCoordinates.lat,
        lng: destinationCoordinates.lng
      }
    }

    const response = await fetch(`${API_BASE_URL}/shipping/calculate-distance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to calculate distance');
    }

    return data.data;
  } catch (error) {
    console.error('Distance calculation error:', error);
    throw error;
  }
};

/**
 * Estimate shipping cost based on states and weight
 * @param {string} pickupState - Pickup state code
 * @param {string} pickupLga - Pickup LGA slug
 * @param {string} destinationState - Destination state code
 * @param {string} destinationLga - Destination LGA slug
 * @param {number} weight - Weight in tons
 * @param {object} pickupCoordinates - Optional: {lat, lng} for pickup location
 * @param {object} destinationCoordinates - Optional: {lat, lng} for destination location
 * @param {boolean} fragileItems - Whether items are fragile/perishable
 * @param {boolean} insurance - Whether insurance is selected
 * @returns {Promise<object>} Cost estimation result
 */
export const estimateShippingCost = async (pickupState, pickupLga, destinationState, destinationLga, weight = 1, pickupCoordinates = null, destinationCoordinates = null, fragileItems = false, insurance = false) => {
  try {
    const body = {
      pickupState,
      pickupLga,
      destinationState,
      destinationLga,
      weight,
      fragileItems,
      insurance
    }

    // Add coordinates if available
    if (pickupCoordinates && pickupCoordinates.lat && pickupCoordinates.lng) {
      body.pickupCoordinates = {
        lat: pickupCoordinates.lat,
        lng: pickupCoordinates.lng
      }
    }

    if (destinationCoordinates && destinationCoordinates.lat && destinationCoordinates.lng) {
      body.destinationCoordinates = {
        lat: destinationCoordinates.lat,
        lng: destinationCoordinates.lng
      }
    }

    const response = await fetch(`${API_BASE_URL}/shipping/estimate-cost`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to estimate cost');
    }

    return data.data;
  } catch (error) {
    console.error('Cost estimation error:', error);
    throw error;
  }
};

