// Jamendo API Service Layer calling Node.js Express Proxy
const PROXY_BASE_URL = 'http://localhost:5000/api';

/**
 * Dynamically resolve Jamendo Client ID saved in browser localStorage
 */
export const getJamendoClientId = () => {
  return localStorage.getItem('mysukoon_client_id') || '';
};

/**
 * Helper to build backend query parameters, appending the client ID if present
 */
const buildUrl = (endpoint, params = {}) => {
  const customKey = getJamendoClientId();
  const queryParams = new URLSearchParams({
    ...params,
  });
  
  if (customKey) {
    queryParams.append('client_id', customKey);
  }
  
  return `${PROXY_BASE_URL}${endpoint}?${queryParams.toString()}`;
};

/**
 * Fetch and handle errors
 */
async function fetchFromProxy(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // Cache the successful API response for offline browsing
    try {
      localStorage.setItem(`mysukoon_cache_${url}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('[Cache System] Failed to write response to localStorage cache:', e);
    }
    
    return data;
  } catch (error) {
    console.error('Backend Proxy Connection Error:', error);
    
    // Check if error is credentials related to alert the UI
    const errorStr = error.message.toLowerCase();
    if (
      errorStr.includes('client_id') || 
      errorStr.includes('credential') || 
      errorStr.includes('authorized') || 
      errorStr.includes('suspended')
    ) {
      window.dispatchEvent(new CustomEvent('jamendo_auth_failed', { detail: error.message }));
    }
    
    // Try to load cached data for offline browsing
    try {
      const cached = localStorage.getItem(`mysukoon_cache_${url}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        console.warn(`[Cache System] Serving offline cached data for: ${url} (Cached at: ${new Date(parsed.timestamp).toLocaleString()})`);
        return parsed.data;
      }
    } catch (e) {
      console.error('[Cache System] Failed to read from localStorage cache:', e);
    }
    
    throw error;
  }
}

/**
 * Audio Stream Helper:
 * Constructs the backend streaming proxy URL to eliminate browser CORS blocks
 */
export const getStreamUrl = (audioUrl) => {
  if (!audioUrl) return '';
  return `${PROXY_BASE_URL}/stream?url=${encodeURIComponent(audioUrl)}`;
};

export const JamendoApi = {
  /**
   * Get Trending / Popular Tracks
   */
  getTrendingTracks: async (limit = 20, offset = 0) => {
    const url = buildUrl('/trending', { limit, offset });
    return fetchFromProxy(url);
  },

  /**
   * Search Songs, Artists, or Albums
   */
  searchTracks: async (query, type = 'all', limit = 20, offset = 0) => {
    if (!query || query.trim() === '') return [];
    const url = buildUrl('/search', { query, type, limit, offset });
    return fetchFromProxy(url);
  },

  /**
   * Get Tracks by Genre Tag
   */
  getTracksByCategory: async (tag, limit = 20, offset = 0) => {
    const url = buildUrl('/category', { tag, limit, offset });
    return fetchFromProxy(url);
  }
};
