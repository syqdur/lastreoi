/**
 * 🚀 INSTANT PERFORMANCE FIX for Gallery Loading
 * This file provides immediate solutions to slow gallery loading
 */

// 1. Reduce initial load sizes
export const FAST_LOAD_CONFIG = {
  INITIAL_MEDIA_LIMIT: 6,        // Nur 6 Bilder initial laden
  INITIAL_COMMENTS_LIMIT: 10,    // Nur 10 Kommentare initial
  PAGINATION_SIZE: 4,            // Kleine Batches nachladen
  CACHE_TIME: 30000,            // 30 Sekunden Cache
  DEBOUNCE_TIME: 100            // Schnelle Reaktion
};

// 2. Image optimization settings
export const IMAGE_OPTIMIZATION = {
  MAX_WIDTH: 400,               // Kleinere Bilder für Grid
  MAX_HEIGHT: 400,
  QUALITY: 0.6,                 // Niedrigere Qualität für Speed
  THUMBNAIL_SIZE: 150           // Kleine Thumbnails
};

// 3. Simple cache implementation
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  
  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // Check if expired (30 seconds)
    if (Date.now() - item.timestamp > FAST_LOAD_CONFIG.CACHE_TIME) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export const galleryCache = new SimpleCache();

// 4. Debounce function for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: any;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 5. Lazy loading helper
export function createImageLoader() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    },
    { 
      rootMargin: '50px',
      threshold: 0.1
    }
  );
  
  return {
    observe: (img: HTMLImageElement) => observer.observe(img),
    disconnect: () => observer.disconnect()
  };
}

// 6. Performance monitoring
export class PerformanceLogger {
  private startTime = 0;
  
  start(label: string): void {
    console.log(`⏱️ Starting: ${label}`);
    this.startTime = performance.now();
  }
  
  end(label: string): void {
    const duration = performance.now() - this.startTime;
    console.log(`✅ Finished: ${label} in ${duration.toFixed(2)}ms`);
    
    // Warn if slow
    if (duration > 1000) {
      console.warn(`🐌 Slow operation detected: ${label} took ${duration.toFixed(2)}ms`);
    }
  }
}

export const perfLogger = new PerformanceLogger();

// 7. Quick fixes to apply immediately
export const applyQuickPerformanceFixes = () => {
  console.log('🚀 Applying quick performance fixes...');
  
  // Reduce console logs in production
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    console.log = () => {};
    console.warn = () => {};
  }
  
  // Add performance observer if available
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.duration > 100) {
          console.warn(`Slow operation: ${entry.name} took ${entry.duration}ms`);
        }
      });
    });
    
    observer.observe({ entryTypes: ['measure'] });
  }
  
  console.log('✅ Quick performance fixes applied');
};

// 8. Memory cleanup
export const cleanupMemory = () => {
  galleryCache.clear();
  
  // Force garbage collection if available
  if ('gc' in window) {
    (window as any).gc();
  }
  
  console.log('🗑️ Memory cleanup completed');
};

// 9. Initialize all performance optimizations
export const initializePerformanceOptimizations = () => {
  applyQuickPerformanceFixes();
  
  // Cleanup memory every 5 minutes
  setInterval(cleanupMemory, 5 * 60 * 1000);
  
  return {
    cache: galleryCache,
    perfLogger,
    debounce,
    config: FAST_LOAD_CONFIG,
    imageConfig: IMAGE_OPTIMIZATION
  };
};
