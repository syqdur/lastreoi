import React, { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
// Notification service imports updated for new tagging system
// import { subscribeToNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notificationService';

interface Notification {
  id: string;
  type: 'comment' | 'like' | 'tag' | 'tagged' | 'mention' | 'test';
  fromUser: string;
  fromDeviceId: string;
  targetUser: string;
  targetDeviceId: string;
  mediaId?: string;
  mediaUrl?: string;
  mediaType?: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationCenterProps {
  userName: string;
  deviceId: string;
  isDarkMode: boolean;
  onNavigateToMedia?: (mediaId: string) => void;
  galleryId: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userName,
  deviceId,
  isDarkMode,
  onNavigateToMedia,
  galleryId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  // Button position calculation when opening
  const updateButtonPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };
  // Device Detection
  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      setIsMobile(isMobileDevice || isSmallScreen || isTouchDevice);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  useEffect(() => {
    if (!userName || !deviceId || !galleryId) return;

    const timeoutId = setTimeout(() => {
      // Notification subscription will be implemented with new tagging system
      console.log('Notification subscription started for gallery:', galleryId);
      // Temporarily disabled until new notification system is integrated
      return () => {}; // Empty cleanup function
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [userName, deviceId, galleryId]);

  // Prevent body scroll when modal is open on mobile
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, isMobile]);

  const handleNotificationClick = (notification: Notification) => {
    console.log('🔔 Notification clicked:', notification);

    if (!notification.read) {
      // markNotificationAsRead(notification.id); // Temporarily disabled for new tagging system
    }

    if (onNavigateToMedia && notification.mediaId && notification.mediaId !== 'test') {
      onNavigateToMedia(notification.mediaId);
    }

    setIsOpen(false);
  };

  const handleDismissNotification = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    // markNotificationAsRead(notificationId, galleryId); // Temporarily disabled for new tagging system
  };

  const markAllAsRead = () => {
    if (notifications.length > 0) {
      // Temporarily disabled - will be replaced with new tagging system
      console.log('Mark all as read - New tagging system integration pending');
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

      if (diffInMinutes < 1) return 'Jetzt';
      if (diffInMinutes < 60) return `${diffInMinutes}m`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
      return `${Math.floor(diffInMinutes / 1440)}d`;
    } catch {
      return '';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment': return '💬';
      case 'like': return '❤️';
      case 'tag':
      case 'tagged': return '🏷️';
      default: return '🔔';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => {
          console.log('🔔 Button clicked, isMobile:', isMobile);
          if (!isOpen) {
            updateButtonPosition();
          }
          setIsOpen(!isOpen);
        }}
        className={`
          relative flex items-center justify-center
          w-10 h-10 rounded-full
          transition-all duration-200
          ${isDarkMode 
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white' 
            : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 shadow-sm'
          }
        `}
      >
        <Bell className="w-5 h-5" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Modal/Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-[9998]"
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9998
            }}
          />

          {/* Modal */}
          {isMobile ? (
            // Mobile: Modal unter der Glocke
            <div 
              className={`
                fixed w-11/12 max-w-md h-auto max-h-[70vh]
                ${isDarkMode ? 'bg-gray-900' : 'bg-white'}
                rounded-2xl overflow-hidden z-[9999] shadow-2xl
              `}
              style={{
                position: 'fixed',
                top: `${buttonPosition.top + 10}px`,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                maxHeight: '70vh',
                width: '90%',
                maxWidth: '400px'
              }}
            >
              {/* Mobile Handle - entfernt da zentriert */}

              {/* Header */}
              <div className={`flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <h2 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Benachrichtigungen
                  </h2>
                  {unreadCount > 0 && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${isDarkMode ? 'bg-blue-600 text-blue-100' : 'bg-blue-100 text-blue-700'}`}>
                      {unreadCount} neu
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                    >
                      <Check className="w-3 h-3" />
                      Alle
                    </button>
                  )}

                  <button
                    onClick={() => setIsOpen(false)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 80px)' }}>
                {notifications.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Bell className="w-12 h-12 opacity-50 mb-4" />
                    <p className="text-base font-medium mb-1">Alles erledigt!</p>
                    <p className="text-sm opacity-75">Keine neuen Benachrichtigungen</p>
                  </div>
                ) : (
                  <div>
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`
                          flex items-start gap-3 p-4 border-l-4 cursor-pointer
                          ${!notification.read 
                            ? isDarkMode 
                              ? 'bg-blue-900/20 border-blue-500 hover:bg-blue-900/30' 
                              : 'bg-blue-50 border-blue-500 hover:bg-blue-100'
                            : isDarkMode
                              ? 'border-transparent hover:bg-gray-800'
                              : 'border-transparent hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {notification.title}
                          </p>
                          <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {formatTime(notification.createdAt)}
                            </span>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDismissNotification(e, notification.id)}
                          className={`w-8 h-8 flex items-center justify-center rounded-full ${isDarkMode ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom padding entfernt da zentriert */}
            </div>
          ) : (
            // Desktop: Dropdown
            <div 
              className={`
                absolute top-full right-0 mt-2 w-96 max-h-96
                ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}
                rounded-2xl border shadow-2xl overflow-hidden z-[9999]
              `}
            >
              {/* Desktop Header */}
              <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Benachrichtigungen
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className={`text-xs px-2 py-1 rounded-lg ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                    >
                      Alle lesen
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className={`p-1 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Desktop Content */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Keine Benachrichtigungen</p>
                  </div>
                ) : (
                  <div>
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`
                          flex items-start gap-3 p-3 cursor-pointer border-l-4
                          ${!notification.read 
                            ? isDarkMode 
                              ? 'bg-blue-900/20 border-blue-500 hover:bg-blue-900/30' 
                              : 'bg-blue-50 border-blue-500 hover:bg-blue-100'
                            : isDarkMode
                              ? 'border-transparent hover:bg-gray-700/30'
                              : 'border-transparent hover:bg-gray-50'
                          }
                        `}
                      >
                        <span className="text-lg mt-0.5">{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {notification.title}
                          </p>
                          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                          <button
                            onClick={(e) => handleDismissNotification(e, notification.id)}
                            className={`p-1.5 rounded-full ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};