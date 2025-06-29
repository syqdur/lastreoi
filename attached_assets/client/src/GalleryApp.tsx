import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Sun, Moon, UserPlus, Lock, Unlock, Settings } from 'lucide-react';
import { UserNamePrompt } from './components/UserNamePrompt';
import { UploadSection } from './components/UploadSection';
import { InstagramGallery } from './components/InstagramGallery';
import { MediaModal } from './components/MediaModal';
import { AdminPanel } from './components/AdminPanel';
import { ProfileHeader } from './components/ProfileHeader';
import { UnderConstructionPage } from './components/UnderConstructionPage';
import { StoriesBar } from './components/StoriesBar';
import { StoriesViewer } from './components/StoriesViewer';
import { StoryUploadModal } from './components/StoryUploadModal';
import { TabNavigation } from './components/TabNavigation';
import { LiveUserIndicator } from './components/LiveUserIndicator';
import { SpotifyCallback } from './components/SpotifyCallback';
import { MusicWishlist } from './components/MusicWishlist';
import { Timeline } from './components/Timeline';
import { PostWeddingRecap } from './components/PostWeddingRecap';
import { PublicRecapPage } from './components/PublicRecapPage';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminCredentialsSetup } from './components/AdminCredentialsSetup';
import { UserProfileModal } from './components/UserProfileModal';
import { ProfileEditModal } from './components/ProfileEditModal';
import { ProfileEditTest } from './components/ProfileEditTest';
import { BackToTopButton } from './components/BackToTopButton';
import { NotificationCenter } from './components/NotificationCenter';
import { GalleryTutorial } from './components/GalleryTutorial';
import { AdminTutorial } from './components/AdminTutorial';
import { MediaTaggingModal } from './components/MediaTaggingModal';
import { InstagramTaggingModal } from './components/InstagramTaggingModal';
import { useUser } from './hooks/useUser';
import { MediaItem, Comment, Like } from './types';
import { Gallery, galleryService } from './services/galleryService';
import { getThemeConfig, getThemeTexts, getThemeStyles } from './config/themes';
import { storage, db } from './config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import {
  uploadFiles,
  uploadVideoBlob,
  deleteMediaItem,
  loadComments,
  addComment,
  deleteComment,
  loadLikes,
  toggleLike,
  addNote,
  editNote,
  loadUserProfiles,
  getUserProfile,
  getAllUserProfiles,
  createOrUpdateUserProfile,
  uploadUserProfilePicture,
  UserProfile,
  createTestNotification
} from './services/firebaseService';
import { subscribeSiteStatus, SiteStatus } from './services/siteStatusService';
import { getUserName, getDeviceId } from './utils/deviceId';
import { notificationService, initializePushNotifications } from './services/notificationService';
import { Story } from './services/liveService';

// Modified firebase service functions to work with gallery collections
import {
  loadGalleryMedia,
  uploadGalleryFiles,
  uploadGalleryVideoBlob,
  addGalleryNote,
  editGalleryNote,
  deleteGalleryMediaItem,
  loadGalleryComments,
  addGalleryComment,
  deleteGalleryComment,
  loadGalleryLikes,
  toggleGalleryLike,
  loadGalleryUserProfiles,
  getGalleryUserProfile,
  getAllGalleryUserProfiles,
  createOrUpdateGalleryUserProfile,
  uploadGalleryUserProfilePicture,
  addGalleryStory,
  subscribeGalleryStories,
  subscribeAllGalleryStories,
  markGalleryStoryAsViewed,
  deleteGalleryStory,
  cleanupExpiredGalleryStories,
  getGalleryUsers
} from './services/galleryFirebaseService';

