import React from 'react';

interface EventLoadingSpinnerProps {
  theme: 'hochzeit' | 'geburtstag' | 'urlaub' | 'eigenes';
  isDarkMode: boolean;
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

export const EventLoadingSpinner: React.FC<EventLoadingSpinnerProps> = ({
  theme,
  isDarkMode,
  size = 'medium',
  text
}) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const getThemeColors = () => {
    switch (theme) {
      case 'hochzeit':
        return isDarkMode ? 'text-pink-400' : 'text-pink-500';
      case 'geburtstag':
        return isDarkMode ? 'text-purple-400' : 'text-purple-500';
      case 'urlaub':
        return isDarkMode ? 'text-blue-400' : 'text-blue-500';
      case 'eigenes':
        return isDarkMode ? 'text-green-400' : 'text-green-500';
      default:
        return isDarkMode ? 'text-pink-400' : 'text-pink-500';
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'hochzeit':
        return '💍';
      case 'geburtstag':
        return '🎂';
      case 'urlaub':
        return '🏖️';
      case 'eigenes':
        return '🎊';
      default:
        return '💍';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        {/* Spinning ring */}
        <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-transparent ${getThemeColors()}`}
             style={{
               borderTopColor: 'currentColor',
               borderRightColor: 'currentColor'
             }}
        />
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm animate-pulse">
            {getThemeIcon()}
          </span>
        </div>
      </div>
      
      {text && (
        <p className={`text-sm animate-pulse ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {text}
        </p>
      )}
    </div>
  );
};