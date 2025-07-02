import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';

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
  const [tags, setTags] = useState<PersonTag[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchInterface, setShowSearchInterface] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null);
  const [showTags, setShowTags] = useState(true);
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

  // Handle image/video click for tagging
  const handleMediaClick = useCallback((e: React.MouseEvent) => {
    if (!mediaRef.current || !containerRef.current) return;
    
    const rect = mediaRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    const x = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    const y = ((e.clientY - containerRect.top) / containerRect.height) * 100;
    
    setPendingPosition({ x, y });
    setShowSearchInterface(true);
    setSearchTerm('');
  }, []);

  // Add person tag
  const addPersonTag = useCallback((user: GalleryUser) => {
    if (!pendingPosition) return;
    
    // Check if user is already tagged
    const isAlreadyTagged = tags.some(tag => tag.user.id === user.deviceId);
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
    
    setTags(prev => [...prev, newTag]);
    setShowSearchInterface(false);
    setPendingPosition(null);
  }, [pendingPosition, tags]);

  // Remove tag
  const removeTag = useCallback((tagId: string) => {
    setTags(prev => prev.filter(tag => tag.id !== tagId));
  }, []);

  // Get label position (avoid going off screen)
  const getLabelPosition = (x: number, y: number) => {
    return {
      left: x > 70 ? 'auto' : `${x + 2}%`,
      right: x > 70 ? `${100 - x + 2}%` : 'auto',
      top: y > 50 ? 'auto' : `${y + 2}%`,
      bottom: y > 50 ? `${100 - y + 2}%` : 'auto',
    };
  };

  // Convert PersonTags to MediaTags for compatibility with existing code
  const handleConfirm = useCallback(() => {
    const legacyTags: MediaTag[] = tags.map(tag => ({
      id: tag.id,
      type: 'person' as const,
      position: { x: tag.x, y: tag.y },
      userName: tag.user.username,
      deviceId: tag.user.id,
      displayName: tag.user.name
    }));
    
    onConfirm(legacyTags);
  }, [tags, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-[9999] overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4 text-white">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">Personen markieren</h1>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors"
          >
            Fertig
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

        {/* Tag Dots */}
        {showTags && tags.map(tag => (
          <div key={tag.id} className="absolute group">
            {/* Dot */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag.id);
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
              const isTagged = tags.some(tag => tag.user.id === user.deviceId);
              
              return (
                <button
                  key={user.deviceId}
                  onClick={() => !isTagged && addPersonTag(user)}
                  className={`w-full flex items-center px-4 py-3 hover:bg-gray-50 transition-colors ${
                    isTagged ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={isTagged}
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white font-semibold mr-3">
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
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900">
                      {user.displayName || user.userName}
                    </p>
                    <p className="text-sm text-gray-500">@{user.userName}</p>
                  </div>
                  
                  {/* Tagged Indicator */}
                  {isTagged && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
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

      {/* Tag Counter (if tags exist) */}
      {tags.length > 0 && !showSearchInterface && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="bg-black bg-opacity-80 text-white px-4 py-2 rounded-full text-sm font-medium">
            {tags.length} {tags.length === 1 ? 'Person' : 'Personen'} markiert
          </div>
        </div>
      )}

      {/* Instructions */}
      {tags.length === 0 && !showSearchInterface && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="bg-black bg-opacity-80 text-white px-4 py-2 rounded-full text-sm">
            Tippe auf das Bild, um Personen zu markieren
          </div>
        </div>
      )}
    </div>
  );
};