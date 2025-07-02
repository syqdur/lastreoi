import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, X, MapPin, Navigation, Building, Home, ShoppingBag, Coffee, Camera, TreePine } from 'lucide-react';

interface PersonTag {
  id: string;
  x: number; // Percentage (0-100)
  y: number; // Percentage (0-100)
  user: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
}

// Legacy support for existing MediaTag types
interface TagPosition {
  x: number;
  y: number;
}

interface LocationTag {
  id: string;
  type: 'location';
  position: TagPosition;
  locationName: string;
  coordinates?: { lat: number; lng: number } | null;
}

interface TextTag {
  id: string;
  type: 'text';
  position: TagPosition;
  text: string;
  fontSize?: number;
  color?: string;
}

// Convert PersonTag to legacy format for compatibility
interface LegacyPersonTag {
  id: string;
  type: 'person';
  position: TagPosition;
  userName: string;
  deviceId: string;
  displayName?: string;
}

type MediaTag = LegacyPersonTag | LocationTag | TextTag;

interface GalleryUser {
  userName: string;
  deviceId: string;
  displayName?: string;
  profilePicture?: string;
  lastVisited?: string;
}

interface SimpleTaggingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tags: MediaTag[]) => void;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  isDarkMode: boolean;
  galleryUsers: GalleryUser[];
}



