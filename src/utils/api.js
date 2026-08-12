/**
 * Centralized API utility for handling authenticated requests
 * Automatically handles token expiration and redirects to login
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

/**
 * Handle token expiration - clear session and redirect
 */
const handleTokenExpiration = (navigateTo) => {
  // Clear all auth data
  localStorage.removeItem("authToken")
  localStorage.removeItem("userInfo")
  localStorage.removeItem("driverInfo")
  localStorage.removeItem("userRole")
  localStorage.removeItem("rememberedEmail")
  localStorage.removeItem("rememberedPhone")
  
  // Redirect to login
  if (navigateTo) {
    navigateTo("login")
  } else {
    // Fallback: reload page to trigger router redirect
    window.location.href = '/'
  }
}

/**
 * Fetch wrapper that handles token expiration automatically
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @param {Function} navigateTo - Navigation function (optional)
 * @returns {Promise<Response>}
 */
export const apiFetch = async (endpoint, options = {}, navigateTo = null) => {
  const token = localStorage.getItem("authToken")
  
  // Add auth header if token exists
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const fullUrl = `${API_BASE_URL}${endpoint}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20000)

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    // Parse JSON response
    let data
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    // Check for token expiration (401 status or expired flag)
    if (response.status === 401 || (typeof data === 'object' && data.expired === true)) {
      handleTokenExpiration(navigateTo)
      // Return a rejected promise to stop execution
      return Promise.reject(new Error('Token expired'))
    }

    // If response is not ok, return the error data
    if (!response.ok) {
      return { ok: false, status: response.status, data }
    }

    return { ok: true, status: response.status, data }
  } catch (error) {
    clearTimeout(timeoutId)

    const isTimeout = error.name === "AbortError"
    const isNetworkError = !isTimeout && error instanceof TypeError

    let detailedMessage = error.message
    if (isTimeout) {
      detailedMessage = `Request to ${fullUrl} timed out after 20s. The server may be slow or unreachable.`
    } else if (isNetworkError) {
      detailedMessage = navigator.onLine
        ? `Could not reach the server at ${fullUrl}. It may be down, or blocking this site (CORS).`
        : `Could not reach the server — you appear to be offline.`
    }

    console.error('API fetch error:', {
      endpoint,
      url: fullUrl,
      isNetworkError,
      isTimeout,
      online: navigator.onLine,
      errorName: error.name,
      errorMessage: error.message,
      timestamp: new Date().toISOString(),
    })

    // Network-level failures never reach the backend, so report them separately —
    // otherwise they'd only ever be visible in this one browser's console.
    if (isNetworkError || isTimeout) {
      fetch(`${API_BASE_URL}/client-errors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint,
          url: fullUrl,
          online: navigator.onLine,
          errorName: error.name,
          errorMessage: isTimeout ? "Request timed out after 20s" : error.message,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {})
    }

    const enrichedError = new Error(detailedMessage)
    enrichedError.cause = error
    throw enrichedError
  }
}

/**
 * Get auth token from localStorage
 */
export const getAuthToken = () => {
  return localStorage.getItem("authToken")
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem("authToken")
}

/**
 * Clear all auth data
 */
export const clearAuth = () => {
  localStorage.removeItem("authToken")
  localStorage.removeItem("userInfo")
  localStorage.removeItem("driverInfo")
  localStorage.removeItem("userRole")
  localStorage.removeItem("rememberedEmail")
  localStorage.removeItem("rememberedPhone")
}

