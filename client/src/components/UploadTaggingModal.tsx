import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Users, MapPin, Search, ChevronLeft, ChevronRight, Loader2, Navigation, UserPlus, Copy } from 'lucide-react';
import { addNotification } from '../services/firebaseService';
// Location services using browser APIs

interface TagPosition {
  x: number;
  y: number;
}

interface PersonTag {
  id: string;
  type: 'person';
  position: TagPosition;
  userName: string;
  deviceId?: string;
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
  lastTagged?: string; // For recent users functionality
}

interface LocationSuggestion {
  name: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
}

interface UploadTaggingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (files: FileList, fileTags: Record<string, MediaTag[]>) => Promise<void>;
  files: FileList | null;
  previewUrls: string[];
  galleryUsers: GalleryUser[];
  currentUser: string;
  currentDeviceId: string;
  isDarkMode: boolean;
  galleryId: string;
}

export const UploadTaggingModal: React.FC<UploadTaggingModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  files,
  previewUrls,
  galleryUsers,
  currentUser,
  currentDeviceId,
  isDarkMode,
  galleryId
}) => {
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [fileTags, setFileTags] = useState<Record<string, MediaTag[]>>({});
  const [isTagMode, setIsTagMode] = useState(false);
  const [showUserDrawer, setShowUserDrawer] = useState(false);
  const [showLocationDrawer, setShowLocationDrawer] = useState(false);
  const [pendingTagPosition, setPendingTagPosition] = useState<TagPosition | null>(null);
  const [tagsVisible, setTagsVisible] = useState(true);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [locationSearchTerm, setLocationSearchTerm] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [bulkTaggingMode, setBulkTaggingMode] = useState(false);
  const [bulkTags, setBulkTags] = useState<MediaTag[]>([]);
  const mediaRef = useRef<HTMLDivElement>(null);

  // Get current file and its tags
  const currentFile = files?.[currentFileIndex];
  const currentFileName = currentFile?.name || '';
  const currentTags = fileTags[currentFileName] || [];
  const currentPreviewUrl = previewUrls[currentFileIndex];
  const currentMediaType = currentFile?.type.startsWith('video') ? 'video' : 'image';

  // Recent users (sorted by last tagged time)
  const recentUsers = galleryUsers
    .filter(user => user.lastTagged)
    .sort((a, b) => new Date(b.lastTagged!).getTime() - new Date(a.lastTagged!).getTime())
    .slice(0, 6);

  // Filtered users for search
  const filteredUsers = galleryUsers.filter(user => 
    (user.displayName || user.userName).toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // Handle media click for tagging
  const handleMediaClick = useCallback((event: React.MouseEvent) => {
    if (!isTagMode) return;

    const rect = mediaRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const boundedX = Math.max(5, Math.min(95, x));
    const boundedY = Math.max(5, Math.min(95, y));

    setPendingTagPosition({ x: boundedX, y: boundedY });
    setShowUserDrawer(true);
  }, [isTagMode]);

  // Handle person selection
  const handlePersonSelect = useCallback((user: GalleryUser) => {
    if (!pendingTagPosition || !currentFileName) return;

    const newTag: PersonTag = {
      id: Date.now().toString(),
      type: 'person',
      position: pendingTagPosition,
      userName: user.userName,
      deviceId: user.deviceId,
      displayName: user.displayName
    };

    // Update last tagged time for recent users
    const updatedUser = { ...user, lastTagged: new Date().toISOString() };
    
    // Add tag to current file
    setFileTags(prev => ({
      ...prev,
      [currentFileName]: [...(prev[currentFileName] || []), newTag]
    }));

    setPendingTagPosition(null);
    setShowUserDrawer(false);

    // If bulk tagging is enabled, add to bulk tags
    if (bulkTaggingMode) {
      setBulkTags(prev => [...prev, newTag]);
    }
  }, [pendingTagPosition, currentFileName, bulkTaggingMode]);

  // Handle location selection
  const handleLocationSelect = useCallback((location: LocationSuggestion) => {
    if (!currentFileName) return;

    const locationTag: LocationTag = {
      id: `location_${Date.now()}`,
      type: 'location',
      position: { x: 50, y: 15 }, // Top center
      locationName: location.name,
      coordinates: location.coordinates || null
    };

    setFileTags(prev => ({
      ...prev,
      [currentFileName]: [...(prev[currentFileName] || []), locationTag]
    }));

    setShowLocationDrawer(false);
    setLocationSearchTerm('');
    setLocationSuggestions([]);
  }, [currentFileName]);

  // Handle GPS location
  const handleGPSLocation = useCallback(async () => {
    setIsLoadingLocation(true);
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
      await handleLocationSelect({
        name: locationName,
        coordinates: { lat: position.coords.latitude, lng: position.coords.longitude }
      });
    } catch (error) {
      console.error('GPS error:', error);
      alert('Standort konnte nicht ermittelt werden');
    } finally {
      setIsLoadingLocation(false);
    }
  }, [handleLocationSelect]);

  // Search locations with debounce
  useEffect(() => {
    if (locationSearchTerm.length > 2) {
      const debounceTimer = setTimeout(async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearchTerm)}&limit=5&addressdetails=1`
          );
          const data = await response.json();
          
          const suggestions: LocationSuggestion[] = data.map((item: any) => ({
            name: item.name || item.display_name.split(',')[0],
            address: item.display_name,
            coordinates: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) }
          }));
          
          setLocationSuggestions(suggestions);
        } catch (error) {
          console.error('Location search error:', error);
        }
      }, 500);

      return () => clearTimeout(debounceTimer);
    } else {
      setLocationSuggestions([]);
    }
  }, [locationSearchTerm]);

  // Apply bulk tags to all files
  const applyBulkTags = useCallback(() => {
    if (!files || bulkTags.length === 0) return;

    const newFileTags: Record<string, MediaTag[]> = {};
    
    for (let i = 0; i < files.length; i++) {
      const fileName = files[i].name;
      newFileTags[fileName] = [...(fileTags[fileName] || []), ...bulkTags];
    }

    setFileTags(prev => ({ ...prev, ...newFileTags }));
    setBulkTags([]);
    setBulkTaggingMode(false);
  }, [files, bulkTags, fileTags]);

  // Remove tag
  const handleRemoveTag = useCallback((tagId: string) => {
    if (!currentFileName) return;
    
    setFileTags(prev => ({
      ...prev,
      [currentFileName]: (prev[currentFileName] || []).filter(tag => tag.id !== tagId)
    }));
  }, [currentFileName]);

  // Handle upload with tags
  const handleConfirm = useCallback(async () => {
    if (!files) return;

    setIsUploading(true);
    try {
      // Upload files with tags
      await onConfirm(files, fileTags);
      
      // Send notifications to tagged users
      console.log('📨 Sending notifications for tagged users...');
      
      // Collect all tagged users across all files
      const allTaggedUsers: string[] = [];
      Object.values(fileTags).forEach(tags => {
        tags.forEach(tag => {
          if (tag.type === 'person') {
            const personTag = tag as PersonTag;
            const userKey = `${personTag.userName}-${personTag.deviceId}`;
            if (!allTaggedUsers.includes(userKey)) {
              allTaggedUsers.push(userKey);
            }
          }
        });
      });

      // Send notification to each tagged user
      for (const userKey of allTaggedUsers) {
        const [userName, deviceId] = userKey.split('-');
        if (userName !== currentUser) { // Don't notify the current user
          try {
            await addNotification(
              userName,
              deviceId,
              'tag',
              `${currentUser} hat dich in ${files.length > 1 ? 'mehreren Bildern' : 'einem Bild'} markiert`,
              '', // mediaId will be set after upload
              '', // mediaUrl will be set after upload
              currentUser,
              currentDeviceId
            );
            console.log(`✅ Notification sent to ${userName}`);
          } catch (notificationError) {
            console.error(`❌ Failed to send notification to ${userName}:`, notificationError);
          }
        }
      }
      
      console.log(`📨 Sent notifications to ${allTaggedUsers.length} tagged users`);
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  }, [files, fileTags, onConfirm, onClose, currentUser, currentDeviceId]);

  if (!isOpen || !files || previewUrls.length === 0) return null;

  const totalFiles = files.length;
  const totalTags = Object.values(fileTags).reduce((sum, tags) => sum + tags.length, 0);
  const personTags = currentTags.filter(tag => tag.type === 'person') as PersonTag[];

  return (
    <div className="fixed inset-0 z-[2147483647] bg-black/95 flex items-center justify-center">
      <div className="relative w-full h-full max-w-md mx-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 text-white border-b border-white/10">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            disabled={isUploading}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <h1 className="text-lg font-semibold">
              Dateien markieren
            </h1>
            <p className="text-sm text-white/60">
              {currentFileIndex + 1}/{totalFiles}
            </p>
          </div>
          
          <button
            onClick={handleConfirm}
            disabled={isUploading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Lädt...</span>
              </>
            ) : (
              <span>Hochladen</span>
            )}
          </button>
        </div>

        {/* File Navigation */}
        {totalFiles > 1 && (
          <div className="flex items-center justify-between p-3 bg-black/50 border-b border-white/10">
            <button
              onClick={() => setCurrentFileIndex(Math.max(0, currentFileIndex - 1))}
              disabled={currentFileIndex === 0}
              className="p-2 text-white/60 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: totalFiles }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFileIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentFileIndex ? 'bg-blue-500' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={() => setCurrentFileIndex(Math.min(totalFiles - 1, currentFileIndex + 1))}
              disabled={currentFileIndex === totalFiles - 1}
              className="p-2 text-white/60 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Media Container */}
        <div className="flex-1 flex items-center justify-center p-4 min-h-0">
          <div
            ref={mediaRef}
            className={`relative max-w-full max-h-full rounded-lg overflow-hidden ${
              isTagMode ? 'cursor-crosshair' : 'cursor-default'
            }`}
            onClick={handleMediaClick}
            style={{ maxHeight: '50vh' }}
          >
            {currentMediaType === 'image' ? (
              <img
                src={currentPreviewUrl}
                alt="Media zum Markieren"
                className="max-w-full max-h-full object-contain select-none"
                draggable={false}
                style={{ maxHeight: '50vh' }}
              />
            ) : (
              <video
                src={currentPreviewUrl}
                className="max-w-full max-h-full object-contain"
                controls={!isTagMode}
                playsInline
                muted
                style={{ maxHeight: '50vh' }}
              />
            )}

            {/* Existing Tags */}
            {tagsVisible && currentTags.map((tag) => (
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
                    : (tag as LocationTag).locationName
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 space-y-3 bg-black/80 border-t border-white/10">
          {/* Multi-file bulk tagging */}
          {totalFiles > 1 && (
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div className="flex items-center gap-2">
                <Copy className="w-4 h-4 text-white/60" />
                <span className="text-white/80 text-sm">Für alle Dateien</span>
              </div>
              <button
                onClick={() => setBulkTaggingMode(!bulkTaggingMode)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  bulkTaggingMode 
                    ? 'bg-green-600 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {bulkTaggingMode ? 'Aktiv' : 'Aktivieren'}
              </button>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-3">
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

            <button
              onClick={() => setShowLocationDrawer(true)}
              className="flex-1 flex items-center justify-center space-x-2 py-4 rounded-xl font-medium transition-colors bg-white/10 text-white hover:bg-white/20 min-h-[48px] touch-manipulation"
            >
              <MapPin className="w-5 h-5" />
              <span className="text-sm">Ort</span>
            </button>
          </div>

          {/* Tag Counter & Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="text-white/80">
              {personTags.length > 0 ? (
                <span>{personTags.length} {personTags.length === 1 ? 'Person' : 'Personen'} markiert</span>
              ) : (
                <span className="text-white/60">
                  {isTagMode ? 'Foto antippen zum Markieren' : 'Keine Markierungen'}
                </span>
              )}
            </div>
            
            {totalTags > 0 && (
              <div className="text-white/60">
                {totalTags} Tags gesamt
              </div>
            )}
          </div>

          {/* Clear All Tags */}
          {currentTags.length > 0 && (
            <button
              onClick={() => setFileTags(prev => ({ ...prev, [currentFileName]: [] }))}
              className="w-full py-2 text-white/60 hover:text-white text-sm transition-colors"
            >
              Alle Tags entfernen
            </button>
          )}
        </div>
      </div>

      {/* User Selection Drawer */}
      {showUserDrawer && (
        <div className="fixed inset-x-0 bottom-0 z-[2147483648] bg-black/95 backdrop-blur-lg rounded-t-2xl border-t border-white/20 max-h-[60vh]">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-white font-semibold text-lg">Person markieren</h3>
            <button
              onClick={() => setShowUserDrawer(false)}
              className="text-white/60 hover:text-white transition-colors p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="text"
                placeholder="Nach Person suchen..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 text-white placeholder-white/60 rounded-xl border border-white/20 focus:border-white/40 focus:outline-none"
              />
            </div>

            {/* Recent Users */}
            {recentUsers.length > 0 && userSearchTerm === '' && (
              <div>
                <h4 className="text-white/80 text-sm font-medium mb-2">Kürzlich markiert</h4>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {recentUsers.map((user) => (
                    <button
                      key={`${user.userName}_${user.deviceId}`}
                      onClick={() => handlePersonSelect(user)}
                      className="flex-shrink-0 flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all min-w-[80px]"
                    >
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.displayName || user.userName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                          {(user.displayName || user.userName)[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-white text-xs text-center truncate max-w-[60px]">
                        {user.displayName || user.userName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All Users */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(40vh - 120px)' }}>
              <h4 className="text-white/80 text-sm font-medium mb-2">
                {userSearchTerm ? 'Suchergebnisse' : 'Alle Teilnehmer'}
              </h4>
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <button
                    key={`${user.userName}_${user.deviceId}`}
                    onClick={() => handlePersonSelect(user)}
                    className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
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
        </div>
      )}

      {/* Location Selection Drawer */}
      {showLocationDrawer && (
        <div className="fixed inset-x-0 bottom-0 z-[2147483648] bg-black/95 backdrop-blur-lg rounded-t-2xl border-t border-white/20 max-h-[50vh]">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-white font-semibold text-lg">Ort hinzufügen</h3>
            <button
              onClick={() => setShowLocationDrawer(false)}
              className="text-white/60 hover:text-white transition-colors p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            {/* GPS Location */}
            <button
              onClick={handleGPSLocation}
              disabled={isLoadingLocation}
              className="w-full flex items-center gap-3 p-4 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-xl transition-colors min-h-[56px]"
            >
              {isLoadingLocation ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Navigation className="w-6 h-6 text-white" />
              )}
              <span className="text-white font-medium text-base">
                {isLoadingLocation ? 'GPS wird verwendet...' : 'Aktueller Standort verwenden'}
              </span>
            </button>
            
            {/* Manual Location Search */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  type="text"
                  placeholder="Ort manuell eingeben..."
                  value={locationSearchTerm}
                  onChange={(e) => setLocationSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      handleLocationSelect({ name: e.currentTarget.value.trim() });
                    }
                  }}
                  className="w-full pl-10 pr-4 py-4 bg-white/10 text-white placeholder-white/60 rounded-xl border border-white/20 focus:border-white/40 focus:outline-none text-base"
                />
              </div>

              {/* Location Suggestions */}
              {locationSuggestions.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {locationSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleLocationSelect(suggestion)}
                      className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <div className="text-white font-medium">{suggestion.name}</div>
                      {suggestion.address && (
                        <div className="text-white/60 text-sm truncate">{suggestion.address}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};