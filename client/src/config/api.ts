// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  // Detect if we're on Netlify
  typeof window !== 'undefined' && window.location.hostname.includes('netlify.app') 
    ? '/.netlify/functions' 
    : ''
);

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
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