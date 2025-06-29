import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, X, Navigation } from 'lucide-react';
import { PlaceTag, PlaceSearchResult } from '../../types/tagging';

interface PlacePickerProps {
  onPlaceSelect: (place: PlaceTag) => void;
  onCancel: () => void;
  isDarkMode?: boolean;
}

// Mock Google Places API for now
const mockPlacesSearch = async (query: string): Promise<PlaceSearchResult[]> => {
  if (!query || query.length < 3) return [];
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock search results
  const mockResults: PlaceSearchResult[] = [
    {
      place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      name: 'Starbucks Coffee',
      formatted_address: '123 Main St, New York, NY 10001, USA',
      geometry: {
        location: { lat: 40.7128, lng: -74.0060 }
      },
      types: ['cafe', 'food', 'point_of_interest', 'establishment'],
      rating: 4.2
    },
    {
      place_id: 'ChIJKxjxuaNZwokRBHGBNe6u5P8',
      name: 'Central Park',
      formatted_address: 'New York, NY, USA',
      geometry: {
        location: { lat: 40.7829, lng: -73.9654 }
      },
      types: ['park', 'tourist_attraction', 'point_of_interest', 'establishment'],
      rating: 4.8
    },
    {
      place_id: 'ChIJOwg_06VPwokRYv534QaPC8g',
      name: 'The High Line',
      formatted_address: 'New York, NY 10011, USA',
      geometry: {
        location: { lat: 40.7480, lng: -74.0048 }
      },
      types: ['tourist_attraction', 'point_of_interest', 'establishment'],
      rating: 4.6
    }
  ].filter(place => 
    place.name.toLowerCase().includes(query.toLowerCase()) ||
    place.formatted_address.toLowerCase().includes(query.toLowerCase())
  );
  
  return mockResults;
};

export const PlacePicker: React.FC<PlacePickerProps> = ({
  onPlaceSelect,
  onCancel,
  isDarkMode = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const performSearch = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await mockPlacesSearch(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search places:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounced search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handlePlaceSelect = (place: PlaceSearchResult) => {
    const placeTag: PlaceTag = {
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      geometry: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      }
    };
    
    onPlaceSelect(placeTag);
  };

  const handleCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      // Mock reverse geocoding for current location
      const currentPlace: PlaceTag = {
        placeId: 'current_location',
        name: 'Current Location',
        address: 'Your current location',
        geometry: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
      };

      onPlaceSelect(currentPlace);
    } catch (error) {
      console.error('Failed to get current location:', error);
      alert('Unable to get your current location. Please try searching for a place instead.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchResults.length === 1) {
      handlePlaceSelect(searchResults[0]);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Add Location</div>
        <button
          onClick={onCancel}
          className={`p-1 rounded-full transition-colors ${
            isDarkMode 
              ? 'hover:bg-gray-800/50 text-gray-400' 
              : 'hover:bg-gray-100/50 text-gray-600'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search for a place..."
          className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm transition-colors ${
            isDarkMode
              ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-gray-600'
              : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400'
          } focus:outline-none focus:ring-2 focus:ring-green-500/30`}
        />
      </div>

      <button
        onClick={handleCurrentLocation}
        disabled={isGettingLocation}
        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
          isDarkMode 
            ? 'hover:bg-gray-800/50 border-gray-700' 
            : 'hover:bg-gray-100/50 border-gray-300'
        } border border-dashed`}
      >
        <div className="p-2 rounded-full bg-blue-500/20">
          <Navigation className={`w-4 h-4 text-blue-500 ${isGettingLocation ? 'animate-spin' : ''}`} />
        </div>
        <div className="text-left">
          <div className="font-medium">
            {isGettingLocation ? 'Getting location...' : 'Use Current Location'}
          </div>
          <div className="text-xs opacity-70">Tag your current location</div>
        </div>
      </button>

      {isLoading && (
        <div className="p-3 text-center text-sm opacity-70">Searching...</div>
      )}

      {searchResults.length > 0 && (
        <div className="max-h-40 overflow-y-auto space-y-1">
          {searchResults.map((place) => (
            <button
              key={place.place_id}
              onClick={() => handlePlaceSelect(place)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${
                isDarkMode 
                  ? 'hover:bg-gray-800/50' 
                  : 'hover:bg-gray-100/50'
              }`}
            >
              <div className="p-2 rounded-full bg-green-500/20 flex-shrink-0">
                <MapPin className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{place.name}</div>
                <div className="text-xs opacity-70 truncate">{place.formatted_address}</div>
                {place.rating && (
                  <div className="text-xs text-yellow-500 mt-1">
                    ★ {place.rating.toFixed(1)}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {searchTerm.length >= 3 && !isLoading && searchResults.length === 0 && (
        <div className="p-3 text-center text-sm opacity-70">
          No places found. Try a different search term.
        </div>
      )}
    </div>
  );
};