interface GalleryAppProps {
  gallery: Gallery;
  isOwner: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const GalleryApp: React.FC<GalleryAppProps> = ({ 
  gallery, 
  isOwner, 
  isDarkMode, 
  onToggleDarkMode 
}) => {
  // Check if user was deleted and prevent app initialization
  const isUserDeleted = localStorage.getItem('userDeleted') === 'true';
  
  // Get theme configuration
  const themeConfig = getThemeConfig(gallery.theme || 'hochzeit');
  const themeTexts = getThemeTexts(gallery.theme || 'hochzeit');
  const themeStyles = getThemeStyles(gallery.theme || 'hochzeit');
  
  const { userName, deviceId, showNamePrompt, setUserName } = useUser();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [galleryProfileData, setGalleryProfileData] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [galleryUsers, setGalleryUsers] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [status, setStatus] = useState('');
  const [siteStatus, setSiteStatus] = useState<SiteStatus | null>(null);
  const [isAdmin, setIsAdmin] = useState(false); // Always start with false - admin mode requires credentials
  const [showAdminCredentialsSetup, setShowAdminCredentialsSetup] = useState(false);
  const [showStoriesViewer, setShowStoriesViewer] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showStoryUpload, setShowStoryUpload] = useState(false);
  const [activeTab, setActiveTab] = useState<'gallery' | 'music' | 'timeline'>('gallery');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showAdminTutorial, setShowAdminTutorial] = useState(false);
  const [showTaggingModal, setShowTaggingModal] = useState(false);
  const [pendingUploadFiles, setPendingUploadFiles] = useState<FileList | null>(null);
  const [pendingUploadUrl, setPendingUploadUrl] = useState<string>('');
  
  // Reset state when gallery changes to fix data isolation
  useEffect(() => {
    console.log('🔄 Gallery changed - resetting all state for:', gallery.id, gallery.eventName);
    
    // Clear old data immediately
    setGalleryProfileData(null);
    setMediaItems([]);
    setComments([]);
    setLikes([]);
    setStories([]);
    setUserProfiles([]);
    setCurrentUserProfile(null);
    setSiteStatus(null);
    setIsAdmin(false);
    setModalOpen(false);
    setActiveTab('gallery');
    
    // Check if tutorial should be shown for this gallery
    const tutorialKey = `tutorial_shown_${gallery.id}`;
    const tutorialShown = localStorage.getItem(tutorialKey);
    if (!tutorialShown && userName) {
      setShowTutorial(true);
    }
  }, [gallery.id, userName]);
  
  // Handle tab switching when features are disabled
  const handleTabChange = (tab: 'gallery' | 'music' | 'timeline') => {
    if (tab === 'gallery' && siteStatus && !siteStatus.galleryEnabled) {
      return; // Don't switch if disabled
    }
    if (tab === 'music' && siteStatus && !siteStatus.musicWishlistEnabled) {
      return;
    }
    setActiveTab(tab);
  };

  // Auto-switch away from disabled tabs
  useEffect(() => {
    if (siteStatus && !siteStatus.galleryEnabled && activeTab === 'gallery') {
      setActiveTab('timeline');
    }
    if (siteStatus && !siteStatus.musicWishlistEnabled && activeTab === 'music') {
      setActiveTab('timeline');
    }
  }, [siteStatus, activeTab]);

  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Check if we're on the Spotify callback page
  const isSpotifyCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('code') && urlParams.has('state');
  };

  // Initialize notification service when user is logged in
  useEffect(() => {
    if (!userName) return;

    const initNotifications = async () => {
      try {
        const initialized = await notificationService.init();
        if (initialized) {
          await notificationService.subscribeToPush(userName, deviceId);
          console.log('✅ Push notifications initialized');
        }
        
        await initializePushNotifications();
      } catch (error) {
        console.log('⚠️ Push notifications not available:', error);
      }
    };

    initNotifications();

    const handleServiceWorkerNavigation = (event: any) => {
      const { mediaId } = event.detail;
      if (mediaId) {
        setActiveTab('gallery');
        const mediaIndex = mediaItems.findIndex(item => item.id === mediaId);
        if (mediaIndex !== -1) {
          setCurrentImageIndex(mediaIndex);
          setModalOpen(true);
        }
      }
    };

    window.addEventListener('navigateToMedia', handleServiceWorkerNavigation);
    
    return () => {
      window.removeEventListener('navigateToMedia', handleServiceWorkerNavigation);
    };
  }, [userName, deviceId]);

  // Subscribe to stories when user is logged in
  useEffect(() => {
    if (!userName || !gallery.settings.allowStories) return;

    const unsubscribeStories = isAdmin 
      ? subscribeAllGalleryStories(gallery.id, setStories)
      : subscribeGalleryStories(gallery.id, setStories);

    const cleanupInterval = setInterval(() => {
      cleanupExpiredGalleryStories(gallery.id);
    }, 60000);

    return () => {
      clearInterval(cleanupInterval);
      unsubscribeStories();
    };
  }, [userName, deviceId, gallery.id, gallery.settings.allowStories, isAdmin]);

  useEffect(() => {
    if (!userName) return;

    const unsubscribeGallery = loadGalleryMedia(gallery.id, setMediaItems);
    const unsubscribeComments = loadGalleryComments(gallery.id, setComments);
    const unsubscribeLikes = loadGalleryLikes(gallery.id, setLikes);
    const unsubscribeUserProfiles = loadGalleryUserProfiles(gallery.id, setUserProfiles);

    // Load gallery users for tagging
    const loadUsers = async () => {
      try {
        const users = await getGalleryUsers(gallery.id);
        setGalleryUsers(users);
      } catch (error) {
        console.error('Error loading gallery users:', error);
      }
    };

    loadUsers();

    return () => {
      unsubscribeGallery();
      unsubscribeComments();
      unsubscribeLikes();
      unsubscribeUserProfiles();
    };
  }, [userName, gallery.id]);

  // Auto-logout when window/tab is closed
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isAdmin) {
        localStorage.removeItem(`admin_status_${gallery.slug}`);
      }
    };

    // Only check stored admin status, don't auto-enable for owners
    const storedAdminStatus = localStorage.getItem(`admin_status_${gallery.slug}`);
    if (storedAdminStatus === 'true') {
      setIsAdmin(true);
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isAdmin, gallery.slug]);

  const handleUpload = async (files: FileList) => {
    if (!userName || !files || files.length === 0) return;

    // Create preview URL for the first file to show in tagging modal
    const firstFile = files[0];
    const previewUrl = URL.createObjectURL(firstFile);
    
    setPendingUploadFiles(files);
    setPendingUploadUrl(previewUrl);
    setShowTaggingModal(true);
  }

  const handleTaggingConfirm = async (tags: any[]) => {
    if (!pendingUploadFiles || !userName) return;

    setIsUploading(true);
    setUploadProgress(0);
    setStatus('⏳ Lädt hoch...');
    setShowTaggingModal(false);

    try {
      // Pass tags to upload function
      await uploadGalleryFiles(pendingUploadFiles, userName, deviceId, gallery.id, setUploadProgress, tags);
      
      await createOrUpdateGalleryUserProfile(userName, deviceId, {}, gallery.id);
      
      setStatus('✅ Bilder erfolgreich hochgeladen!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('❌ Fehler beim Hochladen. Bitte versuche es erneut.');
      console.error('Upload error:', error);
      setTimeout(() => setStatus(''), 5000);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setPendingUploadFiles(null);
      setPendingUploadUrl('');
      // Clean up the preview URL
      if (pendingUploadUrl) {
        URL.revokeObjectURL(pendingUploadUrl);
      }
    }
  }

  const handleTaggingCancel = () => {
    setShowTaggingModal(false);
    setPendingUploadFiles(null);
    // Clean up the preview URL
    if (pendingUploadUrl) {
      URL.revokeObjectURL(pendingUploadUrl);
      setPendingUploadUrl('');
    }
  };

  const handleVideoUpload = async (videoBlob: Blob) => {
    if (!userName) return;

    setIsUploading(true);
    setUploadProgress(0);
    setStatus('⏳ Video wird hochgeladen...');

    try {
      await uploadGalleryVideoBlob(videoBlob, userName, deviceId, gallery.id, setUploadProgress);
      
      await createOrUpdateGalleryUserProfile(userName, deviceId, {}, gallery.id);
      
      setStatus('✅ Video erfolgreich hochgeladen!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('❌ Fehler beim Hochladen des Videos. Bitte versuche es erneut.');
      console.error('Video upload error:', error);
      setTimeout(() => setStatus(''), 5000);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleNoteSubmit = async (noteText: string) => {
    if (!userName) return;

    setIsUploading(true);
    setStatus('⏳ Notiz wird gespeichert...');

    try {
      await addGalleryNote(noteText, userName, deviceId, gallery.id);
      
      await createOrUpdateGalleryUserProfile(userName, deviceId, {}, gallery.id);
      
      setStatus('✅ Notiz erfolgreich hinterlassen!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('❌ Fehler beim Speichern der Notiz. Bitte versuche es erneut.');
      console.error('Note error:', error);
      setTimeout(() => setStatus(''), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditNote = async (item: MediaItem, newText: string) => {
    if (!userName || item.uploadedBy !== userName) {
      alert('Du kannst nur deine eigenen Notizen bearbeiten.');
      return;
    }

    setIsUploading(true);
    setStatus('⏳ Notiz wird aktualisiert...');

    try {
      await editGalleryNote(item.id, newText, gallery.id);
      setStatus('✅ Notiz erfolgreich aktualisiert!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('❌ Fehler beim Aktualisieren der Notiz. Bitte versuche es erneut.');
      console.error('Edit note error:', error);
      setTimeout(() => setStatus(''), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!isAdmin && item.uploadedBy !== userName) {
      alert('Du kannst nur deine eigenen Beiträge löschen.');
      return;
    }

    const itemType = item.type === 'note' ? 'Notiz' : item.type === 'video' ? 'Video' : 'Bild';
    const confirmMessage = isAdmin 
      ? `${itemType} von ${item.uploadedBy} wirklich löschen?`
      : `Dein${item.type === 'note' ? 'e' : ''} ${itemType} wirklich löschen?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await deleteGalleryMediaItem(item, gallery.id);
      setStatus(`✅ ${itemType} erfolgreich gelöscht!`);
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus(`❌ Fehler beim Löschen des ${itemType}s.`);
      console.error('Delete error:', error);
      setTimeout(() => setStatus(''), 5000);
    }
  };

  const handleAddComment = async (mediaId: string, text: string) => {
    if (!userName) return;
    
    try {
      await addGalleryComment(mediaId, text, userName, deviceId, gallery.id);
      
      const mediaItem = mediaItems.find(item => item.id === mediaId);
      if (mediaItem && mediaItem.uploadedBy !== userName) {
        await notificationService.sendCommentNotification(
          mediaItem.uploadedBy,
          mediaItem.deviceId,
          userName,
          deviceId,
          mediaId,
          text
        );
      }
      
      await createOrUpdateGalleryUserProfile(userName, deviceId, {}, gallery.id);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteGalleryComment(commentId, gallery.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleToggleLike = async (mediaId: string) => {
    if (!userName) return;
    
    try {
      await toggleGalleryLike(mediaId, userName, deviceId, gallery.id);
      
      const mediaItem = mediaItems.find(item => item.id === mediaId);
      if (mediaItem && mediaItem.uploadedBy !== userName) {
        await notificationService.sendLikeNotification(
          mediaItem.uploadedBy,
          mediaItem.deviceId,
          userName,
          deviceId,
          mediaId
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleStoryUpload = async (file: File) => {
    if (!userName) return;

    setIsUploading(true);
    setStatus('⏳ Story wird hochgeladen...');

    try {
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      
      await addGalleryStory(file, mediaType, userName, deviceId, gallery.id);
      
      setStatus('✅ Story erfolgreich hinzugefügt!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Story upload error:', error);
      setStatus('❌ Fehler beim Hochladen der Story. Bitte versuche es erneut.');
      setTimeout(() => setStatus(''), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewStory = (storyIndex: number) => {
    setCurrentStoryIndex(storyIndex);
    setShowStoriesViewer(true);
  };

  const handleStoryViewed = async (storyId: string) => {
    await markGalleryStoryAsViewed(storyId, deviceId, gallery.id);
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      await deleteGalleryStory(storyId, gallery.id);
      setStatus('✅ Story erfolgreich gelöscht!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error deleting story:', error);
      setStatus('❌ Fehler beim Löschen der Story.');
      setTimeout(() => setStatus(''), 5000);
    }
  };

  const openModal = (index: number) => {
    setCurrentImageIndex(index);
    setModalOpen(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === mediaItems.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? mediaItems.length - 1 : prev - 1
    );
  };

  const handleAdminLogin = (username: string) => {
    setIsAdmin(true);
    localStorage.setItem(`admin_status_${gallery.slug}`, 'true');
    
    // Store auth token with timestamp
    const authData = {
      username: username,
      timestamp: Date.now()
    };
    localStorage.setItem(`admin_auth_${gallery.id}`, JSON.stringify(authData));
    
    setShowAdminLogin(false);
    console.log('🔐 Admin logged in successfully');
    
    // Check if admin tutorial should be shown (first time admin access)
    const adminTutorialKey = `admin_tutorial_shown_${gallery.id}`;
    const adminTutorialShown = localStorage.getItem(adminTutorialKey);
    if (!adminTutorialShown) {
      setShowAdminTutorial(true);
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem(`admin_status_${gallery.slug}`);
    localStorage.removeItem(`admin_auth_${gallery.id}`);
    console.log('🚪 Admin logged out');
  };

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    // Mark tutorial as shown for this gallery
    const tutorialKey = `tutorial_shown_${gallery.id}`;
    localStorage.setItem(tutorialKey, 'true');
  };

  const handleCloseAdminTutorial = () => {
    setShowAdminTutorial(false);
    // Mark admin tutorial as shown for this gallery
    const adminTutorialKey = `admin_tutorial_shown_${gallery.id}`;
    localStorage.setItem(adminTutorialKey, 'true');
  };

  const handleAdminCredentialsSetup = async (credentials: { username: string; password: string }) => {
    try {
      console.log('🔧 Setting up admin credentials for gallery:', gallery.id);
      console.log('🔧 Device ID:', deviceId);
      console.log('🔧 Username:', credentials.username);
      
      // Hash the password (simple implementation for demo)
      const hashedPassword = btoa(credentials.password); // Base64 encoding for demo
      
      const adminCredentials = {
        username: credentials.username,
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString(),
        createdBy: deviceId
      };

      console.log('🔧 Saving admin credentials to Firestore...');
      console.log('🔧 Document path:', `galleries/${gallery.id}/admin/credentials`);
      
      // Try using updateDoc instead of setDoc first
      const adminDocRef = doc(db, 'galleries', gallery.id, 'admin', 'credentials');
      
      try {
        await setDoc(adminDocRef, adminCredentials);
        console.log('✅ Admin credentials saved via setDoc');
      } catch (setDocError: any) {
        console.log('⚠️ setDoc failed, trying updateDoc:', setDocError.message);
        // Try updateDoc as fallback
        await updateDoc(adminDocRef, adminCredentials);
        console.log('✅ Admin credentials saved via updateDoc');
      }
      
      // Set admin session
      const authData = {
        username: credentials.username,
        timestamp: Date.now()
      };
      localStorage.setItem(`admin_auth_${gallery.id}`, JSON.stringify(authData));
      console.log('✅ Admin session saved to localStorage');
      
      setIsAdmin(true);
      setShowAdminCredentialsSetup(false);
      console.log('🔐 Admin credentials set up successfully');
      
      // Create default gallery profile with owner name when admin credentials are set up
      if (!galleryProfileData || !galleryProfileData.profilePicture) {
        const ownerProfile = {
          name: credentials.username,
          bio: `${gallery.eventName} - Teilt eure schönsten Momente mit uns! 📸`,
          countdownDate: null, // Disabled by default
          countdownEndMessage: 'Der große Tag ist da! 🎉',
          countdownMessageDismissed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        try {
          const profileDocRef = doc(db, 'galleries', gallery.id, 'profile', 'main');
          await setDoc(profileDocRef, ownerProfile);
          setGalleryProfileData(ownerProfile);
          console.log('✅ Default owner profile created');
        } catch (error) {
          console.error('Error creating owner profile:', error);
        }
      }
    } catch (error: any) {
      console.error('❌ Error setting up admin credentials:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      });
      
      // If Firestore fails, let's store credentials in localStorage as fallback
      console.log('🔄 Trying localStorage fallback...');
      try {
        const localAdminCreds = {
          username: credentials.username,
          passwordHash: btoa(credentials.password),
          createdAt: new Date().toISOString(),
          createdBy: deviceId
        };
        
        localStorage.setItem(`admin_credentials_${gallery.id}`, JSON.stringify(localAdminCreds));
        
        const authData = {
          username: credentials.username,
          timestamp: Date.now()
        };
        localStorage.setItem(`admin_auth_${gallery.id}`, JSON.stringify(authData));
        
        setIsAdmin(true);
        setShowAdminCredentialsSetup(false);
        console.log('✅ Admin credentials saved to localStorage as fallback');
        
        // Create default gallery profile with owner name when admin credentials are set up
        if (!galleryProfileData || !galleryProfileData.profilePicture) {
          const ownerProfile = {
            name: credentials.username,
            bio: `${gallery.eventName} - Teilt eure schönsten Momente mit uns! 📸`,
            countdownDate: null, // Disabled by default
            countdownEndMessage: 'Der große Tag ist da! 🎉',
            countdownMessageDismissed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          try {
            const profileDocRef = doc(db, 'galleries', gallery.id, 'profile', 'main');
            await setDoc(profileDocRef, ownerProfile);
            setGalleryProfileData(ownerProfile);
            console.log('✅ Default owner profile created via localStorage fallback');
          } catch (error) {
            console.error('Error creating owner profile via localStorage fallback:', error);
            // Set local state even if Firebase fails
            setGalleryProfileData(ownerProfile);
          }
        }
      } catch (localError: any) {
        console.error('❌ Even localStorage fallback failed:', localError);
        throw new Error(`Fehler beim Einrichten der Admin-Zugangsdaten: ${error?.message || 'Unbekannter Fehler'}`);
      }
    }
  };

  const handleProfileUpdated = (profile: UserProfile) => {
    setCurrentUserProfile(profile);
    setUserProfiles(prev => {
      const index = prev.findIndex(p => p.id === profile.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = profile;
        return updated;
      } else {
        return [...prev, profile];
      }
    });
  };

  const handleNavigateToMedia = (mediaId: string) => {
    const mediaIndex = mediaItems.findIndex(item => item.id === mediaId);
    if (mediaIndex !== -1) {
      setActiveTab('gallery');
      setCurrentImageIndex(mediaIndex);
      setModalOpen(true);
    }
  };

  // Real-time profile synchronization using Firebase listener
  useEffect(() => {
    if (!userName || !deviceId) return;
    
    console.log('🔄 Setting up real-time profile listener for:', userName);
    
    const userProfileRef = doc(db, 'galleries', gallery.id, 'userProfiles', `${userName}_${deviceId}`);
    
    const unsubscribe = onSnapshot(userProfileRef, (doc) => {
      if (doc.exists()) {
        const profileData = doc.data();
        const latestProfile = {
          id: doc.id,
          ...profileData
        } as UserProfile;
        
        // Only update if data actually changed
        if (JSON.stringify(latestProfile) !== JSON.stringify(currentUserProfile)) {
          console.log('✅ Profile updated via listener:', latestProfile);
          setCurrentUserProfile(latestProfile);
        }
      } else {
        // Profile doesn't exist, set to null
        if (currentUserProfile !== null) {
          console.log('📝 Profile not found, setting to null');
          setCurrentUserProfile(null);
        }
      }
    }, (error) => {
      console.error('Error in profile listener:', error);
    });
    
    return () => {
      console.log('🔌 Cleaning up profile listener');
      unsubscribe();
    };
  }, [userName, deviceId, gallery.id]); // Removed currentUserProfile from dependencies to prevent loops

  // Load current user profile
  useEffect(() => {
    const loadCurrentUserProfile = async () => {
      if (userName && deviceId) {
        try {
          const userProfile = await getGalleryUserProfile(userName, deviceId, gallery.id);
          setCurrentUserProfile(userProfile);
          
          if (!userProfile) {
            const allProfiles = await getAllGalleryUserProfiles(gallery.id);
            let existingUserProfile = allProfiles.find((p: UserProfile) => p.userName === userName);
            
            if (!existingUserProfile) {
              const lowerUserName = userName.toLowerCase();
              existingUserProfile = allProfiles.find((p: UserProfile) => {
                const lowerProfileName = p.userName.toLowerCase();
                return lowerProfileName.includes(lowerUserName.slice(0, 4)) || 
                       lowerUserName.includes(lowerProfileName.slice(0, 4));
              });
            }
            
            if (existingUserProfile) {
              try {
                await createOrUpdateGalleryUserProfile(userName, deviceId, {
                  displayName: existingUserProfile.displayName || userName,
                  profilePicture: existingUserProfile.profilePicture
                }, gallery.id);
                
                const linkedProfile = await getGalleryUserProfile(userName, deviceId, gallery.id);
                setCurrentUserProfile(linkedProfile);
              } catch (error) {
                console.error('Error linking profile:', error);
                setCurrentUserProfile(null);
              }
            } else {
              setCurrentUserProfile(null);
            }
          }
        } catch (error) {
          console.error('Error loading current user profile:', error);
        }
      }
    };

    loadCurrentUserProfile();
  }, [userName, deviceId, gallery.id]);

  // Load gallery profile data from Firebase for current gallery
  useEffect(() => {
    // Set immediate default profile to prevent loading state flash
    const immediateDefaultProfile = {
      name: gallery.eventName,
      bio: `${gallery.eventName} - Teilt eure schönsten Momente mit uns! 📸`,
      countdownDate: null, // Disabled by default
      countdownEndMessage: 'Der große Tag ist da! 🎉',
      countdownMessageDismissed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setGalleryProfileData(immediateDefaultProfile);

    const loadGalleryProfile = async () => {
      try {
        console.log('🔄 Loading gallery profile for:', gallery.id);
        console.log('🎯 Current gallery name:', gallery.eventName);
        
        const profileDocRef = doc(db, 'galleries', gallery.id, 'profile', 'main');
        const profileDoc = await getDoc(profileDocRef);
        
        if (profileDoc.exists()) {
          const firebaseData = profileDoc.data();
          console.log('✅ Gallery profile loaded from Firebase:', firebaseData);
          console.log('🔄 Applying Firebase profile data immediately');
          setGalleryProfileData(firebaseData);
        } else {
          console.log('📝 No Firebase profile found, keeping default gallery profile');
          // Keep the default profile we already set
        }
      } catch (error) {
        console.error('❌ Error loading gallery profile:', error);
        // Keep the default profile we already set on error
      }
    };

    // Load Firebase profile after setting default
    loadGalleryProfile();
  }, [gallery.id, gallery.eventName, gallery.eventDate]);

  // Subscribe to site status changes
  useEffect(() => {
    console.log('🔄 Setting up site status subscription for gallery:', gallery.id);
    
    const unsubscribe = subscribeSiteStatus((status) => {
      console.log('📊 Site status updated:', status);
      setSiteStatus(status);
    });

    return () => {
      console.log('🧹 Cleaning up site status subscription');
      unsubscribe();
    };
  }, [gallery.id]);

  // Check for admin credentials setup on gallery load
  useEffect(() => {
    const checkAdminCredentials = async () => {
      try {
        console.log('🔍 Checking admin credentials for gallery:', gallery.slug, 'ID:', gallery.id);
        
        // Check if this is a gallery owner (created by this device)
        const isOwner = localStorage.getItem(`gallery_owner_${gallery.slug}`) === 'true';
        console.log('👑 Is owner:', isOwner);
        
        if (isOwner) {
          // Check if admin credentials are already set up (Firestore first, then localStorage)
          let credentialsExist = false;
          
          try {
            const adminCredsDoc = await getDoc(doc(db, 'galleries', gallery.id, 'admin', 'credentials'));
            credentialsExist = adminCredsDoc.exists();
            console.log('📄 Admin credentials doc exists in Firestore:', credentialsExist);
          } catch (firestoreError) {
            console.log('⚠️ Could not check Firestore, checking localStorage...');
            // Check localStorage fallback
            const localCreds = localStorage.getItem(`admin_credentials_${gallery.id}`);
            credentialsExist = !!localCreds;
            console.log('📱 Admin credentials exist in localStorage:', credentialsExist);
          }
          
          if (!credentialsExist) {
            // First time - show setup dialog but don't enable admin mode yet
            console.log('🔧 First time gallery owner - showing admin setup');
            setShowAdminCredentialsSetup(true);
            // Ensure admin mode is off until credentials are set up
            setIsAdmin(false);
          } else {
            // Credentials exist - check if already logged in
            const savedAuth = localStorage.getItem(`admin_auth_${gallery.id}`);
            console.log('🔐 Saved auth exists:', !!savedAuth);
            
            if (savedAuth) {
              const authData = JSON.parse(savedAuth);
              // Check if auth is still valid (24 hours)
              if (Date.now() - authData.timestamp < 24 * 60 * 60 * 1000) {
                setIsAdmin(true);
                console.log('🔐 Admin auto-login successful');
                
                // Check if admin tutorial should be shown (first time admin access)
                const adminTutorialKey = `admin_tutorial_shown_${gallery.id}`;
                const adminTutorialShown = localStorage.getItem(adminTutorialKey);
                if (!adminTutorialShown) {
                  setShowAdminTutorial(true);
                }
              } else {
                // Auth expired, remove it
                localStorage.removeItem(`admin_auth_${gallery.id}`);
                setIsAdmin(false);
                console.log('⏰ Admin auth expired');
              }
            } else {
              // No saved auth, ensure admin mode is off
              setIsAdmin(false);
              console.log('🚫 No saved admin auth');
            }
          }
        } else {
          // Not the owner, ensure admin mode is off
          setIsAdmin(false);
          console.log('👤 Not gallery owner');
        }
      } catch (error) {
        console.error('Error checking admin credentials:', error);
        setIsAdmin(false);
      }
    };

    // Add a small delay to ensure the gallery is fully loaded
    const timeoutId = setTimeout(checkAdminCredentials, 500);
    return () => clearTimeout(timeoutId);
  }, [gallery.id, gallery.slug]);

  // Additional effect to handle fresh gallery creation
  useEffect(() => {
    // Check if we just created this gallery (flag should be very fresh)
    const checkFreshGalleryCreation = () => {
      const isOwner = localStorage.getItem(`gallery_owner_${gallery.slug}`) === 'true';
      const galleryCreatedFlag = localStorage.getItem(`gallery_just_created_${gallery.slug}`);
      
      console.log('🆕 Checking fresh gallery - Owner:', isOwner, 'JustCreated flag:', galleryCreatedFlag);
      
      if (isOwner && galleryCreatedFlag === 'true') {
        console.log('🎉 Fresh gallery detected - showing admin setup immediately');
        setShowAdminCredentialsSetup(true);
        // Remove the flag so it doesn't show again
        localStorage.removeItem(`gallery_just_created_${gallery.slug}`);
        // Ensure admin mode is off
        setIsAdmin(false);
      }
    };

    checkFreshGalleryCreation();
  }, [gallery.slug]);

  // Sync all user profiles
  useEffect(() => {
    const syncAllUserProfiles = async () => {
      try {
        const allProfiles = await getAllGalleryUserProfiles(gallery.id);
        setUserProfiles(allProfiles);
      } catch (error) {
        console.error('Error syncing user profiles:', error);
      }
    };

    syncAllUserProfiles();

    const handleUserConnected = async (event: CustomEvent) => {
      const { userName, deviceId, profilePicture } = event.detail;
      
      if (profilePicture && profilePicture instanceof File) {
        try {
          console.log('🖼️ Processing profile picture for new user:', userName);
          const profilePictureUrl = await uploadGalleryUserProfilePicture(profilePicture, userName, deviceId, gallery.id);
          
          const newProfile = await createOrUpdateGalleryUserProfile(userName, deviceId, {
            displayName: userName,
            profilePicture: profilePictureUrl
          }, gallery.id);
          
          // Immediately update current user profile if this is the current user
          const currentStoredName = getUserName();
          const currentStoredDeviceId = getDeviceId();
          if (userName === currentStoredName && deviceId === currentStoredDeviceId) {
            console.log('✅ Updating current user profile immediately');
            setCurrentUserProfile(newProfile);
          }
          
          // Immediately update user profiles list
          setUserProfiles(prev => {
            const index = prev.findIndex(p => p.userName === userName && p.deviceId === deviceId);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = newProfile;
              return updated;
            } else {
              return [...prev, newProfile];
            }
          });
          
          // Trigger a custom event to notify all components of profile update
          window.dispatchEvent(new CustomEvent('profilePictureUpdated', { 
            detail: { userName, deviceId, profile: newProfile } 
          }));
          
          console.log('✅ Profile picture saved and synced immediately');
        } catch (error) {
          console.error('❌ Error saving profile picture:', error);
        }
      }
      
      // Still sync all profiles after a short delay as backup
      setTimeout(() => {
        syncAllUserProfiles();
      }, 500);
    };

    window.addEventListener('userConnected', handleUserConnected as any);
    
    return () => {
      window.removeEventListener('userConnected', handleUserConnected as any);
    };
  }, [gallery.id]);

  const getUserAvatar = (targetUserName: string, targetDeviceId?: string) => {
    const userProfile = userProfiles.find(p => 
      p.userName === targetUserName && (!targetDeviceId || p.deviceId === targetDeviceId)
    );
    return userProfile?.profilePicture || null;
  };

  const getUserDisplayName = (targetUserName: string, targetDeviceId?: string) => {
    const userProfile = userProfiles.find(p => 
      p.userName === targetUserName && (!targetDeviceId || p.deviceId === targetDeviceId)
    );
    return (userProfile?.displayName && userProfile.displayName !== targetUserName) 
      ? userProfile.displayName 
      : targetUserName;
  };

  // Show Spotify callback handler if on callback page
  if (isSpotifyCallback()) {
    return <SpotifyCallback isDarkMode={isDarkMode} />;
  }

  if (showNamePrompt) {
    return <UserNamePrompt 
      onSubmit={(name: string, profilePicture?: File) => {
        setUserName(name, profilePicture);
      }} 
      isDarkMode={isDarkMode} 
      galleryTheme={gallery.theme as 'hochzeit' | 'geburtstag' | 'urlaub' | 'eigenes'}
    />;
  }

  return (
    <div className={`min-h-screen relative transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gray-900' 
        : gallery.theme === 'hochzeit'
        ? 'bg-gradient-to-br from-gray-50 via-pink-50/30 to-rose-50/20'
        : gallery.theme === 'geburtstag'
        ? 'bg-gradient-to-br from-gray-50 via-purple-50/30 to-violet-50/20'
        : gallery.theme === 'urlaub'
        ? 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-cyan-50/20'
        : 'bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20'
    }`}>

      {/* Gallery Header */}
      <div className={`sticky top-0 z-50 transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gray-900/70 border-gray-700/30 backdrop-blur-xl shadow-xl shadow-purple-500/5' 
          : gallery.theme === 'hochzeit'
          ? 'bg-white/70 border-gray-200/30 backdrop-blur-xl shadow-xl shadow-pink-500/5'
          : gallery.theme === 'geburtstag'
          ? 'bg-white/70 border-gray-200/30 backdrop-blur-xl shadow-xl shadow-purple-500/5'
          : gallery.theme === 'urlaub'
          ? 'bg-white/70 border-gray-200/30 backdrop-blur-xl shadow-xl shadow-blue-500/5'
          : 'bg-white/70 border-gray-200/30 backdrop-blur-xl shadow-xl shadow-green-500/5'
      } border-b`}>
        <div className="max-w-md mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center relative bg-transparent">
                {/* Theme-specific Icon */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <span className="text-xl sm:text-2xl animate-pulse" style={{
                    animation: 'bounce 2s ease-in-out infinite'
                  }}>
                    {themeConfig.icon}
                  </span>
                  
                  {/* Sparkle effect for all themes */}
                  <div className={`absolute w-1 h-1 rounded-full transition-all duration-500 ${
                    isDarkMode ? `bg-${themeStyles.secondaryColor || 'pink-200'}` : `bg-${themeStyles.accentColor || 'pink-300'}`
                  }`} style={{
                    animation: 'sparkle 2s ease-in-out infinite',
                    top: '20%',
                    right: '20%'
                  }}></div>
                </div>
              </div>
              <h1 className={`text-base sm:text-lg font-bold tracking-tight transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {gallery.eventName}
              </h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Notification Center */}
              {userName && (
                <NotificationCenter
                  userName={userName}
                  deviceId={deviceId}
                  isDarkMode={isDarkMode}
                  onNavigateToMedia={handleNavigateToMedia}
                  galleryId={gallery.id}
                />
              )}
              
              {/* Profile Button */}
              <button
                onClick={() => setShowUserProfileModal(true)}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm shadow-lg min-w-0 h-[40px] ${
                  isDarkMode 
                    ? 'bg-white/10 hover:bg-white/15 text-white border border-white/20 shadow-black/20' 
                    : 'bg-white/20 hover:bg-white/30 text-gray-800 border border-white/30 shadow-gray-500/20'
                }`}
                title="Mein Profil bearbeiten"
              >
                {currentUserProfile?.profilePicture ? (
                  <img 
                    src={currentUserProfile?.profilePicture || ''} 
                    alt="My Profile"
                    className="w-6 h-6 rounded-full object-cover ring-2 ring-white/30 shadow-sm flex-shrink-0"
                  />
                ) : (
                  <UserPlus className={`w-4 h-4 transition-colors duration-300 flex-shrink-0 ${
                    isDarkMode ? 'text-white/80' : 'text-gray-700'
                  }`} />
                )}
                <span className="text-sm font-medium truncate hidden sm:block max-w-16">Profil</span>
              </button>
              
              {/* Live User Indicator */}
              <LiveUserIndicator 
                currentUser={userName || ''}
                isDarkMode={isDarkMode}
                galleryId={gallery.id}
              />
              
              <button
                onClick={onToggleDarkMode}
                className={`p-2 sm:p-2.5 rounded-full transition-all duration-300 touch-manipulation ${
                  isDarkMode 
                    ? 'text-yellow-400 hover:bg-gray-800/50 hover:scale-110' 
                    : 'text-gray-600 hover:bg-gray-100/50 hover:scale-110'
                }`}
              >
                {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-2 sm:px-0">
        {/* Profile Header */}
        <ProfileHeader
          isDarkMode={isDarkMode}
          isAdmin={isAdmin}
          userName={userName || undefined}
          mediaItems={mediaItems}
          onToggleAdmin={setIsAdmin}
          currentUserProfile={currentUserProfile}
          onOpenUserProfile={() => setShowUserProfileModal(true)}
          showTopBarControls={false}
          galleryProfileData={galleryProfileData}
          onEditGalleryProfile={() => setShowProfileEditModal(true)}
          gallery={gallery}
        />

        
        {/* Stories Bar */}
        {siteStatus?.storiesEnabled && (
          <StoriesBar
            stories={stories}
            currentUser={userName || ''}
            onAddStory={() => setShowStoryUpload(true)}
            onViewStory={handleViewStory}
            isDarkMode={isDarkMode}
            storiesEnabled={siteStatus.storiesEnabled}
          />
        )}
        
        {/* Tab Navigation */}
        <TabNavigation 
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isDarkMode={isDarkMode}
          galleryEnabled={siteStatus?.galleryEnabled ?? true}
          musicWishlistEnabled={siteStatus?.musicWishlistEnabled ?? true}
          themeTexts={themeTexts}
          themeIcon={themeConfig.icon}
          themeStyles={themeStyles}
          galleryEventName={gallery.eventName}
        />

        {/* Tab Content */}
        {activeTab === 'gallery' ? (
          <>
            <UploadSection
              onUpload={handleUpload}
              onVideoUpload={handleVideoUpload}
              onNoteSubmit={handleNoteSubmit}
              onAddStory={() => setShowStoryUpload(true)}
              isUploading={isUploading}
              progress={uploadProgress}
              isDarkMode={isDarkMode}
              storiesEnabled={gallery.settings.allowStories}
              themeTexts={themeTexts}
              themeStyles={themeStyles}
              galleryTheme={gallery.theme as 'hochzeit' | 'geburtstag' | 'urlaub' | 'eigenes'}
            />

            {status && (
              <div className="px-4 py-2">
                <p className={`text-sm text-center transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`} dangerouslySetInnerHTML={{ __html: status }} />
              </div>
            )}

            <InstagramGallery
              items={mediaItems}
              onItemClick={openModal}
              onDelete={handleDelete}
              onEditNote={handleEditNote}
              isAdmin={isAdmin}
              comments={comments}
              likes={likes}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
              onToggleLike={handleToggleLike}
              userName={userName || ''}
              isDarkMode={isDarkMode}
              getUserAvatar={getUserAvatar}
              getUserDisplayName={getUserDisplayName}
              deviceId={deviceId || ''}
              galleryTheme={gallery.theme}
              galleryId={gallery.id}
            />
          </>
        ) : activeTab === 'timeline' ? (
          <Timeline 
            isDarkMode={isDarkMode}
            userName={userName || ''}
            isAdmin={isAdmin}
            galleryId={gallery.id}
            galleryTheme={gallery.theme}
          />
        ) : activeTab === 'music' && gallery.settings.spotifyIntegration ? (
          <MusicWishlist 
            isDarkMode={isDarkMode} 
            isAdmin={isAdmin}
            galleryId={gallery.id}
          />
        ) : (
          <div className={`p-8 text-center transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <p>Diese Funktion ist derzeit deaktiviert.</p>
          </div>
        )}
      </div>

      {/* All the modals and components */}
      <MediaModal
        isOpen={modalOpen}
        items={mediaItems}
        currentIndex={currentImageIndex}
        onClose={() => setModalOpen(false)}
        onNext={nextImage}
        onPrev={prevImage}
        comments={comments}
        likes={likes}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        onToggleLike={handleToggleLike}
        userName={userName || ''}
        isAdmin={isAdmin}
        isDarkMode={isDarkMode}
        getUserAvatar={getUserAvatar}
        getUserDisplayName={getUserDisplayName}
      />

      <StoriesViewer
        isOpen={showStoriesViewer}
        stories={stories}
        initialStoryIndex={currentStoryIndex}
        currentUser={userName || ''}
        onClose={() => setShowStoriesViewer(false)}
        onStoryViewed={handleStoryViewed}
        onDeleteStory={handleDeleteStory}
        isAdmin={isAdmin}
        isDarkMode={isDarkMode}
      />

      <StoryUploadModal
        isOpen={showStoryUpload}
        onClose={() => setShowStoryUpload(false)}
        onUpload={handleStoryUpload}
        isDarkMode={isDarkMode}
      />

      <AdminLoginModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onLogin={handleAdminLogin}
        isDarkMode={isDarkMode}
        galleryId={gallery.id}
      />

      <AdminCredentialsSetup
        isOpen={showAdminCredentialsSetup}
        onClose={() => setShowAdminCredentialsSetup(false)}
        onSetup={handleAdminCredentialsSetup}
        isDarkMode={isDarkMode}
        galleryName={gallery.eventName}
      />

      {userName && deviceId && (
        <UserProfileModal
          isOpen={showUserProfileModal}
          onClose={() => setShowUserProfileModal(false)}
          userName={userName}
          deviceId={deviceId}
          isDarkMode={isDarkMode}
          onProfileUpdated={handleProfileUpdated}
          isAdmin={isAdmin}
          currentUserName={userName}
          currentDeviceId={deviceId}
          galleryId={gallery.id}
        />
      )}

      {/* Admin Panel with Feature Toggles - Only visible for admins */}
      {isAdmin && (
        <AdminPanel
          isDarkMode={isDarkMode}
          isAdmin={isAdmin}
          onToggleAdmin={(newIsAdmin: boolean) => {
            if (newIsAdmin) {
              setShowAdminLogin(true);
            } else {
              handleAdminLogout();
            }
          }}
          mediaItems={mediaItems}
          siteStatus={siteStatus ?? undefined}
          getUserAvatar={getUserAvatar}
          getUserDisplayName={getUserDisplayName}
          gallery={gallery}
        />
      )}





      {isAdmin && (
        <ProfileEditModal
          isOpen={showProfileEditModal}
          onClose={() => setShowProfileEditModal(false)}
          currentProfileData={{
            profilePicture: galleryProfileData?.profilePicture,
            name: galleryProfileData?.name || gallery.eventName,
            bio: galleryProfileData?.bio || `${gallery.eventName} - Teilt eure schönsten Momente mit uns! 📸`,
            countdownDate: galleryProfileData?.countdownDate || gallery.eventDate,
            countdownEndMessage: galleryProfileData?.countdownEndMessage || 'Der große Tag ist da! 🎉',
            countdownMessageDismissed: galleryProfileData?.countdownMessageDismissed || false
          }}
          onSave={async (profileData) => {
            try {
              console.log('🔄 Saving gallery profile...', profileData);
              let profilePictureUrl = galleryProfileData?.profilePicture;
              
              // Handle profile picture update
              if (profileData.profilePicture instanceof File) {
                console.log('📸 Processing gallery profile picture...');
                
                // Since ProfileEditModal already compresses the image, the File should already be compressed
                // But let's ensure it's under Firebase limits by converting to base64
                const reader = new FileReader();
                profilePictureUrl = await new Promise((resolve, reject) => {
                  reader.onload = () => {
                    const result = reader.result as string;
                    // Check if the base64 is under Firebase limit (900KB)
                    if (result.length > 900000) {
                      console.warn('⚠️ Profile picture still too large after compression:', Math.round(result.length / 1024), 'KB');
                      reject(new Error('Profilbild ist zu groß für Firebase. Bitte wählen Sie ein kleineres Bild.'));
                    } else {
                      console.log('✅ Gallery profile picture processed successfully:', Math.round(result.length / 1024), 'KB');
                      resolve(result);
                    }
                  };
                  reader.onerror = reject;
                  reader.readAsDataURL(profileData.profilePicture as File);
                });
              } else if (typeof profileData.profilePicture === 'string') {
                profilePictureUrl = profileData.profilePicture;
              }

              const updatedGalleryProfile: any = {
                name: profileData.name,
                bio: profileData.bio,
                profilePicture: profilePictureUrl,
                countdownEndMessage: profileData.countdownEndMessage,
                countdownMessageDismissed: profileData.countdownMessageDismissed,
                updatedAt: new Date().toISOString()
              };

              // Handle countdownDate explicitly - include it if it has a value, otherwise explicitly set to null to remove it
              if (profileData.countdownDate && profileData.countdownDate.trim() !== '') {
                updatedGalleryProfile.countdownDate = profileData.countdownDate;
              } else {
                updatedGalleryProfile.countdownDate = null; // Explicitly remove countdown
              }

              console.log('📝 Profile data to save:', updatedGalleryProfile);
              console.log('🎯 Gallery ID:', gallery.id);

              // Save to gallery profile collection using setDoc
              const profileDocRef = doc(db, 'galleries', gallery.id, 'profile', 'main');
              console.log('📍 Document path:', `galleries/${gallery.id}/profile/main`);
              
              await setDoc(profileDocRef, updatedGalleryProfile, { merge: true });
              
              setGalleryProfileData(updatedGalleryProfile);
              setShowProfileEditModal(false);
              console.log('✅ Gallery profile updated successfully');
            } catch (error: any) {
              console.error('❌ Error updating gallery profile:', error);
              console.error('❌ Error message:', error.message);
              console.error('❌ Error code:', error.code);
              alert(`Fehler beim Aktualisieren des Galerie-Profils: ${error.message}`);
            }
          }}
          isDarkMode={isDarkMode}
        />
      )}

      <AdminPanel 
        isDarkMode={isDarkMode} 
        isAdmin={isAdmin}
        onToggleAdmin={(status) => {
          if (status) {
            setShowAdminLogin(true);
          } else {
            handleAdminLogout();
          }
        }}
        mediaItems={mediaItems}
        siteStatus={siteStatus ?? undefined}
        getUserAvatar={getUserAvatar}
        getUserDisplayName={getUserDisplayName}
        gallery={gallery}
      />

      <BackToTopButton isDarkMode={isDarkMode} galleryTheme={gallery.theme as 'hochzeit' | 'geburtstag' | 'urlaub' | 'eigenes'} />

      {/* Floating Admin Controls */}
      {userName && (
        <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
          <button
            onClick={() => {
              if (isAdmin) {
                handleAdminLogout();
              } else {
                setShowAdminLogin(true);
              }
            }}
            className={`w-12 h-12 rounded-full transition-all duration-300 hover:scale-110 flex items-center justify-center shadow-lg ring-2 ${
              isDarkMode 
                ? 'bg-gray-800/90 hover:bg-gray-700/90 backdrop-blur-sm ring-gray-600/40 hover:ring-gray-500/60' 
                : 'bg-white/90 hover:bg-gray-50/90 backdrop-blur-sm ring-gray-300/40 hover:ring-gray-400/60'
            }`}
            title={isAdmin ? "Admin-Modus verlassen" : "Admin-Modus"}
          >
            {isAdmin ? (
              <Unlock className={`w-5 h-5 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`} />
            ) : (
              <Lock className={`w-5 h-5 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`} />
            )}
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowProfileEditModal(true)}
              className={`w-12 h-12 rounded-full transition-all duration-300 hover:scale-110 flex items-center justify-center shadow-lg ring-2 ${
                isDarkMode 
                  ? 'bg-gray-800/90 hover:bg-gray-700/90 backdrop-blur-sm ring-gray-600/40 hover:ring-gray-500/60' 
                  : 'bg-white/90 hover:bg-gray-50/90 backdrop-blur-sm ring-gray-300/40 hover:ring-gray-400/60'
              }`}
              title="Galerie-Einstellungen"
            >
              <Settings className={`w-5 h-5 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`} />
            </button>
          )}
        </div>
      )}

      {/* Gallery Tutorial */}
      <GalleryTutorial
        isOpen={showTutorial}
        onClose={handleCloseTutorial}
        isDarkMode={isDarkMode}
        galleryTheme={gallery.theme || 'hochzeit'}
      />

      {/* Admin Tutorial */}
      <AdminTutorial
        isOpen={showAdminTutorial}
        onClose={handleCloseAdminTutorial}
        isDarkMode={isDarkMode}
        galleryTheme={gallery.theme || 'hochzeit'}
      />

      {/* Media Tagging Modal */}
      {showTaggingModal && pendingUploadUrl && (
        <MediaTaggingModal
          isOpen={showTaggingModal}
          onClose={handleTaggingCancel}
          onConfirm={handleTaggingConfirm}
          mediaUrl={pendingUploadUrl}
          mediaType={pendingUploadFiles?.[0]?.type.startsWith('video') ? 'video' : 'image'}
          isDarkMode={isDarkMode}
          galleryUsers={galleryUsers}
        />
      )}

      {/* Instagram-Style Tagging Modal */}
      <InstagramTaggingModal
        isOpen={showTaggingModal}
        onClose={handleTaggingCancel}
        onConfirm={handleTaggingConfirm}
        mediaUrl={pendingUploadUrl}
        mediaType={pendingUploadFiles?.[0]?.type.startsWith('video') ? 'video' : 'image'}
        isDarkMode={isDarkMode}
        galleryUsers={galleryUsers}
      />
    </div>
  );
};
