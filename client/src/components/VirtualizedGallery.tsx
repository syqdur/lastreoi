import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { MediaItem } from '../types';
import { debounce, createImageLoader } from '../services/performanceService';
import { Heart, MessageCircle, Play } from 'lucide-react';

interface VirtualizedGalleryProps {
  mediaItems: MediaItem[];
  onItemClick: (index: number) => void;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isDarkMode: boolean;
  themeConfig: any;
}

interface MediaCellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    mediaItems: MediaItem[];
    columnsPerRow: number;
    onItemClick: (index: number) => void;
    isDarkMode: boolean;
    themeConfig: any;
  };
}

// Optimized media cell with lazy loading
const MediaCell: React.FC<MediaCellProps> = ({ columnIndex, rowIndex, style, data }) => {
  const { mediaItems, columnsPerRow, onItemClick, isDarkMode, themeConfig } = data;
  const itemIndex = rowIndex * columnsPerRow + columnIndex;
  const item = mediaItems[itemIndex];
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [optimizedUrl, setOptimizedUrl] = useState<string>('');
  const imageLoader = useMemo(() => createImageLoader(), []);
  
  // Load optimized image on mount
  useEffect(() => {
    if (item && item.url && item.type !== 'note') {
      imageLoader.loadImage(item.url, 400).then(url => {
        setOptimizedUrl(url);
        setImageLoaded(true);
      }).catch(() => {
        setOptimizedUrl(item.url);
        setImageLoaded(true);
      });
    }
  }, [item, imageLoader]);

  if (!item) {
    return <div style={style} />;
  }

  if (item.type === 'note') {
    return (
      <div style={style} className="p-1">
        <div 
          className={`
            h-full w-full rounded-lg p-4 cursor-pointer transition-all duration-200 hover:scale-105
            ${isDarkMode ? 'bg-neutral-800' : 'bg-white'}
            shadow-md hover:shadow-lg
          `}
          onClick={() => onItemClick(itemIndex)}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className={`text-2xl mb-2 ${themeConfig.gradient}`}>💌</div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {item.noteText || item.note || 'Notiz'}
              </p>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                von {item.uploadedBy}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={style} className="p-1">
      <div 
        className="relative h-full w-full cursor-pointer group overflow-hidden rounded-lg"
        onClick={() => onItemClick(itemIndex)}
      >
        {!imageLoaded && (
          <div className={`
            absolute inset-0 animate-pulse rounded-lg
            ${isDarkMode ? 'bg-neutral-700' : 'bg-gray-200'}
          `} />
        )}
        
        {imageLoaded && (
          <>
            {item.type === 'video' ? (
              <div className="relative h-full w-full">
                <video
                  className="h-full w-full object-cover rounded-lg"
                  src={optimizedUrl}
                  preload="metadata"
                  muted
                  playsInline
                />
                <div className="absolute inset-0 bg-black/20 rounded-lg" />
                <div className="absolute top-2 right-2">
                  <Play className="w-6 h-6 text-white drop-shadow-lg" fill="white" />
                </div>
              </div>
            ) : (
              <img
                className="h-full w-full object-cover rounded-lg transition-transform duration-200 group-hover:scale-105"
                src={optimizedUrl}
                alt={item.name}
                loading="lazy"
              />
            )}
            
            {/* Overlay with metadata */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg">
              <div className="absolute bottom-2 left-2 right-2 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4" />
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    {item.uploadedBy}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tags indicator */}
            {item.tags && item.tags.length > 0 && (
              <div className="absolute top-2 left-2">
                <div className="flex space-x-1">
                  {item.tags.map((_, index) => (
                    <div
                      key={index}
                      className="w-2 h-2 bg-white rounded-full shadow-lg animate-pulse"
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const VirtualizedGallery: React.FC<VirtualizedGalleryProps> = ({
  mediaItems,
  onItemClick,
  isLoading,
  hasMore,
  onLoadMore,
  isDarkMode,
  themeConfig
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  // Responsive grid calculation
  const columnsPerRow = useMemo(() => {
    if (containerSize.width < 640) return 2; // mobile
    if (containerSize.width < 1024) return 3; // tablet
    return 4; // desktop
  }, [containerSize.width]);
  
  const itemSize = useMemo(() => {
    const gaps = (columnsPerRow - 1) * 8; // 8px gap between items
    const padding = 16; // container padding
    return Math.floor((containerSize.width - gaps - padding) / columnsPerRow);
  }, [containerSize.width, columnsPerRow]);
  
  const rowCount = Math.ceil(mediaItems.length / columnsPerRow);
  
  // Debounced resize handler
  const debouncedResize = useCallback(
    debounce(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    }, 150),
    []
  );
  
  // Set up resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const resizeObserver = new ResizeObserver(debouncedResize);
    resizeObserver.observe(container);
    
    // Initial size
    debouncedResize();
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [debouncedResize]);
  
  // Infinite scroll detection
  const handleScroll = useCallback(
    debounce(({ scrollTop, scrollHeight, clientHeight }) => {
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
      if (scrollPercentage > 0.8 && hasMore && !isLoading) {
        onLoadMore();
      }
    }, 200),
    [hasMore, isLoading, onLoadMore]
  );
  
  const cellData = useMemo(() => ({
    mediaItems,
    columnsPerRow,
    onItemClick,
    isDarkMode,
    themeConfig
  }), [mediaItems, columnsPerRow, onItemClick, isDarkMode, themeConfig]);
  
  if (containerSize.width === 0) {
    return (
      <div 
        ref={containerRef} 
        className="w-full h-full min-h-[400px]"
      />
    );
  }
  
  return (
    <div ref={containerRef} className="w-full h-full">
      <Grid
        columnCount={columnsPerRow}
        columnWidth={itemSize}
        height={containerSize.height}
        rowCount={rowCount}
        rowHeight={itemSize}
        width={containerSize.width}
        itemData={cellData}
        onScroll={handleScroll}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: isDarkMode ? '#374151 #1f2937' : '#d1d5db #f9fafb'
        }}
      >
        {MediaCell}
      </Grid>
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${themeConfig.colors.primary}`} />
        </div>
      )}
      
      {/* No more items indicator */}
      {!hasMore && mediaItems.length > 0 && (
        <div className="text-center py-4">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Alle Inhalte geladen
          </p>
        </div>
      )}
    </div>
  );
};