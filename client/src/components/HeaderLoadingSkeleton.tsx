import React from 'react';

interface HeaderLoadingSkeletonProps {
  isDarkMode: boolean;
  galleryTheme?: 'hochzeit' | 'geburtstag' | 'urlaub' | 'eigenes';
}

export const HeaderLoadingSkeleton: React.FC<HeaderLoadingSkeletonProps> = ({ 
  isDarkMode, 
  galleryTheme = 'hochzeit' 
}) => {
  // Theme-specific shimmer colors
  const getShimmerGradient = () => {
    const baseGradient = isDarkMode 
      ? 'from-gray-700 via-gray-600 to-gray-700'
      : 'from-gray-200 via-gray-100 to-gray-200';
    
    switch (galleryTheme) {
      case 'hochzeit':
        return isDarkMode 
          ? 'from-pink-900/30 via-rose-800/20 to-pink-900/30'
          : 'from-pink-100 via-rose-50 to-pink-100';
      case 'geburtstag':
        return isDarkMode 
          ? 'from-purple-900/30 via-violet-800/20 to-purple-900/30'
          : 'from-purple-100 via-violet-50 to-purple-100';
      case 'urlaub':
        return isDarkMode 
          ? 'from-blue-900/30 via-cyan-800/20 to-blue-900/30'
          : 'from-blue-100 via-cyan-50 to-blue-100';
      case 'eigenes':
        return isDarkMode 
          ? 'from-green-900/30 via-emerald-800/20 to-green-900/30'
          : 'from-green-100 via-emerald-50 to-green-100';
      default:
        return baseGradient;
    }
  };

  const shimmerClass = `animate-shimmer bg-gradient-to-r ${getShimmerGradient()}`;

  return (
    <div className={`w-full transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'
    } backdrop-blur-xl border-b ${
      isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
    }`}>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Left side - Profile Picture Skeleton */}
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-full ${shimmerClass}`} />
            <div className="space-y-2">
              <div className={`h-6 w-48 rounded-lg ${shimmerClass}`} />
              <div className={`h-4 w-32 rounded-lg ${shimmerClass}`} />
            </div>
          </div>

          {/* Right side - Navigation Skeleton */}
          <div className="flex items-center space-x-3">
            {/* Dark mode toggle skeleton */}
            <div className={`w-10 h-10 rounded-full ${shimmerClass}`} />
            
            {/* Profile button skeleton */}
            <div className={`w-24 h-10 rounded-2xl ${shimmerClass}`} />
            
            {/* Admin controls skeleton (if applicable) */}
            <div className={`w-10 h-10 rounded-full ${shimmerClass}`} />
            
            {/* Live users skeleton */}
            <div className={`w-32 h-10 rounded-2xl ${shimmerClass}`} />
            
            {/* Notification bell skeleton */}
            <div className={`w-10 h-10 rounded-full ${shimmerClass}`} />
          </div>
        </div>

        {/* Countdown skeleton (if applicable) */}
        <div className="mt-4 flex justify-center">
          <div className={`h-12 w-80 rounded-2xl ${shimmerClass}`} />
        </div>
      </div>

      {/* Floating shimmer effect overlay */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
};