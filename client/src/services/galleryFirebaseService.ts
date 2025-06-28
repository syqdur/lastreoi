// Storage imports removed - now using base64 conversion with compression
import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  where,
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { MediaItem, Comment, Like, ProfileData, MediaTag, LocationTag } from '../types';
import { UserProfile } from './firebaseService';
import { compressImage, compressVideo, shouldCompress } from '../utils/imageCompression';

// Gallery Stories Types
export interface Story {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  userName: string;
  deviceId: string;
  createdAt: string;
  expiresAt: string;
  views: string[]; // Array of user IDs who viewed this story
  fileName?: string; // For deletion from storage
  isStory?: boolean;
}

// Gallery-specific media loading
export const loadGalleryMedia = (
  galleryId: string,
  setMediaItems: (items: MediaItem[]) => void
): (() => void) => {
  const mediaCollection = `galleries/${galleryId}/media`;
  const q = query(collection(db, mediaCollection), orderBy('uploadedAt', 'desc'));
  
  return onSnapshot(q, async (snapshot) => {
    const mediaList: MediaItem[] = [];
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      let url = '';
      
      if (data.type !== 'note') {
        // Use base64 data directly instead of storage URLs
        if (data.base64Data) {
          url = data.base64Data;
        } else {
          console.warn(`⚠️ No base64 data found for ${data.name}`);
          url = '';
        }
      }
      
      const mediaItem: MediaItem = {
        id: docSnap.id,
        name: data.name,
        url: url,
        uploadedBy: data.uploadedBy,
        uploadedAt: data.uploadedAt,
        deviceId: data.deviceId,
        type: data.type,
        noteText: data.noteText,
        note: data.note,
        isUnavailable: !url && data.type !== 'note'
      };
      
      mediaList.push(mediaItem);
    }
    
    setMediaItems(mediaList);
  });
};

