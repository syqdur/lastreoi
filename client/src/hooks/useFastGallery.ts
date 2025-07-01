import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MediaItem, Comment, Like } from '../types';
import { UserProfile } from '../services/firebaseService';
import { 
  loadGalleryMedia, 
  loadMoreGalleryMedia,
  loadGalleryComments, 
  loadGalleryLikes,
  loadGalleryUserProfiles
} from '../services/galleryFirebaseService';
import { PERF_CONFIG } from '../services/performanceOptimizations';

interface FastGalleryOptions {
  galleryId: string;
  userName: string;
  deviceId: string;
}

interface FastGalleryReturn {
  mediaItems: MediaItem[];
  comments: Comment[];
  likes: Like[];
  userProfiles: UserProfile[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => Promise<void>;
  error: string | null;
}

export const useFastGallery = ({
  galleryId,
  userName,
  deviceId
}: FastGalleryOptions): FastGalleryReturn => {
  // State
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const lastDocRef = useRef<any>(null);
  const unsubscribersRef = useRef<(() => void)[]>([]);
  const cacheRef = useRef(new Map<string, { data: any; timestamp: number }>());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cache helper
  const getFromCache = useCallback((key: string, ttl: number) => {
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return null;
  }, []);

  const setToCache = useCallback((key: string, data: any) => {
    cacheRef.current.set(key, { data, timestamp: Date.now() });
  }, []);

  // Fast media loading with minimal listeners
  const loadMediaFast = useCallback(async () => {
    if (!galleryId || !userName) return;

    // Check cache first
    const cachedMedia = getFromCache(`media_${galleryId}`, PERF_CONFIG.CACHE_TTL.MEDIA);
    if (cachedMedia) {
      setMediaItems(cachedMedia);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Load only essential data with smaller limit
      const unsubscribe = loadGalleryMedia(galleryId, (items) => {
        // Only take first few items for speed
        const limitedItems = items.slice(0, PERF_CONFIG.INITIAL_MEDIA_LIMIT);
        setMediaItems(limitedItems);
        setToCache(`media_${galleryId}`, limitedItems);
        
        if (limitedItems.length > 0) {
          lastDocRef.current = { 
            uploadedAt: limitedItems[limitedItems.length - 1].uploadedAt 
          };
        }
        
        setHasMore(items.length >= PERF_CONFIG.INITIAL_MEDIA_LIMIT);
        setIsLoading(false);
      }, PERF_CONFIG.INITIAL_MEDIA_LIMIT);

      unsubscribersRef.current.push(unsubscribe);

    } catch (err: any) {
      console.error('Fast media loading error:', err);
      setError('Fehler beim Laden der Medien');
      setIsLoading(false);
    }
  }, [galleryId, userName, getFromCache, setToCache]);

  // Load comments with caching
  const loadCommentsFast = useCallback(async () => {
    const cachedComments = getFromCache(`comments_${galleryId}`, PERF_CONFIG.CACHE_TTL.COMMENTS);
    if (cachedComments) {
      setComments(cachedComments);
      return;
    }

    try {
      const unsubscribe = loadGalleryComments(galleryId, (newComments) => {
        // Limit comments for performance
        const limitedComments = newComments.slice(0, PERF_CONFIG.COMMENTS_LIMIT);
        setComments(limitedComments);
        setToCache(`comments_${galleryId}`, limitedComments);
      });
      unsubscribersRef.current.push(unsubscribe);
    } catch (err) {
      console.error('Comments loading error:', err);
    }
  }, [galleryId, getFromCache, setToCache]);

  // Load likes with caching
  const loadLikesFast = useCallback(async () => {
    const cachedLikes = getFromCache(`likes_${galleryId}`, PERF_CONFIG.CACHE_TTL.LIKES);
    if (cachedLikes) {
      setLikes(cachedLikes);
      return;
    }

    try {
      const unsubscribe = loadGalleryLikes(galleryId, (newLikes) => {
        setLikes(newLikes);
        setToCache(`likes_${galleryId}`, newLikes);
      });
      unsubscribersRef.current.push(unsubscribe);
    } catch (err) {
      console.error('Likes loading error:', err);
    }
  }, [galleryId, getFromCache, setToCache]);

  // Load user profiles with caching
  const loadUserProfilesFast = useCallback(async () => {
    const cachedProfiles = getFromCache(`profiles_${galleryId}`, PERF_CONFIG.CACHE_TTL.PROFILES);
    if (cachedProfiles) {
      setUserProfiles(cachedProfiles);
      return;
    }

    try {
      const unsubscribe = loadGalleryUserProfiles(galleryId, (profiles) => {
        setUserProfiles(profiles);
        setToCache(`profiles_${galleryId}`, profiles);
      });
      unsubscribersRef.current.push(unsubscribe);
    } catch (err) {
      console.error('User profiles loading error:', err);
    }
  }, [galleryId, getFromCache, setToCache]);

  // Load more media with throttling
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !lastDocRef.current) return;

    setIsLoadingMore(true);
    try {
      const { items, lastDoc } = await loadMoreGalleryMedia(
        galleryId,
        lastDocRef.current,
        PERF_CONFIG.PAGINATION_SIZE
      );

      if (items.length === 0) {
        setHasMore(false);
      } else {
        setMediaItems((prev: MediaItem[]) => {
          const newItems = [...prev, ...items];
          setToCache(`media_${galleryId}`, newItems);
          return newItems;
        });
        lastDocRef.current = lastDoc;
      }
    } catch (err) {
      console.error('Load more error:', err);
      setError('Fehler beim Laden weiterer Medien');
    } finally {
      setIsLoadingMore(false);
    }
  }, [galleryId, isLoadingMore, hasMore, setToCache]);

  // Refresh function with cache clearing
  const refresh = useCallback(async () => {
    // Clear cache
    cacheRef.current.clear();
    
    // Reset state
    setMediaItems([]);
    setComments([]);
    setLikes([]);
    setUserProfiles([]);
    setIsLoading(true);
    setHasMore(true);
    lastDocRef.current = null;
    setError(null);

    // Cleanup existing subscriptions
    unsubscribersRef.current.forEach(unsubscribe => unsubscribe());
    unsubscribersRef.current = [];

    // Reload data
    await loadMediaFast();
    await Promise.all([
      loadCommentsFast(),
      loadLikesFast(),
      loadUserProfilesFast()
    ]);
  }, [loadMediaFast, loadCommentsFast, loadLikesFast, loadUserProfilesFast]);

  // Initialize data loading - Prioritize media first
  useEffect(() => {
    if (!galleryId || !userName) return;

    // Load media immediately (most important)
    loadMediaFast();

    // Load other data with slight delay to prioritize media
    const timer = setTimeout(() => {
      Promise.all([
        loadCommentsFast(),
        loadLikesFast(),
        loadUserProfilesFast()
      ]);
    }, 100);

    return () => {
      clearTimeout(timer);
      // Cleanup subscriptions
      unsubscribersRef.current.forEach(unsubscribe => unsubscribe());
      unsubscribersRef.current = [];
      
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [galleryId, userName]);

  // Cleanup on gallery change
  useEffect(() => {
    return () => {
      unsubscribersRef.current.forEach(unsubscribe => unsubscribe());
      unsubscribersRef.current = [];
      cacheRef.current.clear();
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [galleryId]);

  return {
    mediaItems,
    comments,
    likes,
    userProfiles,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
    error
  };
};
