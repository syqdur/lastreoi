import { useState, useEffect, useCallback, useRef } from 'react';
import { MediaItem, Comment, Like } from '../types';
import { UserProfile } from '../services/firebaseService';
import { 
  loadGalleryMedia, 
  loadMoreGalleryMedia,
  loadGalleryComments, 
  loadGalleryLikes,
  loadGalleryUserProfiles,
  getGalleryUsers
} from '../services/galleryFirebaseService';
import { debounce, memoize, PerformanceMonitor } from '../services/performanceService';
import { optimizedNotificationService } from '../services/optimizedNotificationService';

interface UseOptimizedGalleryOptions {
  galleryId: string;
  userName: string;
  deviceId: string;
  initialLimit?: number;
  enableInfiniteScroll?: boolean;
}

interface UseOptimizedGalleryReturn {
  // Data
  mediaItems: MediaItem[];
  comments: Comment[];
  likes: Like[];
  userProfiles: UserProfile[];
  galleryUsers: any[];
  
  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  
  // Actions
  loadMore: () => void;
  refresh: () => Promise<void>;
  
  // Performance metrics
  performanceMetrics: any;
}

export const useOptimizedGallery = ({
  galleryId,
  userName,
  deviceId,
  initialLimit = 20,
  enableInfiniteScroll = true
}: UseOptimizedGalleryOptions): UseOptimizedGalleryReturn => {
  // State
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [galleryUsers, setGalleryUsers] = useState<any[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // Refs for performance tracking
  const lastDocRef = useRef<any>(null);
  const unsubscribersRef = useRef<(() => void)[]>([]);
  const performanceMonitor = PerformanceMonitor.getInstance();

  // Debounced load more function
  const debouncedLoadMore = useCallback(
    debounce(async () => {
      if (!enableInfiniteScroll || isLoadingMore || !hasMore || !lastDocRef.current) return;
      
      setIsLoadingMore(true);
      const endTime = performanceMonitor.time('loadMore');
      
      try {
        const { items, lastDoc } = await loadMoreGalleryMedia(
          galleryId,
          lastDocRef.current,
          initialLimit
        );
        
        if (items.length === 0) {
          setHasMore(false);
        } else {
          setMediaItems(prev => [...prev, ...items]);
          lastDocRef.current = lastDoc;
        }
      } catch (error) {
        console.error('Error loading more media:', error);
      } finally {
        setIsLoadingMore(false);
        endTime();
      }
    }, 300),
    [galleryId, isLoadingMore, hasMore, enableInfiniteScroll, initialLimit]
  );

  // Optimized data loading with caching
  const loadGalleryData = useCallback(async () => {
    if (!userName || !galleryId) return;
    
    setIsLoading(true);
    const endTime = performanceMonitor.time('initialLoad');
    
    try {
      // Load data in parallel with caching
      await Promise.all([
        // Media loading with real-time updates
        new Promise<void>((resolve) => {
          const unsubscribe = loadGalleryMedia(galleryId, (items) => {
            setMediaItems(items);
            if (items.length > 0) {
              // Set lastDoc for pagination (assuming items are sorted by uploadedAt desc)
              lastDocRef.current = { uploadedAt: items[items.length - 1].uploadedAt };
            }
            resolve();
          }, initialLimit);
          unsubscribersRef.current.push(unsubscribe);
        }),
        
        // Comments with caching
        memoize(`comments_${galleryId}`, async () => {
          const unsubscribe = loadGalleryComments(galleryId, setComments);
          unsubscribersRef.current.push(unsubscribe);
        }, 60000), // 1 minute cache
        
        // Likes with caching
        memoize(`likes_${galleryId}`, async () => {
          const unsubscribe = loadGalleryLikes(galleryId, setLikes);
          unsubscribersRef.current.push(unsubscribe);
        }, 60000),
        
        // User profiles with caching
        memoize(`userProfiles_${galleryId}`, async () => {
          const unsubscribe = loadGalleryUserProfiles(galleryId, setUserProfiles);
          unsubscribersRef.current.push(unsubscribe);
        }, 120000), // 2 minute cache
        
        // Gallery users for tagging with caching
        memoize(`galleryUsers_${galleryId}`, async () => {
          const users = await getGalleryUsers(galleryId);
          setGalleryUsers(users);
          return users;
        }, 180000) // 3 minute cache
      ]);
      
      // Initialize notification service
      optimizedNotificationService.subscribeToNotifications(
        galleryId,
        deviceId,
        (notifications) => {
          // Handle notifications efficiently
        }
      );
      
    } catch (error) {
      console.error('Error loading gallery data:', error);
    } finally {
      setIsLoading(false);
      endTime();
    }
  }, [galleryId, userName, deviceId, initialLimit]);

  // Refresh function
  const refresh = useCallback(async () => {
    // Clear cache for fresh data
    const cacheKeys = [
      `comments_${galleryId}`,
      `likes_${galleryId}`,
      `userProfiles_${galleryId}`,
      `galleryUsers_${galleryId}`
    ];
    
    // Clear specific cache keys
    const { clearCache } = await import('../services/performanceService');
    cacheKeys.forEach(key => clearCache(key));
    
    // Reset pagination
    lastDocRef.current = null;
    setHasMore(true);
    
    // Reload data
    await loadGalleryData();
  }, [galleryId, loadGalleryData]);

  // Initialize data loading
  useEffect(() => {
    loadGalleryData();
    
    // Cleanup function
    return () => {
      unsubscribersRef.current.forEach(unsubscribe => unsubscribe());
      unsubscribersRef.current = [];
      optimizedNotificationService.cleanup();
    };
  }, [loadGalleryData]);

  // Gallery change cleanup
  useEffect(() => {
    return () => {
      // Clean up subscriptions when gallery changes
      unsubscribersRef.current.forEach(unsubscribe => unsubscribe());
      unsubscribersRef.current = [];
      setMediaItems([]);
      setComments([]);
      setLikes([]);
      setUserProfiles([]);
      setGalleryUsers([]);
      setIsLoading(true);
      setHasMore(true);
      lastDocRef.current = null;
    };
  }, [galleryId]);

  return {
    // Data
    mediaItems,
    comments,
    likes,
    userProfiles,
    galleryUsers,
    
    // Loading states
    isLoading,
    isLoadingMore,
    hasMore,
    
    // Actions
    loadMore: debouncedLoadMore,
    refresh,
    
    // Performance metrics
    performanceMetrics: performanceMonitor.getReport()
  };
};