// Gallery-specific file upload
export const uploadGalleryFiles = async (
  files: FileList, 
  userName: string, 
  deviceId: string,
  galleryId: string,
  onProgress: (progress: number) => void
): Promise<void> => {
  let uploaded = 0;
  
  for (const file of Array.from(files)) {
    console.log(`📸 Processing media file: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
    
    let processedFile = file;
    
    // Compress file if needed to prevent Firebase errors
    if (shouldCompress(file)) {
      console.log(`🗜️ Compressing large file...`);
      try {
        if (file.type.startsWith('image/')) {
          processedFile = await compressImage(file, { targetSizeKB: 200, maxWidth: 1200, maxHeight: 800 });
        } else if (file.type.startsWith('video/')) {
          processedFile = await compressVideo(file, 1024); // 1MB for videos
        }
        console.log(`✅ Compression complete: ${(processedFile.size / 1024).toFixed(1)}KB`);
      } catch (error) {
        console.warn(`⚠️ Compression failed, using original file:`, error);
        processedFile = file;
      }
    }
    
    // Convert file to base64
    const reader = new FileReader();
    const base64Data = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(processedFile);
    });
    
    console.log(`✅ Media file converted to base64 successfully`);
    
    // Add metadata to gallery-specific collection with base64 data
    const isVideo = processedFile.type.startsWith('video/');
    const mediaCollection = `galleries/${galleryId}/media`;
    await addDoc(collection(db, mediaCollection), {
      name: `${Date.now()}-${processedFile.name}`,
      uploadedBy: userName,
      deviceId: deviceId,
      uploadedAt: new Date().toISOString(),
      type: isVideo ? 'video' : 'image',
      base64Data: base64Data, // Store compressed base64 data
      mimeType: processedFile.type,
      size: processedFile.size,
      originalSize: file.size // Keep track of original size
    });
    
    uploaded++;
    onProgress((uploaded / files.length) * 100);
  }
};

// Gallery-specific video upload
export const uploadGalleryVideoBlob = async (
  videoBlob: Blob,
  userName: string,
  deviceId: string,
  galleryId: string,
  onProgress: (progress: number) => void
): Promise<void> => {
  console.log(`🎥 Processing video blob (${(videoBlob.size / 1024).toFixed(1)}KB)`);
  
  const fileName = `${Date.now()}-recorded-video.webm`;
  
  onProgress(25);
  
  // Convert video blob to base64
  const reader = new FileReader();
  const base64Data = await new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(videoBlob);
  });
  
  onProgress(75);
  
  const mediaCollection = `galleries/${galleryId}/media`;
  await addDoc(collection(db, mediaCollection), {
    name: fileName,
    uploadedBy: userName,
    deviceId: deviceId,
    uploadedAt: new Date().toISOString(),
    type: 'video',
    base64Data: base64Data,
    mimeType: videoBlob.type,
    size: videoBlob.size
  });
  
  onProgress(100);
  console.log(`✅ Video blob uploaded successfully`);
};

// Gallery-specific note addition
export const addGalleryNote = async (
  noteText: string,
  userName: string,
  deviceId: string,
  galleryId: string
): Promise<void> => {
  const mediaCollection = `galleries/${galleryId}/media`;
  await addDoc(collection(db, mediaCollection), {
    name: `note-${Date.now()}`,
    uploadedBy: userName,
    deviceId: deviceId,
    uploadedAt: new Date().toISOString(),
    type: 'note',
    noteText: noteText
  });
};

// Gallery-specific note editing
export const editGalleryNote = async (
  noteId: string, 
  newText: string,
  galleryId: string
): Promise<void> => {
  const mediaCollection = `galleries/${galleryId}/media`;
  const noteRef = doc(db, mediaCollection, noteId);
  await updateDoc(noteRef, {
    noteText: newText
  });
};

// Gallery-specific media deletion
export const deleteGalleryMediaItem = async (
  item: MediaItem,
  galleryId: string
): Promise<void> => {
  // Delete from Firestore
  const mediaCollection = `galleries/${galleryId}/media`;
  await deleteDoc(doc(db, mediaCollection, item.id));

  // Note: Storage deletion removed - using base64 data directly in Firestore

  // Delete associated comments
  const commentsCollection = `galleries/${galleryId}/comments`;
  const commentsQuery = query(collection(db, commentsCollection), where('mediaId', '==', item.id));
  const commentsSnapshot = await getDocs(commentsQuery);
  
  for (const commentDoc of commentsSnapshot.docs) {
    await deleteDoc(commentDoc.ref);
  }

  // Delete associated likes
  const likesCollection = `galleries/${galleryId}/likes`;
  const likesQuery = query(collection(db, likesCollection), where('mediaId', '==', item.id));
  const likesSnapshot = await getDocs(likesQuery);
  
  for (const likeDoc of likesSnapshot.docs) {
    await deleteDoc(likeDoc.ref);
  }
};

// Gallery-specific comments
export const loadGalleryComments = (
  galleryId: string,
  setComments: (comments: Comment[]) => void
): (() => void) => {
  const commentsCollection = `galleries/${galleryId}/comments`;
  const q = query(collection(db, commentsCollection), orderBy('createdAt', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const commentsList: Comment[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Comment[];
    
    setComments(commentsList);
  });
};

export const addGalleryComment = async (
  mediaId: string, 
  text: string, 
  userName: string, 
  deviceId: string,
  galleryId: string
): Promise<void> => {
  const commentsCollection = `galleries/${galleryId}/comments`;
  await addDoc(collection(db, commentsCollection), {
    mediaId,
    text,
    userName,
    deviceId,
    createdAt: new Date().toISOString()
  });
};

export const deleteGalleryComment = async (
  commentId: string,
  galleryId: string
): Promise<void> => {
  const commentsCollection = `galleries/${galleryId}/comments`;
  await deleteDoc(doc(db, commentsCollection, commentId));
};

// Gallery-specific likes
export const loadGalleryLikes = (
  galleryId: string,
  setLikes: (likes: Like[]) => void
): (() => void) => {
  const likesCollection = `galleries/${galleryId}/likes`;
  const q = query(collection(db, likesCollection), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const likesList: Like[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Like[];
    
    setLikes(likesList);
  });
};

export const toggleGalleryLike = async (
  mediaId: string, 
  userName: string, 
  deviceId: string,
  galleryId: string
): Promise<void> => {
  const likesCollection = `galleries/${galleryId}/likes`;
  
  // Check if user already liked this item
  const existingLikeQuery = query(
    collection(db, likesCollection),
    where('mediaId', '==', mediaId),
    where('deviceId', '==', deviceId)
  );
  
  const existingLikes = await getDocs(existingLikeQuery);
  
  if (!existingLikes.empty) {
    // Remove like
    await deleteDoc(existingLikes.docs[0].ref);
  } else {
    // Add like
    await addDoc(collection(db, likesCollection), {
      mediaId,
      userName,
      deviceId,
      createdAt: new Date().toISOString()
    });
  }
};

// Gallery-specific user profiles
export const loadGalleryUserProfiles = (
  galleryId: string,
  setUserProfiles: (profiles: UserProfile[]) => void
): (() => void) => {
  const profilesCollection = `galleries/${galleryId}/userProfiles`;
  const q = query(collection(db, profilesCollection), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const profilesList: UserProfile[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserProfile[];
    
    setUserProfiles(profilesList);
  });
};

export const getGalleryUserProfile = async (
  userName: string, 
  deviceId: string,
  galleryId: string
): Promise<UserProfile | null> => {
  const profilesCollection = `galleries/${galleryId}/userProfiles`;
  const q = query(
    collection(db, profilesCollection),
    where('userName', '==', userName),
    where('deviceId', '==', deviceId)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  } as UserProfile;
};

export const getAllGalleryUserProfiles = async (galleryId: string): Promise<UserProfile[]> => {
  const profilesCollection = `galleries/${galleryId}/userProfiles`;
  const querySnapshot = await getDocs(collection(db, profilesCollection));
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as UserProfile[];
};

export const createOrUpdateGalleryUserProfile = async (
  userName: string,
  deviceId: string,
  profileData: Partial<UserProfile>,
  galleryId: string
): Promise<UserProfile> => {
  try {
    console.log('🔄 Starting createOrUpdateGalleryUserProfile...');
    console.log('📊 Parameters:', { userName, deviceId, galleryId });
    console.log('📝 Profile data keys:', Object.keys(profileData));
    
    const profilesCollection = `galleries/${galleryId}/userProfiles`;
    console.log('📂 Collection path:', profilesCollection);
    
    // Check if profile already exists
    console.log('🔍 Checking for existing profile...');
    const existingProfile = await getGalleryUserProfile(userName, deviceId, galleryId);
    console.log('👤 Existing profile found:', !!existingProfile);
    
    const timestamp = new Date().toISOString();
    
    // Clean profile data to remove undefined values that might cause Firebase issues
    const cleanedProfileData = Object.fromEntries(
      Object.entries(profileData).filter(([_, value]) => value !== undefined)
    );
    
    const updatedData = {
      userName,
      deviceId,
      ...cleanedProfileData,
      updatedAt: timestamp
    };
    
    console.log('💾 Data to save:', updatedData);
    
    if (existingProfile) {
      // Update existing profile
      console.log('🔄 Updating existing profile with ID:', existingProfile.id);
      await updateDoc(doc(db, profilesCollection, existingProfile.id), updatedData);
      console.log('✅ Profile updated successfully');
      
      return {
        ...existingProfile,
        ...updatedData
      };
    } else {
      // Create new profile
      const newProfileData = {
        ...updatedData,
        createdAt: timestamp
      };
      
      console.log('➕ Creating new profile');
      const docRef = await addDoc(collection(db, profilesCollection), newProfileData);
      console.log('✅ New profile created with ID:', docRef.id);
      
      return {
        id: docRef.id,
        ...newProfileData
      } as UserProfile;
    }
  } catch (error: any) {
    console.error('❌ Error in createOrUpdateGalleryUserProfile:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    
    // Provide more specific error messages
    if (error.code === 'permission-denied') {
      throw new Error('Keine Berechtigung zum Speichern des Profils. Bitte versuchen Sie es erneut.');
    } else if (error.code === 'unavailable') {
      throw new Error('Verbindung unterbrochen. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.');
    } else if (error.code === 'quota-exceeded') {
      throw new Error('Speicher-Limit erreicht. Bitte versuchen Sie es mit einem kleineren Profilbild.');
    } else if (error.code === 'invalid-argument' && error.message && error.message.includes('longer than')) {
      throw new Error('Profilbild ist zu groß. Firebase erlaubt maximal 1MB pro Feld. Bitte wählen Sie ein kleineres Bild.');
    } else if (error.message && error.message.includes('base64')) {
      throw new Error('Profilbild konnte nicht verarbeitet werden. Bitte wählen Sie ein anderes Bild.');
    }
    
    // Re-throw the original error if no specific handling
    throw error;
  }
};

export const uploadGalleryUserProfilePicture = async (
  file: File,
  userName: string,
  deviceId: string,
  galleryId: string
): Promise<string> => {
  // Convert profile picture to base64 instead of uploading to Firebase Storage
  const reader = new FileReader();
  const base64Data = await new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  
  return base64Data;
};

// Gallery-specific stories functions
export const addGalleryStory = async (
  file: File,
  mediaType: 'image' | 'video',
  userName: string,
  deviceId: string,
  galleryId: string
): Promise<void> => {
  console.log(`🚀 === GALLERY STORY UPLOAD START ===`);
  console.log(`👤 User: ${userName} (${deviceId})`);
  console.log(`🎪 Gallery: ${galleryId}`);
  console.log(`📁 File: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
  
  try {
    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      throw new Error(`Ungültiger Dateityp: ${file.type}`);
    }
    
    let processedFile = file;
    
    // Compress file to prevent Firebase document size errors
    if (shouldCompress(file)) {
      console.log(`🗜️ Compressing story file for optimal Firebase storage...`);
      try {
        if (file.type.startsWith('image/')) {
          processedFile = await compressImage(file, { targetSizeKB: 100, maxWidth: 800, maxHeight: 600 }); // Much smaller for stories
        } else if (file.type.startsWith('video/')) {
          processedFile = await compressVideo(file, 512); // 512KB for story videos
        }
        console.log(`✅ Story compression complete: ${(processedFile.size / 1024).toFixed(1)}KB`);
      } catch (error) {
        console.warn(`⚠️ Story compression failed, using original file:`, error);
        processedFile = file;
      }
    }
    
    // Final size check for Firebase compatibility
    const maxSizeForFirebase = 1024 * 1024; // 1MB absolute limit for Firebase documents
    if (processedFile.size > maxSizeForFirebase) {
      throw new Error(`Datei nach Komprimierung immer noch zu groß: ${(processedFile.size / 1024).toFixed(1)}KB (max. 1MB für Stories)`);
    }
    
    console.log(`📸 Converting story file to base64...`);
    
    // Convert file to base64
    const reader = new FileReader();
    const base64Data = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(processedFile);
    });
    
    console.log(`✅ Story file converted to base64 successfully`);
    
    // Generate filename for reference
    const timestamp = Date.now();
    const cleanUserName = userName.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_');
    const fileExtension = processedFile.name.split('.').pop()?.toLowerCase() || (mediaType === 'video' ? 'mp4' : 'jpg');
    const fileName = `STORY_${timestamp}_${cleanUserName}.${fileExtension}`;
    
    // Set expiry time (24 hours from now)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Save to gallery-specific stories collection with compressed base64 data
    const storiesCollection = `galleries/${galleryId}/stories`;
    const storyData = {
      mediaUrl: base64Data, // Using compressed base64 data
      mediaType,
      userName,
      deviceId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      views: [],
      fileName: fileName,
      isStory: true,
      base64Data: base64Data, // Store compressed base64 for consistency
      originalSize: file.size, // Track original size
      compressedSize: processedFile.size // Track compressed size
    };
    
    console.log(`💾 Saving to gallery stories collection: ${storiesCollection}`);
    const docRef = await addDoc(collection(db, storiesCollection), storyData);
    console.log(`✅ Gallery story saved with ID: ${docRef.id}`);
    
  } catch (error: any) {
    console.error(`❌ Gallery story upload failed:`, error);
    
    // Re-throw with user-friendly message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Unbekannter Fehler beim Story-Upload: ${error}`);
    }
  }
};

