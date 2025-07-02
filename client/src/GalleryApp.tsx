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
import InstagramTagging from './components/tagging/InstagramTagging';
import { useUser } from './hooks/useUser';
import { MediaItem, Comment, Like } from './types';
import { Gallery, galleryService } from './services/galleryService';
import { getThemeConfig, getThemeTexts, getThemeStyles } from './config/themes';
import { storage, db } from './config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
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
import { Story } from './services/liveService';

// Modified firebase service functions to work with gallery collections
import {
  loadGalleryMedia,
  uploadGalleryFiles,
  uploadGalleryVideoBlob,
  addGalleryNote,
  editGalleryNote,
  editTextTag,
  updateMediaTags,
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
  console.log('🎨 GalleryApp initialized for:', gallery.eventName, 'Theme:', gallery.theme);
  
  // Get theme configuration
  const themeConfig = getThemeConfig(gallery.theme);
  const themeTexts = getThemeTexts(gallery.theme);
  const themeStyles = getThemeStyles(gallery.theme);

  // Get user information from localStorage
  const userName = getUserName();
  const deviceId = getDeviceId();

  // Initialize gallery state
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // UI states
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminCredentialsSetup, setShowAdminCredentialsSetup] = useState(false);
  const [showStoriesViewer, setShowStoriesViewer] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showStoryUpload, setShowStoryUpload] = useState(false);
  const [activeTab, setActiveTab] = useState<'gallery' | 'music' | 'timeline'>('gallery');
  const [viewMode, setViewMode] = useState<'feed' | 'grid'>('feed');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showAdminTutorial, setShowAdminTutorial] = useState(false);
  const [showTaggingModal, setShowTaggingModal] = useState(false);
  const [pendingUploadFiles, setPendingUploadFiles] = useState<FileList | null>(null);
  const [pendingUploadUrl, setPendingUploadUrl] = useState<string>('');

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
          setGalleryProfileData(firebaseData);
        } else {
          console.log('📝 No Firebase profile found, keeping default gallery profile');
        }
      } catch (error) {
        console.error('❌ Error loading gallery profile:', error);
      }
    };

    // Load Firebase profile after setting default
    loadGalleryProfile();

    // Setup real-time listener for gallery profile changes
    const profileDocRef = doc(db, 'galleries', gallery.id, 'profile', 'main');
    console.log('🎯 Setting up real-time listener for gallery profile:', profileDocRef.path);
    
    const unsubscribe = onSnapshot(profileDocRef, (docSnapshot) => {
      console.log('📡 Profile snapshot received for gallery:', gallery.id);
      
      if (docSnapshot.exists()) {
        const firebaseData = docSnapshot.data();
        console.log('✅ Real-time profile update:', {
          name: firebaseData.name,
          bio: firebaseData.bio,
          hasProfilePicture: !!firebaseData.profilePicture,
          updatedAt: firebaseData.updatedAt
        });
        
        console.log('🔄 Applying real-time profile update');
        setGalleryProfileData({ ...firebaseData });
      } else {
        console.log('📝 Profile document does not exist - using defaults');
      }
    }, (error) => {
      console.error('❌ Profile listener error:', error);
    });

    return () => {
      console.log('🧹 Cleaning up profile listener');
      unsubscribe();
    };
  }, [gallery.id, gallery.eventName, gallery.eventDate]);

  // Load media items
  useEffect(() => {
    const loadMedia = async () => {
      try {
        const media = await loadGalleryMedia(gallery.id);
        setMediaItems(media);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading media:', error);
        setIsLoading(false);
      }
    };

    loadMedia();
  }, [gallery.id]);

  // Handle file upload
  const handleUpload = async (files: FileList) => {
    if (!userName || !deviceId) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedItems = await uploadGalleryFiles(
        files,
        userName,
        deviceId,
        gallery.id,
        (progress) => setUploadProgress(progress)
      );

      // Add new items to the beginning of the array
      setMediaItems(prev => [...uploadedItems, ...prev]);
      
      setStatus('Upload erfolgreich!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setStatus('Upload fehlgeschlagen');
      setTimeout(() => setStatus(''), 3000);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Gallery Header */}
      <ProfileHeader
        isDarkMode={isDarkMode}
        isAdmin={isAdmin}
        userName={userName}
        mediaItems={mediaItems}
        onToggleAdmin={setIsAdmin}
        currentUserProfile={currentUserProfile}
        onOpenUserProfile={() => setShowUserProfileModal(true)}
        showTopBarControls={true}
        galleryProfileData={galleryProfileData}
        onEditGalleryProfile={() => setShowProfileEditModal(true)}
        gallery={gallery}
      />

      {/* Stories Bar */}
      <StoriesBar
        stories={stories}
        currentUser={userName || ''}
        deviceId={deviceId || ''}
        onAddStory={() => setShowStoryUpload(true)}
        onViewStory={(storyIndex: number) => {
          setCurrentStoryIndex(storyIndex);
          setShowStoriesViewer(true);
        }}
        isDarkMode={isDarkMode}
        storiesEnabled={true}
      />

      {/* Tab Navigation */}
      <TabNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDarkMode={isDarkMode}
        galleryEnabled={true}
        musicWishlistEnabled={true}
        themeTexts={themeTexts}
        themeIcon={themeConfig.icon}
        themeStyles={themeStyles}
        galleryEventName={gallery.eventName}
      />

      {/* Main Content */}
      {activeTab === 'gallery' && (
        <>
          <UploadSection
            onUpload={handleUpload}
            isUploading={isUploading}
            progress={uploadProgress}
            isDarkMode={isDarkMode}
            themeStyles={themeStyles}
            themeTexts={themeTexts}
          />

          <InstagramGallery
            items={mediaItems}
            onItemClick={(index) => {
              setCurrentImageIndex(index);
              setModalOpen(true);
            }}
            viewMode={viewMode}
            setViewMode={setViewMode}
            isDarkMode={isDarkMode}
            likes={likes}
            comments={comments}
            userName={userName || ''}
            galleryId={gallery.id}
          />
        </>
      )}

      {activeTab === 'timeline' && (
        <Timeline 
          isDarkMode={isDarkMode}
          userName={userName || ''}
          isAdmin={isAdmin}
          galleryId={gallery.id}
          galleryTheme={gallery.theme}
        />
      )}

      {activeTab === 'music' && (
        <MusicWishlist 
          isDarkMode={isDarkMode} 
          isAdmin={isAdmin}
          galleryId={gallery.id}
        />
      )}

      {/* Modal for media viewing */}
      <MediaModal
        isOpen={modalOpen}
        items={mediaItems}
        currentIndex={currentImageIndex}
        onClose={() => setModalOpen(false)}
        onNext={() => setCurrentImageIndex((prev) => (prev + 1) % mediaItems.length)}
        onPrev={() => setCurrentImageIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length)}
        comments={comments}
        likes={likes}
        onAddComment={async () => {}}
        onDeleteComment={async () => {}}
        onToggleLike={async () => {}}
        userName={userName || ''}
        isAdmin={isAdmin}
        isDarkMode={isDarkMode}
        getUserAvatar={() => null}
        getUserDisplayName={(userName) => userName}
        deviceId={deviceId || ''}
        galleryId={gallery.id}
        onUpdateTextTags={async () => {}}
      />

      {/* Profile Edit Modal for Admin */}
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
              console.log('💾 Saving gallery profile data...');
              
              let profilePictureUrl = galleryProfileData?.profilePicture;

              // Handle profile picture update
              if (profileData.profilePicture instanceof File) {
                console.log('📸 Processing gallery profile picture...');

                // Convert to base64 to ensure Firebase limits
                const reader = new FileReader();
                profilePictureUrl = await new Promise((resolve, reject) => {
                  reader.onload = () => {
                    const result = reader.result as string;
                    if (result.length > 900000) {
                      console.warn('⚠️ Profile picture too large:', Math.round(result.length / 1024), 'KB');
                      reject(new Error('Profilbild ist zu groß. Bitte wählen Sie ein kleineres Bild.'));
                    } else {
                      console.log('✅ Profile picture compressed to:', Math.round(result.length / 1024), 'KB');
                      resolve(result);
                    }
                  };
                  reader.onerror = reject;
                  reader.readAsDataURL(profileData.profilePicture as File);
                });
              }

              // Create updated profile object
              const updatedGalleryProfile = {
                name: profileData.name,
                bio: profileData.bio,
                profilePicture: profilePictureUrl,
                countdownDate: profileData.countdownDate || null,
                countdownEndMessage: profileData.countdownEndMessage,
                countdownMessageDismissed: profileData.countdownMessageDismissed,
                createdAt: galleryProfileData?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };

              console.log('📝 Profile data to save:', updatedGalleryProfile);

              // Save to gallery profile collection
              const profileDocRef = doc(db, 'galleries', gallery.id, 'profile', 'main');
              await setDoc(profileDocRef, updatedGalleryProfile, { merge: true });

              // Update local state immediately
              setGalleryProfileData(updatedGalleryProfile);
              setShowProfileEditModal(false);
              
              console.log('✅ Gallery profile saved successfully');
            } catch (error: any) {
              console.error('❌ Error updating gallery profile:', error);
              alert(`Fehler beim Aktualisieren des Galerie-Profils: ${error.message}`);
            }
          }}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Instagram Tagging System */}
      <InstagramTagging
        isOpen={showTaggingModal}
        onClose={() => {
          setShowTaggingModal(false);
          setPendingUploadFiles(null);
          setPendingUploadUrl('');
        }}
        mediaUrl={pendingUploadUrl}
        mediaType={pendingUploadFiles?.[0]?.type.startsWith('video') ? 'video' : 'image'}
        isDarkMode={isDarkMode}
        galleryUsers={galleryUsers}
        onSaveTags={async (tags) => {
          console.log('📝 Saving tags:', tags);
          setShowTaggingModal(false);
          setPendingUploadFiles(null);
          setPendingUploadUrl('');
        }}
      />
    </div>
  );
};