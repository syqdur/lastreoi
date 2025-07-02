import React, { useState, useEffect, useCallback } from 'react';
import { Grid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem, Comment, Like } from '../types';
import { InstagramPost } from './InstagramPost';
import { NotePost } from './NotePost';
import { GALLERY_THEMES } from '../config/themes';

interface InstagramGalleryProps {
  items: MediaItem[];
  onItemClick: (index: number) => void;
  onDelete?: (item: MediaItem) => void;
  onEditNote?: (item: MediaItem, newText: string) => void;
  onEditTextTag?: (item: MediaItem, tagId: string, newText: string) => void;
  isAdmin: boolean;
  comments: Comment[];
  likes: Like[];
  onAddComment: (mediaId: string, text: string) => void;
  onDeleteComment: (commentId: string) => void;
  onToggleLike: (mediaId: string) => void;
  userName: string;
  isDarkMode: boolean;
  getUserAvatar?: (userName: string, deviceId?: string) => string | null;
  getUserDisplayName?: (userName: string, deviceId?: string) => string;
  deviceId: string;
  galleryTheme: 'hochzeit' | 'geburtstag' | 'urlaub' | 'eigenes';
  galleryId: string;
  viewMode?: 'feed' | 'grid';
  // Infinite scroll props
  loadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  isLoadingMore?: boolean;
}

// 🚀 INSTANT VISUAL FEEDBACK: Skeleton component for gallery loading
export const GallerySkeleton: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2 px-2 sm:px-3">
    {[...Array(4)].map((_, i) => (
      <div
        key={i}
        className={`aspect-square rounded-lg animate-pulse ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
        }`}
        style={{ minHeight: '120px' }}
      >
        <div className={`w-full h-full rounded-lg ${
          isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
        }`} />
      </div>
    ))}
  </div>
);

