import React, { useState } from 'react';
import { Plus, Camera, MessageSquare, Image, Video, Zap } from 'lucide-react';
import { VideoRecorder } from './VideoRecorder';
import { EventLoadingSpinner } from './EventLoadingSpinner';

interface UploadSectionProps {
  onUpload: (files: FileList) => Promise<void>;
  onVideoUpload: (videoBlob: Blob) => Promise<void>;
  onNoteSubmit: (note: string) => Promise<void>;
  onAddStory: () => void;
  isUploading: boolean;
  progress: number;
  isDarkMode: boolean;
  storiesEnabled?: boolean;
  themeTexts?: any;
  themeStyles?: any;
  galleryTheme?: 'hochzeit' | 'geburtstag' | 'urlaub' | 'eigenes';
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onUpload,
  onVideoUpload,
  onNoteSubmit,
  onAddStory,
  isUploading,
  progress,
  isDarkMode,
  storiesEnabled = true,
  themeTexts,
  themeStyles,
  galleryTheme = 'hochzeit'
}) => {
  // PERFORMANCE FIX: Early return optimierung für bessere Modal-Performance
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      setShowUploadOptions(false);
    }
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (noteText.trim()) {
      await onNoteSubmit(noteText.trim());
      setNoteText('');
      setShowNoteInput(false);
    }
  };

  const handleVideoRecorded = async (videoBlob: Blob) => {
    setShowVideoRecorder(false);
    await onVideoUpload(videoBlob);
  };

  // PERFORMANCE FIX: Memoized Modal Content für bessere Performance
  const modalContent = React.useMemo(() => {
    if (!showUploadOptions) return null;

    return (
      <div 
        className="fixed inset-0 flex items-center justify-center p-3 sm:p-4"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 2147483647
        }}
        onClick={() => setShowUploadOptions(false)}
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className={`relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-md w-full mx-2 sm:mx-4 transform transition-all duration-300 max-h-[90vh] overflow-y-auto ${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-600 shadow-2xl' 
              : 'bg-white border border-gray-200 shadow-2xl'
          }`}
          style={{ zIndex: 2147483647 }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className={`w-16 h-16 mx-auto mb-4 p-4 rounded-2xl ${
              isDarkMode ? `bg-${themeStyles?.primaryColor || 'pink-500'}/20` : `bg-${themeStyles?.primaryColor || 'pink-500'}/10`
            }`}>
              <Plus className={`w-full h-full ${
                isDarkMode ? `text-${themeStyles?.secondaryColor || 'pink-400'}` : `text-${themeStyles?.accentColor || 'pink-600'}`
              }`} />
            </div>
            <h3 className={`text-xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {themeTexts?.momentsText || 'Neuer Beitrag'}
            </h3>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {themeTexts?.uploadPrompt || 'Teilt eure schönsten Momente'}
            </p>
          </div>
          
          {/* Upload Options */}
          <div className="space-y-2 sm:space-y-3">
            <label className={`group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98] hover:scale-[1.02] touch-manipulation ${
              isDarkMode 
                ? 'bg-blue-600/10 hover:bg-blue-600/20 active:bg-blue-600/30 border border-blue-500/30' 
                : 'bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200'
            }`}
            style={{ minHeight: '60px' }}
            >
              <input
                type="file"
                multiple
                accept="image/*,video/*,.heic,.heif,.avif"
                onChange={(e) => {
                  if (e.target.files) {
                    setFiles(e.target.files);
                    setShowUploadOptions(false);
                  }
                }}
                className="hidden"
              />
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-blue-500/20' : 'bg-blue-500/10'
              }`}>
                <Image className={`w-6 h-6 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>
              <div className="flex-1 text-center">
                <h4 className={`font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {themeTexts?.uploadPhoto || 'Foto oder Video'}
                </h4>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Fotos & Videos aus der Galerie
                </p>
              </div>
              <Camera className={`w-5 h-5 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
            </label>

            <button
              onClick={() => {
                setShowVideoRecorder(true);
                setShowUploadOptions(false);
              }}
              className={`group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98] hover:scale-[1.02] w-full touch-manipulation ${
                isDarkMode 
                  ? 'bg-red-600/10 hover:bg-red-600/20 active:bg-red-600/30 border border-red-500/30' 
                  : 'bg-red-50 hover:bg-red-100 active:bg-red-200 border border-red-200'
              }`}
              style={{ minHeight: '60px' }}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-red-500/20' : 'bg-red-500/10'
              }`}>
                <Video className={`w-6 h-6 ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`} />
              </div>
              <div className="flex-1 text-center">
                <h4 className={`font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Video aufnehmen
                </h4>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Direkt mit der Kamera (max. 10s)
                </p>
              </div>
              <Zap className={`w-5 h-5 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
            </button>

            <button
              onClick={() => {
                setShowNoteInput(true);
                setShowUploadOptions(false);
              }}
              className={`group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98] hover:scale-[1.02] w-full touch-manipulation ${
                isDarkMode 
                  ? `bg-${themeStyles?.primaryColor || 'purple-500'}/10 hover:bg-${themeStyles?.primaryColor || 'purple-500'}/20 active:bg-${themeStyles?.primaryColor || 'purple-500'}/30 border border-${themeStyles?.primaryColor || 'purple-500'}/30` 
                  : `bg-${themeStyles?.primaryColor || 'purple-500'}/10 hover:bg-${themeStyles?.primaryColor || 'purple-500'}/20 active:bg-${themeStyles?.primaryColor || 'purple-500'}/30 border border-${themeStyles?.primaryColor || 'purple-500'}/30`
              }`}
              style={{ minHeight: '60px' }}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-purple-500/20' : 'bg-purple-500/10'
              }`}>
                <MessageSquare className={`w-6 h-6 ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`} />
              </div>
              <div className="flex-1 text-center">
                <h4 className={`font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Notiz hinterlassen
                </h4>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Schreibe deine Wünsche und Gedanken
                </p>
              </div>
              <span className="text-2xl">💕</span>
            </button>

            {storiesEnabled && (
              <button
                onClick={() => {
                  onAddStory();
                  setShowUploadOptions(false);
                }}
                className={`group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98] hover:scale-[1.02] w-full touch-manipulation ${
                  isDarkMode 
                    ? 'bg-pink-600/10 hover:bg-pink-600/20 active:bg-pink-600/30 border border-pink-500/30' 
                    : 'bg-pink-50 hover:bg-pink-100 active:bg-pink-200 border border-pink-200'
                }`}
                style={{ minHeight: '60px' }}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDarkMode ? 'bg-pink-500/20' : 'bg-pink-500/10'
                }`}>
                  <Zap className={`w-6 h-6 ${
                    isDarkMode ? 'text-pink-400' : 'text-pink-600'
                  }`} />
                </div>
                <div className="flex-1 text-center">
                  <h4 className={`font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Story hinzufügen
                  </h4>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Teile einen besonderen Moment (24h sichtbar)
                  </p>
                </div>
                <span className="text-2xl">✨</span>
              </button>
            )}
          </div>
          
          {/* Cancel Button */}
          <button
            onClick={() => setShowUploadOptions(false)}
            className={`w-full mt-6 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
              isDarkMode 
                ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300' 
                : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-700'
            }`}
          >
            Abbrechen
          </button>
        </div>
      </div>
    );
  }, [showUploadOptions, isDarkMode, themeTexts, themeStyles, storiesEnabled, onAddStory]);

  return (
    <>
      <div className={`mx-3 mb-3 p-3 rounded-xl transition-all duration-500 ${
        isDarkMode 
          ? `bg-gray-800/40 border border-gray-700/30 backdrop-blur-xl shadow-xl shadow-${themeStyles?.primaryColor || 'pink-500'}/10` 
          : `bg-white/60 border border-gray-200/40 backdrop-blur-xl shadow-xl shadow-${themeStyles?.primaryColor || 'pink-500'}/10`
      }`}>
        <div className="flex items-center gap-4">
          {/* Modern Upload Button */}
          <div className={`w-12 h-12 border-2 border-dashed rounded-xl flex items-center justify-center relative overflow-hidden transition-all duration-300 group hover:scale-105 ${
            isDarkMode 
              ? 'border-pink-500/50 bg-gray-700/30 hover:bg-pink-500/20 hover:border-pink-400' 
              : 'border-pink-400/50 bg-pink-500/10 hover:bg-pink-500/20 hover:border-pink-500'
          }`}>
            <button
              onClick={() => setShowUploadOptions(true)}
              className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer"
            >
              <Plus className={`w-5 h-5 transition-all duration-300 ${
                isDarkMode 
                  ? `text-${themeStyles?.secondaryColor || 'pink-400'} group-hover:text-${themeStyles?.primaryColor || 'pink-300'}` 
                  : `text-${themeStyles?.primaryColor || 'pink-500'} group-hover:text-${themeStyles?.accentColor || 'pink-600'}`
              }`} />
            </button>
          </div>

          {/* Modern Content Info */}
          <div className="flex-1">
            <h3 className={`font-semibold text-base tracking-tight mb-1 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Neuer Beitrag
            </h3>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {themeTexts?.shareInvitation || 'Teile deine schönsten Momente'}
            </p>
            {isUploading && (
              <div className="mt-3 flex items-center gap-3">
                <EventLoadingSpinner 
                  theme={galleryTheme} 
                  isDarkMode={isDarkMode} 
                  size="small"
                  text="Wird hochgeladen..."
                />
                {progress > 0 && (
                  <div className={`flex-1 h-2 rounded-full overflow-hidden transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200/50'
                  }`}>
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        galleryTheme === 'hochzeit' 
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500'
                          : galleryTheme === 'geburtstag'
                          ? 'bg-gradient-to-r from-purple-500 to-violet-500'
                          : galleryTheme === 'urlaub'
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                          : galleryTheme === 'eigenes'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : 'bg-gradient-to-r from-pink-500 to-purple-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Camera Icon */}
          <div className="flex items-center gap-2">
            <Camera className={`w-5 h-5 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
          </div>
        </div>
      </div>
      
      {/* PERFORMANCE FIX: Memoized Modal Content */}
      {modalContent}


      {/* Note Input Modal - Auch außerhalb */}
      {showNoteInput && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 2147483647
          }}
          onClick={() => {
            setShowNoteInput(false);
            setNoteText('');
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`relative rounded-3xl p-6 max-w-lg w-full mx-4 transform transition-all duration-300 ${
              isDarkMode 
                ? 'bg-gray-800 border border-gray-600 shadow-2xl' 
                : 'bg-white border border-gray-200 shadow-2xl'
            }`}
            style={{ zIndex: 2147483647 }}
          >
            <div className="text-center mb-6">
              <div className={`w-16 h-16 mx-auto mb-4 p-4 rounded-2xl ${
                isDarkMode ? 'bg-pink-500/20' : 'bg-pink-500/10'
              }`}>
                <MessageSquare className={`w-full h-full ${
                  isDarkMode ? 'text-pink-400' : 'text-pink-600'
                }`} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {themeTexts?.addNote || 'Notiz hinterlassen'}
              </h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {themeTexts?.shareInvitation || 'Teile deine Gedanken und Wünsche'}
              </p>
            </div>
            
            <form onSubmit={handleNoteSubmit} className="space-y-6">
              <div className="relative">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder={
                    themeTexts?.addNote === 'Geburtstagswunsch schreiben' 
                      ? "Hinterlasse einen schönen Geburtstagswunsch..."
                      : themeTexts?.addNote === 'Reise-Notiz schreiben'
                      ? "Teile deine Reise-Eindrücke und Erlebnisse..."
                      : themeTexts?.addNote === 'Nachricht schreiben'
                      ? "Hinterlasse eine schöne Nachricht..."
                      : "Hinterlasse eine schöne Nachricht für das Brautpaar..."
                  }
                  rows={5}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 outline-none resize-none transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  autoFocus
                  maxLength={500}
                />
                <div className={`absolute bottom-3 right-3 text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {noteText.length}/500
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNoteInput(false);
                    setNoteText('');
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                  }`}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={!noteText.trim()}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                    !noteText.trim()
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-[1.02]'
                  } ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/25' 
                      : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25'
                  }`}
                >
                  Senden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Recorder Modal */}
      {showVideoRecorder && (
        <VideoRecorder
          onVideoRecorded={handleVideoRecorded}
          onClose={() => setShowVideoRecorder(false)}
          isDarkMode={isDarkMode}
        />
      )}
    </>
  );
};
