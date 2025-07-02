import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { ArrowLeft, Check, Search, User, Clock } from 'lucide-react';

interface TagPosition {
  x: number; // Relative position 0-1
  y: number; // Relative position 0-1
}

interface PersonTag {
  id: string;
  x: number;
  y: number;
  user: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    lastVisited: string;
  };
}

interface GalleryUser {
  userName: string;
  deviceId: string;
  displayName?: string;
  profilePicture?: string;
  lastVisited?: string;
}

interface InstagramTaggingSystemProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tags: PersonTag[]) => void;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  galleryUsers: GalleryUser[];
}

const InstagramTaggingSystem: React.FC<InstagramTaggingSystemProps> = ({
  isOpen,
  onClose,
  onConfirm,
  mediaUrl,
  mediaType,
  galleryUsers
}) => {
  const [tags, setTags] = useState<PersonTag[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTagging, setIsTagging] = useState(false);
  const [pendingTagPosition, setPendingTagPosition] = useState<TagPosition | null>(null);
  const [showTagLabels, setShowTagLabels] = useState(false);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Format time since last visit
  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'vor langer Zeit';
    
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `vor ${diffMins} Min`;
    if (diffHours < 24) return `vor ${diffHours} Std`;
    return `vor ${diffDays} Tagen`;
  };

  // Filter and sort gallery users
  const filteredUsers = useMemo(() => {
    const alreadyTaggedIds = new Set(tags.map(tag => tag.user.id));
    
    return galleryUsers
      .filter(user => {
        const userId = `${user.userName}_${user.deviceId}`;
        const isNotTagged = !alreadyTaggedIds.has(userId);
        const matchesSearch = !searchTerm || 
          (user.displayName || user.userName).toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.userName.toLowerCase().includes(searchTerm.toLowerCase());
        return isNotTagged && matchesSearch;
      })
      .sort((a, b) => {
        // Sort by last visited (most recent first)
        const aTime = a.lastVisited ? new Date(a.lastVisited).getTime() : 0;
        const bTime = b.lastVisited ? new Date(b.lastVisited).getTime() : 0;
        return bTime - aTime;
      });
  }, [galleryUsers, searchTerm, tags]);

  // Handle media click for tagging
  const handleMediaClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Ensure coordinates are within bounds
    if (x < 0 || x > 1 || y < 0 || y > 1) return;

    setPendingTagPosition({ x, y });
    setIsTagging(true);
    setSearchTerm('');
    
    // Focus search input
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, []);

  // Handle person selection
  const handlePersonSelect = useCallback((user: GalleryUser) => {
    if (!pendingTagPosition) return;

    const newTag: PersonTag = {
      id: `tag_${Date.now()}_${Math.random()}`,
      x: pendingTagPosition.x,
      y: pendingTagPosition.y,
      user: {
        id: `${user.userName}_${user.deviceId}`,
        name: user.displayName || user.userName,
        username: user.userName,
        avatar: user.profilePicture,
        lastVisited: user.lastVisited || new Date().toISOString()
      }
    };

    setTags(prev => [...prev, newTag]);
    setPendingTagPosition(null);
    setIsTagging(false);
    setSearchTerm('');
  }, [pendingTagPosition]);

  // Cancel tagging
  const cancelTagging = useCallback(() => {
    setPendingTagPosition(null);
    setIsTagging(false);
    setSearchTerm('');
  }, []);

  // Handle confirm
  const handleConfirm = useCallback(() => {
    onConfirm(tags);
  }, [tags, onConfirm]);

  // Remove tag
  const removeTag = useCallback((tagId: string) => {
    setTags(prev => prev.filter(tag => tag.id !== tagId));
  }, []);

  // Get cursor style for image
  const getCursorStyle = () => {
    if (isTagging) return 'crosshair';
    return 'pointer';
  };

  // Calculate tag label position to prevent overflow
  const getTagLabelPosition = (tag: PersonTag) => {
    const labelWidth = 150; // Estimated label width
    const labelHeight = 40; // Estimated label height
    
    let left = `${tag.x * 100}%`;
    let top = `${tag.y * 100}%`;
    let transform = 'translate(-50%, -100%)';
    
    // Adjust horizontal position if too close to edges
    if (tag.x < 0.2) {
      left = '10px';
      transform = 'translate(0, -100%)';
    } else if (tag.x > 0.8) {
      left = 'auto';
      transform = 'translate(0, -100%)';
    }
    
    // Adjust vertical position if too close to top
    if (tag.y < 0.2) {
      top = `${tag.y * 100}%`;
      transform = transform.replace('-100%', '10px');
    }
    
    return { left, top, transform };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-4 bg-transparent">
        <button
          onClick={onClose}
          className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <h1 className="text-white text-base font-medium">Personen taggen</h1>
        
        {tags.length > 0 && (
          <button
            onClick={handleConfirm}
            className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <Check className="w-6 h-6" />
          </button>
        )}
        
        {tags.length === 0 && <div className="w-10" />}
      </div>

      {/* Image Container */}
      <div className="flex-1 flex items-center justify-center px-5 py-4">
        <div className="relative max-w-full max-h-[70vh]">
          {mediaType === 'image' ? (
            <img
              ref={imageRef}
              src={mediaUrl}
              alt="Media to tag"
              className="max-w-full max-h-full object-contain rounded-lg bg-black"
              style={{ cursor: getCursorStyle() }}
              onClick={handleMediaClick}
              onMouseEnter={() => setShowTagLabels(true)}
              onMouseLeave={() => setShowTagLabels(false)}
            />
          ) : (
            <video
              ref={imageRef as any}
              src={mediaUrl}
              className="max-w-full max-h-full object-contain rounded-lg bg-black"
              style={{ cursor: getCursorStyle() }}
              onClick={handleMediaClick}
              onMouseEnter={() => setShowTagLabels(true)}
              onMouseLeave={() => setShowTagLabels(false)}
              muted
              playsInline
            />
          )}

          {/* Existing Tags */}
          {tags.map((tag) => {
            const labelPos = getTagLabelPosition(tag);
            return (
              <div key={tag.id}>
                {/* Tag Point */}
                <div
                  className="absolute w-6 h-6 rounded-full bg-white border-2 border-[#0095F6] cursor-pointer animate-pulse"
                  style={{
                    left: `${tag.x * 100}%`,
                    top: `${tag.y * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    animationDuration: '2s',
                    animationIterationCount: 'infinite'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag.id);
                  }}
                />
                
                {/* Tag Label */}
                {showTagLabels && (
                  <div
                    className="absolute bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg pointer-events-none"
                    style={{
                      left: labelPos.left,
                      top: labelPos.top,
                      transform: labelPos.transform,
                      maxWidth: '150px',
                      zIndex: 10
                    }}
                  >
                    <div className="text-black text-sm font-medium truncate">
                      {tag.user.name}
                    </div>
                    
                    {/* Small arrow pointing to tag */}
                    <div 
                      className="absolute w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/95"
                      style={{
                        left: '50%',
                        bottom: '-4px',
                        transform: 'translateX(-50%)'
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Pending Tag Point */}
          {pendingTagPosition && (
            <div
              className="absolute w-6 h-6 rounded-full bg-white border-2 border-[#0095F6] animate-pulse"
              style={{
                left: `${pendingTagPosition.x * 100}%`,
                top: `${pendingTagPosition.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                animationDuration: '1s'
              }}
            />
          )}
        </div>
      </div>

      {/* Search Area */}
      <div className="bg-white rounded-t-3xl min-h-[40vh] max-h-[40vh] flex flex-col">
        {/* Search Input */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Personen suchen..."
              className="w-full h-11 pl-12 pr-4 bg-gray-100 rounded-full border-none outline-none text-black placeholder-gray-500 focus:bg-gray-50"
              autoFocus={isTagging}
            />
          </div>
        </div>

        {/* People List */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length === 0 && searchTerm && (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500 text-center">
                <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Keine Personen gefunden</p>
              </div>
            </div>
          )}

          {filteredUsers.map((user) => (
            <button
              key={`${user.userName}_${user.deviceId}`}
              onClick={() => handlePersonSelect(user)}
              className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.displayName || user.userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-gray-400" />
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 text-left">
                <div className="text-black font-medium text-base">
                  {user.displayName || user.userName}
                </div>
                <div className="text-gray-500 text-sm flex items-center">
                  <span>@{user.userName}</span>
                  <span className="mx-1">•</span>
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{formatTimeAgo(user.lastVisited)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cancel tagging overlay */}
      {isTagging && (
        <div
          className="absolute inset-0 z-[9998]"
          onClick={cancelTagging}
        />
      )}
    </div>
  );
};

export default InstagramTaggingSystem;