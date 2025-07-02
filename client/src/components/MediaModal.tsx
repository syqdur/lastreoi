import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Edit3, Plus, Trash2, Type } from 'lucide-react';
import { MediaItem, Comment, Like, TextTag } from '../types';

interface MediaModalProps {
  isOpen: boolean;
  items: MediaItem[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  comments: Comment[];
  likes: Like[];
  onAddComment: (mediaId: string, text: string) => void;
  onDeleteComment: (commentId: string) => void;
  onToggleLike: (mediaId: string) => void;
  userName: string;
  isAdmin: boolean;
  isDarkMode: boolean;
  getUserAvatar?: (userName: string, deviceId?: string) => string | null;
  getUserDisplayName?: (userName: string, deviceId?: string) => string;
  deviceId: string;
  galleryId: string;
  onMediaUpdate?: () => void;
  onUpdateTextTags?: (mediaId: string, tags: TextTag[]) => void;
}

export const MediaModal: React.FC<MediaModalProps> = ({
  isOpen,
  items,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  comments,
  likes,
  onAddComment,
  onDeleteComment,
  onToggleLike,
  userName,
  isAdmin,
  isDarkMode,
  getUserAvatar,
  getUserDisplayName,
  deviceId,
  galleryId,
  onMediaUpdate,
  onUpdateTextTags
}) => {
  const [commentText, setCommentText] = useState('');
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [preloadedImages, setPreloadedImages] = useState<string[]>([]);
  const [isEditingText, setIsEditingText] = useState(false);
  const [selectedTextTag, setSelectedTextTag] = useState<TextTag | null>(null);
  const [newTextContent, setNewTextContent] = useState('');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);

  const currentItem = (items || [])[currentIndex];
  const currentComments = (comments || []).filter(c => c.mediaId === currentItem?.id);
  const currentLikes = (likes || []).filter(l => l.mediaId === currentItem?.id);
  const isLiked = currentLikes.some(like => like.userName === userName);
  const likeCount = currentLikes.length;

  // 🚀 LIGHTNING FAST: Preload ALL images immediately when modal opens
  useEffect(() => {
    if (!isOpen || !items || !items.length) return;

    const preloadImage = (url: string) => {
      if (preloadedImages.includes(url)) return;
      
      const img = new Image();
      img.onload = () => {
        setPreloadedImages(prev => [...prev, url]);
      };
      img.onerror = () => {
        console.log('❌ Failed to preload:', url);
      };
      img.src = url;
    };

    // INSTANT PERFORMANCE: Preload ALL images immediately
    (items || []).forEach(item => {
      if (item.type === 'image' && item.url) {
        preloadImage(item.url);
      }
    });
  }, [isOpen, items]);