export const subscribeGalleryStories = (
  galleryId: string,
  callback: (stories: Story[]) => void
): (() => void) => {
  console.log(`📱 === SUBSCRIBING TO GALLERY STORIES ===`);
  console.log(`🎪 Gallery: ${galleryId}`);
  
  const storiesCollection = `galleries/${galleryId}/stories`;
  const q = query(
    collection(db, storiesCollection),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    console.log(`📱 Raw gallery stories from Firestore: ${snapshot.docs.length}`);
    
    const now = new Date();
    const allStories: Story[] = [];
    const activeStories: Story[] = [];
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const story: Story = {
        id: doc.id,
        ...data
      } as Story;
      
      allStories.push(story);
      
      // Check if story is still active (not expired)
      const expiresAt = new Date(story.expiresAt);
      const isActive = expiresAt > now;
      
      console.log(`  ${index + 1}. ${story.userName} - ${story.mediaType} - ${isActive ? 'ACTIVE' : 'EXPIRED'} (expires: ${expiresAt.toLocaleString()})`);
      
      if (isActive) {
        activeStories.push(story);
      }
    });
    
    console.log(`📱 Gallery stories - Total: ${allStories.length}, Active: ${activeStories.length}`);
    callback(activeStories);
    
  }, (error) => {
    console.error('❌ Error listening to gallery stories:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      galleryId: galleryId
    });
    callback([]);
  });
};

