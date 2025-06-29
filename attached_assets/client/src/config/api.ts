// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // Auto-detect Netlify environment for API base URL
  let baseUrl = API_BASE_URL;
  if (!baseUrl && typeof window !== 'undefined' && window.location.hostname.includes('netlify.app')) {
    baseUrl = '/.netlify/functions';
  }
  
  const url = `${baseUrl}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  return response;
};