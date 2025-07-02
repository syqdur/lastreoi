import { useState, useEffect, useCallback, useRef } from 'react';
import { MediaItem, Comment, Like } from '../types';
import { UserProfile } from '../services/firebaseService';
import { 
  loadGalleryComments, 
  loadGalleryLikes,
  loadGalleryUserProfiles,
  getGalleryUsers
} from '../services/galleryFirebaseService';
import { SIMPLE_CONFIG, simplePerf, prefetchFirstImages } from '../utils/simpleGalleryLoad';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  limit,
  startAfter,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface UseSimpleGalleryOptions {
  galleryId: string;
  userName: string;
  deviceId: string;
}

interface UseSimpleGalleryReturn {
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
}

export const useSimpleGallery = ({
  galleryId,
  userName,
  deviceId
}: UseSimpleGalleryOptions): UseSimpleGalleryReturn => {
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
  
  // Refs
  const lastDocRef = useRef<any>(null);
  const unsubscribersRef = useRef<(() => void)[]>([]);

  // OPTIMIZED: Fast media loading with getDocs instead of onSnapshot
  const loadInitialMedia = useCallback(async () => {
    if (!galleryId) return;
    
    const startTime = simplePerf.start('Initial Media Load');
    setIsLoading(true);
    
    try {
      const mediaCollection = collection(db, `galleries/${galleryId}/media`);
      const q = query(
        mediaCollection,
        orderBy('uploadedAt', 'desc'),
        limit(SIMPLE_CONFIG.INITIAL_MEDIA_LIMIT)
      );
      
      // Use getDocs for faster initial load instead of onSnapshot
      const snapshot = await getDocs(q);
      
      const mediaList: MediaItem[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let url = '';
        
        if (data.type !== 'note') {
          // SMART FALLBACK: Use mediaUrl first, base64 only if no mediaUrl exists
          if (data.mediaUrl) {
            url = data.mediaUrl; // Prefer optimized URLs
          } else if (data.base64Data) {
            url = data.base64Data; // Fallback to base64 if no URL available
          }
        }
        
        return {
          id: docSnap.id,
          name: data.name,
          url: url,
          uploadedBy: data.uploadedBy,
          uploadedAt: data.uploadedAt,
          deviceId: data.deviceId,
          type: data.type || 'image',
          userName: data.userName,
          noteText: data.noteText,
            textTags: data.textTags || [],
          personTags: data.personTags || [],
          locationTags: data.locationTags || [],
          isStory: data.isStory || false
        };
      });
      
      setMediaItems(mediaList);
      
      // Set last document for pagination
      if (snapshot.docs.length > 0) {
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      }
      
      // Prefetch first few images
      prefetchFirstImages(mediaList);
      
      setIsLoading(false);
      simplePerf.end('Initial Media Load', startTime);
      
    } catch (error) {
      console.error('Error loading media:', error);
      setIsLoading(false);
    }
  }, [galleryId]);

  // Load more media for infinite scroll
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !lastDocRef.current) return;
    
    const startTime = simplePerf.start('Load More Media');
    setIsLoadingMore(true);
    
    try {
      const mediaCollection = collection(db, `galleries/${galleryId}/media`);
      const q = query(
        mediaCollection,
        orderBy('uploadedAt', 'desc'),
        startAfter(lastDocRef.current),
        limit(SIMPLE_CONFIG.PAGINATION_SIZE)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.docs.length === 0) {
        setHasMore(false);
        return;
      }
      
      const moreMedia: MediaItem[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let url = '';
        
        if (data.type !== 'note') {
          // SMART FALLBACK: Use mediaUrl first, base64 only if needed
          if (data.mediaUrl) {
            url = data.mediaUrl;
          } else if (data.base64Data) {
            url = data.base64Data;
          }
        }
        
        return {
          id: docSnap.id,
          name: data.name,
          url: url,
          uploadedBy: data.uploadedBy,
          uploadedAt: data.uploadedAt,
          deviceId: data.deviceId,
          type: data.type || 'image',
          userName: data.userName,
          noteText: data.noteText,
          textTags: data.textTags || [],
          personTags: data.personTags || [],
          locationTags: data.locationTags || [],
          isStory: data.isStory || false
        };
      });
      
      setMediaItems(prev => [...prev, ...moreMedia]);
      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      
      simplePerf.end('Load More Media', startTime);
      
    } catch (error) {
      console.error('Error loading more media:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [galleryId, isLoadingMore, hasMore]);

  // OPTIMIZED: Load additional data with delay to not block media loading
  const loadAdditionalData = useCallback(async () => {
    if (!galleryId) return;
    
    // Delay additional data loading to prioritize media display
    setTimeout(async () => {
      try {
        // Load comments
        const commentsUnsubscribe = loadGalleryComments(galleryId, setComments);
        unsubscribersRef.current.push(commentsUnsubscribe);
        
        // Load likes
        const likesUnsubscribe = loadGalleryLikes(galleryId, setLikes);
        unsubscribersRef.current.push(likesUnsubscribe);
        
        // Load user profiles
        const profilesUnsubscribe = loadGalleryUserProfiles(galleryId, setUserProfiles);
        unsubscribersRef.current.push(profilesUnsubscribe);
        
        // Load gallery users
        const users = await getGalleryUsers(galleryId);
        setGalleryUsers(users);
        
      } catch (error) {
        console.error('Error loading additional data:', error);
      }
    }, 3000); // 3 second delay for instant gallery display
  }, [galleryId]);

  // Refresh function
  const refresh = useCallback(async () => {
    // Reset state
    setMediaItems([]);
    setHasMore(true);
    lastDocRef.current = null;
    
    // Reload data
    await loadInitialMedia();
    await loadAdditionalData();
  }, [loadInitialMedia, loadAdditionalData]);

  // Initialize - Start loading immediately with galleryId only
  useEffect(() => {
    if (galleryId) {
      console.log('🎯 Starting simple gallery load for:', galleryId);
      loadInitialMedia();
      loadAdditionalData();
    }
    
    // Cleanup
    return () => {
      unsubscribersRef.current.forEach(unsubscribe => unsubscribe());
      unsubscribersRef.current = [];
    };
  }, [galleryId, loadInitialMedia, loadAdditionalData]); // Removed userName dependency!

  return {
    mediaItems,
    comments,
    likes,
    userProfiles,
    galleryUsers,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh
  };
};