export const subscribeAllGalleryStories = (
  galleryId: string,
  callback: (stories: Story[]) => void
): (() => void) => {
  console.log(`📱 === SUBSCRIBING TO ALL GALLERY STORIES (ADMIN) ===`);
  console.log(`🎪 Gallery: ${galleryId}`);
  
  const storiesCollection = `galleries/${galleryId}/stories`;
  const q = query(
    collection(db, storiesCollection),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const stories: Story[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Story[];
    
    console.log(`📱 All gallery stories (admin): ${stories.length}`);
    callback(stories);
  });
};

export const markGalleryStoryAsViewed = async (
  storyId: string,
  deviceId: string,
  galleryId: string
): Promise<void> => {
  try {
    const storiesCollection = `galleries/${galleryId}/stories`;
    const storyRef = doc(db, storiesCollection, storyId);
    const storyDoc = await getDocs(query(collection(db, storiesCollection), where('__name__', '==', storyId)));
    
    if (!storyDoc.empty) {
      const storyData = storyDoc.docs[0].data();
      const currentViews = storyData.views || [];
      
      if (!currentViews.includes(deviceId)) {
        await updateDoc(storyRef, {
          views: [...currentViews, deviceId]
        });
      }
    }
    
  } catch (error) {
    console.error('Error marking gallery story as viewed:', error);
  }
};

