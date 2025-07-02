/**
 * 🎯 SIMPLE GALLERY LOADING STRATEGY
 * One job: Load gallery images quickly and reliably, no complexity
 */

// ULTRA-FAST: Maximum loading configuration for instant gallery
export const SIMPLE_CONFIG = {
  INITIAL_MEDIA_LIMIT: 200,      // Load massive batch immediately for instant UX
  PAGINATION_SIZE: 100,          // Load very large chunks at a time
  LOADING_TIMEOUT: 2000          // Very short timeout
};

// ULTRA-FAST: Maximum compression for instant loading
export const IMAGE_SETTINGS = {
  MAX_WIDTH: 300,               // Smaller for faster loading
  MAX_HEIGHT: 300,              // Smaller for faster loading
  QUALITY: 0.6,                 // Lower quality for speed
  THUMBNAIL_SIZE: 120           // Smaller thumbnails
};

// ULTRA-AGGRESSIVE: Prefetch many images immediately for instant display
export const prefetchFirstImages = (items: any[]) => {
  if (!items || items.length === 0) return;
  
  // Prefetch first 25 images aggressively for instant visual feedback
  const imagesToPrefetch = items.slice(0, 25);
  imagesToPrefetch.forEach(item => {
    if (item.type !== 'note') {
      const img = new Image();
      // Use mediaUrl if available, otherwise fallback to base64Data or url
      const imageUrl = item.mediaUrl || (item.base64Data ? `data:image/jpeg;base64,${item.base64Data}` : item.url);
      if (imageUrl) {
        img.src = imageUrl;
      }
    }
  });
};

// OPTIMIZED: Silent performance tracking for production
export const simplePerf = {
  start: (name: string) => {
    return performance.now();
  },
  
  end: (name: string, startTime: number) => {
    const duration = performance.now() - startTime;
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${name}: ${duration.toFixed(2)}ms`);
    }
  }
};

// Initialize simple loading
export const initSimpleGalleryLoading = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🎯 Simple gallery loading initialized');
    console.log('📋 Config:', SIMPLE_CONFIG);
  }
};
