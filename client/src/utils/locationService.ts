interface LocationResult {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface LocationSearchResult {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  type: string;
}

// GPS Position Options
const GPS_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 60000 // 1 minute cache
};

// Get current GPS position
export const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation wird von diesem Browser nicht unterstützt'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Standortberechtigung verweigert'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Standort nicht verfügbar'));
            break;
          case error.TIMEOUT:
            reject(new Error('Standortabfrage zeitüberschreitung'));
            break;
          default:
            reject(new Error('Unbekannter Standortfehler'));
        }
      },
      GPS_OPTIONS
    );
  });
};

// Reverse geocoding using Nominatim API
export const reverseGeocode = async (lat: number, lng: number): Promise<LocationResult> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&extratags=1&namedetails=1&zoom=18&accept-language=de`
    );
    
    if (!response.ok) {
      throw new Error('Reverse geocoding fehlgeschlagen');
    }
    
    const data = await response.json();
    
    // Prioritize meaningful location names
    const name = 
      data.namedetails?.name ||
      data.display_name?.split(',')[0] ||
      data.address?.amenity ||
      data.address?.shop ||
      data.address?.tourism ||
      data.address?.building ||
      data.address?.house_name ||
      `${data.address?.city || data.address?.town || data.address?.village || 'Unbekannter Ort'}`;
    
    const address = data.display_name || `${lat}, ${lng}`;
    
    return {
      name,
      address,
      coordinates: { lat, lng }
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      name: 'Aktueller Standort',
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      coordinates: { lat, lng }
    };
  }
};

// Search locations using Nominatim API
export const searchLocations = async (query: string): Promise<LocationSearchResult[]> => {
  if (!query || query.length < 2) return [];
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&extratags=1&namedetails=1&limit=8&accept-language=de`
    );
    
    if (!response.ok) {
      throw new Error('Location search fehlgeschlagen');
    }
    
    const data = await response.json();
    
    return data
      .filter((item: any) => item.importance > 0.3) // Filter by importance
      .map((item: any) => {
        const name = 
          item.namedetails?.name ||
          item.display_name?.split(',')[0] ||
          item.address?.amenity ||
          item.address?.shop ||
          item.address?.tourism ||
          item.address?.building ||
          item.name ||
          'Unbekannter Ort';
        
        const type = 
          item.type ||
          item.class ||
          item.address?.amenity ||
          item.address?.shop ||
          'location';
        
        return {
          name,
          address: item.display_name,
          coordinates: {
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
          },
          type
        };
      })
      .slice(0, 8);
  } catch (error) {
    console.error('Location search error:', error);
    return [];
  }
};

// Get location type icon
export const getLocationTypeIcon = (type: string): string => {
  const typeMap: { [key: string]: string } = {
    'restaurant': '🍽️',
    'cafe': '☕',
    'shop': '🛍️',
    'hotel': '🏨',
    'attraction': '📸',
    'park': '🌳',
    'building': '🏢',
    'amenity': '📍',
    'tourism': '🎭',
    'default': '📍'
  };
  
  return typeMap[type] || typeMap.default;
};

// Get location type color
export const getLocationTypeColor = (type: string): string => {
  const colorMap: { [key: string]: string } = {
    'restaurant': 'text-orange-500',
    'cafe': 'text-amber-600',
    'shop': 'text-purple-500',
    'hotel': 'text-blue-500',
    'attraction': 'text-red-500',
    'park': 'text-green-500',
    'building': 'text-gray-500',
    'amenity': 'text-indigo-500',
    'tourism': 'text-pink-500',
    'default': 'text-gray-400'
  };
  
  return colorMap[type] || colorMap.default;
};