export const deleteGalleryStory = async (
  storyId: string,
  galleryId: string
): Promise<void> => {
  try {
    const storiesCollection = `galleries/${galleryId}/stories`;
    
    // Get story data first for file deletion
    const storyDoc = await getDocs(query(collection(db, storiesCollection), where('__name__', '==', storyId)));
    
    if (!storyDoc.empty) {
      const storyData = storyDoc.docs[0].data();
      
      // Note: Stories are stored as base64 in Firestore, no storage cleanup needed
      console.log(`🗑️ Story data contains base64, no external storage cleanup required`);
    }
    
    // Delete from Firestore
    await deleteDoc(doc(db, storiesCollection, storyId));
    console.log(`✅ Deleted gallery story from Firestore: ${storyId}`);
    
  } catch (error) {
    console.error('Error deleting gallery story:', error);
    throw error;
  }
};

export const cleanupExpiredGalleryStories = async (galleryId: string): Promise<void> => {
  try {
    console.log(`🧹 === CLEANING UP EXPIRED GALLERY STORIES ===`);
    console.log(`🎪 Gallery: ${galleryId}`);
    
    const storiesCollection = `galleries/${galleryId}/stories`;
    const allStoriesSnapshot = await getDocs(collection(db, storiesCollection));
    const now = new Date();
    const expiredStories: any[] = [];
    
    allStoriesSnapshot.docs.forEach(doc => {
      const storyData = doc.data();
      const expiresAt = new Date(storyData.expiresAt);
      
      if (expiresAt <= now) {
        expiredStories.push({
          id: doc.id,
          ...storyData
        });
      }
    });
    
    console.log(`🗑️ Found ${expiredStories.length} expired gallery stories to delete`);
    
    // Delete expired stories
    for (const expiredStory of expiredStories) {
      try {
        await deleteGalleryStory(expiredStory.id, galleryId);
        console.log(`✅ Cleaned up expired gallery story: ${expiredStory.id}`);
      } catch (error) {
        console.error(`❌ Failed to cleanup expired gallery story: ${expiredStory.id}`, error);
      }
    }
    
    console.log(`🧹 Gallery story cleanup completed`);
    
  } catch (error) {
    console.error('Error cleaning up expired gallery stories:', error);
  }
};

