import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Users, MapPin, Navigation } from 'lucide-react';

interface TagPosition {
  x: number;
  y: number;
}

interface PersonTag {
  id: string;
  type: 'person';
  position: TagPosition;
  userName: string;
  deviceId: string;
  displayName?: string;
}

interface LocationTag {
  id: string;
  type: 'location';
  position: TagPosition;
  locationName: string;
  coordinates?: { lat: number; lng: number } | null;
}

type MediaTag = PersonTag | LocationTag;

interface GalleryUser {
  userName: string;
  deviceId: string;
  displayName?: string;
  profilePicture?: string;
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
  const [tags, setTags] = useState<MediaTag[]>([]);
  const [isTaggingMode, setIsTaggingMode] = useState(false);
  const [showQuickUsers, setShowQuickUsers] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<TagPosition | null>(null);
  const [customLocationName, setCustomLocationName] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const mediaRef = useRef<HTMLDivElement>(null);

  // Show more users for better selection
  const quickUsers = galleryUsers.slice(0, 8);
  const allUsers = galleryUsers;

  // Enhanced location search function
  const searchLocationSuggestions = async (query: string) => {
    setIsSearchingLocations(true);
    try {
      // Use OpenStreetMap Nominatim API for location search
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=de&addressdetails=1`
      );
      const data = await response.json();
      
      const suggestions = data.map((item: any) => ({
        name: item.display_name.split(',')[0],
        address: item.display_name,
        coordinates: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) }
      }));
      
      setLocationSuggestions(suggestions);
    } catch (error) {
      console.error('Error searching locations:', error);
      setLocationSuggestions([]);
    } finally {
      setIsSearchingLocations(false);
    }
  };

  // Location search with debounce
  useEffect(() => {
    if (customLocationName && customLocationName.length > 2) {
      const debounceTimer = setTimeout(async () => {
        await searchLocationSuggestions(customLocationName);
      }, 500);
      
      return () => clearTimeout(debounceTimer);
    } else {
      setLocationSuggestions([]);
    }
  }, [customLocationName]);

  const handleMediaClick = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!isTaggingMode) return;

    const mediaContainer = mediaRef.current;
    if (!mediaContainer) return;

    // Get the actual media element (img or video)
    const mediaElement = mediaContainer.querySelector('img, video') as HTMLElement;
    if (!mediaElement) return;

    const containerRect = mediaContainer.getBoundingClientRect();
    const mediaRect = mediaElement.getBoundingClientRect();

    // Calculate click position relative to the actual media element
    let clientX: number, clientY: number;
    if ('touches' in event) {
      // Touch event
      const touch = event.touches[0] || event.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      // Mouse event
      clientX = event.clientX;
      clientY = event.clientY;
    }

    // Calculate percentage position relative to the media element
    const x = ((clientX - mediaRect.left) / mediaRect.width) * 100;
    const y = ((clientY - mediaRect.top) / mediaRect.height) * 100;

    // Ensure position is within bounds with padding
    const boundedX = Math.max(5, Math.min(95, x));
    const boundedY = Math.max(5, Math.min(95, y));

    console.log('Media click:', { 
      clientX, clientY, 
      mediaRect: { left: mediaRect.left, top: mediaRect.top, width: mediaRect.width, height: mediaRect.height },
      calculatedPosition: { x: boundedX, y: boundedY }
    });

    setPendingPosition({ x: boundedX, y: boundedY });
    setShowQuickUsers(true);
  }, [isTaggingMode]);

  const handleQuickUserSelect = useCallback((user: GalleryUser) => {
    if (!pendingPosition) return;

    const newTag: PersonTag = {
      id: Date.now().toString(),
      type: 'person',
      position: pendingPosition,
      userName: user.userName,
      deviceId: user.deviceId,
      displayName: user.displayName
    };

    setTags(prev => [...prev, newTag]);
    setPendingPosition(null);
    setShowQuickUsers(false);
    setIsTaggingMode(false);
  }, [pendingPosition]);

  const addCurrentLocation = useCallback(async () => {
    if (!pendingPosition) return;

    try {
      // Get user's location with high accuracy
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve, 
          reject, 
          { 
            enableHighAccuracy: true, 
            timeout: 20000, 
            maximumAge: 60000 
          }
        );
      });

      const { latitude, longitude } = position.coords;

      // Try Google Maps Geocoding API first
      let locationName = 'Aktueller Standort';
      
      try {
        // Using Google's reverse geocoding for better accuracy
        const googleResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
        );
        
        if (googleResponse.ok) {
          const googleData = await googleResponse.json();
          if (googleData.results?.[0]) {
            // Get the most specific location (establishment, point of interest, or street address)
            const result = googleData.results[0];
            const addressComponents = result.address_components;
            
            // Look for establishment, point of interest, or premise
            const establishment = addressComponents.find((comp: any) => 
              comp.types.includes('establishment') || 
              comp.types.includes('point_of_interest') ||
              comp.types.includes('premise')
            );
            
            if (establishment) {
              locationName = establishment.long_name;
            } else {
              // Fallback to formatted address without street number
              const parts = result.formatted_address.split(',');
              locationName = parts[0] || 'Aktueller Standort';
            }
          }
        }
      } catch (googleError) {
        console.warn('Google geocoding failed, trying OpenStreetMap:', googleError);
        
        // Fallback to OpenStreetMap Nominatim
        try {
          const osmResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          
          if (osmResponse.ok) {
            const osmData = await osmResponse.json();
            
            // Try to get a meaningful location name
            const address = osmData.address;
            if (address) {
              locationName = address.amenity || 
                           address.shop || 
                           address.tourism || 
                           address.leisure ||
                           address.building ||
                           address.house_name ||
                           `${address.city || address.town || address.village}, ${address.country}` ||
                           osmData.display_name?.split(',')[0] ||
                           'Aktueller Standort';
            }
          }
        } catch (osmError) {
          console.warn('OpenStreetMap geocoding failed:', osmError);
        }
      }

      const newTag: LocationTag = {
        id: Date.now().toString(),
        type: 'location',
        position: pendingPosition,
        locationName,
        coordinates: {
          lat: latitude,
          lng: longitude
        }
      };

      setTags(prev => [...prev, newTag]);
      setPendingPosition(null);
      setShowQuickUsers(false);
      setIsTaggingMode(false);
    } catch (error) {
      console.error('Location error:', error);
      
      // Show user-friendly error and still allow manual location entry
      const manualLocation = prompt('Standort konnte nicht automatisch ermittelt werden. Bitte geben Sie den Standort manuell ein:');
      
      if (manualLocation && manualLocation.trim()) {
        const newTag: LocationTag = {
          id: Date.now().toString(),
          type: 'location',
          position: pendingPosition,
          locationName: manualLocation.trim(),
          coordinates: null
        };

        setTags(prev => [...prev, newTag]);
      }
      
      setPendingPosition(null);
      setShowQuickUsers(false);
      setIsTaggingMode(false);
    }
  }, [pendingPosition]);

  const removeTag = useCallback((tagId: string) => {
    setTags(prev => prev.filter(tag => tag.id !== tagId));
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(tags);
  }, [tags, onConfirm]);

  // Enhanced current location function with better error handling
  const getCurrentLocationEnhanced = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation wird von diesem Browser nicht unterstützt'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 60000 // 1 minute cache
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          let errorMessage = 'Standort konnte nicht ermittelt werden';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Standortzugriff verweigert. Bitte erlauben Sie den Standortzugriff.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Standort nicht verfügbar. Bitte versuchen Sie es erneut.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Standortermittlung dauert zu lange. Bitte versuchen Sie es erneut.';
              break;
          }
          reject(new Error(errorMessage));
        },
        options
      );
    });
  };

  // Reverse geocoding to get location name from coordinates
  const getLocationFromCoordinates = async (lat: number, lng: number): Promise<{ name: string; address: string }> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      // Extract meaningful location name
      const address = data.address || {};
      const name = address.amenity || 
                   address.tourism || 
                   address.shop || 
                   address.building || 
                   address.house_number && address.road ? `${address.house_number} ${address.road}` :
                   address.road || 
                   address.suburb || 
                   address.village || 
                   address.town || 
                   address.city || 
                   'Unbekannter Ort';
                   
      return {
        name: name,
        address: data.display_name || `${lat}, ${lng}`
      };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return {
        name: 'Aktueller Standort',
        address: `${lat}, ${lng}`
      };
    }
  };

  // Enhanced location tagging handlers
  const handleAddCurrentLocation = async () => {
    if (!pendingPosition) return;
    
    setIsLoadingLocation(true);
    try {
      const coordinates = await getCurrentLocationEnhanced();
      const location = await getLocationFromCoordinates(coordinates.latitude, coordinates.longitude);
      
      const newTag: LocationTag = {
        id: crypto.randomUUID(),
        type: 'location',
        position: pendingPosition,
        locationName: location.name,
        coordinates: { lat: coordinates.latitude, lng: coordinates.longitude }
      };
      
      setTags(prev => [...prev, newTag]);
      setShowQuickUsers(false);
      setShowLocationInput(false);
      setPendingPosition(null);
      setIsTaggingMode(false);
    } catch (error) {
      console.error('Error adding current location:', error);
      alert(error instanceof Error ? error.message : 'Fehler beim Hinzufügen des Standorts');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleAddCustomLocation = async () => {
    if (!customLocationName.trim() || !pendingPosition) return;
    
    setIsLoadingLocation(true);
    try {
      const newTag: LocationTag = {
        id: crypto.randomUUID(),
        type: 'location',
        position: pendingPosition,
        locationName: customLocationName.trim(),
        coordinates: null
      };
      
      setTags(prev => [...prev, newTag]);
      setShowQuickUsers(false);
      setShowLocationInput(false);
      setCustomLocationName('');
      setLocationSuggestions([]);
      setPendingPosition(null);
      setIsTaggingMode(false);
    } catch (error) {
      console.error('Error adding custom location:', error);
      alert('Fehler beim Hinzufügen des Standorts');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleSelectLocationSuggestion = async (suggestion: any) => {
    if (!pendingPosition) return;
    
    setIsLoadingLocation(true);
    try {
      const newTag: LocationTag = {
        id: crypto.randomUUID(),
        type: 'location',
        position: pendingPosition,
        locationName: suggestion.name,
        coordinates: suggestion.coordinates || null
      };
      
      setTags(prev => [...prev, newTag]);
      setShowQuickUsers(false);
      setShowLocationInput(false);
      setCustomLocationName('');
      setLocationSuggestions([]);
      setPendingPosition(null);
      setIsTaggingMode(false);
    } catch (error) {
      console.error('Error adding suggested location:', error);
      alert('Fehler beim Hinzufügen des Standorts');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2147483647] bg-black/90 flex items-center justify-center">
      <div className="relative w-full h-full max-w-5xl max-h-[100vh] sm:max-h-[95vh] flex flex-col">
        {/* Header - More Compact */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900/98 backdrop-blur-xl border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">Markieren</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Media Container - Enhanced for Mobile */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          <div
            ref={mediaRef}
            className="relative w-full h-full flex items-center justify-center cursor-crosshair touch-manipulation"
            onClick={handleMediaClick}
            onTouchEnd={handleMediaClick}
            style={{ minHeight: '300px', maxHeight: 'calc(100vh - 200px)' }}
          >
            {mediaType === 'video' ? (
              <video
                src={mediaUrl}
                className="max-w-full max-h-full w-auto h-auto object-contain"
                controls={!isTaggingMode}
                muted
                playsInline
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto'
                }}
              />
            ) : (
              <img
                src={mediaUrl}
                alt="Media to tag"
                className="max-w-full max-h-full w-auto h-auto object-contain"
                draggable={false}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto'
                }}
                onLoad={(e) => {
                  // Ensure the image is properly sized after loading
                  const img = e.target as HTMLImageElement;
                  const container = mediaRef.current;
                  if (container && img) {
                    console.log('Image loaded:', img.naturalWidth, 'x', img.naturalHeight);
                    console.log('Container size:', container.offsetWidth, 'x', container.offsetHeight);
                  }
                }}
              />
            )}

            {/* Existing Tags */}
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="absolute"
                style={{
                  left: `${tag.position.x}%`,
                  top: `${tag.position.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="relative group">
                  {/* Tag Dot */}
                  <div className="w-6 h-6 bg-white rounded-full border-2 border-blue-500 flex items-center justify-center animate-pulse">
                    {tag.type === 'person' ? (
                      <Users className="w-3 h-3 text-blue-500" />
                    ) : (
                      <MapPin className="w-3 h-3 text-green-500" />
                    )}
                  </div>

                  {/* Tag Label - Always Visible */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded-md text-xs whitespace-nowrap">
                    {tag.type === 'person' 
                      ? (tag.displayName || tag.userName)
                      : tag.locationName
                    }
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTag(tag.id);
                      }}
                      className="ml-2 text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Pending Tag Position */}
            {pendingPosition && (
              <div
                className="absolute w-6 h-6 bg-yellow-400 rounded-full animate-ping"
                style={{
                  left: `${pendingPosition.x}%`,
                  top: `${pendingPosition.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            )}
          </div>

          {/* Quick User Selection Popup - Fixed Mobile Positioning */}
          {showQuickUsers && pendingPosition && (
            <div className="fixed bottom-0 left-0 right-0 z-[2147483648] bg-gray-900/98 backdrop-blur-xl border-t border-white/20 shadow-2xl sm:absolute sm:inset-x-8 sm:bottom-20 sm:rounded-3xl sm:border sm:max-w-4xl sm:mx-auto">
              <div className="p-4 pb-safe">
                <div className="text-white text-lg font-bold mb-4 text-center">Person auswählen</div>
                
                {/* Quick Users - Enhanced Desktop Scrolling */}
                <div 
                  className="flex gap-3 overflow-x-auto overflow-y-hidden pb-3 mb-4 px-1"
                  style={{ 
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent'
                  }}
                  onWheel={(e) => {
                    // Enable horizontal scrolling with mouse wheel on desktop
                    if (e.deltaY !== 0) {
                      e.preventDefault();
                      e.currentTarget.scrollLeft += e.deltaY;
                    }
                  }}
                >
                  {quickUsers.map((user) => (
                    <button
                      key={user.deviceId}
                      onClick={() => handleQuickUserSelect(user)}
                      className="flex-shrink-0 flex flex-col items-center p-3 rounded-2xl bg-white/15 hover:bg-white/25 active:bg-white/35 transition-all duration-200 min-w-[80px] min-h-[100px] touch-manipulation cursor-pointer"
                    >
                      {/* Profile Picture or Avatar - Larger */}
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.displayName || user.userName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white/30 mb-2"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-base font-bold mb-2 border-2 border-white/30">
                          {(user.displayName?.[0] || user.userName[0]).toUpperCase()}
                        </div>
                      )}
                      <div className="text-white text-sm font-semibold truncate max-w-full text-center">
                        {user.displayName || user.userName}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Action Buttons - Mobile Friendly */}
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowLocationInput(true)}
                      className="flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl bg-green-600 hover:bg-green-700 active:bg-green-800 transition-colors text-white font-bold text-sm min-h-[48px] touch-manipulation"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Standort</span>
                    </button>
                    
                    <button
                      onClick={() => setShowAllUsers(true)}
                      className="flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 transition-colors text-white font-bold text-sm min-h-[48px] touch-manipulation"
                    >
                      <Users className="w-4 h-4" />
                      <span>Alle Nutzer</span>
                    </button>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowQuickUsers(false);
                      setPendingPosition(null);
                      setIsTaggingMode(false);
                    }}
                    className="p-3 rounded-2xl bg-gray-700 hover:bg-gray-600 active:bg-gray-500 transition-colors text-white font-bold text-base min-h-[48px] touch-manipulation"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Location Input Modal - Fixed Mobile Positioning */}
          {showLocationInput && pendingPosition && (
            <div className="fixed inset-0 z-[2147483649] bg-black/80 flex items-end sm:items-center justify-center">
              <div className="bg-gray-900/98 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl border border-white/20 shadow-2xl w-full sm:max-w-sm sm:mx-4 max-h-[90vh] sm:max-h-[80vh] flex flex-col">
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white text-lg font-bold">Standort hinzufügen</h3>
                    <button
                      onClick={() => {
                        setShowLocationInput(false);
                        setCustomLocationName('');
                        setLocationSuggestions([]);
                      }}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Current Location Button */}
                  <button
                    onClick={handleAddCurrentLocation}
                    disabled={isLoadingLocation}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
                      isLoadingLocation ? 'opacity-50 cursor-not-allowed' : ''
                    } bg-gradient-to-r from-green-500/20 to-blue-500/20 hover:from-green-500/30 hover:to-blue-500/30 text-green-300 backdrop-blur-sm border border-green-600/30 shadow-lg hover:shadow-xl`}
                  >
                    <MapPin className="w-4 h-4" />
                    {isLoadingLocation ? 'Standort wird ermittelt...' : 'GPS Standort verwenden'}
                  </button>

                  {/* Custom Location Input */}
                  <div className="space-y-3 relative">
                    <div className="relative">
                      <input
                        type="text"
                        value={customLocationName}
                        onChange={(e) => setCustomLocationName(e.target.value)}
                        placeholder="Standort eingeben (z.B. Eiffelturm, Paris)"
                        className="w-full px-4 py-3 rounded-2xl border-2 border-transparent bg-white/10 backdrop-blur-lg focus:border-green-500 focus:ring-4 focus:ring-green-500/20 focus:outline-none placeholder-gray-400 text-white transition-all duration-300"
                        autoFocus
                      />
                      {isSearchingLocations && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent"></div>
                        </div>
                      )}
                    </div>

                    {/* Location Suggestions Dropdown */}
                    {locationSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full bg-gray-900/95 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                        {locationSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSelectLocationSuggestion(suggestion)}
                            disabled={isLoadingLocation}
                            className={`w-full text-left px-4 py-3 hover:bg-green-500/10 transition-colors duration-200 border-b border-gray-700/30 last:border-b-0 ${
                              isLoadingLocation ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-white truncate">
                                  {suggestion.name}
                                </div>
                                <div className="text-sm text-gray-400 truncate">
                                  {suggestion.address}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={handleAddCustomLocation}
                      disabled={isLoadingLocation || !customLocationName.trim() || locationSuggestions.length > 0}
                      className={`w-full px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
                        isLoadingLocation || !customLocationName.trim() || locationSuggestions.length > 0
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:bg-white/20'
                      } bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:border-green-500 shadow-sm hover:shadow-md`}
                    >
                      {isLoadingLocation ? 'Wird hinzugefügt...' : 'Standort hinzufügen'}
                    </button>
                  </div>
                </div>
                
                <div className="p-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setShowLocationInput(false);
                      setCustomLocationName('');
                      setLocationSuggestions([]);
                    }}
                    className="w-full p-3 rounded-2xl bg-gray-700 hover:bg-gray-600 active:bg-gray-500 transition-colors text-white font-medium"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* All Users Modal - Fixed Mobile Positioning */}
          {showAllUsers && pendingPosition && (
            <div className="fixed inset-0 z-[2147483649] bg-black/80 flex items-end sm:items-center justify-center">
              <div className="bg-gray-900/98 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl border border-white/20 shadow-2xl w-full sm:max-w-sm sm:mx-4 max-h-[90vh] sm:max-h-[80vh] flex flex-col">
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white text-lg font-bold">Alle Nutzer</h3>
                    <button
                      onClick={() => setShowAllUsers(false)}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {allUsers.map((user) => (
                      <button
                        key={user.deviceId}
                        onClick={() => {
                          handleQuickUserSelect(user);
                          setShowAllUsers(false);
                        }}
                        className="flex flex-col items-center p-3 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/30 transition-all duration-200 touch-manipulation"
                      >
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.displayName || user.userName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white/30 mb-2"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold mb-2 border-2 border-white/30">
                            {(user.displayName?.[0] || user.userName[0]).toUpperCase()}
                          </div>
                        )}
                        <div className="text-white text-sm font-medium truncate max-w-full text-center">
                          {user.displayName || user.userName}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 border-t border-white/10">
                  <button
                    onClick={() => setShowAllUsers(false)}
                    className="w-full p-3 rounded-2xl bg-gray-700 hover:bg-gray-600 active:bg-gray-500 transition-colors text-white font-medium"
                  >
                    Schließen
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls - Responsive Design */}
        <div className="p-3 bg-gray-900/98 backdrop-blur-xl border-t border-white/10">
          <div className="flex flex-col gap-3 max-w-md mx-auto">
            {/* Primary Action Button */}
            <button
              onClick={() => setIsTaggingMode(!isTaggingMode)}
              className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 min-h-[52px] touch-manipulation ${
                isTaggingMode
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white/15 text-white hover:bg-white/25 active:bg-white/30'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-base font-semibold">
                {isTaggingMode ? 'Tippen zum Markieren' : 'Personen markieren'}
              </span>
              {tags.length > 0 && (
                <span className="bg-green-600 text-white px-2 py-1 rounded-full text-sm font-bold min-w-[24px] text-center">
                  {tags.length}
                </span>
              )}
            </button>

            {/* Secondary Actions */}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white rounded-xl transition-colors font-medium text-base min-h-[48px] touch-manipulation"
              >
                Abbrechen
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-xl transition-colors font-bold text-base min-h-[48px] touch-manipulation shadow-lg"
              >
                Fertig
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};