export const InstagramGallery: React.FC<InstagramGalleryProps> = ({
  items,
  onItemClick,
  onDelete,
  onEditNote,
  onEditTextTag,
  isAdmin,
  comments,
  likes,
  onAddComment,
  onDeleteComment,
  onToggleLike,
  userName,
  isDarkMode,
  getUserAvatar,
  getUserDisplayName,
  deviceId,
  galleryTheme,
  galleryId,
  viewMode = 'feed',
  loadMore,
  hasMore,
  isLoading,
  isLoadingMore
}) => {
  const [notesSliderIndex, setNotesSliderIndex] = useState(0);

  // OPTIMIZED: Memoize expensive filtering operations
  const { noteItems, mediaItems } = React.useMemo(() => {
    const notes = (items || []).filter(item => item.type === 'note');
    const media = (items || []).filter(item => item.type !== 'note');
    return { noteItems: notes, mediaItems: media };
  }, [items]);

  // OPTIMIZED: Memoize comment and like maps for O(1) lookup instead of O(n) filtering
  const commentsByMediaId = React.useMemo(() => {
    const map = new Map<string, Comment[]>();
    comments.forEach(comment => {
      const existing = map.get(comment.mediaId) || [];
      map.set(comment.mediaId, [...existing, comment]);
    });
    return map;
  }, [comments]);

  const likesByMediaId = React.useMemo(() => {
    const map = new Map<string, Like[]>();
    likes.forEach(like => {
      const existing = map.get(like.mediaId) || [];
      map.set(like.mediaId, [...existing, like]);
    });
    return map;
  }, [likes]);
  
  // Get theme configuration with fallback
  const themeConfig = GALLERY_THEMES[galleryTheme] || GALLERY_THEMES.hochzeit;
  const themeStyles = themeConfig.styles;

  const getAvatarUrl = (name: string) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=transparent`;
  };

  const nextNote = () => {
    setNotesSliderIndex((prev) => (prev + 1) % noteItems.length);
  };

  const prevNote = () => {
    setNotesSliderIndex((prev) => (prev - 1 + noteItems.length) % noteItems.length);
  };

  const goToNote = (index: number) => {
    setNotesSliderIndex(index);
  };

  // Infinite scroll functionality
  const handleScroll = useCallback(() => {
    if (!loadMore || !hasMore || isLoading || isLoadingMore) return;

    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;

    // Trigger load more when 200px from bottom
    if (scrollHeight - scrollTop <= clientHeight + 200) {
      loadMore();
    }
  }, [loadMore, hasMore, isLoading, isLoadingMore]);

  // Add scroll listener
  useEffect(() => {
    if (loadMore && hasMore) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll, loadMore, hasMore]);

  return (
    <div>
      {/* Content */}
      {viewMode === 'feed' ? (
        // Feed View
        <div className="space-y-0">
          {(items || []).map((item, index) => (
            item.type === 'note' ? (
              <NotePost
                key={item.id}
                item={item}
                comments={commentsByMediaId.get(item.id) || []}
                likes={likesByMediaId.get(item.id) || []}
                onAddComment={onAddComment}
                onDeleteComment={onDeleteComment}
                onToggleLike={onToggleLike}
                onDelete={onDelete}
                onEditNote={onEditNote}
                showDeleteButton={isAdmin}
                userName={userName}
                isAdmin={isAdmin}
                isDarkMode={isDarkMode}
                getUserAvatar={getUserAvatar}
                getUserDisplayName={getUserDisplayName}
                galleryTheme={galleryTheme}
              />
            ) : (
              <InstagramPost
                key={item.id}
                item={item}
                comments={commentsByMediaId.get(item.id) || []}
                likes={likesByMediaId.get(item.id) || []}
                onAddComment={onAddComment}
                onDeleteComment={onDeleteComment}
                onToggleLike={onToggleLike}
                onDelete={onDelete}
                onEditNote={onEditNote}
                onEditTextTag={onEditTextTag}
                showDeleteButton={isAdmin}
                userName={userName}
                isAdmin={isAdmin}
                onClick={() => onItemClick(index)}
                isDarkMode={isDarkMode}
                getUserAvatar={getUserAvatar}
                getUserDisplayName={getUserDisplayName}
                getUserDeviceId={() => deviceId}
                galleryId={galleryId}
              />
            )
          ))}
        </div>
      ) : (
        // Grid View
        <div className="p-1">
          {/* Show skeleton if loading and no items yet */}
          {isLoading && items.length === 0 && (
            <GallerySkeleton isDarkMode={isDarkMode} />
          )}
          
          {/* Notes Slider */}
          {noteItems.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3 px-3">
                <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  💌 Notizen ({noteItems.length})
                </h3>
                
                {/* Slider Navigation */}
                {noteItems.length > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={prevNote}
                      className={`p-2 sm:p-3 rounded-full transition-colors duration-300 touch-manipulation ${
                        isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                      style={{ minWidth: '44px', minHeight: '44px' }}
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    
                    {/* Dots Indicator */}
                    <div className="flex gap-1">
                      {noteItems.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => goToNote(index)}
                          className={`w-3 h-3 sm:w-2 sm:h-2 rounded-full transition-all duration-300 touch-manipulation ${
                            index === notesSliderIndex
                              ? galleryTheme === 'hochzeit'
                                ? 'bg-pink-500 w-6 sm:w-4'
                                : galleryTheme === 'geburtstag'
                                ? 'bg-purple-500 w-6 sm:w-4'
                                : galleryTheme === 'urlaub'
                                ? 'bg-blue-500 w-6 sm:w-4'
                                : 'bg-green-500 w-6 sm:w-4'
                              : isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400'
                          }`}
                          style={{ minWidth: '24px', minHeight: '24px' }}
                        />
                      ))}
                    </div>
                    
                    <button
                      onClick={nextNote}
                      className={`p-2 sm:p-3 rounded-full transition-colors duration-300 touch-manipulation ${
                        isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                      style={{ minWidth: '44px', minHeight: '44px' }}
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Slider Container */}
              <div className="relative overflow-hidden rounded-xl">
                <div 
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${notesSliderIndex * 100}%)` }}
                >
                  {noteItems.map((item) => {
                    const itemLikes = likes.filter(l => l.mediaId === item.id);
                    const itemComments = comments.filter(c => c.mediaId === item.id);
                    const isLiked = itemLikes.some(like => like.userName === userName);
                    const canDelete = isAdmin || item.uploadedBy === userName;
                    const canEdit = item.uploadedBy === userName;
                
                    return (
                      <div
                        key={item.id}
                        className="w-full flex-shrink-0 px-3"
                      >
                        <div className={`p-6 rounded-xl border transition-all duration-300 ${
                          isDarkMode 
                            ? 'bg-gray-800/50 border-gray-700' 
                            : 'bg-white border-gray-200 shadow-sm'
                        }`}>
                          {/* Note Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center relative">
                                {/* Animated Envelope with Heart */}
                                <div className="relative">
                                  {/* Envelope using SVG for clean rendering */}
                                  <svg 
                                    width="24" 
                                    height="18" 
                                    viewBox="0 0 24 18" 
                                    className={`transition-colors duration-300 ${
                                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                    }`}
                                    style={{
                                      animation: 'gentle-bounce 3s ease-in-out infinite'
                                    }}
                                  >
                                    {/* Envelope body */}
                                    <rect 
                                      x="2" 
                                      y="4" 
                                      width="20" 
                                      height="12" 
                                      rx="1" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      strokeWidth="1.5"
                                    />
                                    {/* Envelope flap */}
                                    <path 
                                      d="M2 5L12 11L22 5" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      strokeWidth="1.5" 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                  
                                  {/* Floating Heart */}
                                  <div 
                                    className="absolute text-red-500 text-sm"
                                    style={{
                                      animation: 'heart-float 2s ease-in-out infinite',
                                      top: '-6px',
                                      right: '-6px'
                                    }}
                                  >
                                    ❤️
                                  </div>
                                </div>
                              </div>
                              <div>
                                <div>
                                  <span className={`font-semibold transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {getUserDisplayName ? getUserDisplayName(item.uploadedBy, item.deviceId) : item.uploadedBy}
                                    {item.uploadedBy === userName && (
                                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full transition-colors duration-300 ${
                                        isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                                      }`}>
                                        Du
                                      </span>
                                    )}
                                  </span>
                                  <p className={`text-sm transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    {new Date(item.uploadedAt).toLocaleDateString('de-DE', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Note Content */}
                          <div className={`mb-4 p-4 rounded-lg transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-700/30' : 'bg-gray-50'
                          }`}>
                            <p className={`text-base leading-relaxed transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-200' : 'text-gray-800'
                            }`}>
                              {item.noteText || item.note}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => onToggleLike(item.id)}
                                className={`flex items-center gap-1 text-sm transition-colors duration-300 ${
                                  isLiked 
                                    ? 'text-red-500 hover:text-red-600' 
                                    : isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
                                }`}
                              >
                                <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
                                <span>{itemLikes.length}</span>
                              </button>
                              <span className={`text-sm transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                💬 {itemComments.length}
                              </span>
                            </div>
                            {(canDelete || canEdit) && (
                              <div className="flex gap-2">
                                {canEdit && onEditNote && (
                                  <button
                                    onClick={() => {
                                      const newText = prompt('Notiz bearbeiten:', item.noteText || item.note || '');
                                      if (newText !== null) {
                                        onEditNote(item, newText);
                                      }
                                    }}
                                    className={`text-sm px-3 py-1 rounded-full transition-colors duration-300 ${
                                      isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                                    }`}
                                  >
                                    Bearbeiten
                                  </button>
                                )}
                                {canDelete && onDelete && (
                                  <button
                                    onClick={() => onDelete(item)}
                                    className={`text-sm px-3 py-1 rounded-full transition-colors duration-300 ${
                                      isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-100 hover:bg-red-200 text-red-800'
                                    }`}
                                  >
                                    Löschen
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Swipe Hint */}
              {noteItems.length > 1 && (
                <div className={`text-center mt-2 text-xs transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  ← Wische oder nutze die Pfeile zum Navigieren →
                </div>
              )}
            </div>
          )}

          {/* Media Grid */}
          {mediaItems.length > 0 && (
            <div>
              <h3 className={`text-lg font-semibold mb-3 px-3 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                📸 Medien ({mediaItems.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2 px-2 sm:px-3">
                {mediaItems.map((item, mediaIndex) => {
                  // Find the original index in the full items array
                  const originalIndex = items.findIndex(i => i.id === item.id);
                  const itemLikes = likes.filter(l => l.mediaId === item.id);
                  const itemComments = comments.filter(c => c.mediaId === item.id);
                  
                  return (
                    <div
                      key={item.id}
                      className="relative aspect-square cursor-pointer group touch-manipulation"
                      onClick={() => onItemClick(originalIndex)}
                      style={{ minHeight: '120px' }}
                    >
                      {/* Media Content */}
                      <div className="w-full h-full overflow-hidden">
                        {item.type === 'video' ? (
                          <div className="relative w-full h-full">
                            <video
                              src={item.url}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                            />
                            {/* Video indicator */}
                            <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={item.url}
                            alt={item.noteText || item.note || 'Uploaded media'}
                            className="w-full h-full object-cover"
                            loading={mediaIndex < 4 ? "eager" : "lazy"}
                            decoding="async"
                            style={{ 
                              backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
                              transition: 'opacity 0.2s ease-in-out'
                            }}
                            onLoad={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.opacity = '1';
                            }}
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.opacity = '0.5';
                              console.warn('Failed to load image:', item.url);
                            }}
                          />
                        )}
                      </div>
                      
                      {/* Mobile optimized overlay - shows on touch devices */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center md:hover:opacity-100">
                        <div className="text-white text-center">
                          <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm font-medium">
                            <span className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full">
                              <span>❤️</span>
                              {itemLikes.length}
                            </span>
                            <span className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full">
                              <span>💬</span>
                              {itemComments.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 🚀 INSTANT FEEDBACK: Show skeleton immediately if no items */}
          {items.length === 0 && (
            <GallerySkeleton isDarkMode={isDarkMode} />
          )}

          {/* Media Grid */}
          {mediaItems.length > 0 && (
            <div>
              <h3 className={`text-lg font-semibold mb-3 px-3 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                📸 Medien ({mediaItems.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2 px-2 sm:px-3">
                {mediaItems.map((item, mediaIndex) => {
                  // Find the original index in the full items array
                  const originalIndex = items.findIndex(i => i.id === item.id);
                  const itemLikes = likes.filter(l => l.mediaId === item.id);
                  const itemComments = comments.filter(c => c.mediaId === item.id);
                  
                  return (
                    <div
                      key={item.id}
                      className="relative aspect-square cursor-pointer group touch-manipulation"
                      onClick={() => onItemClick(originalIndex)}
                      style={{ minHeight: '120px' }}
                    >
                      {/* Media Content */}
                      <div className="w-full h-full overflow-hidden">
                        {item.type === 'video' ? (
                          <div className="relative w-full h-full">
                            <video
                              src={item.url}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                            />
                            {/* Video indicator */}
                            <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={item.url}
                            alt={item.noteText || item.note || 'Uploaded media'}
                            className="w-full h-full object-cover"
                            loading={mediaIndex < 4 ? "eager" : "lazy"}
                            decoding="async"
                            style={{ 
                              backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
                              transition: 'opacity 0.2s ease-in-out'
                            }}
                            onLoad={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.opacity = '1';
                            }}
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.opacity = '0.5';
                              console.warn('Failed to load image:', item.url);
                            }}
                          />
                        )}
                      </div>
                      
                      {/* Mobile optimized overlay - shows on touch devices */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center md:hover:opacity-100">
                        <div className="text-white text-center">
                          <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm font-medium">
                            <span className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full">
                              <span>❤️</span>
                              {itemLikes.length}
                            </span>
                            <span className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full">
                              <span>💬</span>
                              {itemComments.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Loading indicator for more content */}
          {isLoadingMore && items.length > 0 && (
            <div className={`text-center py-8 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-t-transparent border-current"></div>
              <p className="mt-2">Mehr Inhalte werden geladen...</p>
            </div>
          )}

          {/* Load More Button */}
          {loadMore && hasMore && !isLoading && !isLoadingMore && items.length > 0 && (
            <div className="text-center py-6">
              <button
                onClick={loadMore}
                className={`px-6 py-3 rounded-lg font-medium transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
              >
                Mehr laden
              </button>
            </div>
          )}

          {/* End of content indicator */}
          {loadMore && !hasMore && items.length > 0 && (
            <div className={`text-center py-6 text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              🎉 Du hast alle Inhalte gesehen!
            </div>
          )}
        </div>
      )}
    </div>
  );
};