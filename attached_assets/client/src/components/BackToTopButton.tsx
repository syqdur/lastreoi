import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

interface BackToTopButtonProps {
  isDarkMode: boolean;
  galleryTheme?: 'hochzeit' | 'geburtstag' | 'urlaub' | 'eigenes';
}

export const BackToTopButton: React.FC<BackToTopButtonProps> = ({ isDarkMode, galleryTheme = 'hochzeit' }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Theme-specific configuration
  const themeConfig = {
    hochzeit: {
      gradient: isDarkMode 
        ? 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500' 
        : 'bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600',
      shadow: isDarkMode ? 'shadow-pink-500/25' : 'shadow-pink-400/25'
    },
    geburtstag: {
      gradient: isDarkMode 
        ? 'bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-400 hover:to-violet-500' 
        : 'bg-gradient-to-r from-purple-400 to-violet-500 hover:from-purple-500 hover:to-violet-600',
      shadow: isDarkMode ? 'shadow-purple-500/25' : 'shadow-purple-400/25'
    },
    urlaub: {
      gradient: isDarkMode 
        ? 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500' 
        : 'bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600',
      shadow: isDarkMode ? 'shadow-blue-500/25' : 'shadow-blue-400/25'
    },
    eigenes: {
      gradient: isDarkMode 
        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500' 
        : 'bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600',
      shadow: isDarkMode ? 'shadow-green-500/25' : 'shadow-green-400/25'
    }
  };

  const currentTheme = themeConfig[galleryTheme];

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-4 right-4 z-50 p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-lg ${currentTheme.gradient} ${currentTheme.shadow} backdrop-blur-sm border border-white/20`}
      title="Zum Anfang scrollen"
      aria-label="Back to top"
    >
      <ChevronUp className="w-4 h-4 text-white" />
    </button>
  );
};