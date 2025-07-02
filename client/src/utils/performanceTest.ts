/**
 * 🎯 PERFORMANCE TEST UTILITY
 * Quick tests to verify gallery loading performance
 */

export const performanceTest = {
  // Test gallery loading time
  testGalleryLoad: (galleryId: string) => {
    const startTime = performance.now();
    
    return {
      start: startTime,
      end: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`📊 Gallery ${galleryId} loaded in ${duration.toFixed(2)}ms`);
        
        if (duration < 2000) {
          console.log('✅ EXCELLENT: Under 2 seconds!');
        } else if (duration < 3000) {
          console.log('✅ GOOD: Under 3 seconds');
        } else if (duration < 5000) {
          console.log('⚠️ SLOW: Over 3 seconds');
        } else {
          console.log('❌ VERY SLOW: Over 5 seconds');
        }
        
        return duration;
      }
    };
  },

  // Test component render time
  testComponentRender: (componentName: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 16) { // 60fps = ~16ms per frame
        console.log(`⚠️ ${componentName} render took ${duration.toFixed(2)}ms (>16ms)!`);
      }
      
      return duration;
    };
  },

  // Memory usage test
  checkMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const used = Math.round(memory.usedJSHeapSize / 1048576 * 100) / 100;
      const total = Math.round(memory.totalJSHeapSize / 1048576 * 100) / 100;
      
      console.log(`🧠 Memory: ${used}MB / ${total}MB`);
      
      if (used > 100) {
        console.log('⚠️ High memory usage detected!');
      }
      
      return { used, total };
    }
    
    return null;
  }
};

// Auto-run memory check in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    performanceTest.checkMemoryUsage();
  }, 30000); // Check every 30 seconds
}
