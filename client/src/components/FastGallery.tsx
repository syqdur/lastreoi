import React, { useState, useCallback, useMemo, memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { MediaItem, Comment, Like } from '../types';
import { useFastGallery } from '../hooks/useFastGallery';
import { PERF_CONFIG } from '../services/performanceOptimizations';

interface FastGalleryProps {
  galleryId: string;
  userName: string;
  deviceId: string;
  onItemClick: (index: number) => void;
  onDelete?: (item: MediaItem) => void;
  isAdmin: boolean;
  isDarkMode: boolean;
  galleryTheme: 'hochzeit' | 'geburtstag' | 'urlaub' | 'eigenes';
}

// Memoized media item component for performance
const MediaItemComponent = memo<{
  item: MediaItem;
  index: number;
  onClick: () => void;
  onDelete?: () => void;
  isAdmin: boolean;
  isDarkMode: boolean;
  style: React.CSSProperties;
}>(({ item, index, onClick, onDelete, isAdmin, isDarkMode, style }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div style={style} className="p-2">
      <div 
        className={`relative rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        } shadow-sm`}
        onClick={onClick}
      >
        {/* Image/Video */}
        {item.type === 'image' ? (
          <div className="relative aspect-square">
            {!imageLoaded && !imageError && (
              <div className={`absolute inset-0 animate-pulse ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`} />
            )}
            
            <img
              src={item.url}
              alt={item.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
            
            {imageError && (
              <div className={`absolute inset-0 flex items-center justify-center ${
                isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
              }`}>
                <span>❌ Fehler</span>
              </div>
            )}
          </div>
        ) : item.type === 'video' ? (
          <div className="relative aspect-square">
            <video
              src={item.url}
              className="w-full h-full object-cover"
              preload="metadata"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black bg-opacity-50 rounded-full p-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
            </div>
          </div>
        ) : (
          <div className={`aspect-square flex items-center justify-center ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="text-center p-4">
              <div className="text-2xl mb-2">📝</div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {item.noteText || item.note || 'Notiz'}
              </p>
            </div>
          </div>
        )}

        {/* Overlay info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <p className="text-white text-sm font-medium truncate">
            {item.uploadedBy}
          </p>
          <p className="text-white/80 text-xs">
            {new Date(item.uploadedAt).toLocaleDateString('de-DE')}
          </p>
        </div>

        {/* Delete button for admin */}
        {isAdmin && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
});

MediaItemComponent.displayName = 'MediaItemComponent';

export const FastGallery: React.FC<FastGalleryProps> = ({
  galleryId,
  userName,
  deviceId,
  onItemClick,
  onDelete,
  isAdmin,
  isDarkMode,
  galleryTheme
}) => {
  const {
    mediaItems,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
    error
  } = useFastGallery({ galleryId, userName, deviceId });

  const [containerHeight, setContainerHeight] = useState(800);

  // Calculate grid dimensions
  const gridConfig = useMemo(() => {
    const itemsPerRow = window.innerWidth < 640 ? 2 : window.innerWidth < 1024 ? 3 : 4;
    const itemWidth = Math.floor((window.innerWidth - 32) / itemsPerRow); // Account for padding
    const itemHeight = itemWidth + 60; // Add space for info
    
    return { itemsPerRow, itemWidth, itemHeight };
  }, []);

  // Create grid rows for virtualization
  const gridRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < mediaItems.length; i += gridConfig.itemsPerRow) {
      rows.push(mediaItems.slice(i, i + gridConfig.itemsPerRow));
    }
    return rows;
  }, [mediaItems, gridConfig.itemsPerRow]);

  // Row renderer for virtual grid
  const renderRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = gridRows[index];
    if (!row) return null;

    return (
      <div style={style} className="flex gap-2 px-4">
        {row.map((item, itemIndex) => {
          const globalIndex = index * gridConfig.itemsPerRow + itemIndex;
          return (
            <div key={item.id} style={{ width: `${100 / gridConfig.itemsPerRow}%` }}>
              <MediaItemComponent
                item={item}
                index={globalIndex}
                onClick={() => onItemClick(globalIndex)}
                onDelete={onDelete ? () => onDelete(item) : undefined}
                isAdmin={isAdmin}
                isDarkMode={isDarkMode}
                style={{}}
              />
            </div>
          );
        })}
      </div>
    );
  }, [gridRows, gridConfig, onItemClick, onDelete, isAdmin, isDarkMode]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(({ scrollTop, scrollHeight, clientHeight }: any) => {
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200;
    if (isNearBottom && hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-red-500 text-lg mb-4">⚠️ {error}</div>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            Galerie wird geladen...
          </span>
        </div>
      </div>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-6xl mb-4">📸</div>
        <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Noch keine Fotos
        </h3>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
          Lade das erste Foto hoch, um die Galerie zu starten!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Refresh button */}
      <div className="flex justify-between items-center mb-4 px-4">
        <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Galerie ({mediaItems.length})
        </h2>
        <button
          onClick={refresh}
          className={`px-3 py-1 rounded-lg transition-colors ${
            isDarkMode 
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🔄 Aktualisieren
        </button>
      </div>

      {/* Virtual grid with improved width */}
      <List
        height={containerHeight}
        width="100%"
        itemCount={gridRows.length}
        itemSize={gridConfig.itemHeight}
        onScroll={handleScroll}
        className={isDarkMode ? 'dark-scrollbar' : 'light-scrollbar'}
      >
        {renderRow}
      </List>

      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              Weitere Bilder werden geladen...
            </span>
          </div>
        </div>
      )}

      {/* End of gallery */}
      {!hasMore && mediaItems.length > 0 && (
        <div className="text-center py-8">
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            🎉 Alle Bilder geladen!
          </div>
        </div>
      )}
    </div>
  );
};

export default FastGallery;
