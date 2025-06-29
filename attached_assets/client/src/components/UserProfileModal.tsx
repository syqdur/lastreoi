import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, User, Save, Upload } from 'lucide-react';
import { UserProfile } from '../services/firebaseService';
import { 
  getGalleryUserProfile, 
  createOrUpdateGalleryUserProfile
} from '../services/galleryFirebaseService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  deviceId: string;
  isDarkMode: boolean;
  onProfileUpdated?: (profile: UserProfile) => void;
  isAdmin?: boolean;
  currentUserName?: string;
  currentDeviceId?: string;
  galleryId: string;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userName,
  deviceId,
  isDarkMode,
  onProfileUpdated,
  isAdmin = false,
  currentUserName,
  currentDeviceId,
  galleryId
}) => {
  // Check if current user is trying to edit their own profile
  const isOwnProfile = userName === currentUserName && deviceId === currentDeviceId;
  
  // Only allow editing if it's the user's own profile (not admin editing others)
  const canEdit = isOwnProfile;
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && userName && deviceId && galleryId) {
      loadUserProfile();
    }
  }, [isOpen, userName, deviceId, galleryId]);

  const loadUserProfile = async () => {
    try {
      const profile = await getGalleryUserProfile(userName, deviceId, galleryId);
      if (profile) {
        setUserProfile(profile);
        setDisplayName(profile.displayName || profile.userName);
        setProfilePicture(profile.profilePicture || null);
      } else {
        setDisplayName(userName);
        setProfilePicture(null);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const compressImage = (file: File, maxWidth: number = 300, quality: number = 0.6): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        const { width, height } = img;
        const ratio = Math.min(maxWidth / width, maxWidth / height);
        const newWidth = width * ratio;
        const newHeight = height * ratio;
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Draw and compress the image
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);
        
        // Progressive compression to stay under Firebase 1MB limit
        let currentQuality = quality;
        let attempts = 0;
        const maxAttempts = 8;
        
        const tryCompress = () => {
          const compressedBase64 = canvas.toDataURL('image/jpeg', currentQuality);
          const sizeKB = Math.round(compressedBase64.length / 1024);
          
          console.log(`🗜️ Compression attempt ${attempts + 1}: ${sizeKB}KB (quality: ${currentQuality.toFixed(2)})`);
          
          // Firebase limit is ~1MB (1048576 bytes), but base64 adds ~33% overhead
          // Target 700KB to be safe with base64 encoding
          if (compressedBase64.length <= 700000 || attempts >= maxAttempts) {
            console.log(`✅ Final compression: ${sizeKB}KB`);
            resolve(compressedBase64);
            return;
          }
          
          // Reduce quality and dimensions more aggressively
          attempts++;
          currentQuality *= 0.7;
          
          // Also reduce canvas size if still too large
          if (attempts > 3) {
            const reductionFactor = 0.8;
            canvas.width *= reductionFactor;
            canvas.height *= reductionFactor;
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
          
          tryCompress();
        };
        
        tryCompress();
      };
      
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) {
      alert('Sie können nur Ihr eigenes Profil bearbeiten.');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type - support more formats
    const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml'];
    if (!supportedFormats.includes(file.type.toLowerCase())) {
      alert(`Nicht unterstütztes Bildformat. Erlaubte Formate: JPG, PNG, GIF, WebP, BMP, TIFF, SVG`);
      return;
    }

    // Validate file size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      alert(`Datei zu groß: ${fileSizeMB}MB. Maximale Größe: 4MB`);
      return;
    }

    setIsUploading(true);
    try {
      console.log('📸 Processing profile picture...');
      console.log('📊 Original file:', { name: file.name, size: file.size, type: file.type });
      
      // Always compress images to ensure they fit Firebase limits
      const compressedBase64 = await compressImage(file, 400, 0.7);
      
      console.log('✅ Profile picture compressed successfully');
      console.log('📏 Compressed size:', Math.round(compressedBase64.length / 1024), 'KB');
      
      // Final check - if still too large, compress more aggressively
      if (compressedBase64.length > 700000) { // 700KB final check (more conservative)
        console.log('🔄 Still too large, compressing more aggressively...');
        const finalCompressed = await compressImage(file, 200, 0.3); // Even smaller and lower quality
        console.log('📏 Final compressed size:', Math.round(finalCompressed.length / 1024), 'KB');
        
        // Ultimate check - if STILL too large, use ultra compression
        if (finalCompressed.length > 700000) {
          console.log('🔄 Ultra compression needed...');
          const ultraCompressed = await compressImage(file, 150, 0.2);
          console.log('📏 Ultra compressed size:', Math.round(ultraCompressed.length / 1024), 'KB');
          setProfilePicture(ultraCompressed);
        } else {
          setProfilePicture(finalCompressed);
        }
      } else {
        setProfilePicture(compressedBase64);
      }
    } catch (error) {
      console.error('Error processing profile picture:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Fehler beim Verarbeiten des Profilbildes: ${errorMessage}. Bitte versuchen Sie es mit einem anderen Bild.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!canEdit) {
      alert('Sie können nur Ihr eigenes Profil bearbeiten.');
      return;
    }

    if (!displayName.trim()) {
      alert('Bitte geben Sie einen Anzeigenamen ein.');
      return;
    }

    setIsSaving(true);
    try {
      console.log('🔄 Starting profile save process...');
      console.log('📝 Display name:', displayName.trim());
      console.log('🖼️ Profile picture size:', profilePicture ? `${profilePicture.length} characters` : 'none');
      console.log('👤 User:', userName, 'Device:', deviceId);
      console.log('🎪 Gallery:', galleryId);

      // Validate profile picture size (Firebase field limit ~1MB)
      if (profilePicture && profilePicture.length > 900000) { // 900KB limit for Firebase
        throw new Error('Profilbild ist zu groß für Firebase. Bitte wählen Sie ein kleineres Bild oder reduzieren Sie die Qualität.');
      }

      const updatedProfile = await createOrUpdateGalleryUserProfile(userName, deviceId, {
        displayName: displayName.trim(),
        profilePicture: profilePicture || undefined
      }, galleryId);
      
      console.log('✅ Profile saved successfully:', updatedProfile);
      setUserProfile(updatedProfile);
      onProfileUpdated?.(updatedProfile);
      onClose();
    } catch (error: any) {
      console.error('❌ Error saving profile:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Fehler beim Speichern des Profils.';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Keine Berechtigung zum Speichern. Bitte versuchen Sie es erneut.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Verbindung unterbrochen. Bitte prüfen Sie Ihre Internetverbindung.';
      } else if (error.message && error.message.includes('Profilbild')) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = `Fehler: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const getAvatarInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto backdrop-blur-xl border transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gray-900/95 border-gray-700/30 shadow-2xl shadow-purple-500/10' 
          : 'bg-white/95 border-gray-200/30 shadow-2xl shadow-pink-500/10'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className={`text-lg sm:text-xl font-semibold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Mein Profil
          </h3>
          <button
            onClick={onClose}
            className={`p-2 sm:p-3 rounded-full backdrop-blur-sm transition-all duration-300 touch-manipulation ${
              isDarkMode 
                ? 'hover:bg-white/10 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100/80 text-gray-600 hover:text-gray-900'
            }`}
            style={{ minWidth: '48px', minHeight: '48px' }}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Profile Picture Section */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <div className={`w-24 h-24 rounded-full overflow-hidden border-4 transition-colors duration-300 ${
              isDarkMode ? 'border-gray-600' : 'border-gray-200'
            }`}>
              {profilePicture ? (
                <img 
                  src={profilePicture} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center text-2xl font-bold transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white' 
                    : 'bg-gradient-to-br from-pink-500 to-purple-500 text-white'
                }`}>
                  {getAvatarInitials(displayName || userName)}
                </div>
              )}
            </div>
            
            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !canEdit}
              className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                  : 'bg-pink-500 hover:bg-pink-600 text-white'
              } ${(isUploading || !canEdit) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/tiff,image/svg+xml,image/heic,image/heif,image/avif"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          
          <p className={`text-sm mt-2 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Klicken Sie auf die Kamera, um ein Profilbild hochzuladen
          </p>
        </div>

        {/* Display Name Section */}
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Anzeigename
          </label>
          <div className="relative">
            <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Wie möchten Sie genannt werden?"
              disabled={!canEdit}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-colors duration-300 ${
                !canEdit ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-pink-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-pink-500'
              } focus:outline-none focus:ring-2 focus:ring-pink-500/20`}
            />
          </div>
          <p className={`text-xs mt-1 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-600'
          }`}>
            {canEdit ? 'Dieser Name wird bei Ihren Beiträgen und Kommentaren angezeigt' : 'Sie können nur Ihr eigenes Profil bearbeiten.'}
          </p>
        </div>

        {/* User Info */}
        <div className={`mb-6 p-3 rounded-xl transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
        }`}>
          <p className={`text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <strong>Benutzername:</strong> {userName}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 py-3 px-4 rounded-xl transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Abbrechen
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving || !displayName.trim() || !canEdit}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors duration-300 ${
              (isSaving || !displayName.trim() || !canEdit)
                ? isDarkMode 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isDarkMode 
                  ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                  : 'bg-pink-500 hover:bg-pink-600 text-white'
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Speichern...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Speichern
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};