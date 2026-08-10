/**
 * DualCodeX Frontend Configuration
 * Connects frontend to the deployed Railway backend API.
 */

// Deployed backend production URL on Railway
const RAILWAY_BACKEND_URL = 'https://proactive-intuition-production-3faa.up.railway.app';

// Set API_BASE_URL globally
// Use custom window.API_BASE_URL if explicitly defined, otherwise default to RAILWAY_BACKEND_URL
const API_BASE_URL = (typeof window !== 'undefined' && window.API_BASE_URL)
  ? window.API_BASE_URL
  : RAILWAY_BACKEND_URL;

if (typeof window !== 'undefined') {
  window.API_BASE_URL = API_BASE_URL;
}

console.log('DualCodeX API Base URL:', API_BASE_URL);
