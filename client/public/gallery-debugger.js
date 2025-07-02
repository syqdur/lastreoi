/**
 * 🔍 GALLERY LOADING DEBUGGER
 * This script helps track exactly what's happening during gallery load
 */

// Add to browser console to debug gallery loading
console.log('🔍 GALLERY LOADING DEBUGGER ACTIVATED');

// Track when useSimpleGallery hook starts
const originalLog = console.log;
window.galleryDebugData = {
  startTime: Date.now(),
  events: [],
  isLoading: null,
  mediaItems: [],
  userName: null,
  galleryId: null
};

console.log = function(...args) {
  const message = args.join(' ');
  
  // Track gallery-related logs
  if (message.includes('🎯 Starting simple gallery load') || 
      message.includes('📸 Loaded') || 
      message.includes('⏱️ Starting') ||
      message.includes('✅ Completed')) {
    
    window.galleryDebugData.events.push({
      time: Date.now(),
      elapsed: Date.now() - window.galleryDebugData.startTime,
      message: message
    });
    
    // Extract key data
    if (message.includes('🎯 Starting simple gallery load for:')) {
      window.galleryDebugData.galleryId = args[args.length - 1];
    }
    
    if (message.includes('📸 Loaded') && message.includes('media items')) {
      const match = message.match(/(\d+) media items/);
      if (match) {
        window.galleryDebugData.mediaItems.push({
          time: Date.now(),
          count: parseInt(match[1])
        });
      }
    }
  }
  
  return originalLog.apply(console, args);
};

// Track React state changes
const originalSetState = React.useState;
React.useState = function(initialState) {
  const [state, setState] = originalSetState(initialState);
  
  // Track isLoading state specifically
  if (typeof initialState === 'boolean' && arguments.callee.caller) {
    const callerName = arguments.callee.caller.name;
    if (callerName.includes('SimpleGallery') || callerName.includes('Gallery')) {
      
      const originalSetStateWithLogging = (newState) => {
        if (typeof newState === 'boolean') {
          window.galleryDebugData.isLoading = newState;
          console.log(`🔍 LOADING STATE CHANGED: ${newState} at ${Date.now() - window.galleryDebugData.startTime}ms`);
        }
        return setState(newState);
      };
      
      return [state, originalSetStateWithLogging];
    }
  }
  
  return [state, setState];
};

// Report function
window.reportGalleryDebug = () => {
  const debugData = window.galleryDebugData;
  const totalTime = Date.now() - debugData.startTime;
  
  console.log('📊 GALLERY LOADING REPORT:');
  console.log(`⏱️ Total time elapsed: ${totalTime}ms`);
  console.log(`🆔 Gallery ID: ${debugData.galleryId}`);
  console.log(`📸 Media items loaded: ${debugData.mediaItems.length > 0 ? debugData.mediaItems[debugData.mediaItems.length - 1].count : 0}`);
  console.log(`🔄 Current loading state: ${debugData.isLoading}`);
  console.log('📋 Events timeline:');
  
  debugData.events.forEach(event => {
    console.log(`  ${event.elapsed}ms: ${event.message}`);
  });
  
  if (debugData.mediaItems.length > 0) {
    console.log('📈 Media loading timeline:');
    debugData.mediaItems.forEach(item => {
      console.log(`  ${item.time - debugData.startTime}ms: ${item.count} items loaded`);
    });
  }
  
  // Check for potential issues
  if (totalTime > 5000) {
    console.warn('⚠️ SLOW LOADING DETECTED: Gallery took more than 5 seconds');
  }
  
  if (debugData.isLoading === true && totalTime > 3000) {
    console.warn('⚠️ STUCK LOADING: Gallery still loading after 3 seconds');
  }
  
  return debugData;
};

console.log('🔍 Gallery debugger ready. Run window.reportGalleryDebug() to see report.');
