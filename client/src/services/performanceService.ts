/**
 * Performance Service - Centralized performance optimizations
 */

// Debounce utility for performance
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility for performance
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memoization cache for expensive operations
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export const memoize = <T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = 300000 // 5 minutes default
): Promise<T> => {
  const cached = cache.get(key);
  const now = Date.now();
  
  if (cached && now - cached.timestamp < cached.ttl) {
    return Promise.resolve(cached.data);
  }
  
  return fn().then(data => {
    cache.set(key, { data, timestamp: now, ttl });
    return data;
  });
};

// Clear cache for specific key or all
export const clearCache = (key?: string) => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};

// Image lazy loading and compression
export const createImageLoader = () => {
  const imageCache = new Map<string, string>();
  
  return {
    async loadImage(url: string, maxWidth: number = 800): Promise<string> {
      const cacheKey = `${url}_${maxWidth}`;
      
      if (imageCache.has(cacheKey)) {
        return imageCache.get(cacheKey)!;
      }
      
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          // Calculate optimized dimensions
          const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const optimizedUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          imageCache.set(cacheKey, optimizedUrl);
          resolve(optimizedUrl);
        };
        
        img.onerror = reject;
        img.src = url;
      });
    },
    
    clearImageCache() {
      imageCache.clear();
    }
  };
};

// Batch operations utility
export class BatchProcessor<T> {
  private batch: T[] = [];
  private timeout: NodeJS.Timeout | null = null;
  
  constructor(
    private processBatch: (items: T[]) => Promise<void>,
    private batchSize: number = 10,
    private delay: number = 100
  ) {}
  
  add(item: T) {
    this.batch.push(item);
    
    if (this.batch.length >= this.batchSize) {
      this.flush();
    } else if (!this.timeout) {
      this.timeout = setTimeout(() => this.flush(), this.delay);
    }
  }
  
  async flush() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    
    if (this.batch.length > 0) {
      const itemsToProcess = [...this.batch];
      this.batch = [];
      await this.processBatch(itemsToProcess);
    }
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics = new Map<string, number[]>();
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  time(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }
      this.metrics.get(label)!.push(duration);
    };
  }
  
  getAverageTime(label: string): number {
    const times = this.metrics.get(label) || [];
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }
  
  getReport(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const report: Record<string, any> = {};
    this.metrics.forEach((times, label) => {
      report[label] = {
        avg: this.getAverageTime(label),
        min: Math.min(...times),
        max: Math.max(...times),
        count: times.length
      };
    });
    return report;
  }
  
  clear() {
    this.metrics.clear();
  }
}

// Virtual scrolling utility
export const createVirtualScroller = (
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  return {
    getVisibleRange(scrollTop: number, totalItems: number) {
      const visibleCount = Math.ceil(containerHeight / itemHeight);
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + overscan * 2);
      
      return { startIndex, endIndex, visibleCount };
    },
    
    getTotalHeight(totalItems: number) {
      return totalItems * itemHeight;
    },
    
    getItemOffset(index: number) {
      return index * itemHeight;
    }
  };
};