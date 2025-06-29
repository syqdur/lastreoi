import React, { useState, useRef } from 'react';
import { X, Camera, Save, Loader2, Smartphone } from 'lucide-react';
import { CameraCapture } from './CameraCapture';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfileData: {
    profilePicture?: string;
    name: string;
    bio: string;
    countdownDate?: string;
    countdownEndMessage?: string;
    countdownMessageDismissed?: boolean;
  };
  onSave: (profileData: {
    profilePicture?: File | string;
    name: string;
    bio: string;
    countdownDate?: string;
    countdownEndMessage?: string;
    countdownMessageDismissed?: boolean;
  }) => Promise<void>;
  isDarkMode: boolean;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  currentProfileData,
  onSave,
  isDarkMode
}) => {
  const [name, setName] = useState(currentProfileData.name);
  const [bio, setBio] = useState(currentProfileData.bio);
  const [countdownDate, setCountdownDate] = useState(currentProfileData.countdownDate || '');
  const [countdownEndMessage, setCountdownEndMessage] = useState(currentProfileData.countdownEndMessage || '');
  const [resetMessageVisibility, setResetMessageVisibility] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(
    currentProfileData.profilePicture || null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type - support more formats including HEIC/HEIF
    const supportedFormats = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
      'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml',
      'image/heic', 'image/heif', 'image/avif'
    ];
    
    const fileTypeSupported = supportedFormats.includes(file.type.toLowerCase()) || 
                              file.name.toLowerCase().endsWith('.heic') || 
                              file.name.toLowerCase().endsWith('.heif');
    
    if (!fileTypeSupported) {
      alert(`Nicht unterstütztes Bildformat. Erlaubte Formate: JPG, PNG, GIF, WebP, BMP, TIFF, SVG, HEIC, HEIF, AVIF`);
      return;
    }

    // Validate file size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      alert(`Datei zu groß: ${fileSizeMB}MB. Maximale Größe: 4MB`);
      return;
    }

    try {
      console.log('📸 Processing gallery profile picture...');
      console.log('📊 Original file:', { name: file.name, size: file.size, type: file.type });
      
      // Always compress images to ensure they fit Firebase limits
      const compressedBase64 = await compressImage(file, 400, 0.7);
      
      console.log('✅ Gallery profile picture compressed successfully');
      console.log('📏 Compressed size:', Math.round(compressedBase64.length / 1024), 'KB');
      
      // Final check - if still too large, compress more aggressively
      if (compressedBase64.length > 900000) { // 900KB final check
        console.log('🔄 Still too large, compressing more aggressively...');
        const finalCompressed = await compressImage(file, 300, 0.5);
        console.log('📏 Final compressed size:', Math.round(finalCompressed.length / 1024), 'KB');
        
        // Create a file from compressed base64 for compatibility
        const response = await fetch(finalCompressed);
        const blob = await response.blob();
        const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
        setProfilePicture(compressedFile);
        setProfilePicturePreview(finalCompressed);
      } else {
        // Create a file from compressed base64 for compatibility
        const response = await fetch(compressedBase64);
        const blob = await response.blob();
        const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
        setProfilePicture(compressedFile);
        setProfilePicturePreview(compressedBase64);
      }
    } catch (error) {
      console.error('Error processing gallery profile picture:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Fehler beim Verarbeiten des Profilbildes: ${errorMessage}. Bitte versuchen Sie es mit einem anderen Bild.`);
    }
  };

  const handleCameraCapture = async (blob: Blob) => {
    try {
      // Convert blob to file
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
      
      console.log('📸 Processing camera capture for gallery profile...');
      console.log('📊 Original selfie:', { size: file.size, type: file.type });
      
      // Always compress camera captures to ensure they fit Firebase limits
      const compressedBase64 = await compressImage(file, 400, 0.7);
      
      console.log('✅ Camera selfie compressed successfully');
      console.log('📏 Compressed size:', Math.round(compressedBase64.length / 1024), 'KB');
      
      // Final check - if still too large, compress more aggressively
      if (compressedBase64.length > 900000) { // 900KB final check
        console.log('🔄 Still too large, compressing more aggressively...');
        const finalCompressed = await compressImage(file, 300, 0.5);
        console.log('📏 Final compressed size:', Math.round(finalCompressed.length / 1024), 'KB');
        
        // Create a file from compressed base64 for compatibility
        const response = await fetch(finalCompressed);
        const newBlob = await response.blob();
        const compressedFile = new File([newBlob], 'selfie.jpg', { type: 'image/jpeg' });
        setProfilePicture(compressedFile);
        setProfilePicturePreview(finalCompressed);
      } else {
        // Create a file from compressed base64 for compatibility
        const response = await fetch(compressedBase64);
        const newBlob = await response.blob();
        const compressedFile = new File([newBlob], 'selfie.jpg', { type: 'image/jpeg' });
        setProfilePicture(compressedFile);
        setProfilePicturePreview(compressedBase64);
      }
      
      setShowCamera(false);
    } catch (error) {
      console.error('Error processing camera capture:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Fehler beim Verarbeiten des Kamera-Fotos: ${errorMessage}. Bitte versuchen Sie es erneut.`);
      setShowCamera(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        profilePicture: profilePicture || currentProfileData.profilePicture,
        name: name.trim(),
        bio: bio.trim(),
        countdownDate: countdownDate || undefined,
        countdownEndMessage: countdownEndMessage.trim() || undefined,
        countdownMessageDismissed: resetMessageVisibility ? false : currentProfileData.countdownMessageDismissed
      });
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Fehler beim Speichern des Profils. Bitte versuche es erneut.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      // Reset form data
      setName(currentProfileData.name);
      setBio(currentProfileData.bio);
      setCountdownDate(currentProfileData.countdownDate || '');
      setCountdownEndMessage(currentProfileData.countdownEndMessage || '');
      setResetMessageVisibility(false);
      setProfilePicture(null);
      setProfilePicturePreview(currentProfileData.profilePicture || null);
      setShowCamera(false);
      onClose();
    }
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
            Profil bearbeiten
          </h3>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className={`p-2 sm:p-3 rounded-full backdrop-blur-sm transition-all duration-300 touch-manipulation ${
              isSaving 
                ? 'cursor-not-allowed opacity-50'
                : isDarkMode 
                  ? 'hover:bg-white/10 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100/80 text-gray-600 hover:text-gray-900'
            }`}
            style={{ minWidth: '48px', minHeight: '48px' }}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Profile Picture Section */}
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Profilbild
          </label>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {profilePicturePreview ? (
                  <img 
                    src={profilePicturePreview} 
                    alt="Profile preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-2xl font-bold ${
                    isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {name.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowCamera(true)}
                disabled={isSaving}
                className={`absolute -bottom-1 -right-1 p-1.5 rounded-full shadow-lg transition-colors duration-300 ${
                  isSaving
                    ? 'cursor-not-allowed opacity-50'
                    : 'bg-pink-600 hover:bg-pink-700 text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/tiff,image/svg+xml,image/heic,image/heif,image/avif"
                onChange={handleProfilePictureChange}
                className="hidden"
                disabled={isSaving}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-300 ${
                    isSaving
                      ? 'cursor-not-allowed opacity-50'
                      : isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  <Camera className="w-4 h-4 inline mr-2" />
                  Galerie
                </button>
                <button
                  onClick={() => setShowCamera(true)}
                  disabled={isSaving}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-300 ${
                    isSaving
                      ? 'cursor-not-allowed opacity-50'
                      : 'bg-pink-600 hover:bg-pink-700 text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4 inline mr-2" />
                  Selfie
                </button>
              </div>
              <p className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Wähle ein Bild aus der Galerie oder nimm ein Selfie auf
              </p>
            </div>
          </div>
        </div>

        {/* Name Section */}
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSaving}
            placeholder="Dein Name..."
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors duration-300 ${
              isSaving
                ? 'cursor-not-allowed opacity-50'
                : isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            maxLength={50}
          />
          <p className={`text-xs mt-1 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {name.length}/50 Zeichen
          </p>
        </div>

        {/* Bio Section */}
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={isSaving}
            placeholder="Erzähle etwas über euch..."
            rows={4}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none transition-colors duration-300 ${
              isSaving
                ? 'cursor-not-allowed opacity-50'
                : isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            maxLength={200}
          />
          <p className={`text-xs mt-1 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {bio.length}/200 Zeichen
          </p>
        </div>

        {/* Countdown Date Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className={`text-sm font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Countdown Datum (optional)
            </label>
            {countdownDate && (
              <button
                type="button"
                onClick={() => setCountdownDate('')}
                disabled={isSaving}
                className={`px-3 py-1 text-xs rounded-lg transition-colors duration-300 ${
                  isSaving
                    ? 'cursor-not-allowed opacity-50'
                    : isDarkMode
                      ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30'
                      : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                }`}
              >
                Countdown deaktivieren
              </button>
            )}
          </div>
          <input
            type="datetime-local"
            value={countdownDate}
            onChange={(e) => setCountdownDate(e.target.value)}
            disabled={isSaving}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors duration-300 ${
              isSaving
                ? 'cursor-not-allowed opacity-50'
                : isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
          <p className={`text-xs mt-1 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {countdownDate ? 'Countdown ist aktiviert' : 'Setzt ein Datum für den Countdown im Profil'}
          </p>
        </div>

        {/* Countdown End Message Section */}
        {countdownDate && (
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Nachricht nach Countdown Ende (optional)
            </label>
            <textarea
              value={countdownEndMessage}
              onChange={(e) => setCountdownEndMessage(e.target.value)}
              disabled={isSaving}
              placeholder="Diese Nachricht wird angezeigt wenn der Countdown beendet ist..."
              rows={3}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none transition-colors duration-300 ${
                isSaving
                  ? 'cursor-not-allowed opacity-50'
                  : isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              maxLength={150}
            />
            <p className={`text-xs mt-1 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {countdownEndMessage.length}/150 Zeichen
            </p>
            
            {/* Reset Message Visibility Option */}
            {currentProfileData.countdownMessageDismissed && (
              <div className="mt-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={resetMessageVisibility}
                    onChange={(e) => setResetMessageVisibility(e.target.checked)}
                    disabled={isSaving}
                    className="rounded focus:ring-pink-500"
                  />
                  <span className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Nachricht wieder anzeigen (falls geschlossen)
                  </span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className={`flex-1 py-3 px-4 rounded-xl transition-colors duration-300 ${
              isSaving
                ? 'cursor-not-allowed opacity-50'
                : isDarkMode 
                  ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
            }`}
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className={`flex-1 py-3 px-4 rounded-xl transition-colors duration-300 flex items-center justify-center gap-2 ${
              isSaving || !name.trim()
                ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                : 'bg-pink-600 hover:bg-pink-700 text-white'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
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

      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};