import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Users, User, Plus, Navigation, MapPin, Search } from 'lucide-react';

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

interface InstagramTaggingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tags: MediaTag[]) => void;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  isDarkMode: boolean;
  galleryUsers: GalleryUser[];
}

interface SearchPopupProps {
  position: TagPosition;
  onSelectPerson: (user: GalleryUser) => void;
  onCancel: () => void;
  galleryUsers: GalleryUser[];
  isDarkMode: boolean;
}

interface LocationSearchPopupProps {
  position: TagPosition;
  onSelectLocation: (location: { name: string; coordinates?: { lat: number; lng: number } }) => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

// Google Maps API integration
const loadGoogleMapsAPI = () => {
  return new Promise((resolve, reject) => {
    if ((window as any).google && (window as any).google.maps) {
      resolve((window as any).google);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAo-Ak_1bLGFriNq-LiQUQqzQfwYwleBfw&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve((window as any).google);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Location Search Popup Component
const LocationSearchPopup: React.FC<LocationSearchPopupProps> = ({
  position,
  onSelectLocation,
  onCancel,
  isDarkMode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingGPS, setIsUsingGPS] = useState(false);

  // Search places using Google Places API
  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      await loadGoogleMapsAPI();
      const google = (window as any).google;
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      
      const request = {
        query,
        fields: ['name', 'formatted_address', 'geometry']
      };

      service.textSearch(request, (results: any, status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setSuggestions(results.slice(0, 5));
        } else {
          setSuggestions([]);
        }
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Google Places API error:', error);
      // Fallback to Nominatim
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
        );
        const data = await response.json();
        setSuggestions(data);
      } catch (fallbackError) {
        console.error('Fallback search error:', fallbackError);
        setSuggestions([]);
      }
      setIsLoading(false);
    }
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    setIsUsingGPS(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Try Google Geocoding first
      try {
        await loadGoogleMapsAPI();
        const google = (window as any).google;
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({
          location: { lat: latitude, lng: longitude }
        });
        
        if (response.results[0]) {
          const place = response.results[0];
          onSelectLocation({
            name: place.formatted_address.split(',')[0],
            coordinates: { lat: latitude, lng: longitude }
          });
          return;
        }
      } catch (error) {
        console.error('Google Geocoding error:', error);
      }

      // Fallback to Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      const locationName = data.display_name?.split(',')[0] || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      onSelectLocation({
        name: locationName,
        coordinates: { lat: latitude, lng: longitude }
      });
    } catch (error) {
      console.error('Geolocation error:', error);
      alert('Standort konnte nicht ermittelt werden. Bitte manuell eingeben.');
    }
    setIsUsingGPS(false);
  }, [onSelectLocation]);

  useEffect(() => {
    const timer = setTimeout(() => searchPlaces(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, searchPlaces]);

  return (
    <div 
      className="absolute bg-black/90 backdrop-blur-md rounded-xl p-4 min-w-80 max-w-sm shadow-2xl border border-white/20"
      style={{
        left: position.x > 50 ? 'auto' : '0',
        right: position.x > 50 ? '0' : 'auto',
        top: position.y > 50 ? 'auto' : '100%',
        bottom: position.y > 50 ? '100%' : 'auto',
        transform: position.y > 50 ? 'translateY(-8px)' : 'translateY(8px)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium">Ort hinzufügen</h3>
        <button
          onClick={onCancel}
          className="p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* GPS Button */}
      <button
        onClick={getCurrentLocation}
        disabled={isUsingGPS}
        className="w-full flex items-center justify-center gap-2 py-2.5 mb-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg text-white text-sm font-medium transition-colors"
      >
        <Navigation className={`w-4 h-4 ${isUsingGPS ? 'animate-spin' : ''}`} />
        {isUsingGPS ? 'Standort wird ermittelt...' : 'Aktueller Standort'}
      </button>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Ort suchen..."
          className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
      </div>

      {/* Suggestions */}
      {isLoading && (
        <div className="text-white/60 text-sm text-center py-2">
          Suche...
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                const name = suggestion.name || suggestion.display_name?.split(',')[0] || 'Unbekannter Ort';
                const coordinates = suggestion.geometry?.location ? 
                  { lat: suggestion.geometry.location.lat(), lng: suggestion.geometry.location.lng() } :
                  suggestion.lat && suggestion.lon ?
                  { lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) } :
                  undefined;
                
                onSelectLocation({ name, coordinates });
              }}
              className="w-full text-left p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white text-sm font-medium">
                    {suggestion.name || suggestion.display_name?.split(',')[0]}
                  </div>
                  {(suggestion.formatted_address || suggestion.display_name) && (
                    <div className="text-white/60 text-xs">
                      {suggestion.formatted_address || suggestion.display_name}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {searchTerm && !isLoading && suggestions.length === 0 && (
        <button
          onClick={() => onSelectLocation({ name: searchTerm })}
          className="w-full text-left p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-white/60" />
            <span className="text-white text-sm">"{searchTerm}" hinzufügen</span>
          </div>
        </button>
      )}
    </div>
  );
};

const SearchPopup: React.FC<SearchPopupProps> = ({
  position,
  onSelectPerson,
  onCancel,
  galleryUsers,
  isDarkMode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filteredUsers = galleryUsers.filter(user =>
    (user.displayName || user.userName).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
      className="absolute z-[2147483647] min-w-[280px]"
      style={{
        left: position.x > 70 ? 'auto' : '10px',
        right: position.x > 70 ? '10px' : 'auto',
        top: position.y > 70 ? 'auto' : '10px',
        bottom: position.y > 70 ? '10px' : 'auto',
      }}
    >
      <div className={`rounded-xl shadow-2xl border ${
        isDarkMode 
          ? 'bg-gray-900/95 border-gray-700 backdrop-blur-lg' 
          : 'bg-white/95 border-gray-200 backdrop-blur-lg'
      }`}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Wen möchtest du markieren?
          </h3>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nach Person suchen..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
        </div>

        {/* Recent Users Section */}
        {galleryUsers.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Kürzlich markiert
            </p>
            <div className="flex space-x-2 overflow-x-auto">
              {galleryUsers.slice(0, 5).map((user) => (
                <button
                  key={`${user.userName}_${user.deviceId}`}
                  onClick={() => onSelectPerson(user)}
                  className="flex-shrink-0 flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                    {(user.displayName || user.userName).charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 max-w-[60px] truncate">
                    {(user.displayName || user.userName).split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* User List */}
        <div className="max-h-60 overflow-y-auto">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <button
                key={`${user.userName}_${user.deviceId}`}
                onClick={() => onSelectPerson(user)}
                className={`w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                  {(user.displayName || user.userName).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.displayName || user.userName}
                  </p>
                  {user.displayName && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      @{user.userName}
                    </p>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
              <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Keine Personen gefunden</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};

export const InstagramTaggingModal: React.FC<InstagramTaggingModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  mediaUrl,
  mediaType,
  isDarkMode,
  galleryUsers
}) => {
  const [tags, setTags] = useState<MediaTag[]>([]);
  const [isTagMode, setIsTagMode] = useState(false);
  const [pendingTag, setPendingTag] = useState<{ position: TagPosition } | null>(null);
  const [tagsVisible, setTagsVisible] = useState(true);
  const mediaRef = useRef<HTMLDivElement>(null);

  const handleMediaClick = useCallback((event: React.MouseEvent) => {
    if (!isTagMode) return;

    const rect = mediaRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    // Ensure tag is within bounds
    const boundedX = Math.max(5, Math.min(95, x));
    const boundedY = Math.max(5, Math.min(95, y));

    setPendingTag({ position: { x: boundedX, y: boundedY } });
  }, [isTagMode]);

  const handlePersonSelect = useCallback((user: GalleryUser) => {
    if (!pendingTag) return;

    const newTag: PersonTag = {
      id: Date.now().toString(),
      type: 'person',
      position: pendingTag.position,
      userName: user.userName,
      deviceId: user.deviceId,
      displayName: user.displayName
    };

    setTags(prev => [...prev, newTag]);
    setPendingTag(null);
  }, [pendingTag]);

  const [showLocationSearch, setShowLocationSearch] = useState(false);

  const handleLocationSelect = useCallback((location: { name: string; coordinates?: { lat: number; lng: number } }) => {
    const locationTag: LocationTag = {
      id: `location_${Date.now()}`,
      type: 'location',
      position: { x: 50, y: 15 }, // Top center
      locationName: location.name,
      coordinates: location.coordinates || null
    };

    setTags(prev => [...prev, locationTag]);
    setShowLocationSearch(false);
  }, []);

  const handleAddLocation = useCallback(() => {
    setShowLocationSearch(true);
  }, []);

  const handleRemoveTag = useCallback((tagId: string) => {
    setTags(prev => prev.filter(tag => tag.id !== tagId));
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(tags);
    onClose();
  }, [tags, onConfirm, onClose]);

  if (!isOpen) return null;

  const personTags = tags.filter(tag => tag.type === 'person') as PersonTag[];

  return (
    <div className="fixed inset-0 z-[2147483646] bg-black/90 flex items-center justify-center">
      <div className="relative w-full h-full max-w-md mx-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 text-white">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">Markierungen hinzufügen</h1>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Fertig
          </button>
        </div>

        {/* Media Container */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div
            ref={mediaRef}
            className={`relative max-w-full max-h-full rounded-lg overflow-hidden ${
              isTagMode ? 'cursor-crosshair' : 'cursor-default'
            }`}
            onClick={handleMediaClick}
          >
            {mediaType === 'image' ? (
              <img
                src={mediaUrl}
                alt="Media zum Markieren"
                className="max-w-full max-h-full object-contain select-none"
                draggable={false}
              />
            ) : (
              <video
                src={mediaUrl}
                className="max-w-full max-h-full object-contain"
                controls={!isTagMode}
                playsInline
                muted
              />
            )}

            {/* Existing Tags */}
            {tagsVisible && tags.map((tag) => (
              <div
                key={tag.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{
                  left: `${tag.position.x}%`,
                  top: `${tag.position.y}%`
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isTagMode) {
                    handleRemoveTag(tag.id);
                  }
                }}
              >
                {/* Tag Dot */}
                <div className="w-6 h-6 bg-white rounded-full border-2 border-blue-500 animate-pulse shadow-lg" />
                
                {/* Tag Label */}
                <div className={`absolute mt-2 px-3 py-1 bg-black/80 text-white text-xs rounded-full whitespace-nowrap transform -translate-x-1/2 ${
                  tag.position.y > 80 ? 'bottom-8' : 'top-8'
                }`}>
                  {tag.type === 'person' 
                    ? (tag as PersonTag).displayName || (tag as PersonTag).userName
                    : tag.type === 'location'
                    ? (tag as LocationTag).locationName
                    : ''
                  }
                </div>
              </div>
            ))}

            {/* Pending Tag Search Popup */}
            {pendingTag && (
              <SearchPopup
                position={pendingTag.position}
                onSelectPerson={handlePersonSelect}
                onCancel={() => setPendingTag(null)}
                galleryUsers={galleryUsers}
                isDarkMode={isDarkMode}
              />
            )}

            {/* Location Search Popup */}
            {showLocationSearch && (
              <LocationSearchPopup
                position={{ x: 50, y: 50 }}
                onSelectLocation={handleLocationSelect}
                onCancel={() => setShowLocationSearch(false)}
                isDarkMode={isDarkMode}
              />
            )}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="p-4 space-y-3">
          {/* Control Buttons Row */}
          <div className="flex gap-3">
            {/* Person Tagging Toggle */}
            <button
              onClick={() => setIsTagMode(!isTagMode)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-medium transition-colors ${
                isTagMode
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="hidden sm:inline">{isTagMode ? 'Aktiv' : 'Personen'}</span>
            </button>

            {/* Location Tagging Button */}
            <button
              onClick={handleAddLocation}
              className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-medium transition-colors bg-white/10 text-white hover:bg-white/20"
            >
              <Navigation className="w-5 h-5" />
              <span className="hidden sm:inline">Ort</span>
            </button>
          </div>

          {/* Tag Counter */}
          {personTags.length > 0 && (
            <div className="text-center text-white/80 text-sm">
              {personTags.length} {personTags.length === 1 ? 'Person' : 'Personen'} markiert
            </div>
          )}

          {/* Clear All Tags */}
          {tags.length > 0 && (
            <button
              onClick={() => setTags([])}
              className="w-full py-2 text-white/60 hover:text-white text-sm transition-colors"
            >
              Alle Markierungen entfernen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};