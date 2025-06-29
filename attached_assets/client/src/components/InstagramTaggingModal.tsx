import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Users, User, Navigation, MapPin, Search, CheckCircle, Plus } from 'lucide-react';

interface TagPosition {
  x: number;
  y: number;
}

interface PersonTag {
  id: string;
  type: 'person';
  position: TagPosition;
  userName: string;
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

// Enhanced location services with fallback
const searchLocationWithFallback = async (query: string) => {
  // Primary: OpenStreetMap Nominatim (more reliable)
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&extratags=1`
    );
    const data = await response.json();
    return data.filter((item: any) => item.importance > 0.3); // Filter by importance
  } catch (error) {
    console.warn('Nominatim search failed:', error);
    return [];
  }
};

const getCurrentLocationWithFallback = async () => {
  return new Promise<{ lat: number; lng: number; name: string }>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation wird von diesem Browser nicht unterstützt'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocoding with Nominatim
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          const locationName = data.display_name?.split(',')[0] || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          resolve({
            lat: latitude,
            lng: longitude,
            name: locationName
          });
        } catch (error) {
          resolve({
            lat: latitude,
            lng: longitude,
            name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          });
        }
      },
      (error) => {
        let message = 'Standort konnte nicht ermittelt werden';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Standortzugriff wurde verweigert';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Standort ist nicht verfügbar';
            break;
          case error.TIMEOUT:
            message = 'Standortabfrage zeitüberschreitung';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 60000
      }
    );
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

  // Search places using fallback method
  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchLocationWithFallback(query);
      setSuggestions(results.slice(0, 5));
      setIsLoading(false);
    } catch (error) {
      console.error('Location search error:', error);
      setSuggestions([]);
      setIsLoading(false);
    }
  }, []);

  // Get current location using enhanced fallback
  const getCurrentLocation = useCallback(async () => {
    setIsUsingGPS(true);
    try {
      const location = await getCurrentLocationWithFallback();
      onSelectLocation({
        name: location.name,
        coordinates: { lat: location.lat, lng: location.lng }
      });
    } catch (error) {
      console.error('Geolocation error:', error);
      alert((error as Error).message || 'Standort konnte nicht ermittelt werden.');
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

  // For mobile, use full-screen modal
  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[2147483647] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/50 border-b border-white/10">
          <h3 className="text-white font-semibold text-lg">Person markieren</h3>
          <button
            onClick={onCancel}
            className="text-white/60 hover:text-white transition-colors p-2 touch-manipulation"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-black/30 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Nach Person suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 text-white placeholder-white/60 pl-12 pr-4 py-4 rounded-2xl border border-white/20 focus:border-white/40 focus:outline-none text-base"
            />
          </div>
        </div>

        {/* Compact User List */}
        <div className="max-h-60 overflow-y-auto p-3">
          {filteredUsers.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {filteredUsers.slice(0, 8).map((user) => (
                <button
                  key={user.deviceId}
                  onClick={() => onSelectPerson(user)}
                  className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 hover:border-white/20 touch-manipulation"
                >
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.displayName || user.userName}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {(user.displayName || user.userName)[0]?.toUpperCase()}
                    </div>
                  )}
                  
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-white font-medium text-sm truncate">{user.displayName || user.userName}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/60">
              <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Keine Personen gefunden</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop version
  return (
    <div 
      className="absolute z-[2147483647]"
      style={{
        left: position.x > 60 ? 'auto' : '20px',
        right: position.x > 60 ? '20px' : 'auto',
        top: position.y > 60 ? 'auto' : '20px',
        bottom: position.y > 60 ? '20px' : 'auto',
      }}
    >
      <div className="bg-black/95 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 w-56">
        {/* Header */}
        <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-white font-medium text-sm">Person wählen</h3>
          <button
            onClick={onCancel}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-white/60" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Suchen..."
              className="w-full pl-7 pr-3 py-2 bg-white/10 text-white placeholder-white/60 rounded-lg border border-white/20 focus:border-white/40 focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Compact User List */}
        <div className="max-h-40 overflow-y-auto">
          {filteredUsers.length > 0 ? (
            <div className="space-y-1 p-2">
              {filteredUsers.slice(0, 6).map((user) => (
                <button
                  key={`${user.userName}_${user.deviceId}`}
                  onClick={() => onSelectPerson(user)}
                  className="w-full flex items-center gap-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-transparent hover:border-white/10"
                >
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.displayName || user.userName}
                      className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {(user.displayName || user.userName)[0]?.toUpperCase()}
                    </div>
                  )}
                  
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-white font-medium text-xs truncate">{user.displayName || user.userName}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-white/60">
              <User className="w-6 h-6 mx-auto mb-1 opacity-50" />
              <p className="text-xs">Keine Personen gefunden</p>
            </div>
          )}
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
  const [showUserDrawer, setShowUserDrawer] = useState(false);
  const [showLocationDrawer, setShowLocationDrawer] = useState(false);
  const [pendingTagPosition, setPendingTagPosition] = useState<TagPosition | null>(null);
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

    setPendingTagPosition({ x: boundedX, y: boundedY });
    setShowUserDrawer(true);
  }, [isTagMode]);

  const handlePersonSelect = useCallback((user: GalleryUser) => {
    if (!pendingTagPosition) return;

    const newTag: PersonTag = {
      id: Date.now().toString(),
      type: 'person',
      position: pendingTagPosition,
      userName: user.userName,
      displayName: user.displayName
    };

    setTags(prev => [...prev, newTag]);
    setPendingTagPosition(null);
    setShowUserDrawer(false);
  }, [pendingTagPosition]);

  const handleLocationSelect = useCallback((location: { name: string; coordinates?: { lat: number; lng: number } }) => {
    const locationTag: LocationTag = {
      id: `location_${Date.now()}`,
      type: 'location',
      position: { x: 50, y: 15 }, // Top center
      locationName: location.name,
      coordinates: location.coordinates || null
    };

    setTags(prev => [...prev, locationTag]);
    setShowLocationDrawer(false);
  }, []);

  const handleAddLocation = useCallback(() => {
    setShowLocationDrawer(true);
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


          </div>
        </div>

        {/* Bottom Controls */}
        <div className="p-4 space-y-3">
          {/* Control Buttons Row */}
          <div className="flex gap-3">
            {/* Person Tagging Toggle */}
            <button
              onClick={() => setIsTagMode(!isTagMode)}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-xl font-medium transition-colors min-h-[48px] touch-manipulation ${
                isTagMode
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-sm">{isTagMode ? 'Aktiv' : 'Personen'}</span>
            </button>

            {/* Location Tagging Button */}
            <button
              onClick={handleAddLocation}
              className="flex-1 flex items-center justify-center space-x-2 py-4 rounded-xl font-medium transition-colors bg-white/10 text-white hover:bg-white/20 min-h-[48px] touch-manipulation"
            >
              <Navigation className="w-5 h-5" />
              <span className="text-sm">Ort</span>
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

      {/* User Selection Bottom Drawer */}
      {showUserDrawer && (
        <div className="fixed inset-x-0 bottom-0 z-[2147483647] bg-black/95 backdrop-blur-lg rounded-t-2xl border-t border-white/20 max-h-[60vh] sm:max-h-96">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-white font-semibold text-lg">Person markieren</h3>
            <button
              onClick={() => setShowUserDrawer(false)}
              className="text-white/60 hover:text-white transition-colors p-2 touch-manipulation"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(60vh - 80px)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {galleryUsers.map((user) => (
                <button
                  key={`${user.userName}_${user.deviceId}`}
                  onClick={() => handlePersonSelect(user)}
                  className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all min-h-[60px] touch-manipulation"
                >
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.displayName || user.userName}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {(user.displayName || user.userName)[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-white font-medium text-base truncate">
                      {user.displayName || user.userName}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Location Selection Bottom Drawer */}
      {showLocationDrawer && (
        <div className="fixed inset-x-0 bottom-0 z-[2147483647] bg-black/95 backdrop-blur-lg rounded-t-2xl border-t border-white/20 max-h-[50vh] sm:max-h-96">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-white font-semibold text-lg">Ort hinzufügen</h3>
            <button
              onClick={() => setShowLocationDrawer(false)}
              className="text-white/60 hover:text-white transition-colors p-2 touch-manipulation"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-4">
            <div className="space-y-4">
              {/* GPS Location Button */}
              <button
                onClick={async () => {
                  try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                      navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 20000,
                        maximumAge: 60000
                      });
                    });
                    
                    const response = await fetch(
                      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&addressdetails=1`
                    );
                    const data = await response.json();
                    
                    const locationName = data.name || data.display_name?.split(',')[0] || 'Aktueller Standort';
                    handleLocationSelect({
                      name: locationName,
                      coordinates: { lat: position.coords.latitude, lng: position.coords.longitude }
                    });
                  } catch (error) {
                    console.error('GPS error:', error);
                    alert('Standort konnte nicht ermittelt werden');
                  }
                }}
                className="w-full flex items-center gap-3 p-4 bg-green-600 hover:bg-green-700 rounded-xl transition-colors min-h-[56px] touch-manipulation"
              >
                <MapPin className="w-6 h-6 text-white" />
                <span className="text-white font-medium text-base">Aktueller Standort verwenden</span>
              </button>
              
              {/* Manual Location Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ort manuell eingeben..."
                  className="w-full pl-12 pr-4 py-4 bg-white/10 text-white placeholder-white/60 rounded-xl border border-white/20 focus:border-white/40 focus:outline-none text-base min-h-[56px] touch-manipulation"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      handleLocationSelect({ name: e.currentTarget.value.trim() });
                    }
                  }}
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};