// Get all users in a specific gallery for tagging
export const getGalleryUsers = async (galleryId: string): Promise<any[]> => {
  console.log(`🔍 === FETCHING GALLERY USERS ===`);
  console.log(`🎪 Gallery: ${galleryId}`);
  
  try {
    const userMap = new Map<string, any>();
    
    // 1. Get users from gallery-specific live_users collection
    const liveUsersQuery = query(collection(db, `galleries/${galleryId}/live_users`));
    const liveUsersSnapshot = await getDocs(liveUsersQuery);
    console.log(`👥 Found ${liveUsersSnapshot.docs.length} live users in gallery`);
    
    liveUsersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.userName && data.deviceId) {
        const key = `${data.userName}-${data.deviceId}`;
        userMap.set(key, {
          userName: data.userName,
          deviceId: data.deviceId,
          displayName: data.displayName || data.userName,
          profilePicture: data.profilePicture
        });
      }
    });
    
    // 2. Get users from gallery-specific userProfiles collection
    const profilesQuery = query(collection(db, `galleries/${galleryId}/userProfiles`));
    const profilesSnapshot = await getDocs(profilesQuery);
    console.log(`👤 Found ${profilesSnapshot.docs.length} user profiles in gallery`);
    
    profilesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.userName && data.deviceId) {
        const key = `${data.userName}-${data.deviceId}`;
        const existingUser = userMap.get(key);
        userMap.set(key, {
          userName: data.userName,
          deviceId: data.deviceId,
          displayName: data.displayName || existingUser?.displayName || data.userName,
          profilePicture: data.profilePicture || existingUser?.profilePicture
        });
      }
    });
    
    // 3. Get users from gallery media uploads
    const mediaQuery = query(collection(db, `galleries/${galleryId}/media`));
    const mediaSnapshot = await getDocs(mediaQuery);
    console.log(`📸 Found ${mediaSnapshot.docs.length} media items in gallery`);
    
    mediaSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.uploadedBy && data.deviceId) {
        const key = `${data.uploadedBy}-${data.deviceId}`;
        if (!userMap.has(key)) {
          userMap.set(key, {
            userName: data.uploadedBy,
            deviceId: data.deviceId,
            displayName: data.uploadedBy
          });
        }
      }
    });
    
    const users = Array.from(userMap.values());
    console.log(`📋 Returning ${users.length} gallery-specific users for tagging`);
    
    return users;
  } catch (error) {
    console.error('❌ Error fetching gallery users:', error);
    return [];
  }
};
