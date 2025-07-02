import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, MapPin, Type, Users, Trash2 } from 'lucide-react';
import { PersonTag, LocationTag, TextTag, MediaTag, TagPosition, GalleryUser } from '../../types/tagging';
import { getCurrentLocation, reverseGeocode, searchLocations } from '../../utils/locationService';

interface InstagramTaggingProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tags: MediaTag[]) => void;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  galleryUsers: GalleryUser[];
  initialTags?: MediaTag[];
}

const InstagramTagging: React.FC<InstagramTaggingProps> = ({
  isOpen,
  onClose,
  onConfirm,
  mediaUrl,
  mediaType,
  galleryUsers,
  initialTags = []
}) => {
  const [tags, setTags] = useState<MediaTag[]>(initialTags);
  const [mode, setMode] = useState<'idle' | 'person' | 'location' | 'text'>('idle');
  const [showUserList, setShowUserList] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<TagPosition | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationSearchResults, setLocationSearchResults] = useState<any[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showTags, setShowTags] = useState(false);
  
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter users that aren't already tagged
  const availableUsers = galleryUsers.filter(user => 
    !tags.some(tag => tag.type === 'person' && tag.deviceId === user.deviceId)
  );

  // Recent users (last 5 unique users)
  const recentUsers = availableUsers
    .sort((a, b) => (b.lastSeen?.getTime() || 0) - (a.lastSeen?.getTime() || 0))
    .slice(0, 5);

  // Filter users by search
  const filteredUsers = searchQuery 
    ? availableUsers.filter(user => 
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.userName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableUsers;

  // Handle media click for tagging
  const handleMediaClick = useCallback((event: React.MouseEvent) => {
    if (mode === 'idle' || !mediaRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const position: TagPosition = { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
    setSelectedPosition(position);

    if (mode === 'person') {
      setShowUserList(true);
    } else if (mode === 'location') {
      setShowLocationInput(true);
    } else if (mode === 'text') {
      setShowTextInput(true);
    }
  }, [mode]);

  // Add person tag
  const addPersonTag = useCallback((user: GalleryUser) => {
    if (!selectedPosition) return;

    const newTag: PersonTag = {
      id: `person_${Date.now()}_${user.deviceId}`,
      userName: user.userName,
      displayName: user.displayName,
      deviceId: user.deviceId,
      position: selectedPosition,
      type: 'person'
    };

    setTags(prev => [...prev, newTag]);
    setSelectedPosition(null);
    setShowUserList(false);
    setSearchQuery('');
    setMode('idle');
  }, [selectedPosition]);

  // Add location tag
  const addLocationTag = useCallback((location: any) => {
    if (!selectedPosition) return;

    const newTag: LocationTag = {
      id: `location_${Date.now()}`,
      name: location.name,
      address: location.address,
      coordinates: location.coordinates,
      position: selectedPosition,
      type: 'location'
    };

    setTags(prev => [...prev, newTag]);
    setSelectedPosition(null);
    setShowLocationInput(false);
    setLocationSearchResults([]);
    setSearchQuery('');
    setMode('idle');
  }, [selectedPosition]);

  // Add text tag
  const addTextTag = useCallback(() => {
    if (!selectedPosition || !textInput.trim()) return;

    const newTag: TextTag = {
      id: `text_${Date.now()}`,
      text: textInput.trim(),
      position: selectedPosition,
      type: 'text'
    };

    setTags(prev => [...prev, newTag]);
    setSelectedPosition(null);
    setShowTextInput(false);
    setTextInput('');
    setMode('idle');
  }, [selectedPosition, textInput]);

  // Get current GPS location
  const handleGPSLocation = useCallback(async () => {
    if (!selectedPosition) return;
    
    setIsLoadingLocation(true);
    try {
      const position = await getCurrentLocation();
      const locationData = await reverseGeocode(position.coords.latitude, position.coords.longitude);
      addLocationTag(locationData);
    } catch (error) {
      console.error('GPS location error:', error);
      alert('Standort konnte nicht ermittelt werden');
    } finally {
      setIsLoadingLocation(false);
    }
  }, [selectedPosition, addLocationTag]);

  // Search locations
  useEffect(() => {
    if (!searchQuery || !showLocationInput) {
      setLocationSearchResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      try {
        const results = await searchLocations(searchQuery);
        setLocationSearchResults(results);
      } catch (error) {
        console.error('Location search error:', error);
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, showLocationInput]);

  // Remove tag
  const removeTag = useCallback((tagId: string) => {
    setTags(prev => prev.filter(tag => tag.id !== tagId));
  }, []);

  // Clear all tags
  const clearAllTags = useCallback(() => {
    setTags([]);
  }, []);

  // Handle confirm
  const handleConfirm = useCallback(() => {
    onConfirm(tags);
    onClose();
  }, [tags, onConfirm, onClose]);

  // Reset states when closing
  const handleClose = useCallback(() => {
    setMode('idle');
    setShowUserList(false);
    setShowLocationInput(false);
    setShowTextInput(false);
    setSelectedPosition(null);
    setSearchQuery('');
    setTextInput('');
    onClose();
  }, [onClose]);

  // Tag position calculations
  const getTagStyle = (position: TagPosition) => ({
    left: `${position.x}%`,
    top: `${position.y}%`,
    transform: 'translate(-50%, -50%)'
  });

  const getLabelPosition = (position: TagPosition) => {
    const isRight = position.x > 50;
    const isBottom = position.y > 70;
    
    return {
      [isRight ? 'right' : 'left']: '100%',
      [isBottom ? 'bottom' : 'top']: '50%',
      transform: `translateY(${isBottom ? '50%' : '-50%'})`,
      marginLeft: isRight ? '-8px' : '8px'
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2147483647] bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={handleClose} className="p-2 text-white hover:text-gray-300">
          <X className="w-6 h-6" />
        </button>
        <h1 className="text-white font-semibold">Markieren</h1>
        <button 
          onClick={handleConfirm}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Fertig
        </button>
      </div>

      {/* Media Container */}
      <div 
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center"
        style={{ cursor: mode !== 'idle' ? 'crosshair' : 'default' }}
        onClick={handleMediaClick}
        onMouseEnter={() => setShowTags(true)}
        onMouseLeave={() => setShowTags(false)}
      >
        {mediaType === 'image' ? (
          <img
            ref={mediaRef as React.RefObject<HTMLImageElement>}
            src={mediaUrl}
            alt="Media"
            className="max-w-full max-h-full object-contain"
            draggable={false}
          />
        ) : (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={mediaUrl}
            className="max-w-full max-h-full object-contain"
            controls
            preload="metadata"
          />
        )}

        {/* Tags Overlay */}
        {tags.map(tag => (
          <div
            key={tag.id}
            className="absolute group"
            style={getTagStyle(tag.position)}
          >
            {/* Tag Dot */}
            <div className="relative">
              <div className="w-6 h-6 bg-white border-2 border-blue-500 rounded-full animate-pulse shadow-lg" />
              
              {/* Tag Label */}
              <div 
                className={`absolute z-10 px-2 py-1 bg-black/80 text-white text-xs rounded-md whitespace-nowrap transition-opacity ${
                  showTags || mode !== 'idle' ? 'opacity-100' : 'opacity-0'
                }`}
                style={getLabelPosition(tag.position)}
              >
                {tag.type === 'person' && (tag.displayName || tag.userName)}
                {tag.type === 'location' && tag.name}
                {tag.type === 'text' && tag.text}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag.id);
                  }}
                  className="ml-1 text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Selected Position Indicator */}
        {selectedPosition && (
          <div
            className="absolute w-6 h-6 bg-yellow-400 border-2 border-white rounded-full animate-ping"
            style={getTagStyle(selectedPosition)}
          />
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
        {/* Tag Counter */}
        {tags.length > 0 && (
          <div className="text-center mb-4">
            <span className="text-white/80 text-sm">
              {tags.filter(t => t.type === 'person').length} Personen, {' '}
              {tags.filter(t => t.type === 'location').length} Orte, {' '}
              {tags.filter(t => t.type === 'text').length} Texte markiert
            </span>
            <button
              onClick={clearAllTags}
              className="ml-3 text-red-400 hover:text-red-300 text-sm"
            >
              Alle löschen
            </button>
          </div>
        )}

        {/* Control Buttons */}
        <div className="grid grid-cols-4 gap-3">
          <button
            onClick={() => setMode(mode === 'person' ? 'idle' : 'person')}
            className={`flex flex-col items-center px-4 py-3 rounded-2xl backdrop-blur-sm transition-all duration-300 ${
              mode === 'person' 
                ? 'bg-gradient-to-br from-purple-500/90 to-pink-500/90 text-white shadow-lg shadow-purple-500/30 scale-105 border border-white/20' 
                : 'bg-white/15 text-white/90 hover:bg-white/25 border border-white/10 hover:scale-105'
            }`}
          >
            <Users className="w-5 h-5 mb-2" />
            <span className="text-xs font-medium">Personen</span>
          </button>

          <button
            onClick={() => setMode(mode === 'location' ? 'idle' : 'location')}
            className={`flex flex-col items-center px-4 py-3 rounded-2xl backdrop-blur-sm transition-all duration-300 ${
              mode === 'location' 
                ? 'bg-gradient-to-br from-green-500/90 to-emerald-500/90 text-white shadow-lg shadow-green-500/30 scale-105 border border-white/20' 
                : 'bg-white/15 text-white/90 hover:bg-white/25 border border-white/10 hover:scale-105'
            }`}
          >
            <MapPin className="w-5 h-5 mb-2" />
            <span className="text-xs font-medium">Ort</span>
          </button>

          <button
            onClick={() => setMode(mode === 'text' ? 'idle' : 'text')}
            className={`flex flex-col items-center px-4 py-3 rounded-2xl backdrop-blur-sm transition-all duration-300 ${
              mode === 'text' 
                ? 'bg-gradient-to-br from-blue-500/90 to-cyan-500/90 text-white shadow-lg shadow-blue-500/30 scale-105 border border-white/20' 
                : 'bg-white/15 text-white/90 hover:bg-white/25 border border-white/10 hover:scale-105'
            }`}
          >
            <Type className="w-5 h-5 mb-2" />
            <span className="text-xs font-medium">Text</span>
          </button>

          <button
            onClick={clearAllTags}
            disabled={tags.length === 0}
            className={`flex flex-col items-center px-4 py-3 rounded-2xl backdrop-blur-sm transition-all duration-300 ${
              tags.length > 0
                ? 'bg-gradient-to-br from-red-500/90 to-rose-500/90 text-white hover:from-red-600/90 hover:to-rose-600/90 shadow-lg shadow-red-500/30 border border-white/20 hover:scale-105' 
                : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/5'
            }`}
          >
            <Trash2 className="w-5 h-5 mb-2" />
            <span className="text-xs font-medium">Löschen</span>
          </button>
        </div>

        {/* Instructions */}
        {mode === 'idle' && tags.length === 0 && (
          <div className="text-center mt-4">
            <p className="text-white/60 text-sm">
              Wähle eine Kategorie und tippe auf das Bild zum Markieren
            </p>
          </div>
        )}

        {mode !== 'idle' && !selectedPosition && (
          <div className="text-center mt-4">
            <p className="text-white/80 text-sm">
              Tippe auf das Bild, um {mode === 'person' ? 'eine Person' : mode === 'location' ? 'einen Ort' : 'Text'} zu markieren
            </p>
          </div>
        )}
      </div>

      {/* User Selection Modal */}
      {showUserList && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center z-20">
          <div className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-t-3xl md:rounded-3xl w-full md:max-w-md max-h-[70vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Person markieren</h3>
                <button 
                  onClick={() => setShowUserList(false)}
                  className="p-2 hover:bg-gray-100/50 rounded-full transition-colors duration-200"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Person suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-300 transition-all duration-200 placeholder-gray-400"
                autoFocus
              />
            </div>
            
            <div className="overflow-y-auto max-h-80">
              {/* Recent Users */}
              {!searchQuery && recentUsers.length > 0 && (
                <div className="p-6">
                  <h4 className="text-sm font-medium text-gray-600 mb-3">Kürzlich markiert</h4>
                  <div className="flex gap-4 overflow-x-auto pb-3">
                    {recentUsers.map(user => (
                      <button
                        key={user.deviceId}
                        onClick={() => addPersonTag(user)}
                        className="flex flex-col items-center min-w-0 p-3 hover:bg-gray-50/80 rounded-2xl transition-all duration-200 hover:scale-105"
                      >
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-2 overflow-hidden shadow-sm">
                          {user.profilePicture ? (
                            <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-purple-600 font-medium text-lg">
                              {(user.displayName || user.userName).charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-center truncate w-full font-medium text-gray-700">
                          {user.displayName || user.userName}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* All Users */}
              <div className="p-6">
                <h4 className="text-sm font-medium text-gray-600 mb-3">
                  {searchQuery ? 'Suchergebnisse' : 'Alle Personen'}
                </h4>
                {filteredUsers.map(user => (
                  <button
                    key={user.deviceId}
                    onClick={() => addPersonTag(user)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-50/80 rounded-2xl transition-all duration-200 mb-2 hover:scale-[1.02]"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center overflow-hidden shadow-sm">
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-purple-600 font-medium">
                          {(user.displayName || user.userName).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">{user.displayName || user.userName}</div>
                      {user.displayName && (
                        <div className="text-sm text-gray-500">@{user.userName}</div>
                      )}
                    </div>
                    {user.isOnline && (
                      <div className="w-3 h-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-sm" />
                    )}
                  </button>
                ))}
                
                {filteredUsers.length === 0 && (
                  <p className="text-gray-500 text-center py-8 text-sm">
                    {searchQuery ? 'Keine Personen gefunden' : 'Alle Personen bereits markiert'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Input Modal */}
      {showLocationInput && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center z-20">
          <div className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-t-3xl md:rounded-3xl w-full md:max-w-md max-h-[70vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Ort hinzufügen</h3>
                <button 
                  onClick={() => setShowLocationInput(false)}
                  className="p-2 hover:bg-gray-100/50 rounded-full transition-colors duration-200"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={handleGPSLocation}
                  disabled={isLoadingLocation}
                  className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-green-50/80 to-emerald-50/80 hover:from-green-100/80 hover:to-emerald-100/80 rounded-2xl disabled:opacity-50 transition-all duration-200 border border-green-100/30"
                >
                  <MapPin className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-700">
                    {isLoadingLocation ? 'Standort wird ermittelt...' : 'Aktueller Standort'}
                  </span>
                </button>
                
                <input
                  type="text"
                  placeholder="Ort suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-300 transition-all duration-200 placeholder-gray-400"
                />
              </div>
            </div>
            
            {locationSearchResults.length > 0 && (
              <div className="overflow-y-auto max-h-80 p-4">
                {locationSearchResults.map((location, index) => (
                  <button
                    key={index}
                    onClick={() => addLocationTag(location)}
                    className="w-full flex items-start gap-4 p-4 hover:bg-gray-50/60 rounded-2xl text-left transition-all duration-200 mb-2"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mt-1 shadow-sm">
                      <MapPin className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{location.name}</div>
                      <div className="text-sm text-gray-500 line-clamp-2 mt-1">{location.address}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Text Input Modal */}
      {showTextInput && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center z-20">
          <div className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-t-3xl md:rounded-3xl w-full md:max-w-md">
            <div className="p-6 border-b border-gray-100/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Text hinzufügen</h3>
                <button 
                  onClick={() => setShowTextInput(false)}
                  className="p-2 hover:bg-gray-100/50 rounded-full transition-colors duration-200"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Dieser Text wird auf dem Bild angezeigt
              </p>
            </div>
            
            <div className="p-6">
              <textarea
                placeholder="Text eingeben..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/50 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-300 transition-all duration-200 placeholder-gray-400"
                rows={3}
                maxLength={100}
                autoFocus
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-400">{textInput.length}/100</span>
                <button
                  onClick={addTextTag}
                  disabled={!textInput.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg shadow-purple-500/25"
                >
                  Hinzufügen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstagramTagging;