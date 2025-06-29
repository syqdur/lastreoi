import React from 'react';
import { useStoryStore } from '../../stores/storyStore';

interface StoryRingProps {
  userId: string;
  userName: string;
  profilePicture?: string;
  hasUnviewedStories: boolean;
  onClick: () => void;
  isDarkMode?: boolean;
}

export const StoryRing: React.FC<StoryRingProps> = ({
  userId,
  userName,
  profilePicture,
  hasUnviewedStories,
  onClick,
  isDarkMode = false
}) => {
  const { shouldShowRing } = useStoryStore();

  const showRing = hasUnviewedStories && shouldShowRing(userId);

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-2 rounded-lg transition-all duration-200 hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
    >
      <div className="relative">
        {/* Story Ring */}
        {showRing && (
          <>
            {/* Animated outer ring */}
            <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 animate-pulse" />
            <div className="absolute inset-0.5 w-15 h-15 rounded-full bg-gradient-to-tr from-purple-600 via-pink-600 to-orange-600 opacity-80" />
            
            {/* Breathing animation */}
            <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-tr from-purple-400 via-pink-400 to-orange-400 animate-ping opacity-20" />
          </>
        )}
        
        {/* Profile Picture Container */}
        <div className={`relative w-14 h-14 rounded-full overflow-hidden ${
          showRing ? 'border-2 border-white dark:border-gray-900' : 'border-2 border-gray-300 dark:border-gray-600'
        }`}>
          {profilePicture ? (
            <img
              src={profilePicture}
              alt={userName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-white font-bold text-lg ${
              showRing 
                ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                : 'bg-gradient-to-br from-gray-400 to-gray-500'
            }`}>
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Add Story Plus Icon for Current User */}
        {userId === 'current_user' && (
          <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        )}
      </div>

      {/* Username */}
      <span className={`text-xs font-medium truncate max-w-16 ${
        isDarkMode ? 'text-gray-200' : 'text-gray-700'
      }`}>
        {userName}
      </span>
    </button>
  );
};