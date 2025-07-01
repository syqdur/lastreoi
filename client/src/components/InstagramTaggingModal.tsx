import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Users, User, Plus, Navigation, MapPin, Search, Type, Hash } from 'lucide-react';

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

interface TextTag {
  id: string;
  type: 'text';
  position: TagPosition;
  text: string;
  fontSize?: number;
  color?: string;
}

type MediaTag = PersonTag | LocationTag | TextTag;

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
  tags: MediaTag[];
}

interface LocationSearchPopupProps {
  position: TagPosition;
  onSelectLocation: (location: { name: string; coordinates?: { lat: number; lng: number } }) => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

interface TextInputPopupProps {
  position: TagPosition;
  onConfirm: (text: string) => void;
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

// Text Input Popup Component
const TextInputPopup: React.FC<TextInputPopupProps> = ({
  position,
  onConfirm,
  onCancel,
  isDarkMode
}) => {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onConfirm(text.trim());
    }
  };

  return (
    <div 
      className="absolute z-[2147483647] min-w-[300px]"
      style={{
        left: position.x > 70 ? 'auto' : '10px',
        right: position.x > 70 ? '10px' : 'auto',
        top: position.y > 70 ? 'auto' : '10px',
        bottom: position.y > 70 ? '10px' : 'auto',
      }}
    >
      <div className={`rounded-2xl shadow-2xl border backdrop-blur-xl ${
        isDarkMode 
          ? 'bg-gray-900/95 border-gray-700/50' 
          : 'bg-white/95 border-gray-200/50'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/30 dark:border-gray-700/30">
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Text hinzufügen
          </h3>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="relative">
            <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Dein Text..."
              className={`w-full pl-12 pr-4 py-3 rounded-xl border text-lg font-medium transition-all ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:bg-gray-800/70 focus:border-purple-500/50' 
                  : 'bg-gray-50/50 border-gray-200/50 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-purple-500/50'
              } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
              maxLength={100}
            />
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                isDarkMode 
                  ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700/70' 
                  : 'bg-gray-100/50 text-gray-600 hover:bg-gray-200/70'
              }`}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                text.trim()
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg' 
                  : 'bg-gray-300/50 text-gray-400 cursor-not-allowed'
              }`}
            >
              Hinzufügen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SearchPopup: React.FC<SearchPopupProps> = ({
  position,
  onSelectPerson,
  onCancel,
  galleryUsers,
  isDarkMode,
  tags
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filter out already tagged users to prevent duplicates
  const alreadyTaggedUsers = new Set(
    tags
      .filter(tag => tag.type === 'person')
      .map(tag => `${(tag as PersonTag).userName}_${(tag as PersonTag).deviceId}`)
  );

  const filteredUsers = galleryUsers.filter(user => {
    const userKey = `${user.userName}_${user.deviceId}`;
    const matchesSearch = (user.displayName || user.userName).toLowerCase().includes(searchTerm.toLowerCase());
    const notAlreadyTagged = !alreadyTaggedUsers.has(userKey);
    return matchesSearch && notAlreadyTagged;
  });

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
      <div className={`rounded-2xl shadow-2xl border backdrop-blur-xl ${
        isDarkMode 
          ? 'bg-gray-900/95 border-gray-700/50' 
          : 'bg-white/95 border-gray-200/50'
      }`}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200/30 dark:border-gray-700/30">
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Wen möchtest du markieren?
          </h3>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200/30 dark:border-gray-700/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nach Person suchen..."
              className={`w-full pl-12 pr-4 py-3 rounded-xl border text-base transition-all ${
                isDarkMode
                  ? 'bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:bg-gray-800/70 focus:border-purple-500/50'
                  : 'bg-gray-50/50 border-gray-200/50 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-purple-500/50'
              } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
            />
          </div>
        </div>

        {/* Recent Users Section - Filter out already tagged users */}
        {galleryUsers.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-200/30 dark:border-gray-700/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                Kürzlich markiert
              </p>
            </div>
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {galleryUsers.slice(0, 6).filter(user => {
                const userKey = `${user.userName}_${user.deviceId}`;
                return !alreadyTaggedUsers.has(userKey);
              }).map((user) => (
                <button
                  key={`${user.userName}_${user.deviceId}`}
                  onClick={() => onSelectPerson(user)}
                  className="flex-shrink-0 flex flex-col items-center space-y-2 p-2 rounded-xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all hover:scale-105"
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-purple-500/20">
                      {user.profilePicture ? (
                        <img 
                          src={user.profilePicture} 
                          alt={user.displayName || user.userName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">
                          {(user.displayName || user.userName).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {/* Online indicator */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 max-w-[60px] truncate">
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
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                  {user.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt={user.displayName || user.userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (user.displayName || user.userName).charAt(0).toUpperCase()
                  )}
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
  const [isTagMode, setIsTagMode] = useState(true); // Start with tagging enabled by default
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

    // Check if user is already tagged to prevent duplicates
    const isAlreadyTagged = tags.some(tag => 
      tag.type === 'person' && 
      (tag as PersonTag).userName === user.userName && 
      (tag as PersonTag).deviceId === user.deviceId
    );

    if (isAlreadyTagged) {
      console.log('🚫 User already tagged, preventing duplicate:', user.userName);
      setPendingTag(null);
      return;
    }

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
  }, [pendingTag, tags]);

  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [pendingTextPosition, setPendingTextPosition] = useState<TagPosition | null>(null);

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

  const handleTextConfirm = useCallback((text: string) => {
    if (!pendingTextPosition) return;

    const textTag: TextTag = {
      id: `text_${Date.now()}`,
      type: 'text',
      position: pendingTextPosition,
      text,
      fontSize: 18,
      color: '#ffffff'
    };

    setTags(prev => [...prev, textTag]);
    setShowTextInput(false);
    setPendingTextPosition(null);
  }, [pendingTextPosition]);

  const handleAddText = useCallback(() => {
    const centerPosition = { x: 50, y: 50 };
    setPendingTextPosition(centerPosition);
    setShowTextInput(true);
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
    <div className="fixed inset-0 z-[2147483646] bg-black/95 backdrop-blur-sm flex items-center justify-center">
      <div className="relative w-full h-full max-w-md mx-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 text-white border-b border-white/10">
          <button
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-white/10 transition-all hover:scale-110"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold">Markierungen</h1>
            <p className="text-xs text-white/60 mt-0.5">
              {isTagMode ? 'Tippe auf das Bild zum markieren' : 'Verwende die Buttons unten'}
            </p>
          </div>
          <button
            onClick={handleConfirm}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-bold transition-all shadow-lg hover:scale-105"
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
                {/* Tag Dot or Text */}
                {tag.type === 'text' ? (
                  <div 
                    className="bg-transparent text-white font-bold text-lg shadow-lg cursor-pointer select-none"
                    style={{ 
                      fontSize: `${(tag as TextTag).fontSize || 18}px`,
                      color: (tag as TextTag).color || '#ffffff',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                    }}
                  >
                    {(tag as TextTag).text}
                  </div>
                ) : (
                  <>
                    <div className="w-6 h-6 bg-white rounded-full border-2 border-purple-500 animate-pulse shadow-lg" />
                    
                    {/* Tag Label */}
                    <div className={`absolute mt-2 px-3 py-1.5 bg-black/90 text-white text-xs font-medium rounded-full whitespace-nowrap transform -translate-x-1/2 backdrop-blur-sm ${
                      tag.position.y > 80 ? 'bottom-8' : 'top-8'
                    }`}>
                      {tag.type === 'person' 
                        ? (tag as PersonTag).displayName || (tag as PersonTag).userName
                        : tag.type === 'location'
                        ? (tag as LocationTag).locationName
                        : ''
                      }
                    </div>
                  </>
                )}
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
                tags={tags}
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

            {/* Text Input Popup */}
            {showTextInput && pendingTextPosition && (
              <TextInputPopup
                position={pendingTextPosition}
                onConfirm={handleTextConfirm}
                onCancel={() => {
                  setShowTextInput(false);
                  setPendingTextPosition(null);
                }}
                isDarkMode={isDarkMode}
              />
            )}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="p-4 space-y-4 border-t border-white/10">
          {/* Tag Status Indicator */}
          {tags.length > 0 && (
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="flex items-center gap-2">
                {personTags.length > 0 && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-purple-500/20 rounded-full">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span className="text-white text-sm font-medium">
                      {personTags.length}
                    </span>
                  </div>
                )}
                {tags.filter(t => t.type === 'location').length > 0 && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 rounded-full">
                    <MapPin className="w-4 h-4 text-green-400" />
                    <span className="text-white text-sm font-medium">
                      {tags.filter(t => t.type === 'location').length}
                    </span>
                  </div>
                )}
                {tags.filter(t => t.type === 'text').length > 0 && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 rounded-full">
                    <Type className="w-4 h-4 text-blue-400" />
                    <span className="text-white text-sm font-medium">
                      {tags.filter(t => t.type === 'text').length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Control Buttons Row */}
          <div className="grid grid-cols-4 gap-2">
            {/* Person Tagging Toggle */}
            <button
              onClick={() => setIsTagMode(!isTagMode)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl font-medium transition-all ${
                isTagMode
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
              }`}
            >
              <Users className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold">Personen</span>
            </button>

            {/* Location Tagging Button */}
            <button
              onClick={handleAddLocation}
              className="flex flex-col items-center justify-center p-3 rounded-xl font-medium transition-all bg-white/10 text-white hover:bg-white/20 hover:scale-105"
            >
              <MapPin className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold">Ort</span>
            </button>

            {/* Text Tagging Button */}
            <button
              onClick={handleAddText}
              className="flex flex-col items-center justify-center p-3 rounded-xl font-medium transition-all bg-white/10 text-white hover:bg-white/20 hover:scale-105"
            >
              <Type className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold">Text</span>
            </button>

            {/* Clear All Tags */}
            <button
              onClick={() => setTags([])}
              disabled={tags.length === 0}
              className={`flex flex-col items-center justify-center p-3 rounded-xl font-medium transition-all ${
                tags.length > 0
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:scale-105'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              }`}
            >
              <Hash className="w-6 h-6 mb-1 rotate-45" />
              <span className="text-xs font-bold">Löschen</span>
            </button>
          </div>

          {/* Instructions */}
          <div className="text-center">
            <p className="text-white/60 text-xs">
              {isTagMode 
                ? '✨ Tippe auf das Bild um Personen zu markieren'
                : '👆 Aktiviere "Personen" zum Markieren'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};