import React, { useState } from 'react';
import { Lock, Unlock, Settings, Download, Globe, Users, ExternalLink, Image, Video, MessageSquare, Gift, Heart, Star, Eye, Code, Music, Sparkles, Camera, Share2, X as XIcon, Menu } from 'lucide-react';
import { MediaItem } from '../types';
import { Gallery } from '../services/galleryService';
import { downloadAllMedia } from '../services/downloadService';
import { SiteStatus, updateSiteStatus, updateFeatureToggles } from '../services/siteStatusService';
import { ShowcaseModal } from './ShowcaseModal';
import { UserManagementModal } from './UserManagementModal';
import { SpotifyAdmin } from './SpotifyAdmin';

interface AdminPanelBurgerProps {
  isDarkMode: boolean;
  isAdmin: boolean;
  onToggleAdmin: (isAdmin: boolean) => void;
  mediaItems?: MediaItem[];
  siteStatus?: SiteStatus;
  getUserAvatar?: (userName: string, deviceId?: string) => string | null;
  getUserDisplayName?: (userName: string, deviceId?: string) => string;
  gallery: Gallery;
}

export const AdminPanelBurger: React.FC<AdminPanelBurgerProps> = ({ 
  isDarkMode, 
  isAdmin, 
  onToggleAdmin,
  mediaItems = [],
  siteStatus,
  getUserAvatar,
  getUserDisplayName,
  gallery
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadWarning, setShowDownloadWarning] = useState(false);
  const [isUpdatingSiteStatus, setIsUpdatingSiteStatus] = useState(false);
  const [isUpdatingFeatures, setIsUpdatingFeatures] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showSpotifyAdmin, setShowSpotifyAdmin] = useState(false);
  const [showBurgerMenu, setShowBurgerMenu] = useState(false);

  const handleWhatsAppShare = () => {
    const galleryUrl = `https://telya.netlify.app/${gallery.slug}`;
    const message = `🎉 Schau dir unsere ${gallery.eventName} Galerie an!\n\nHier kannst du alle Fotos und Videos anschauen und deine eigenen Momente teilen: ${galleryUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleToggleGallery = async () => {
    if (!siteStatus) return;
    
    setIsUpdatingFeatures(true);
    try {
      await updateFeatureToggles(
        !siteStatus.galleryEnabled,
        siteStatus.musicWishlistEnabled,
        siteStatus.storiesEnabled,
        'Admin'
      );
    } catch (error) {
      alert('Fehler beim Aktualisieren der Galerie-Einstellung');
    } finally {
      setIsUpdatingFeatures(false);
    }
  };

  const handleToggleMusicWishlist = async () => {
    if (!siteStatus) return;
    
    setIsUpdatingFeatures(true);
    try {
      await updateFeatureToggles(
        siteStatus.galleryEnabled,
        !siteStatus.musicWishlistEnabled,
        siteStatus.storiesEnabled,
        'Admin'
      );
    } catch (error) {
      alert('Fehler beim Aktualisieren der Musikwünsche-Einstellung');
    } finally {
      setIsUpdatingFeatures(false);
    }
  };

  const handleToggleStories = async () => {
    if (!siteStatus) return;
    
    setIsUpdatingFeatures(true);
    try {
      await updateFeatureToggles(
        siteStatus.galleryEnabled,
        siteStatus.musicWishlistEnabled,
        !siteStatus.storiesEnabled,
        'Admin',
        gallery.id
      );
    } catch (error) {
      alert('Fehler beim Aktualisieren der Stories-Einstellung');
    } finally {
      setIsUpdatingFeatures(false);
    }
  };

  const handleDownloadAll = async () => {
    const downloadableItems = mediaItems.filter(item => item.type !== 'note');
    
    if (downloadableItems.length === 0) {
      alert('Keine Medien zum Herunterladen vorhanden.');
      return;
    }

    setShowDownloadWarning(true);
  };

  const confirmDownload = async () => {
    setShowDownloadWarning(false);
    setIsDownloading(true);
    
    try {
      await downloadAllMedia(mediaItems);
      
      const downloadableItems = mediaItems.filter(item => item.type !== 'note');
      alert(`✅ Download erfolgreich!\n\n📊 Heruntergeladen:\n- ${mediaItems.filter(item => item.type === 'image').length} Bilder\n- ${mediaItems.filter(item => item.type === 'video').length} Videos\n- ${mediaItems.filter(item => item.type === 'note').length} Notizen\n\n💡 Verwende die Bilder für professionelle Fotobuch-Services!`);
    } catch (error) {
      console.error('Download error:', error);
      
      if (error && error.toString().includes('teilweise erfolgreich')) {
        alert(`⚠️ ${error}\n\n💡 Die ZIP-Datei enthält alle verfügbaren Dateien und Fehlerberichte.`);
      } else {
        alert(`❌ Download-Fehler:\n${error}\n\n🔧 Versuche es erneut oder verwende einen anderen Browser.`);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      {/* Burger Menu Button */}
      {isAdmin && (
        <>
          <button
            onClick={() => setShowBurgerMenu(!showBurgerMenu)}
            className={`fixed bottom-4 left-4 p-3 rounded-xl backdrop-blur-xl transition-all duration-300 hover:scale-105 border z-50 ${
              isDarkMode
                ? 'bg-gray-800/80 border-gray-700/50 hover:bg-gray-800/90 shadow-2xl'
                : 'bg-white/80 border-gray-200/60 hover:bg-white/90 shadow-2xl'
            }`}
            title="Admin Menu"
          >
            <Menu className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
          </button>

          {/* Burger Menu Overlay */}
          {showBurgerMenu && (
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowBurgerMenu(false)}
            >
              <div 
                className={`fixed bottom-20 left-4 p-4 rounded-2xl backdrop-blur-xl border max-w-sm w-80 z-50 ${
                  isDarkMode
                    ? 'bg-gray-800/90 border-gray-700/50 shadow-2xl'
                    : 'bg-white/90 border-gray-200/60 shadow-2xl'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="grid grid-cols-2 gap-3">
                  {/* USER MANAGEMENT BUTTON */}
                  <button
                    onClick={() => {
                      setShowUserManagement(true);
                      setShowBurgerMenu(false);
                    }}
                    className={`p-3 rounded-lg transition-all duration-200 hover:scale-105 border ${
                      isDarkMode
                        ? 'bg-gray-700/50 border-gray-600/50 hover:bg-gray-700/70'
                        : 'bg-white/50 border-gray-200/50 hover:bg-white/70'
                    }`}
                  >
                    <Users className={`w-5 h-5 mx-auto mb-1 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                    <div className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      User Management
                    </div>
                  </button>

                  {/* SPOTIFY ADMIN BUTTON */}
                  <button
                    onClick={() => {
                      setShowSpotifyAdmin(true);
                      setShowBurgerMenu(false);
                    }}
                    className={`p-3 rounded-lg transition-all duration-200 hover:scale-105 border ${
                      isDarkMode
                        ? 'bg-gray-700/50 border-gray-600/50 hover:bg-gray-700/70'
                        : 'bg-white/50 border-gray-200/50 hover:bg-white/70'
                    }`}
                  >
                    <Music className={`w-5 h-5 mx-auto mb-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                    <div className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Spotify Admin
                    </div>
                  </button>

                  {/* WHATSAPP SHARE BUTTON */}
                  <button
                    onClick={() => {
                      handleWhatsAppShare();
                      setShowBurgerMenu(false);
                    }}
                    className={`p-3 rounded-lg transition-all duration-200 hover:scale-105 border ${
                      isDarkMode
                        ? 'bg-gray-700/50 border-gray-600/50 hover:bg-gray-700/70'
                        : 'bg-white/50 border-gray-200/50 hover:bg-white/70'
                    }`}
                  >
                    <Share2 className={`w-5 h-5 mx-auto mb-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                    <div className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      WhatsApp Share
                    </div>
                  </button>

                  {/* GALLERY TOGGLE */}
                  <button
                    onClick={() => {
                      handleToggleGallery();
                      setShowBurgerMenu(false);
                    }}
                    disabled={isUpdatingFeatures || !siteStatus}
                    className={`p-3 rounded-lg transition-all duration-200 hover:scale-105 border ${
                      isUpdatingFeatures || !siteStatus
                        ? 'opacity-50 cursor-not-allowed'
                        : isDarkMode
                          ? 'bg-gray-700/50 border-gray-600/50 hover:bg-gray-700/70'
                          : 'bg-white/50 border-gray-200/50 hover:bg-white/70'
                    }`}
                  >
                    <Image className={`w-5 h-5 mx-auto mb-1 ${
                      siteStatus?.galleryEnabled ?? true
                        ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <div className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Gallery
                    </div>
                  </button>

                  {/* MUSIC WISHLIST TOGGLE */}
                  <button
                    onClick={() => {
                      handleToggleMusicWishlist();
                      setShowBurgerMenu(false);
                    }}
                    disabled={isUpdatingFeatures || !siteStatus}
                    className={`p-3 rounded-lg transition-all duration-200 hover:scale-105 border ${
                      isUpdatingFeatures || !siteStatus
                        ? 'opacity-50 cursor-not-allowed'
                        : isDarkMode
                          ? 'bg-gray-700/50 border-gray-600/50 hover:bg-gray-700/70'
                          : 'bg-white/50 border-gray-200/50 hover:bg-white/70'
                    }`}
                  >
                    <Music className={`w-5 h-5 mx-auto mb-1 ${
                      siteStatus?.musicWishlistEnabled ?? true
                        ? isDarkMode ? 'text-purple-400' : 'text-purple-600'
                        : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <div className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Music Wishlist
                    </div>
                  </button>

                  {/* STORIES TOGGLE */}
                  <button
                    onClick={() => {
                      handleToggleStories();
                      setShowBurgerMenu(false);
                    }}
                    disabled={isUpdatingFeatures || !siteStatus}
                    className={`p-3 rounded-lg transition-all duration-200 hover:scale-105 border ${
                      isUpdatingFeatures || !siteStatus
                        ? 'opacity-50 cursor-not-allowed'
                        : isDarkMode
                          ? 'bg-gray-700/50 border-gray-600/50 hover:bg-gray-700/70'
                          : 'bg-white/50 border-gray-200/50 hover:bg-white/70'
                    }`}
                  >
                    <Camera className={`w-5 h-5 mx-auto mb-1 ${
                      siteStatus?.storiesEnabled ?? true
                        ? isDarkMode ? 'text-green-400' : 'text-green-600'
                        : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <div className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Stories
                    </div>
                  </button>

                  {/* ZIP DOWNLOAD BUTTON */}
                  <button
                    onClick={() => {
                      handleDownloadAll();
                      setShowBurgerMenu(false);
                    }}
                    disabled={isDownloading || mediaItems.length === 0}
                    className={`p-3 rounded-lg transition-all duration-200 hover:scale-105 border col-span-2 ${
                      isDownloading || mediaItems.length === 0
                        ? 'opacity-50 cursor-not-allowed'
                        : isDarkMode
                          ? 'bg-gray-700/50 border-gray-600/50 hover:bg-gray-700/70'
                          : 'bg-white/50 border-gray-200/50 hover:bg-white/70'
                    }`}
                  >
                    <Download className={`w-5 h-5 mx-auto mb-1 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                    <div className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {isDownloading ? 'Downloading...' : 'Download ZIP'}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Download Warning Modal */}
      {showDownloadWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full p-6 rounded-2xl border shadow-2xl ${
            isDarkMode
              ? 'bg-gray-800/90 border-gray-700/50 text-white'
              : 'bg-white/90 border-gray-200/60 text-gray-900'
          }`}>
            <h3 className="text-lg font-semibold mb-4">Download bestätigen</h3>
            <p className="text-sm mb-6">
              Möchtest du alle Medien als ZIP-Datei herunterladen? Dies kann je nach Anzahl der Dateien einige Minuten dauern.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDownload}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Download starten
              </button>
              <button
                onClick={() => setShowDownloadWarning(false)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium border transition-colors ${
                  isDarkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {showUserManagement && (
        <UserManagementModal
          isOpen={showUserManagement}
          onClose={() => setShowUserManagement(false)}
          isDarkMode={isDarkMode}
          galleryId={gallery.id}
          getUserAvatar={getUserAvatar}
          getUserDisplayName={getUserDisplayName}
        />
      )}

      {/* Spotify Admin Modal */}
      {showSpotifyAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${
            isDarkMode
              ? 'bg-gray-800/90 border-gray-700/50'
              : 'bg-white/90 border-gray-200/60'
          }`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200/20">
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Spotify Admin
              </h2>
              <button
                onClick={() => setShowSpotifyAdmin(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <SpotifyAdmin isDarkMode={isDarkMode} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};