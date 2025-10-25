const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Calculate distance between two Nigerian states
 * @param {string} pickupState - Pickup state code (e.g., 'lagos')
 * @param {string} destinationState - Destination state code
 * @returns {Promise<object>} Distance calculation result
 */
export const calculateDistance = async (pickupState, destinationState) => {
  try {
    const response = await fetch(`${API_BASE_URL}/shipping/calculate-distance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pickupState,
        destinationState
      })
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
 * @param {string} destinationState - Destination state code
 * @param {number} weight - Weight in tons
 * @returns {Promise<object>} Cost estimation result
 */
export const estimateShippingCost = async (pickupState, destinationState, weight = 1) => {
  try {
    const response = await fetch(`${API_BASE_URL}/shipping/estimate-cost`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pickupState,
        destinationState,
        weight
      })
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