export const SimpleTaggingModal: React.FC<SimpleTaggingModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  mediaUrl,
  mediaType,
  isDarkMode,
  galleryUsers
}) => {
  const [personTags, setPersonTags] = useState<PersonTag[]>([]);
  const [locationTags, setLocationTags] = useState<LocationTag[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchInterface, setShowSearchInterface] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null);
  const [showTags, setShowTags] = useState(true);
  const [tagMode, setTagMode] = useState<'person' | 'location'>('person');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return galleryUsers.slice(0, 10); // Show recent users
    return galleryUsers.filter(user => 
      (user.displayName || user.userName).toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [galleryUsers, searchTerm]);

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      throw new Error('Geolocation wird nicht unterstützt');
    }
    
    return new Promise<{lat: number, lng: number}>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error('Standort konnte nicht ermittelt werden'));
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 60000
        }
      );
    });
  }, []);

  // Enhanced reverse geocoding with smart location detection
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&extratags=1`
      );
      const data = await response.json();
      
      if (data) {
        // Prioritize meaningful location names
        if (data.name) {
          return data.name;
        }
        
        // Check for specific place types
        const address = data.address || {};
        const placeName = 
          address.restaurant || 
          address.hotel || 
          address.shop || 
          address.attraction ||
          address.building ||
          address.house_name ||
          address.amenity ||
          address.leisure ||
          address.tourism;
          
        if (placeName) {
          return placeName;
        }
        
        // Fall back to neighborhood or area
        const areaName = 
          address.suburb ||
          address.neighbourhood ||
          address.hamlet ||
          address.village ||
          address.town ||
          address.city;
          
        if (areaName) {
          return areaName;
        }
        
        // Last resort: first part of display_name
        if (data.display_name) {
          return data.display_name.split(',')[0];
        }
      }
      
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }, []);

  // Enhanced location search with better filtering
  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setLocationSuggestions([]);
      return;
    }
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&extratags=1`
      );
      const data = await response.json();
      
      // Filter and prioritize meaningful locations
      const filteredLocations = data
        .filter((item: any) => {
          // Prioritize places with names over just addresses
          return item.name || item.display_name;
        })
        .map((item: any) => ({
          ...item,
          priority: item.name ? 1 : 0, // Named places get higher priority
          category: item.category || 'place'
        }))
        .sort((a: any, b: any) => b.priority - a.priority);
      
      setLocationSuggestions(filteredLocations);
    } catch (error) {
      console.error('Location search error:', error);
      setLocationSuggestions([]);
    }
  }, []);

  // Handle image/video click for tagging
  const handleMediaClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!mediaRef.current || !containerRef.current) return;
    
    const rect = mediaRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = ((clientX - containerRect.left) / containerRect.width) * 100;
    const y = ((clientY - containerRect.top) / containerRect.height) * 100;
    
    setPendingPosition({ x, y });
    
    if (tagMode === 'person') {
      setShowSearchInterface(true);
      setShowLocationSearch(false);
    } else {
      setShowLocationSearch(true);
      setShowSearchInterface(false);
    }
    
    setSearchTerm('');
  }, [tagMode]);

  // Add person tag
  const addPersonTag = useCallback((user: GalleryUser) => {
    if (!pendingPosition) return;
    
    // Check if user is already tagged
    const isAlreadyTagged = personTags.some(tag => tag.user.id === user.deviceId);
    if (isAlreadyTagged) return;
    
    const newTag: PersonTag = {
      id: `tag_${Date.now()}`,
      x: pendingPosition.x,
      y: pendingPosition.y,
      user: {
        id: user.deviceId,
        name: user.displayName || user.userName,
        username: user.userName,
        avatar: user.profilePicture
      }
    };
    
    setPersonTags(prev => [...prev, newTag]);
    setShowSearchInterface(false);
    setPendingPosition(null);
  }, [pendingPosition, personTags]);

  // Add location tag
  const addLocationTag = useCallback((locationName: string, coordinates?: { lat: number; lng: number }) => {
    if (!pendingPosition) return;
    
    const newTag: LocationTag = {
      id: `location_${Date.now()}`,
      type: 'location',
      position: { x: pendingPosition.x, y: pendingPosition.y },
      locationName,
      coordinates
    };
    
    setLocationTags(prev => [...prev, newTag]);
    setShowLocationSearch(false);
    setPendingPosition(null);
    setSearchTerm('');
  }, [pendingPosition]);

  // Add current location
  const addCurrentLocation = useCallback(async () => {
    if (!pendingPosition) return;
    
    setIsLoadingLocation(true);
    try {
      const coords = await getCurrentLocation();
      const locationName = await reverseGeocode(coords.lat, coords.lng);
      addLocationTag(locationName, coords);
    } catch (error) {
      // Default position if GPS fails
      addLocationTag('Aktueller Standort');
    } finally {
      setIsLoadingLocation(false);
    }
  }, [pendingPosition, getCurrentLocation, reverseGeocode, addLocationTag]);

  // Remove person tag
  const removePersonTag = useCallback((tagId: string) => {
    setPersonTags(prev => prev.filter(tag => tag.id !== tagId));
  }, []);

  // Remove location tag
  const removeLocationTag = useCallback((tagId: string) => {
    setLocationTags(prev => prev.filter(tag => tag.id !== tagId));
  }, []);

  // Search locations with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (showLocationSearch && searchTerm) {
        searchLocations(searchTerm);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, showLocationSearch, searchLocations]);

  // Get label position (avoid going off screen)
  const getLabelPosition = (x: number, y: number) => {
    return {
      left: x > 70 ? 'auto' : `${x + 2}%`,
      right: x > 70 ? `${100 - x + 2}%` : 'auto',
      top: y > 50 ? 'auto' : `${y + 2}%`,
      bottom: y > 50 ? `${100 - y + 2}%` : 'auto',
    };
  };

  // Convert all tags to MediaTags for compatibility with existing code
  const handleConfirm = useCallback(() => {
    const legacyPersonTags: MediaTag[] = personTags.map(tag => ({
      id: tag.id,
      type: 'person' as const,
      position: { x: tag.x, y: tag.y },
      userName: tag.user.username,
      deviceId: tag.user.id,
      displayName: tag.user.name
    }));
    
    const allTags: MediaTag[] = [...legacyPersonTags, ...locationTags];
    onConfirm(allTags);
  }, [personTags, locationTags, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-[9999] overflow-hidden touch-manipulation">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 backdrop-blur-sm safe-area-inset-top">
        <div className="flex items-center justify-between p-4 text-white">
          <button
            onClick={onClose}
            className="p-3 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-center flex-1">
            {tagMode === 'person' ? 'Personen markieren' : 'Ort markieren'}
          </h1>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors min-h-[44px]"
          >
            Fertig
          </button>
        </div>
        
        {/* Mode Selector */}
        <div className="flex mx-4 mb-4 bg-white bg-opacity-10 rounded-lg p-1">
          <button
            onClick={() => setTagMode('person')}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
              tagMode === 'person' 
                ? 'bg-white text-black' 
                : 'text-white hover:bg-white hover:bg-opacity-20'
            }`}
          >
            <Search className="w-4 h-4 mr-2" />
            Personen
          </button>
          <button
            onClick={() => setTagMode('location')}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
              tagMode === 'location' 
                ? 'bg-white text-black' 
                : 'text-white hover:bg-white hover:bg-opacity-20'
            }`}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Ort
          </button>
        </div>
      </div>

      {/* Media Container */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center cursor-crosshair"
        onClick={handleMediaClick}
      >
        {mediaType === 'image' ? (
          <img
            ref={mediaRef as React.RefObject<HTMLImageElement>}
            src={mediaUrl}
            alt="Media to tag"
            className="max-w-full max-h-full object-contain"
            draggable={false}
          />
        ) : (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={mediaUrl}
            className="max-w-full max-h-full object-contain"
            controls={false}
            muted
            playsInline
          />
        )}

        {/* Person Tag Dots */}
        {showTags && personTags.map(tag => (
          <div key={tag.id} className="absolute group">
            {/* Dot */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
              onClick={(e) => {
                e.stopPropagation();
                removePersonTag(tag.id);
              }}
            >
              <div className="w-6 h-6 bg-white rounded-full border-2 border-blue-500 flex items-center justify-center animate-pulse">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
            </div>

            {/* Label */}
            <div
              className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={getLabelPosition(tag.x, tag.y)}
            >
              <div className="bg-black bg-opacity-80 text-white px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap">
                {tag.user.name}
              </div>
            </div>
          </div>
        ))}

        {/* Location Tag Dots */}
        {showTags && locationTags.map(tag => (
          <div key={tag.id} className="absolute group">
            {/* Dot */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: `${tag.position.x}%`, top: `${tag.position.y}%` }}
              onClick={(e) => {
                e.stopPropagation();
                removeLocationTag(tag.id);
              }}
            >
              <div className="w-6 h-6 bg-white rounded-full border-2 border-green-500 flex items-center justify-center animate-pulse">
                <MapPin className="w-3 h-3 text-green-500" />
              </div>
            </div>

            {/* Label */}
            <div
              className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={getLabelPosition(tag.position.x, tag.position.y)}
            >
              <div className="bg-black bg-opacity-80 text-white px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap">
                {tag.locationName}
              </div>
            </div>
          </div>
        ))}

        {/* Pending Tag Position */}
        {pendingPosition && (
          <div
            className="absolute w-6 h-6 bg-white rounded-full border-2 border-blue-500 transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
            style={{ left: `${pendingPosition.x}%`, top: `${pendingPosition.y}%` }}
          >
            <div className="w-2 h-2 bg-blue-500 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        )}
      </div>

      {/* Bottom Search Interface */}
      {showSearchInterface && (
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl max-h-[60vh] overflow-hidden">
          {/* Search Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Wen möchtest du markieren?</h2>
              <button
                onClick={() => {
                  setShowSearchInterface(false);
                  setPendingPosition(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Nach Person suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* User List */}
          <div className="overflow-y-auto max-h-[40vh]">
            {!searchTerm && (
              <div className="px-4 py-2">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Kürzlich aktiv</p>
              </div>
            )}
            
            {filteredUsers.map(user => {
              const isTagged = personTags.some(tag => tag.user.id === user.deviceId);
              
              return (
                <button
                  key={user.deviceId}
                  onClick={() => !isTagged && addPersonTag(user)}
                  className={`w-full flex items-center px-4 py-3 hover:bg-gray-50 transition-colors min-h-[64px] ${
                    isTagged ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={isTagged}
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white font-semibold mr-3 flex-shrink-0">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.displayName || user.userName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg">
                        {(user.displayName || user.userName).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {user.displayName || user.userName}
                    </p>
                    <p className="text-sm text-gray-500 truncate">@{user.userName}</p>
                  </div>
                  
                  {/* Tagged Indicator */}
                  {isTagged && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  )}
                </button>
              );
            })}
            
            {filteredUsers.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-gray-500">Keine Personen gefunden</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location Search Interface */}
      {showLocationSearch && (
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl max-h-[60vh] overflow-hidden safe-area-inset-bottom">
          {/* Location Search Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Ort hinzufügen</h2>
              <button
                onClick={() => {
                  setShowLocationSearch(false);
                  setPendingPosition(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Current Location Button */}
            <button
              onClick={addCurrentLocation}
              disabled={isLoadingLocation}
              className="w-full flex items-center justify-center py-3 px-4 mb-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors min-h-[48px]"
            >
              <Navigation className="w-5 h-5 mr-2" />
              {isLoadingLocation ? 'Standort wird ermittelt...' : 'Aktueller Standort'}
            </button>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Nach Ort suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
                autoFocus
              />
            </div>
          </div>

          {/* Location Suggestions */}
          <div className="overflow-y-auto max-h-[30vh]">
            {locationSuggestions.map((location, index) => {
              // Get location type for better categorization
              const locationType = location.type || location.category || 'place';
              
              // Get appropriate icon for location type
              const getIcon = () => {
                switch (locationType) {
                  case 'restaurant':
                  case 'cafe':
                  case 'bar':
                  case 'food':
                    return <Coffee className="w-5 h-5 text-white" />;
                  case 'shop':
                  case 'retail':
                  case 'mall':
                    return <ShoppingBag className="w-5 h-5 text-white" />;
                  case 'building':
                  case 'office':
                    return <Building className="w-5 h-5 text-white" />;
                  case 'house':
                  case 'residential':
                    return <Home className="w-5 h-5 text-white" />;
                  case 'tourism':
                  case 'attraction':
                  case 'museum':
                    return <Camera className="w-5 h-5 text-white" />;
                  case 'park':
                  case 'natural':
                  case 'leisure':
                    return <TreePine className="w-5 h-5 text-white" />;
                  default:
                    return <MapPin className="w-5 h-5 text-white" />;
                }
              };
              
              // Get color for location type
              const getColor = () => {
                switch (locationType) {
                  case 'restaurant':
                  case 'cafe':
                  case 'bar':
                  case 'food':
                    return 'bg-orange-500 group-hover:bg-orange-600';
                  case 'shop':
                  case 'retail':
                  case 'mall':
                    return 'bg-purple-500 group-hover:bg-purple-600';
                  case 'building':
                  case 'office':
                    return 'bg-gray-500 group-hover:bg-gray-600';
                  case 'house':
                  case 'residential':
                    return 'bg-blue-500 group-hover:bg-blue-600';
                  case 'tourism':
                  case 'attraction':
                  case 'museum':
                    return 'bg-red-500 group-hover:bg-red-600';
                  case 'park':
                  case 'natural':
                  case 'leisure':
                    return 'bg-green-500 group-hover:bg-green-600';
                  default:
                    return 'bg-green-500 group-hover:bg-green-600';
                }
              };
              
              // Get label for location type  
              const getLabel = () => {
                switch (locationType) {
                  case 'restaurant': return 'Restaurant';
                  case 'cafe': return 'Café';
                  case 'bar': return 'Bar';
                  case 'food': return 'Gastronomie';
                  case 'shop':
                  case 'retail': return 'Geschäft';
                  case 'mall': return 'Einkaufszentrum';
                  case 'building': return 'Gebäude';
                  case 'office': return 'Büro';
                  case 'house':
                  case 'residential': return 'Wohnhaus';
                  case 'tourism':
                  case 'attraction': return 'Sehenswürdigkeit';
                  case 'museum': return 'Museum';
                  case 'park': return 'Park';
                  case 'natural': return 'Natur';
                  case 'leisure': return 'Freizeit';
                  default: return 'Ort';
                }
              };
              
              return (
                <button
                  key={index}
                  onClick={() => addLocationTag(
                    location.name || location.display_name.split(',')[0], 
                    {
                      lat: parseFloat(location.lat),
                      lng: parseFloat(location.lon)
                    }
                  )}
                  className="w-full flex items-center px-4 py-3 hover:bg-gray-50 transition-colors min-h-[64px] group"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 transition-colors ${getColor()}`}>
                    {getIcon()}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-gray-900 truncate group-hover:text-gray-700">
                      {location.name || location.display_name.split(',')[0]}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {getLabel()} • {location.display_name.split(',').slice(1, 3).join(', ')}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 ml-2">
                    {Math.round(parseFloat(location.importance || 0) * 100) || ''}
                  </div>
                </button>
              );
            })}
            
            {searchTerm && locationSuggestions.length === 0 && (
              <button
                onClick={() => addLocationTag(searchTerm)}
                className="w-full flex items-center px-4 py-3 hover:bg-gray-50 transition-colors min-h-[64px]"
              >
                <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">
                    "{searchTerm}" hinzufügen
                  </p>
                  <p className="text-sm text-gray-500">
                    Eigenen Ort hinzufügen
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tag Counter */}
      {(personTags.length > 0 || locationTags.length > 0) && !showSearchInterface && !showLocationSearch && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 safe-area-inset-bottom">
          <div className="bg-black bg-opacity-80 text-white px-4 py-2 rounded-full text-sm font-medium">
            {personTags.length > 0 && `${personTags.length} ${personTags.length === 1 ? 'Person' : 'Personen'}`}
            {personTags.length > 0 && locationTags.length > 0 && ', '}
            {locationTags.length > 0 && `${locationTags.length} ${locationTags.length === 1 ? 'Ort' : 'Orte'}`}
            {' markiert'}
          </div>
        </div>
      )}

      {/* Instructions */}
      {personTags.length === 0 && locationTags.length === 0 && !showSearchInterface && !showLocationSearch && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 safe-area-inset-bottom">
          <div className="bg-black bg-opacity-80 text-white px-4 py-2 rounded-full text-sm">
            {tagMode === 'person' ? 'Tippe auf das Bild, um Personen zu markieren' : 'Tippe auf das Bild, um einen Ort zu markieren'}
          </div>
        </div>
      )}
    </div>
  );
};