  // INSTANT LOADING: Skip loading state if already preloaded
  useEffect(() => {
    if (currentItem) {
      setImageError(false);
      
      // INSTANT DISPLAY: If already preloaded, show immediately
      if (currentItem.type === 'image' && preloadedImages.includes(currentItem.url)) {
        setImageLoading(false);
      } else if (currentItem.type === 'image') {
        setImageLoading(true);
      } else {
        // Videos and notes load instantly
        setImageLoading(false);
      }
    }
  }, [currentItem?.id, preloadedImages]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onPrev();
          break;
        case 'ArrowRight':
          onNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose, onNext, onPrev]);

  if (!isOpen || !currentItem) return null;

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(currentItem.id, commentText.trim());
      setCommentText('');
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    console.error(`❌ Modal image failed to load: ${currentItem.url}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'vor wenigen Minuten';
    if (diffInHours < 24) return `vor ${diffInHours}h`;
    if (diffInHours < 168) return `vor ${Math.floor(diffInHours / 24)}d`;
    return date.toLocaleDateString('de-DE');
  };

  // Generate beautiful wedding-themed avatar based on username
  const getAvatarUrl = (username: string, targetDeviceId?: string) => {
    // First try to get user's custom profile picture
    const customAvatar = getUserAvatar?.(username, targetDeviceId);
    if (customAvatar) return customAvatar;
    
    // Fallback to generated avatars
    const weddingAvatars = [
      'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1729797/pexels-photo-1729797.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1444424/pexels-photo-1444424.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1024967/pexels-photo-1024967.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1729799/pexels-photo-1729799.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1444443/pexels-photo-1444443.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
    ];
    
    const hash = username.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return weddingAvatars[Math.abs(hash) % weddingAvatars.length];
  };

  const getDisplayName = (username: string, targetDeviceId?: string) => {
    return getUserDisplayName?.(username, targetDeviceId) || username;
  };

  // Get current text tags from the media item
  const getTextTags = (): TextTag[] => {
    if (!currentItem?.tags) return [];
    return currentItem.tags.filter((tag): tag is TextTag => tag.type === 'text');
  };

  // Handle adding a new text tag at clicked position
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isEditingText || !isAdmin) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setTextPosition({ x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) });
    setNewTextContent('');
    setSelectedTextTag(null);
  };

  // Handle saving a new text tag
  const handleSaveTextTag = () => {
    if (!textPosition || !newTextContent.trim() || !onUpdateTextTags) return;
    
    const newTag: TextTag = {
      id: Date.now().toString(),
      type: 'text',
      position: textPosition,
      text: newTextContent.trim(),
      fontSize: 16,
      color: '#ffffff'
    };
    
    const currentTextTags = getTextTags();
    const updatedTags = [...currentTextTags, newTag];
    
    onUpdateTextTags(currentItem.id, updatedTags);
    setTextPosition(null);
    setNewTextContent('');
  };

  // Handle editing an existing text tag
  const handleEditTextTag = (tag: TextTag) => {
    setSelectedTextTag(tag);
    setNewTextContent(tag.text);
    setTextPosition(tag.position || { x: 50, y: 50 });
  };

  // Handle updating an existing text tag
  const handleUpdateTextTag = () => {
    if (!selectedTextTag || !newTextContent.trim() || !onUpdateTextTags) return;
    
    const currentTextTags = getTextTags();
    const updatedTags = currentTextTags.map(tag => 
      tag.id === selectedTextTag.id 
        ? { ...tag, text: newTextContent.trim(), position: textPosition || tag.position }
        : tag
    );
    
    onUpdateTextTags(currentItem.id, updatedTags);
    setSelectedTextTag(null);
    setTextPosition(null);
    setNewTextContent('');
  };

  // Handle deleting a text tag
  const handleDeleteTextTag = (tagId: string) => {
    if (!onUpdateTextTags) return;
    
    const currentTextTags = getTextTags();
    const updatedTags = currentTextTags.filter(tag => tag.id !== tagId);
    
    onUpdateTextTags(currentItem.id, updatedTags);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditingText(false);
    setSelectedTextTag(null);
    setTextPosition(null);
    setNewTextContent('');
  };

  return (
    <div 
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-40 flex items-center justify-center"
      onClick={(e) => {
        // Close modal when clicking outside the content
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Close button for mobile visibility */}
      <button 
        onClick={onClose}
        className="fixed top-16 right-4 w-12 h-12 flex items-center justify-center rounded-full bg-white/90 text-black shadow-2xl border-2 border-gray-300 touch-manipulation active:scale-95 z-[9999]"
        style={{ 
          position: 'fixed',
          top: '64px',
          right: '16px',
          width: '48px',
          height: '48px',
          zIndex: 99999,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          color: 'black'
        }}
      >
        <X className="w-6 h-6 stroke-2" />
      </button>

      {/* Navigation buttons */}
      {items.length > 1 && (
        <>
          <button
            onClick={onPrev}
            className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-300 touch-manipulation"
            style={{ minWidth: '48px', minHeight: '48px' }}
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={onNext}
            className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-300 touch-manipulation"
            style={{ minWidth: '48px', minHeight: '48px' }}
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      {/* Main content area - Mobile optimized layout */}
      <div className="w-full h-full flex flex-col max-w-7xl mx-auto">
        {/* Media container - Full screen on mobile */}
        <div className="flex-1 w-full h-full flex items-center justify-center p-2 sm:p-4 lg:w-2/3 lg:mx-auto">
          <div className="relative w-full h-full max-w-full max-h-full flex items-center justify-center">
            {currentItem.type === 'video' ? (
              <video
                src={currentItem.url}
                controls
                className="max-w-full max-h-full rounded-lg shadow-2xl"
                preload="metadata"
                playsInline
                webkit-playsinline="true"
                muted
                poster=""
                onLoadStart={() => setImageLoading(true)}
                onLoadedMetadata={() => setImageLoading(false)}
                onCanPlay={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
            ) : currentItem.type === 'note' ? (
              <div className={`w-full h-full flex flex-col items-center justify-center p-8 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50' 
                  : 'bg-gradient-to-br from-purple-100 to-pink-100'
              }`}>
                <div className={`max-w-sm w-full p-6 rounded-2xl transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-800/80 border border-purple-700/30' : 'bg-white/90 border border-purple-200/50'
                }`}>
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-2">💌</div>
                    <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Notiz
                    </h3>
                  </div>
                  <div className={`p-4 rounded-xl transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    <p className={`text-base leading-relaxed transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      "{currentItem.noteText}"
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* INSTANT DISPLAY: Only show loading if not preloaded */}
                {imageLoading && !preloadedImages.includes(currentItem.url) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                
                {imageError ? (
                  <div className="flex flex-col items-center justify-center text-white p-8">
                    <div className="text-6xl mb-4">📷</div>
                    <p className="text-lg text-center mb-2">
                      Bild nicht verfügbar
                    </p>
                    <p className="text-sm text-center opacity-75 mb-4">
                      Von {getUserDisplayName ? getUserDisplayName(currentItem.uploadedBy, currentItem.deviceId) : currentItem.uploadedBy}
                    </p>
                    <button
                      onClick={() => {
                        setImageError(false);
                        setImageLoading(true);
                        // Force reload
                        const img = new Image();
                        img.onload = handleImageLoad;
                        img.onerror = handleImageError;
                        img.src = currentItem.url;
                      }}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
                    >
                      Erneut versuchen
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <img
                        src={currentItem.url}
                        alt="Hochzeitsfoto"
                        className={`max-w-full max-h-full object-contain transition-opacity duration-300 cursor-${isEditingText ? 'crosshair' : 'default'} ${
                          imageLoading ? 'opacity-0' : 'opacity-100'
                        }`}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        onClick={handleImageClick}
                      />
                      
                      {/* Render existing text tags */}
                      {getTextTags().map((tag) => (
                        <div
                          key={tag.id}
                          className="absolute text-white font-bold pointer-events-auto group"
                          style={{
                            left: `${tag.position?.x || 50}%`,
                            top: `${tag.position?.y || 50}%`,
                            transform: 'translate(-50%, -50%)',
                            fontSize: `${tag.fontSize || 16}px`,
                            color: tag.color || '#ffffff',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                            cursor: isAdmin ? 'pointer' : 'default'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isAdmin) handleEditTextTag(tag);
                          }}
                        >
                          {tag.text}
                          {isAdmin && (
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTextTag(tag);
                                }}
                                className="hover:text-blue-400"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTextTag(tag.id);
                                }}
                                className="hover:text-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Show new text position indicator */}
                      {textPosition && (
                        <div
                          className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white animate-pulse"
                          style={{
                            left: `${textPosition.x}%`,
                            top: `${textPosition.y}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info panel - mobile optimized bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 sm:p-6 text-white">
        <div className="max-w-2xl mx-auto">
          {/* User info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img 
                src={getAvatarUrl(currentItem.uploadedBy, currentItem.deviceId)}
                alt={currentItem.uploadedBy}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="font-semibold text-white">
                {getUserDisplayName ? getUserDisplayName(currentItem.uploadedBy, currentItem.deviceId) : currentItem.uploadedBy}
              </span>
              <div className="text-sm text-gray-300">
                {formatDate(currentItem.uploadedAt)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6 mb-4">
            <button 
              onClick={() => onToggleLike(currentItem.id)}
              className={`transition-all duration-300 transform hover:scale-110 ${
                isLiked ? 'text-red-500' : 'text-white hover:text-red-400'
              }`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <MessageCircle className="w-6 h-6 text-white" />
            <span className="text-sm text-gray-300">
              {likeCount > 0 ? `${likeCount} Likes` : ''}
            </span>
            
            {/* Admin Text Editing Controls */}
            {isAdmin && currentItem.type === 'image' && (
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setIsEditingText(!isEditingText)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-all duration-300 ${
                    isEditingText 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <Type className="w-3 h-3" />
                  {isEditingText ? 'Beenden' : 'Text bearbeiten'}
                </button>
                {getTextTags().length > 0 && (
                  <span className="text-xs text-gray-300">
                    {getTextTags().length} Text{getTextTags().length !== 1 ? 'e' : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Note text for note items */}
          {currentItem.type === 'note' && currentItem.noteText && (
            <div className="mb-4 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <p className="text-white leading-relaxed">
                "{currentItem.noteText}"
              </p>
            </div>
          )}

          {/* Comments preview */}
          {currentComments.length > 0 && (
            <div className="space-y-3 mb-4 max-h-32 overflow-y-auto">
              {currentComments.slice(-3).map((comment) => {
                const commentAvatarUrl = getUserAvatar 
                  ? getUserAvatar(comment.userName, comment.deviceId) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(comment.userName)}&backgroundColor=transparent`
                  : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(comment.userName)}&backgroundColor=transparent`;
                
                return (
                  <div key={comment.id} className="text-sm flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                      <img 
                        src={commentAvatarUrl}
                        alt={comment.userName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-white mr-2">
                        {getUserDisplayName ? getUserDisplayName(comment.userName, comment.deviceId) : comment.userName}
                      </span>
                      <span className="text-gray-300">
                        {comment.text}
                      </span>
                    </div>
                  </div>
                );
              })}
              {currentComments.length > 3 && (
                <div className="text-xs text-gray-400 ml-8">
                  +{currentComments.length - 3} weitere Kommentare
                </div>
              )}
            </div>
          )}

          {/* Add comment - mobile optimized */}
          <form onSubmit={handleSubmitComment} className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0">
              <img 
                src={getAvatarUrl(userName, undefined)}
                alt={userName}
                className="w-full h-full object-cover"
              />
            </div>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Kommentieren..."
              className="flex-1 bg-white/10 text-white placeholder-gray-400 px-3 py-2.5 sm:py-2 rounded-lg border border-white/20 outline-none focus:border-white/40 transition-colors text-sm sm:text-base touch-manipulation"
              style={{ minHeight: '44px' }}
            />
            {commentText.trim() && (
              <button
                type="submit"
                className="px-3 sm:px-4 py-2.5 sm:py-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg transition-colors text-sm sm:text-base touch-manipulation"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                <span className="hidden sm:inline">Senden</span>
                <span className="sm:hidden">✓</span>
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Text Editing Modal */}
      {(textPosition || selectedTextTag) && isAdmin && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-lg p-6 transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {selectedTextTag ? 'Text bearbeiten' : 'Text hinzufügen'}
              </h3>
              <button
                onClick={handleCancelEdit}
                className={`p-1 rounded-full transition-colors duration-300 ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Text
                </label>
                <input
                  type="text"
                  value={newTextContent}
                  onChange={(e) => setNewTextContent(e.target.value)}
                  placeholder="Text eingeben..."
                  className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  autoFocus
                />
              </div>
              
              {textPosition && (
                <div className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Position: {Math.round(textPosition.x)}%, {Math.round(textPosition.y)}%
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors duration-300 ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Abbrechen
              </button>
              <button
                onClick={selectedTextTag ? handleUpdateTextTag : handleSaveTextTag}
                disabled={!newTextContent.trim()}
                className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors duration-300 ${
                  newTextContent.trim()
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {selectedTextTag ? 'Aktualisieren' : 'Hinzufügen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions overlay when in text editing mode */}
      {isEditingText && !textPosition && !selectedTextTag && isAdmin && currentItem.type === 'image' && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm z-30">
          Klicke auf das Bild, um Text hinzuzufügen
        </div>
      )}
    </div>
  );
};