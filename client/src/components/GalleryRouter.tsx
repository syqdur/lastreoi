import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { LandingPage, GalleryCreationData } from './LandingPage';
import { GalleryPasswordPrompt } from './GalleryPasswordPrompt';
import { SimpleRootAdmin } from './SimpleRootAdmin';
import { SpotifyCallback } from './SpotifyCallback';
import { EventLoadingSpinner } from './EventLoadingSpinner';
import { galleryService, Gallery } from '../services/galleryService';
import { subscriptionService } from '../services/subscriptionService';
import { getUserName, getDeviceId } from '../utils/deviceId';
// import InstagramTaggingTest from './InstagramTaggingTest';

// Import the main App component (we'll rename the current one to GalleryApp)
import { GalleryApp } from '../GalleryApp';

interface GalleryRouterProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const GalleryRouter: React.FC<GalleryRouterProps> = ({ isDarkMode, onToggleDarkMode }) => {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute('/:slug');
  
  const [currentGallery, setCurrentGallery] = useState<Gallery | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRootAdmin, setShowRootAdmin] = useState(false);

  // Check if we're on the landing page
  const isLandingPage = location === '/' || location === '';
  const isRootAdminPage = location === '/root-admin';
  // const isTaggingTestPage = location === '/tagging-test';
  
  // Check if we're handling a Spotify callback
  const urlParams = new URLSearchParams(window.location.search);
  const isSpotifyCallback = urlParams.has('code') && urlParams.has('state');

  // Load gallery when slug changes (but not for Spotify callbacks)
  useEffect(() => {
    // Skip normal routing if this is a Spotify callback
    if (isSpotifyCallback) {
      console.log('🎵 Spotify callback detected, skipping normal routing');
      return;
    }
    
    if (match && params?.slug) {
      if (params.slug === 'root-admin') {
        setShowRootAdmin(true);
      // } else if (params.slug === 'tagging-test') {
        // Handle tagging test page
        // return;
      } else {
        loadGallery(params.slug);
      }
    } else if (!isLandingPage) {
      // Invalid route, redirect to landing
      setLocation('/');
    }
  }, [match, params?.slug, isLandingPage, isSpotifyCallback, setLocation]);

  const loadGallery = async (slug: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const gallery = await galleryService.getGalleryBySlug(slug);
      
      if (!gallery) {
        setError('Diese Galerie existiert nicht.');
        return;
      }

      if (!gallery.isActive) {
        setError('Diese Galerie ist nicht mehr aktiv.');
        return;
      }

      setCurrentGallery(gallery);

      // Check if password is required
      if (gallery.isPasswordProtected) {
        // Check if we already have authentication for this gallery
        const storedAuth = localStorage.getItem(`gallery_auth_${slug}`);
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          if (authData.timestamp > Date.now() - 24 * 60 * 60 * 1000) { // 24 hours
            setIsAuthenticated(true);
            await joinGallery(gallery);
            return;
          }
        }
        
        setShowPasswordPrompt(true);
        return;
      }

      // No password required, join directly
      setIsAuthenticated(true);
      await joinGallery(gallery);

    } catch (error) {
      console.error('Error loading gallery:', error);
      setError('Fehler beim Laden der Galerie.');
    } finally {
      setIsLoading(false);
    }
  };

  const joinGallery = async (gallery: Gallery) => {
    try {
      const userName = getUserName();
      const deviceId = getDeviceId();

      // Add user to gallery if they have a name
      if (userName) {
        await galleryService.addUserToGallery(gallery.id, {
          userName,
          deviceId,
          isOwner: false,
          isAdmin: false
        });
      }

      // Increment view count
      await galleryService.incrementViewCount(gallery.id);
      
    } catch (error) {
      console.error('Error joining gallery:', error);
      // Don't block access if user joining fails
    }
  };

  const handleCreateGallery = async (data: GalleryCreationData) => {
    console.log('🎯 GalleryRouter: handleCreateGallery called with:', data);
    try {
      console.log('🔨 Creating gallery via service...');
      const gallery = await galleryService.createGallery(data);
      console.log('✅ Gallery created successfully:', gallery);
      
      // Set as owner in localStorage for admin access
      console.log('💾 Setting owner flag in localStorage for slug:', gallery.slug);
      localStorage.setItem(`gallery_owner_${gallery.slug}`, 'true');
      
      // Set flag to indicate this gallery was just created
      localStorage.setItem(`gallery_just_created_${gallery.slug}`, 'true');
      console.log('🆕 Set just created flag for slug:', gallery.slug);
      
      // Store creator as root admin
      localStorage.setItem(`root_admin_${gallery.slug}`, 'true');
      console.log('👑 Set creator as root admin for gallery:', gallery.slug);
      
      // Create subscription for the gallery
      if (data.selectedPlan) {
        console.log(`💳 Creating ${data.selectedPlan} subscription for gallery:`, gallery.slug);
        try {
          await subscriptionService.createSubscription(gallery.slug, data.selectedPlan);
          console.log('✅ Subscription created successfully');
        } catch (error) {
          console.error('❌ Failed to create subscription:', error);
          // Don't block gallery creation if subscription fails
        }
      }
      
      // Navigate to the new gallery
      console.log('🧭 Navigating to:', `/${gallery.slug}`);
      setLocation(`/${gallery.slug}`);
      console.log('🎉 Navigation initiated successfully');
      
    } catch (error: any) {
      console.error('❌ Error in handleCreateGallery:', error);
      console.error('❌ Error details:', error.message, error.stack);
      throw new Error(error.message || 'Fehler beim Erstellen der Galerie');
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!currentGallery) return;

    try {
      const isValid = await galleryService.verifyGalleryPassword(currentGallery.slug, password);
      
      if (isValid) {
        // Store authentication
        localStorage.setItem(`gallery_auth_${currentGallery.slug}`, JSON.stringify({
          timestamp: Date.now()
        }));
        
        setIsAuthenticated(true);
        setShowPasswordPrompt(false);
        await joinGallery(currentGallery);
      } else {
        throw new Error('Falsches Passwort');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Fehler bei der Authentifizierung');
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordPrompt(false);
    setCurrentGallery(null);
    setLocation('/');
  };

  // PERFORMANCE FIX: Removed first loading screen - direct loading into gallery

  // Render error state
  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center max-w-md mx-auto p-8">
          <div className={`text-6xl mb-4`}>😔</div>
          <h2 className={`text-2xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Ups!
          </h2>
          <p className={`text-lg mb-6 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {error}
          </p>
          <button
            onClick={() => setLocation('/')}
            className={`px-6 py-3 rounded-xl font-semibold transition-colors ${
              isDarkMode
                ? 'bg-pink-600 hover:bg-pink-700 text-white'
                : 'bg-pink-500 hover:bg-pink-600 text-white'
            }`}
          >
            Zur Startseite
          </button>
        </div>
      </div>
    );
  }

  // Render password prompt
  if (showPasswordPrompt && currentGallery) {
    return (
      <GalleryPasswordPrompt
        gallery={currentGallery}
        isDarkMode={isDarkMode}
        onSubmit={handlePasswordSubmit}
        onCancel={handlePasswordCancel}
      />
    );
  }

  // Handle Spotify OAuth callback
  if (isSpotifyCallback) {
    return <SpotifyCallback isDarkMode={isDarkMode} />;
  }

  // Render root admin dashboard
  if (showRootAdmin) {
    return (
      <SimpleRootAdmin
        isDarkMode={isDarkMode}
        onBack={() => {
          setShowRootAdmin(false);
          setLocation('/');
        }}
      />
    );
  }

  // Removed tagging test page
  // if (isTaggingTestPage) {
  //   return <InstagramTaggingTest />;
  // }

  // Render landing page
  if (isLandingPage) {
    return (
      <LandingPage
        onCreateGallery={handleCreateGallery}
        onRootAdminLogin={() => {
          setShowRootAdmin(true);
          setLocation('/root-admin');
        }}
      />
    );
  }

  // Render gallery app
  if (currentGallery && isAuthenticated) {
    // Check if user is owner
    const isOwner = localStorage.getItem(`gallery_owner_${currentGallery.slug}`) === 'true';
    
    return (
      <GalleryApp
        gallery={currentGallery}
        isOwner={isOwner}
        isDarkMode={isDarkMode}
        onToggleDarkMode={onToggleDarkMode}
      />
    );
  }

  // Fallback
  return (
    <div className={`min-h-screen flex items-center justify-center ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="text-center">
        <p className={`text-lg ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Lade...
        </p>
      </div>
    </div>
  );
};
