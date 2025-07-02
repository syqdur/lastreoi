import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Users, User, Plus, Navigation, MapPin, Search, Type, Hash, Coffee, ShoppingBag, Building, Home, Camera, TreePine } from 'lucide-react';

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

// Location Search Popup Component
const LocationSearchPopup: React.FC<LocationSearchPopupProps> = ({
  position,
  onSelectLocation,
  onCancel,
  isDarkMode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{
    name: string;
    address: string;
    coordinates?: { lat: number; lng: number };
    type: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Using Nominatim API for location search
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&extratags=1`
      );
      const data = await response.json();
      
      const locations = data.map((item: any) => ({
        name: item.display_name.split(',')[0] || item.display_name,
        address: item.display_name,
        coordinates: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
        type: item.type || 'unknown'
      }));
      
      setSuggestions(locations);
    } catch (error) {
      console.error('Location search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('GPS ist auf diesem Gerät nicht verfügbar');
      return;
    }

    setIsLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Reverse geocoding to get location name
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );
      const data = await response.json();
      
      const locationName = data.display_name?.split(',')[0] || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      
      onSelectLocation({
        name: locationName,
        coordinates: { lat: latitude, lng: longitude }
      });
    } catch (error) {
      console.error('GPS error:', error);
      alert('GPS-Position konnte nicht abgerufen werden');
    } finally {
      setIsLoading(false);
    }
  }, [onSelectLocation]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchLocations(searchTerm);
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, searchLocations]);

  const getLocationIcon = (type: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      'restaurant': Coffee,
      'cafe': Coffee,
      'shop': ShoppingBag,
      'building': Building,
      'house': Home,
      'attraction': Camera,
      'park': TreePine,
      'default': MapPin
    };
    
    const IconComponent = iconMap[type] || iconMap.default;
    return <IconComponent className="w-4 h-4" />;
  };

  const getLocationTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'restaurant': 'Restaurant',
      'cafe': 'Café',
      'shop': 'Geschäft',
      'building': 'Gebäude',
      'house': 'Wohnhaus',
      'attraction': 'Sehenswürdigkeit',
      'park': 'Park',
      'default': 'Ort'
    };
    
    return typeMap[type] || typeMap.default;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2147483647] p-4">
      <div className={`w-full max-w-md rounded-2xl p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} shadow-2xl`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Ort hinzufügen
          </h3>
          <button
            onClick={onCancel}
            className={`p-2 rounded-full hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'text-gray-600'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ort suchen..."
                className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            <button
              onClick={getCurrentLocation}
              disabled={isLoading}
              className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              GPS
            </button>
          </div>

          {isLoading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Suche läuft...
              </p>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {suggestions.map((location, index) => (
                <button
                  key={index}
                  onClick={() => onSelectLocation(location)}
                  className={`w-full text-left p-3 rounded-xl hover:bg-gray-100 ${
                    isDarkMode ? 'hover:bg-gray-800' : ''
                  } transition-colors flex items-center gap-3`}
                >
                  <div className="text-green-500">
                    {getLocationIcon(location.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {location.name}
                    </p>
                    <p className={`text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {getLocationTypeLabel(location.type)} • {location.address}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchTerm && !isLoading && suggestions.length === 0 && (
            <div className="text-center py-4">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Keine Orte gefunden
              </p>
            </div>
          )}
        </div>
      </div>
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

  const handleSubmit = () => {
    if (text.trim()) {
      onConfirm(text.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2147483647] p-4">
      <div className={`w-full max-w-md rounded-2xl p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} shadow-2xl`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Text hinzufügen
          </h3>
          <button
            onClick={onCancel}
            className={`p-2 rounded-full hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'text-gray-600'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Text eingeben..."
            rows={3}
            className={`w-full px-4 py-3 rounded-xl border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
          />
          
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className={`flex-1 py-3 rounded-xl border ${
                isDarkMode 
                  ? 'border-gray-700 text-gray-400 hover:bg-gray-800' 
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Abbrechen
            </button>
            <button
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="flex-1 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hinzufügen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Search Popup Component
const SearchPopup: React.FC<SearchPopupProps> = ({
  position,
  onSelectPerson,
  onCancel,
  galleryUsers,
  isDarkMode,
  tags
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter users based on search term and exclude already tagged users
  const filteredUsers = galleryUsers.filter(user => {
    const isAlreadyTagged = tags.some(tag => 
      tag.type === 'person' && tag.deviceId === user.deviceId
    );
    
    if (isAlreadyTagged) return false;
    
    const searchLower = searchTerm.toLowerCase();
    const userName = user.userName?.toLowerCase() || '';
    const displayName = user.displayName?.toLowerCase() || '';
    
    return userName.includes(searchLower) || displayName.includes(searchLower);
  });

  // Get recent users (first 5 untagged users)
  const recentUsers = galleryUsers
    .filter(user => !tags.some(tag => tag.type === 'person' && tag.deviceId === user.deviceId))
    .slice(0, 5);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-[2147483647] p-4">
      <div className={`w-full max-w-md rounded-t-3xl p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} shadow-2xl max-h-[80vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Wen möchtest du markieren?
          </h3>
          <button
            onClick={onCancel}
            className={`p-2 rounded-full hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'text-gray-600'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nach Person suchen..."
              className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
          </div>

          {!searchTerm && recentUsers.length > 0 && (
            <div>
              <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Kürzlich markiert
              </h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {recentUsers.map((user, index) => (
                  <button
                    key={`recent-${user.deviceId}-${user.userName}-${index}`}
                    onClick={() => onSelectPerson(user)}
                    className="flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center text-white font-medium text-xs">
                      {user.profilePicture ? (
                        <img 
                          src={user.profilePicture} 
                          alt={user.displayName || user.userName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span>{(user.displayName || user.userName).charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className={`text-xs text-center max-w-14 truncate font-normal ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {user.displayName || user.userName}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <button
                key={`${user.deviceId}-${user.userName}`}
                onClick={() => onSelectPerson(user)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 ${
                  isDarkMode ? 'hover:bg-gray-800' : ''
                } transition-colors`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                  {user.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt={user.displayName || user.userName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm">{(user.displayName || user.userName).charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-normal text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user.displayName || user.userName}
                  </p>
                  {user.displayName && (
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      @{user.userName}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <User className={`w-12 h-12 mx-auto mb-2 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {searchTerm ? 'Keine Personen gefunden' : 'Keine Personen verfügbar'}
              </p>
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
  const [isTagMode, setIsTagMode] = useState(true);
  const [tagModeType, setTagModeType] = useState<'person' | 'location' | 'text'>('person');
  const [pendingTag, setPendingTag] = useState<{ position: TagPosition } | null>(null);
  const [tagsVisible, setTagsVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBottomInterface, setShowBottomInterface] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
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

    const position = { x: boundedX, y: boundedY };
    setPendingTag({ position });

    if (tagModeType === 'person') {
      setShowBottomInterface(true);
    } else if (tagModeType === 'location') {
      setShowLocationSearch(true);
    } else if (tagModeType === 'text') {
      setShowTextInput(true);
    }
  }, [isTagMode, tagModeType]);

  const handlePersonSelect = useCallback((user: GalleryUser) => {
    if (!pendingTag) return;

    // Check if user is already tagged to prevent duplicates
    const isAlreadyTagged = tags.some(tag => 
      tag.type === 'person' && tag.deviceId === user.deviceId
    );

    if (isAlreadyTagged) {
      alert('Diese Person wurde bereits markiert!');
      setPendingTag(null);
      setShowBottomInterface(false);
      setSearchTerm('');
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
    setShowBottomInterface(false);
    setSearchTerm('');
  }, [pendingTag, tags]);

  const handleLocationSelect = useCallback((location: { name: string; coordinates?: { lat: number; lng: number } }) => {
    if (!pendingTag) return;

    const locationTag: LocationTag = {
      id: Date.now().toString(),
      type: 'location',
      position: pendingTag.position,
      locationName: location.name,
      coordinates: location.coordinates || null
    };

    setTags(prev => [...prev, locationTag]);
    setPendingTag(null);
    setShowLocationSearch(false);
  }, [pendingTag]);

  const handleTextConfirm = useCallback((text: string) => {
    if (!pendingTag) return;

    const textTag: TextTag = {
      id: Date.now().toString(),
      type: 'text',
      position: pendingTag.position,
      text: text
    };

    setTags(prev => [...prev, textTag]);
    setPendingTag(null);
    setShowTextInput(false);
  }, [pendingTag]);

  const handleRemoveTag = useCallback((tagId: string) => {
    setTags(prev => prev.filter(tag => tag.id !== tagId));
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(tags);
    onClose();
  }, [tags, onConfirm, onClose]);

  const handleCancel = useCallback(() => {
    setPendingTag(null);
    setShowBottomInterface(false);
    setShowLocationSearch(false);
    setShowTextInput(false);
    setSearchTerm('');
  }, []);

  // Filter users based on search term and exclude already tagged users
  const filteredUsers = galleryUsers.filter(user => {
    const isAlreadyTagged = tags.some(tag => 
      tag.type === 'person' && tag.deviceId === user.deviceId
    );
    
    if (isAlreadyTagged) return false;
    
    const searchLower = searchTerm.toLowerCase();
    const userName = user.userName?.toLowerCase() || '';
    const displayName = user.displayName?.toLowerCase() || '';
    
    return userName.includes(searchLower) || displayName.includes(searchLower);
  });

  const getPersonTagCount = () => tags.filter(tag => tag.type === 'person').length;
  const getLocationTagCount = () => tags.filter(tag => tag.type === 'location').length;
  const getTextTagCount = () => tags.filter(tag => tag.type === 'text').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[2147483647]">
      {/* Minimalist Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            Fertig
          </button>
        </div>
      </div>

      {/* Media Container */}
      <div 
        ref={mediaRef}
        className="relative w-full h-full flex items-center justify-center cursor-crosshair"
        onClick={handleMediaClick}
      >
        {mediaType === 'image' ? (
          <img
            src={mediaUrl}
            alt="Media to tag"
            className="max-w-full max-h-full object-contain"
            draggable={false}
          />
        ) : (
          <video
            src={mediaUrl}
            className="max-w-full max-h-full object-contain"
            controls={false}
            muted
            playsInline
          />
        )}

        {/* Render Tags */}
        {tagsVisible && tags.map((tag) => (
          <div
            key={tag.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{
              left: `${tag.position.x}%`,
              top: `${tag.position.y}%`
            }}
          >
            {/* Tag Dot */}
            <div className="w-6 h-6 bg-white rounded-full border-2 border-blue-500 animate-pulse flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>

            {/* Tag Label */}
            <div className={`absolute ${tag.position.y < 50 ? 'top-8' : 'bottom-8'} left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity`}>
              <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm whitespace-nowrap">
                {tag.type === 'person' && (tag.displayName || tag.userName)}
                {tag.type === 'location' && tag.locationName}
                {tag.type === 'text' && tag.text}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTag(tag.id);
                  }}
                  className="ml-2 text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Pending Tag Dot */}
        {pendingTag && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${pendingTag.position.x}%`,
              top: `${pendingTag.position.y}%`
            }}
          >
            <div className="w-6 h-6 bg-white rounded-full border-2 border-purple-500 animate-pulse flex items-center justify-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            </div>
          </div>
        )}
      </div>

      {/* Compact Bottom Interface */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent p-4">
        <div className="max-w-sm mx-auto space-y-3">
          {/* Inline Tag Count */}
          {tags.length > 0 && (
            <div className="flex justify-center gap-2 text-xs text-white/80">
              {getPersonTagCount() > 0 && <span>{getPersonTagCount()} Personen</span>}
              {getLocationTagCount() > 0 && <span>{getLocationTagCount()} Orte</span>}
              {getTextTagCount() > 0 && <span>{getTextTagCount()} Text</span>}
            </div>
          )}

          {/* Compact 3-Button Grid */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setTagModeType('person');
                setIsTagMode(true);
              }}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl font-medium text-xs transition-all ${
                isTagMode && tagModeType === 'person'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <Users className="w-4 h-4" />
              Personen
            </button>
            
            <button
              onClick={() => {
                setTagModeType('location');
                setIsTagMode(true);
              }}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl font-medium text-xs transition-all ${
                isTagMode && tagModeType === 'location'
                  ? 'bg-green-500 text-white'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Ort
            </button>

            <button
              onClick={() => {
                setTagModeType('text');
                setIsTagMode(true);
              }}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl font-medium text-xs transition-all ${
                isTagMode && tagModeType === 'text'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <Type className="w-4 h-4" />
              Text
            </button>
          </div>

          {/* Clear Tags (Compact) */}
          {tags.length > 0 && (
            <button
              onClick={() => setTags([])}
              className="w-full py-2 text-red-400 hover:text-red-300 text-xs transition-colors"
            >
              Alle entfernen
            </button>
          )}
        </div>
      </div>

      {/* Popups */}
      {showBottomInterface && (
        <SearchPopup
          position={pendingTag?.position || { x: 50, y: 50 }}
          onSelectPerson={handlePersonSelect}
          onCancel={handleCancel}
          galleryUsers={galleryUsers}
          isDarkMode={isDarkMode}
          tags={tags}
        />
      )}

      {showLocationSearch && (
        <LocationSearchPopup
          position={pendingTag?.position || { x: 50, y: 50 }}
          onSelectLocation={handleLocationSelect}
          onCancel={handleCancel}
          isDarkMode={isDarkMode}
        />
      )}

      {showTextInput && (
        <TextInputPopup
          position={pendingTag?.position || { x: 50, y: 50 }}
          onConfirm={handleTextConfirm}
          onCancel={handleCancel}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};