import React, { useState, useEffect } from 'react';
import { Settings, UserPlus, Clock, X, Heart, Lock, Unlock } from 'lucide-react';
import { getThemeConfig } from '../config/themes';
import { HeaderLoadingSkeleton } from './HeaderLoadingSkeleton';

interface ProfileHeaderProps {
  isDarkMode: boolean;
  isAdmin: boolean;
  userName?: string;
  mediaItems?: any[];
  onToggleAdmin?: (isAdmin: boolean) => void;
  currentUserProfile?: any;
  onOpenUserProfile?: () => void;
  showTopBarControls?: boolean;
  showProfileEditModal?: boolean;
  onCloseProfileEditModal?: () => void;
  galleryProfileData?: any;
  onEditGalleryProfile?: () => void;
  gallery?: any;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  isDarkMode, 
  isAdmin, 
  userName, 
  mediaItems = [], 
  onToggleAdmin, 
  currentUserProfile, 
  onOpenUserProfile, 
  showTopBarControls = true, 
  showProfileEditModal = false, 
  onCloseProfileEditModal,
  galleryProfileData,
  onEditGalleryProfile,
  gallery
}) => {
  // State management
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [countdownEnded, setCountdownEnded] = useState(false);

  // SIMPLIFIED LOADING: Show animation briefly, then show available data
  useEffect(() => {
    setIsDataLoading(true);
    
    // Show loading for 1.5 seconds, then show whatever data we have
    const timer = setTimeout(() => {
      setIsDataLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []); // Only run once on mount

  // OPTIMIZED: Memoize theme configuration to prevent recalculation
  const themeConfig = React.useMemo(() => 
    getThemeConfig(gallery?.theme || 'hochzeit'), 
    [gallery?.theme]
  );

  // OPTIMIZED: Memoize complex theme-based styles to prevent recalculation
  const themeStyles = React.useMemo(() => {
    const theme = gallery?.theme || 'hochzeit';
    const baseStyles = {
      hochzeit: {
        ring: 'ring-pink-500/40 hover:ring-pink-400/60 shadow-pink-500/25',
        gradient: isDarkMode ? 'from-pink-600 to-rose-600 text-white' : 'from-pink-500 to-rose-500 text-white',
        emoji: '💍',
        button: isDarkMode 
          ? 'bg-gray-800/60 hover:bg-gray-700/70 backdrop-blur-sm ring-pink-500/40 hover:ring-pink-400/60'
          : 'bg-white/60 hover:bg-gray-50/70 backdrop-blur-sm ring-pink-500/40 hover:ring-pink-400/60'
      },
      geburtstag: {
        ring: 'ring-purple-500/40 hover:ring-purple-400/60 shadow-purple-500/25',
        gradient: isDarkMode ? 'from-purple-600 to-violet-600 text-white' : 'from-purple-500 to-violet-500 text-white',
        emoji: '🎂',
        button: isDarkMode 
          ? 'bg-gray-800/60 hover:bg-gray-700/70 backdrop-blur-sm ring-purple-500/40 hover:ring-purple-400/60'
          : 'bg-white/60 hover:bg-gray-50/70 backdrop-blur-sm ring-purple-500/40 hover:ring-purple-400/60'
      },
      urlaub: {
        ring: 'ring-blue-500/40 hover:ring-blue-400/60 shadow-blue-500/25',
        gradient: isDarkMode ? 'from-blue-600 to-cyan-600 text-white' : 'from-blue-500 to-cyan-500 text-white',
        emoji: '🏖️',
        button: isDarkMode 
          ? 'bg-gray-800/60 hover:bg-gray-700/70 backdrop-blur-sm ring-blue-500/40 hover:ring-blue-400/60'
          : 'bg-white/60 hover:bg-gray-50/70 backdrop-blur-sm ring-blue-500/40 hover:ring-blue-400/60'
      },
      eigenes: {
        ring: 'ring-green-500/40 hover:ring-green-400/60 shadow-green-500/25',
        gradient: isDarkMode ? 'from-green-600 to-emerald-600 text-white' : 'from-green-500 to-emerald-500 text-white',
        emoji: '🎊',
        button: isDarkMode 
          ? 'bg-gray-800/60 hover:bg-gray-700/70 backdrop-blur-sm ring-green-500/40 hover:ring-green-400/60'
          : 'bg-white/60 hover:bg-gray-50/70 backdrop-blur-sm ring-green-500/40 hover:ring-green-400/60'
      }
    };
    return baseStyles[theme as keyof typeof baseStyles] || baseStyles.hochzeit;
  }, [gallery?.theme, isDarkMode]);
  
  // ENHANCED DATA DISPLAY: Always show meaningful information
  const displayData = React.useMemo(() => {
    // If we have actual gallery profile data, use it
    if (galleryProfileData && galleryProfileData.name) {
      return {
        ...galleryProfileData,
        // Ensure we have good defaults even with profile data
        bio: galleryProfileData.bio || `Willkommen in der ${gallery?.eventName || 'Event'} Galerie! 📸`
      };
    }

    // Create rich default data from gallery information
    const eventName = gallery?.eventName || 'Galerie';
    const themeEmojis: Record<string, string> = {
      'hochzeit': '💍💖',
      'geburtstag': '🎂🎉', 
      'urlaub': '🏖️✈️',
      'eigenes': '🎊✨'
    };
    const themeEmoji = themeEmojis[gallery?.theme || 'hochzeit'] || '📸';

    return {
      name: eventName,
      bio: `${themeEmoji} ${eventName} ${themeEmoji}\n\nTeilt eure schönsten Momente mit uns!\nHier entstehen unvergessliche Erinnerungen. 📷`,
      profilePicture: null,
      countdownDate: gallery?.eventDate || null,
      countdownEndMessage: 'Der große Tag ist da! 🎉'
    };
  }, [galleryProfileData, gallery?.eventName, gallery?.theme, gallery?.eventDate]);

  // Countdown timer effect with memoized calculation
  useEffect(() => {
    if (!displayData?.countdownDate) {
      setCountdown(null);
      setCountdownEnded(false);
      return;
    }

    const updateCountdown = () => {
      const target = new Date(displayData.countdownDate!);
      const now = new Date();
      const difference = target.getTime() - now.getTime();

      if (difference > 0) {
        const newCountdown = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        };
        
        // Only update if values actually changed
        setCountdown(prev => {
          if (!prev || 
              prev.days !== newCountdown.days || 
              prev.hours !== newCountdown.hours || 
              prev.minutes !== newCountdown.minutes || 
              prev.seconds !== newCountdown.seconds) {
            return newCountdown;
          }
          return prev;
        });
        setCountdownEnded(false);
      } else {
        setCountdown(null);
        setCountdownEnded(true);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [displayData?.countdownDate]);

  // LOADING ANIMATION: Show elegant loading state while data loads
  if (isDataLoading) {
    return (
      <div className={`mx-2 sm:mx-4 my-4 sm:my-6 p-4 sm:p-6 rounded-3xl transition-all duration-500 ${
        isDarkMode 
          ? 'bg-gray-800/40 border border-gray-700/30 backdrop-blur-xl shadow-2xl shadow-purple-500/10' 
          : 'bg-white/60 border border-gray-200/40 backdrop-blur-xl shadow-2xl shadow-pink-500/10'
      }`}>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Animated Profile Picture Skeleton */}
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full relative ring-4 overflow-hidden ${themeStyles.ring}`}>
              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 animate-pulse">
                <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              </div>
            </div>
            
            {/* Animated Text Skeleton */}
            <div className="flex-1">
              <div className={`h-6 w-32 rounded-lg mb-3 animate-pulse ${
                isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
              }`}>
                <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              </div>
              <div className="flex gap-6 sm:gap-8">
                <div className="flex flex-col items-center">
                  <div className={`h-5 w-8 rounded mb-1 animate-pulse ${
                    isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                  }`}></div>
                  <div className={`h-3 w-12 rounded animate-pulse ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`h-5 w-8 rounded mb-1 animate-pulse ${
                    isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                  }`}></div>
                  <div className={`h-3 w-12 rounded animate-pulse ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading Controls Skeleton */}
          {showTopBarControls && (
            <div className="flex gap-2">
              <div className={`w-10 h-10 rounded-full animate-pulse ${
                isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
              }`}></div>
              <div className={`w-10 h-10 rounded-full animate-pulse ${
                isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
              }`}></div>
            </div>
          )}
        </div>

        {/* Loading Bio Skeleton */}
        <div className={`h-4 w-3/4 rounded mb-2 animate-pulse ${
          isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
        }`}></div>
        <div className={`h-4 w-1/2 rounded animate-pulse ${
          isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
        }`}></div>
      </div>
    );
  }

  // NORMAL CONTENT: Show after loading completes
  return (
    <>
      
      <div className={`mx-2 sm:mx-4 my-4 sm:my-6 p-4 sm:p-6 rounded-3xl transition-all duration-500 ${
        isDarkMode 
          ? 'bg-gray-800/40 border border-gray-700/30 backdrop-blur-xl shadow-2xl shadow-purple-500/10' 
          : 'bg-white/60 border border-gray-200/40 backdrop-blur-xl shadow-2xl shadow-pink-500/10'
      }`}>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden relative ring-4 transition-all duration-300 shadow-xl ${themeStyles.ring}`}
            >
              {displayData?.profilePicture ? (
                <img 
                  src={displayData?.profilePicture} 
                  alt={displayData?.name || "Profile"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br flex items-center justify-center text-3xl sm:text-4xl ${themeStyles.gradient}`}>
                  {themeStyles.emoji}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className={`text-lg sm:text-xl font-bold tracking-tight transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
{displayData?.name || 'Gallery'}
              </h2>
              <div className={`flex gap-6 sm:gap-8 mt-2 sm:mt-3 text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <span className="flex flex-col items-center">
                  <span className="font-bold text-lg">∞</span>
                  <span className="text-xs opacity-70">Follower</span>
                </span>
                <span className="flex flex-col items-center">
                  <span className="font-bold text-lg">{mediaItems.length || 0}</span>
                  <span className="text-xs opacity-70">Beiträge</span>
                </span>
              </div>
            </div>
          </div>

          {/* Admin Gallery Profile Settings - Only visible in admin mode */}
          {showTopBarControls && isAdmin && (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => onEditGalleryProfile?.()}
                className={`w-8 h-8 rounded-full transition-all duration-300 hover:scale-110 flex items-center justify-center ring-2 ${themeStyles.button}`}
                title="Galerie-Profil bearbeiten"
              >
                <Settings className={`w-4 h-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`} />
              </button>
            </div>
          )}
        </div>
       
        <div className="space-y-4">
          {displayData?.bio && (
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {displayData.bio}
            </p>
          )}
          
          <div className="mt-4">
            <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium transition-all duration-300 opacity-60 hover:opacity-80 ${
              isDarkMode 
                ? 'bg-gray-800/50 text-gray-400 border border-gray-700/30' 
                : 'bg-gray-100/70 text-gray-500 border border-gray-200/50'
            }`}>
              coded by Mauro
            </span>
          </div>

          {/* Countdown Display - Instagram 2.0 Style */}
          {countdown && (
            <div className={`mt-6 p-8 rounded-3xl transition-all duration-500 relative overflow-hidden ${
              isDarkMode 
                ? 'bg-gray-800/40 border border-gray-700/30 backdrop-blur-xl shadow-2xl shadow-purple-500/10' 
                : 'bg-white/60 border border-gray-200/40 backdrop-blur-xl shadow-2xl shadow-pink-500/10'
            }`}>
              {/* Decorative Background Elements */}
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl ${
                  isDarkMode ? 'bg-pink-500' : 'bg-pink-300'
                }`} style={{ transform: 'translate(50%, -50%)' }}></div>
                <div className={`absolute bottom-0 left-0 w-24 h-24 rounded-full blur-3xl ${
                  isDarkMode ? 'bg-purple-500' : 'bg-purple-300'
                }`} style={{ transform: 'translate(-50%, 50%)' }}></div>
              </div>

              <div className="relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-pink-600/20 border border-pink-500/30' 
                        : 'bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-200/50'
                    }`}>
                      <Heart className={`w-8 h-8 transition-colors duration-300 animate-heartbeat ${
                       isDarkMode ? 'text-pink-400' : 'text-pink-600'
                      }`} 
                      style={{
                        animation: 'heartbeat 12s ease-in-out infinite'
                      }} />
                    </div>
                  </div>
                  <h3 className={`text-2xl font-bold tracking-tight mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Bis zu unserem großen Tag
                  </h3>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Jeder Moment zählt ✨
                  </p>
                </div>
                
                {/* Countdown Cards */}
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                  {[
                    { value: countdown.days, label: 'Tage', icon: '📅' },
                    { value: countdown.hours, label: 'Stunden', icon: '⏰' },
                    { value: countdown.minutes, label: 'Minuten', icon: '⏱️' },
                    { value: countdown.seconds, label: 'Sekunden', icon: '⚡' }
                  ].map((item, index) => (
                    <div
                      key={index}
                      className={`relative w-20 h-24 sm:w-24 sm:h-28 rounded-2xl transition-all duration-500 transform hover:scale-105 group flex-shrink-0 ${
                        isDarkMode 
                          ? 'bg-gray-800/60 border border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/80' 
                          : 'bg-white/80 border border-gray-200/60 backdrop-blur-sm hover:bg-white/90 shadow-lg hover:shadow-xl'
                      }`}
                      style={{
                        animation: 'pulse 8s ease-in-out infinite',
                        animationDelay: `${index * 0.5}s`
                      }}
                    >
                      {/* Gradient Border Effect */}
                      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                        isDarkMode ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20' : 'bg-gradient-to-r from-pink-100/50 to-purple-100/50'
                      }`}></div>

                      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-2">
                        {/* Icon */}
                        <div className="text-lg mb-1 transform group-hover:scale-110 transition-transform duration-300">
                          {item.icon}
                        </div>

                        {/* Value */}
                        <div className={`text-lg font-bold mb-1 transition-all duration-300 ${
                          isDarkMode 
                            ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400' 
                            : 'text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600'
                        }`}>
                          {item.value.toString().padStart(2, '0')}
                        </div>

                        {/* Label */}
                        <div className={`text-xs uppercase tracking-wide font-medium transition-colors duration-300 leading-tight ${
                          isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-700'
                        }`}>
                          {item.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Accent */}
                <div className="mt-6 text-center">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-pink-600/20 border border-pink-500/30' 
                      : 'bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-200/50'
                  }`}>
                    <span className="text-lg">💕</span>
                    <span className={`text-sm font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-pink-300' : 'text-pink-700'
                    }`}>
                      Wir können es kaum erwarten!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Countdown End Message */}
          {countdownEnded && displayData?.countdownEndMessage && !displayData?.countdownMessageDismissed && (
            <div className={`mt-4 p-4 rounded-xl border-2 transition-colors duration-300 animate-pulse relative ${
              isDarkMode ? 'bg-pink-900/30 border-pink-500/50' : 'bg-pink-50 border-pink-300'
            }`}>
              <div className="text-center">
                <div className="text-2xl mb-2">🎉</div>
                <p className={`text-lg font-semibold transition-colors duration-300 ${
                  isDarkMode ? 'text-pink-300' : 'text-pink-700'
                }`}>
                  {displayData.countdownEndMessage}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
