import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Trash2, Edit3, AlertTriangle, Users, MapPin, Type, Edit2 } from 'lucide-react';
import { MediaItem, Comment, Like, PersonTag, TextTag } from '../types';

interface InstagramPostProps {
  item: MediaItem;
  comments: Comment[];
  likes: Like[];
  onAddComment: (mediaId: string, text: string) => void;
  onDeleteComment: (commentId: string) => void;
  onToggleLike: (mediaId: string) => void;
  onDelete?: (item: MediaItem) => void;
  onEditNote?: (item: MediaItem, newText: string) => void;
  onEditTextTag?: (item: MediaItem, tagId: string, newText: string) => void;
  showDeleteButton: boolean;
  userName: string;
  isAdmin: boolean;
  onClick: () => void;
  isDarkMode: boolean;
  getUserAvatar?: (userName: string, deviceId?: string) => string | null;
  getUserDisplayName?: (userName: string, deviceId?: string) => string;
  getUserDeviceId?: () => string;
  galleryId: string;
  galleryTheme?: 'hochzeit' | 'geburtstag' | 'urlaub' | 'eigenes';
}

export const InstagramPost: React.FC<InstagramPostProps> = ({
  item,
  comments,
  likes,
  onAddComment,
  onDeleteComment,
  onToggleLike,
  onDelete,
  onEditNote,
  onEditTextTag,
  showDeleteButton,
  userName,
  isAdmin,
  onClick,
  isDarkMode,
  getUserAvatar,
  getUserDisplayName,
  getUserDeviceId,
  galleryId,
  galleryTheme = 'hochzeit'
}) => {
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editNoteText, setEditNoteText] = useState(item.noteText || '');
  const [editingTextTagId, setEditingTextTagId] = useState<string | null>(null);
  const [editTextTagText, setEditTextTagText] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [preloaded, setPreloaded] = useState(false);
  const [localTextTags, setLocalTextTags] = useState(item.textTags || []);
  const [localLegacyTags, setLocalLegacyTags] = useState(item.tags || []);

  // OPTIMIZED: Memoize expensive calculations
  const { isLiked, likeCount, canDeletePost, canEditNote } = React.useMemo(() => ({
    isLiked: likes.some(like => like.userName === userName),
    likeCount: likes.length,
    canDeletePost: isAdmin || item.uploadedBy === userName,
    canEditNote: item.type === 'note' && item.uploadedBy === userName
  }), [likes, userName, isAdmin, item.uploadedBy, item.type]);

  // OPTIMIZED: Simplified image preloading without DOM manipulation
  useEffect(() => {
    if (item.type === 'image' && item.url) {
      const img = new Image();
      img.onload = () => {
        setPreloaded(true);
        setImageLoading(false);
      };
      img.onerror = () => {
        setImageError(true);
        setImageLoading(false);
      };
      img.src = item.url;
    } else {
      setImageLoading(false);
    }
  }, [item.url, item.type]);

  // Sync local state with props when item changes
  useEffect(() => {
    setLocalTextTags(item.textTags || []);
    setLocalLegacyTags(item.tags || []);
  }, [item.textTags, item.tags]);

  // Listen for profile picture updates
  useEffect(() => {
    const handleProfilePictureUpdate = (event: CustomEvent) => {
      const { userName: updatedUserName, deviceId: updatedDeviceId } = event.detail;
      
      // Check if this update affects any users in this post or comments
      const isPostAuthorUpdated = item.uploadedBy === updatedUserName && item.deviceId === updatedDeviceId;
      const isCommentAuthorUpdated = comments.some(comment => 
        comment.userName === updatedUserName && comment.deviceId === updatedDeviceId
      );
      
      if (isPostAuthorUpdated || isCommentAuthorUpdated) {
        setRefreshKey(prev => prev + 1);
      }
    };

    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate as any);
    
    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate as any);
    };
  }, [item.uploadedBy, item.deviceId, comments]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(item.id, commentText.trim());
      setCommentText('');
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Beitrag wirklich löschen?')) {
      onDelete(item);
    }
  };

  const handleDeleteComment = (commentId: string, comment: Comment) => {
    // User can delete their own comments or admin can delete any
    const canDeleteComment = isAdmin || comment.userName === userName;
    
    if (canDeleteComment && window.confirm('Kommentar wirklich löschen?')) {
      onDeleteComment(commentId);
    }
  };

  const handleEditNote = () => {
    if (onEditNote && editNoteText.trim() && editNoteText !== item.noteText) {
      onEditNote(item, editNoteText.trim());
    }
    setIsEditingNote(false);
  };

  const handleCancelEdit = () => {
    setEditNoteText(item.noteText || '');
    setIsEditingNote(false);
  };

  const handleEditTextTag = (tagId: string, currentText: string) => {
    setEditingTextTagId(tagId);
    setEditTextTagText(currentText);
  };

  const handleSaveTextTag = async () => {
    if (onEditTextTag && editingTextTagId && editTextTagText.trim()) {
      // Update local state immediately for instant UI update
      const updatedText = editTextTagText.trim();
      
      // Update local textTags if editing new format
      if (localTextTags.some(tag => tag.id === editingTextTagId)) {
        setLocalTextTags(prev => 
          prev.map(tag => 
            tag.id === editingTextTagId 
              ? { ...tag, text: updatedText }
              : tag
          )
        );
      }
      
      // Update local legacy tags if editing legacy format
      if (localLegacyTags.some(tag => tag.id === editingTextTagId)) {
        setLocalLegacyTags(prev => 
          prev.map(tag => 
            tag.id === editingTextTagId && tag.type === 'text'
              ? { ...tag, text: updatedText }
              : tag
          )
        );
      }
      
      // Save to backend
      await onEditTextTag(item, editingTextTagId, updatedText);
    }
    setEditingTextTagId(null);
    setEditTextTagText('');
  };

  const handleCancelTextEdit = () => {
    setEditingTextTagId(null);
    setEditTextTagText('');
  };

  // Check if current user can edit text tags
  const canEditTextTag = (tagOwner?: string, tagDeviceId?: string) => {
    return isAdmin || (item.uploadedBy === userName && item.deviceId === getUserDeviceId?.());
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
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

  const displayComments = showAllComments ? comments : comments.slice(0, 2);

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

  const getDisplayName = (username: string) => {
    return getUserDisplayName?.(username, item.deviceId) || username;
  };

  return (
    <div className={`mb-6 mx-4 rounded-3xl border transition-all duration-500 relative overflow-hidden backdrop-blur-xl ${
      isDarkMode 
        ? 'bg-gray-800/40 border-gray-700/30 shadow-2xl shadow-purple-500/10' 
        : 'bg-white/80 border-gray-200/40 shadow-2xl shadow-pink-500/10'
    }`}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-xl ${
          isDarkMode ? 'bg-pink-500' : 'bg-pink-300'
        }`} style={{ transform: 'translate(30%, -30%)' }}></div>
        <div className={`absolute bottom-0 left-0 w-16 h-16 rounded-full blur-xl ${
          isDarkMode ? 'bg-purple-500' : 'bg-purple-300'
        }`} style={{ transform: 'translate(-30%, 30%)' }}></div>
      </div>
      
      <div className="relative z-10">
        {/* Post Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full p-0.5 bg-gradient-to-r ${
              isDarkMode 
                ? 'from-pink-500 via-purple-500 to-indigo-500' 
                : 'from-pink-400 via-purple-400 to-indigo-400'
            }`}>
              <div className="w-full h-full rounded-full overflow-hidden">
                <img 
                  src={getAvatarUrl(item.uploadedBy, item.deviceId)}
                  alt={item.uploadedBy}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div>
              <span className={`font-semibold text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {getUserDisplayName ? getUserDisplayName(item.uploadedBy, item.deviceId) : item.uploadedBy}
                {item.uploadedBy === userName && (
                  <span className={`ml-1.5 text-xs px-2 py-0.5 rounded-full transition-colors duration-300 ${
                    isDarkMode ? 'bg-blue-600/80 text-white' : 'bg-blue-100/80 text-blue-800'
                  }`}>
                    Du
                  </span>
                )}
              </span>
              <div className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {formatDate(item.uploadedAt)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEditNote && (
              <button
                onClick={() => setIsEditingNote(true)}
                className={`p-1.5 rounded-full transition-all duration-300 transform hover:scale-110 ${
                  isDarkMode ? 'text-blue-400 hover:bg-blue-900/30' : 'text-blue-500 hover:bg-blue-50/80'
                }`}
                title="Notiz bearbeiten"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {canDeletePost && (
              <button
                onClick={handleDelete}
                className={`p-1.5 rounded-full transition-all duration-300 transform hover:scale-110 ${
                  isDarkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-500 hover:bg-red-50/80'
                }`}
                title="Beitrag löschen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

          </div>
        </div>

        {/* Media Content with Tagging */}
        <div className="relative mx-4 mb-3 rounded-2xl overflow-hidden">
          {item.type === 'video' ? (
            <div className="relative w-full aspect-square">
              <video
                src={item.url}
                className="w-full h-full object-cover"
                controls
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
              
              {/* Like Button for Videos - Top Right */}
              <div className="absolute top-4 right-4 z-40">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLike(item.id);
                  }}
                  className={`bg-black/60 backdrop-blur-sm rounded-full p-3 transition-all duration-300 transform hover:scale-110 shadow-lg ${
                    isLiked ? 'text-red-500' : 'text-white hover:text-red-400'
                  } flex items-center gap-2`}
                  title={isLiked ? 'Unlike' : 'Like'}
                >
                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                  {likeCount > 0 && (
                    <span className="text-sm font-semibold">{likeCount}</span>
                  )}
                </button>
              </div>

              {/* Loading indicator for videos */}
              {imageLoading && (
                <div className={`absolute inset-0 flex items-center justify-center transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700/80' : 'bg-gray-100/80'
                }`}>
                  <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          ) : (
          <div className="relative w-full aspect-square">
            {imageLoading && !item.isUnavailable && (
              <div className={`absolute inset-0 flex items-center justify-center transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {/* 🔧 FIX: Show unavailable state for items that couldn't be loaded */}
            {(imageError || item.isUnavailable || !item.url) ? (
              <div className={`absolute inset-0 flex flex-col items-center justify-center transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}>
                <AlertTriangle className="w-12 h-12 mb-4 text-orange-500" />
                <div className="text-lg font-semibold mb-2">Datei nicht verfügbar</div>
                <p className="text-sm text-center px-4 mb-2">
                  {item.isUnavailable 
                    ? 'Diese Datei konnte nicht geladen werden'
                    : 'Bild konnte nicht geladen werden'
                  }
                </p>
                <p className="text-xs text-center px-4 opacity-75">
                  Von {item.uploadedBy} • {formatDate(item.uploadedAt)}
                </p>
                <div className={`mt-4 px-3 py-1 rounded-full text-xs transition-colors duration-300 ${
                  isDarkMode ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-800'
                }`}>
                  {item.type === 'note' ? '📝 Notiz' : '📷 Bild'}
                </div>
              </div>
            ) : (
              <img
                src={item.url}
                alt="Hochzeitsfoto"
                className={`w-full h-full object-cover cursor-pointer transition-opacity duration-300 ${
                  imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onClick={onClick}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy"
              />
            )}

            {/* Like Button - Centered Bottom with Full Functionality */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-40">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLike(item.id);
                }}
                className={`bg-black/60 backdrop-blur-sm rounded-full p-3 transition-all duration-300 transform hover:scale-110 shadow-lg ${
                  isLiked ? 'text-red-500' : 'text-white hover:text-red-400'
                } flex items-center gap-2`}
                title={isLiked ? 'Unlike' : 'Like'}
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                {likeCount > 0 && (
                  <span className="text-sm font-semibold">{likeCount}</span>
                )}
              </button>
            </div>

            {/* Bottom Badge Overlay - Persons (Bottom Left) and Location (Bottom Right) */}
            {((item.personTags && item.personTags.length > 0) || (item.tags && item.tags.filter(tag => tag.type === 'person').length > 0)) && (
              <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 flex justify-between items-end">
                {/* Tagged Persons Badge - Bottom Left */}
                {(() => {
                  const personCount = (item.personTags?.length || 0) + (item.tags?.filter(tag => tag.type === 'person').length || 0);
                  return personCount > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-full text-white text-xs border border-white/20">
                      <Users className="w-3 h-3" />
                      <span className="hidden xs:inline">
                        {personCount === 1 ? '1 Person' : `${personCount} Personen`}
                      </span>
                      <span className="xs:hidden">
                        {personCount}
                      </span>
                    </div>
                  );
                })()}


              </div>
            )}
          </div>
          )}
        </div>

        {/* Clean Post Info Section */}
        <div className="px-4 py-3">


          {/* Text Tags Display - REDESIGNED */}
          {((localTextTags && localTextTags.length > 0) || (localLegacyTags && localLegacyTags.filter(tag => tag.type === 'text').length > 0)) && (
            <div className="mb-3">
              {/* Display new textTags */}
              {localTextTags?.map((textTag) => (
                <div key={textTag.id} className="mb-2">
                  {editingTextTagId === textTag.id ? (
                    <div className={`relative p-4 rounded-3xl border backdrop-blur-xl transition-all duration-500 ${
                      isDarkMode 
                        ? 'bg-gray-800/60 border-gray-600/40 shadow-2xl' 
                        : 'bg-white/90 border-gray-200/60 shadow-2xl'
                    }`}>
                      {/* Decorative background elements */}
                      <div className="absolute inset-0 opacity-5 rounded-3xl overflow-hidden">
                        <div className={`absolute top-0 right-0 w-16 h-16 rounded-full blur-xl ${
                          isDarkMode ? 'bg-blue-500' : 'bg-blue-300'
                        }`} style={{ transform: 'translate(20%, -20%)' }}></div>
                        <div className={`absolute bottom-0 left-0 w-12 h-12 rounded-full blur-xl ${
                          isDarkMode ? 'bg-purple-500' : 'bg-purple-300'
                        }`} style={{ transform: 'translate(-20%, 20%)' }}></div>
                      </div>
                      
                      <div className="relative z-10">
                        <h4 className={`font-semibold mb-3 flex items-center gap-2 transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          <Edit2 className="w-4 h-4" />
                          Text bearbeiten
                        </h4>
                        <textarea
                          value={editTextTagText}
                          onChange={(e) => setEditTextTagText(e.target.value)}
                          className={`w-full p-4 rounded-2xl border resize-none transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 ${
                            isDarkMode 
                              ? 'bg-gray-900/50 border-gray-600/50 text-white placeholder-gray-400 backdrop-blur-sm' 
                              : 'bg-white/80 border-gray-300/50 text-gray-900 placeholder-gray-500 backdrop-blur-sm'
                          }`}
                          rows={3}
                          maxLength={200}
                          placeholder="Text eingeben..."
                          autoFocus
                        />
                        <div className={`text-xs mt-2 transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {editTextTagText.length}/200 Zeichen
                        </div>
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={handleCancelTextEdit}
                            className={`flex-1 px-4 py-2 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 ${
                              isDarkMode 
                                ? 'bg-gray-700/80 hover:bg-gray-600/80 text-white' 
                                : 'bg-gray-100/80 hover:bg-gray-200/80 text-gray-700'
                            }`}
                          >
                            Abbrechen
                          </button>
                          <button
                            onClick={handleSaveTextTag}
                            disabled={!editTextTagText.trim() || editTextTagText === textTag.text}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 
                                     disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-2xl 
                                     font-medium transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 
                                     shadow-lg disabled:shadow-none"
                          >
                            Speichern
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`text-base leading-relaxed text-center ${
                      isDarkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {textTag.text}
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTextTag(textTag.id, textTag.text);
                          }}
                          className={`ml-2 p-1 rounded-lg transition-colors opacity-70 hover:opacity-100 ${
                            isDarkMode 
                              ? 'hover:bg-gray-700/50 text-gray-400 hover:text-gray-200' 
                              : 'hover:bg-gray-100/50 text-gray-500 hover:text-gray-700'
                          }`}
                          title="Text bearbeiten (nur Admin)"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Display legacy tags with type 'text' */}
              {localLegacyTags?.filter(tag => tag.type === 'text').map((tag) => {
                const textTag = tag as any; // TextTag interface
                const isEditing = editingTextTagId === tag.id;
                
                return (
                  <div key={tag.id} className="mb-2">
                    {isEditing ? (
                      <div className={`relative p-4 rounded-3xl border backdrop-blur-xl transition-all duration-500 ${
                        isDarkMode 
                          ? 'bg-gray-800/60 border-gray-600/40 shadow-2xl' 
                          : 'bg-white/90 border-gray-200/60 shadow-2xl'
                      }`}>
                        {/* Decorative background elements */}
                        <div className="absolute inset-0 opacity-5 rounded-3xl overflow-hidden">
                          <div className={`absolute top-0 right-0 w-16 h-16 rounded-full blur-xl ${
                            isDarkMode ? 'bg-blue-500' : 'bg-blue-300'
                          }`} style={{ transform: 'translate(20%, -20%)' }}></div>
                          <div className={`absolute bottom-0 left-0 w-12 h-12 rounded-full blur-xl ${
                            isDarkMode ? 'bg-purple-500' : 'bg-purple-300'
                          }`} style={{ transform: 'translate(-20%, 20%)' }}></div>
                        </div>
                        
                        <div className="relative z-10">
                          <h4 className={`font-semibold mb-3 flex items-center gap-2 transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            <Edit2 className="w-4 h-4" />
                            Text bearbeiten
                          </h4>
                          <textarea
                            value={editTextTagText}
                            onChange={(e) => setEditTextTagText(e.target.value)}
                            className={`w-full p-4 rounded-2xl border resize-none transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 ${
                              isDarkMode 
                                ? 'bg-gray-900/50 border-gray-600/50 text-white placeholder-gray-400 backdrop-blur-sm' 
                                : 'bg-white/80 border-gray-300/50 text-gray-900 placeholder-gray-500 backdrop-blur-sm'
                            }`}
                            rows={3}
                            maxLength={200}
                            placeholder="Text eingeben..."
                            autoFocus
                          />
                          <div className={`text-xs mt-2 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {editTextTagText.length}/200 Zeichen
                          </div>
                          <div className="flex gap-3 mt-4">
                            <button
                              onClick={handleCancelTextEdit}
                              className={`flex-1 px-4 py-2 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 ${
                                isDarkMode 
                                  ? 'bg-gray-700/80 hover:bg-gray-600/80 text-white' 
                                  : 'bg-gray-100/80 hover:bg-gray-200/80 text-gray-700'
                              }`}
                            >
                              Abbrechen
                            </button>
                            <button
                              onClick={handleSaveTextTag}
                              disabled={!editTextTagText.trim() || editTextTagText === textTag.text}
                              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 
                                       disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-2xl 
                                       font-medium transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 
                                       shadow-lg disabled:shadow-none"
                            >
                              Speichern
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={`text-base leading-relaxed text-center ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        {textTag.text}
                        {isAdmin && (
                          <button
                            onClick={() => handleEditTextTag(tag.id, textTag.text)}
                            className={`ml-2 p-1 rounded-lg transition-colors opacity-70 hover:opacity-100 ${
                              isDarkMode 
                                ? 'hover:bg-gray-700/50 text-gray-400 hover:text-gray-200' 
                                : 'hover:bg-gray-100/50 text-gray-500 hover:text-gray-700'
                            }`}
                            title="Text bearbeiten (nur Admin)"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tagged People Display with Profile Pictures */}
          {((item.personTags && item.personTags.length > 0) || (item.tags && item.tags.filter(tag => tag.type === 'person').length > 0)) && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {/* Display new personTags */}
                {item.personTags?.map((personTag) => {
                  const avatarUrl = getUserAvatar ? getUserAvatar(personTag.userName, personTag.deviceId) : null;
                  const displayName = getUserDisplayName ? getUserDisplayName(personTag.userName, personTag.deviceId) : personTag.userName;
                  
                  return (
                    <span
                      key={personTag.id}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-300 ${
                        isDarkMode 
                          ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs">
                        {avatarUrl ? (
                          <img 
                            src={avatarUrl} 
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      {displayName}
                    </span>
                  );
                })}
                
                {/* Display legacy tags with type 'person' */}
                {item.tags?.filter(tag => tag.type === 'person').map((tag) => {
                  const personTag = tag as PersonTag;
                  const avatarUrl = getUserAvatar ? getUserAvatar(personTag.userName, personTag.deviceId) : null;
                  const displayName = getUserDisplayName ? getUserDisplayName(personTag.userName, personTag.deviceId) : personTag.userName;
                  
                  return (
                    <span
                      key={tag.id}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-300 ${
                        isDarkMode 
                          ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs">
                        {avatarUrl ? (
                          <img 
                            src={avatarUrl} 
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      {displayName}
                    </span>
                  );
                })}
                
                {/* Display location tags */}
                {item.locationTags?.map((locationTag) => (
                  <span
                    key={locationTag.id}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-green-600/20 text-green-300 border border-green-500/30' 
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}
                  >
                    <MapPin className="w-4 h-4 mr-1.5" />
                    {locationTag.locationName || (locationTag as any).name}
                  </span>
                ))}
                
                {/* Display legacy location tags */}
                {item.tags?.filter(tag => tag.type === 'location').map((tag) => (
                  <span
                    key={tag.id}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-green-600/20 text-green-300 border border-green-500/30' 
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}
                  >
                    <MapPin className="w-4 h-4 mr-1.5" />
                    {(tag as any).locationName || (tag as any).name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Note Edit Mode */}
          {isEditingNote && item.type === 'note' && (
            <div className={`mb-4 p-5 rounded-2xl transition-colors duration-300 backdrop-blur-sm ${
              isDarkMode ? 'bg-gray-700/30 border border-gray-600/50' : 'bg-blue-50/80 border border-blue-200/50'
            }`}>
            <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Notiz bearbeiten:
            </h4>
            <textarea
              value={editNoteText}
              onChange={(e) => setEditNoteText(e.target.value)}
              className={`w-full p-3 rounded-lg border resize-none transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              rows={3}
              maxLength={500}
              placeholder="Deine Notiz..."
            />
            <div className={`text-xs mt-1 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {editNoteText.length}/500
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleCancelEdit}
                className={`px-3 py-1 rounded text-sm transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
              >
                Abbrechen
              </button>
              <button
                onClick={handleEditNote}
                disabled={!editNoteText.trim() || editNoteText === item.noteText}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
              >
                Speichern
              </button>
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="space-y-2">
          {displayComments.map((comment) => {
            const canDeleteThisComment = isAdmin || comment.userName === userName;
            const commentAvatarUrl = getUserAvatar 
              ? (getUserAvatar(comment.userName, comment.deviceId) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(comment.userName)}&backgroundColor=transparent`)
              : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(comment.userName)}&backgroundColor=transparent`;
            
            return (
              <div key={comment.id} className="text-sm flex items-start gap-3 group">
                {/* Profile Picture */}
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                  <img 
                    src={commentAvatarUrl}
                    alt={comment.userName}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div>
                    <span className={`font-semibold mr-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {getUserDisplayName ? getUserDisplayName(comment.userName, comment.deviceId) : comment.userName}
                      {comment.userName === userName && (
                        <span className={`ml-1 text-xs px-1.5 py-0.5 rounded transition-colors duration-300 ${
                          isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                        }`}>
                          Du
                        </span>
                      )}
                    </span>
                    <span className={`transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {comment.text}
                    </span>
                  </div>
                </div>
                
                {canDeleteThisComment && (
                  <button
                    onClick={() => handleDeleteComment(comment.id, comment)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all flex-shrink-0"
                    title="Kommentar löschen"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
          
          {comments.length > 2 && !showAllComments && (
            <button
              onClick={() => setShowAllComments(true)}
              className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              Alle {comments.length} Kommentare ansehen
            </button>
          )}
          </div>



          {/* Add Comment */}
          <form onSubmit={handleSubmitComment} className={`mt-4 pt-4 border-t transition-colors duration-300 ${
            isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
          }`}>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full overflow-hidden">
              <img 
                src={getAvatarUrl(userName, getUserDeviceId?.())}
                alt={userName}
                className="w-full h-full object-cover"
              />
            </div>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Kommentieren..."
              className={`flex-1 text-sm outline-none bg-transparent transition-colors duration-300 ${
                isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
              }`}
            />
            {commentText.trim() && (
              <button
                type="submit"
                className="text-blue-500 font-semibold text-sm"
              >
                Posten
              </button>
            )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};