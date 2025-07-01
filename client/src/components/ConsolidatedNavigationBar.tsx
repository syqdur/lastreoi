import React, { useState } from 'react';
import { Plus, List, Grid3X3, Zap, Camera, Video, FileText } from 'lucide-react';

interface Story {
  id: string;
  userName: string;
  deviceId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  views: string[];
  createdAt: string;
}

interface ConsolidatedNavigationBarProps {
  // Upload Section Props
  onUpload: (files: FileList) => Promise<void>;
  onVideoUpload: (videoBlob: Blob) => Promise<void>;
  onNoteSubmit: (note: string) => Promise<void>;
  onAddStory: () => void;
  isUploading: boolean;
  progress: number;
  
  // Stories Bar Props
  stories: Story[];
  currentUser: string;
  deviceId: string;
  onViewStory: (index: number) => void;
  
  // Feed/Grid Toggle Props
  viewMode: 'feed' | 'grid';
  onViewModeChange: (mode: 'feed' | 'grid') => void;
  
  // Common Props
  isDarkMode: boolean;
  storiesEnabled?: boolean;
  galleryTheme?: 'hochzeit' | 'geburtstag' | 'urlaub' | 'eigenes';
  themeTexts?: any;
  themeStyles?: any;
}

export const ConsolidatedNavigationBar: React.FC<ConsolidatedNavigationBarProps> = ({
  onUpload,
  onVideoUpload,
  onNoteSubmit,
  onAddStory,
  isUploading,
  progress,
  stories,
  currentUser,
  deviceId,
  onViewStory,
  viewMode,
  onViewModeChange,
  isDarkMode,
  storiesEnabled = true,
  galleryTheme = 'hochzeit',
  themeTexts,
  themeStyles
}) => {
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Get theme colors
  const getThemeColors = () => {
    switch (galleryTheme) {
      case 'hochzeit':
        return {
          primary: isDarkMode ? 'bg-pink-600' : 'bg-pink-500',
          primaryHover: isDarkMode ? 'hover:bg-pink-700' : 'hover:bg-pink-600',
          primaryText: 'text-white',
          primaryLight: isDarkMode ? 'bg-pink-600/20' : 'bg-pink-50',
          primaryBorder: isDarkMode ? 'border-pink-500/30' : 'border-pink-200'
        };
      case 'geburtstag':
        return {
          primary: isDarkMode ? 'bg-purple-600' : 'bg-purple-500',
          primaryHover: isDarkMode ? 'hover:bg-purple-700' : 'hover:bg-purple-600',
          primaryText: 'text-white',
          primaryLight: isDarkMode ? 'bg-purple-600/20' : 'bg-purple-50',
          primaryBorder: isDarkMode ? 'border-purple-500/30' : 'border-purple-200'
        };
      case 'urlaub':
        return {
          primary: isDarkMode ? 'bg-blue-600' : 'bg-blue-500',
          primaryHover: isDarkMode ? 'hover:bg-blue-700' : 'hover:bg-blue-600',
          primaryText: 'text-white',
          primaryLight: isDarkMode ? 'bg-blue-600/20' : 'bg-blue-50',
          primaryBorder: isDarkMode ? 'border-blue-500/30' : 'border-blue-200'
        };
      default:
        return {
          primary: isDarkMode ? 'bg-green-600' : 'bg-green-500',
          primaryHover: isDarkMode ? 'hover:bg-green-700' : 'hover:bg-green-600',
          primaryText: 'text-white',
          primaryLight: isDarkMode ? 'bg-green-600/20' : 'bg-green-50',
          primaryBorder: isDarkMode ? 'border-green-500/30' : 'border-green-200'
        };
    }
  };

  const themeColors = getThemeColors();

  // Stories logic
  const groupedStories = stories.reduce((acc, story) => {
    if (!acc[story.userName]) {
      acc[story.userName] = [];
    }
    acc[story.userName].push(story);
    return acc;
  }, {} as Record<string, Story[]>);

  const userStories = Object.entries(groupedStories).map(([userName, userStoriesArray]) => ({
    userName,
    stories: userStoriesArray,
    latestStory: userStoriesArray[userStoriesArray.length - 1],
    hasUnviewed: userStoriesArray.some(story => !story.views.includes(deviceId))
  }));

  userStories.sort((a, b) => {
    if (a.userName === currentUser) return -1;
    if (b.userName === currentUser) return 1;
    return new Date(b.latestStory.createdAt).getTime() - new Date(a.latestStory.createdAt).getTime();
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleStoryClick = (userName: string) => {
    const firstStoryIndex = stories.findIndex(story => story.userName === userName);
    if (firstStoryIndex !== -1) {
      onViewStory(firstStoryIndex);
    }
  };

  const getAvatarUrl = (username: string) => {
    const weddingAvatars = [
      'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
    ];
    
    const hash = username.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return weddingAvatars[Math.abs(hash) % weddingAvatars.length];
  };

  return (
    <div className={`mx-3 mb-3 rounded-2xl transition-all duration-500 overflow-hidden ${
      isDarkMode 
        ? 'bg-gray-800/30 border border-gray-700/20 backdrop-blur-xl shadow-xl' 
        : 'bg-white/50 border border-gray-200/30 backdrop-blur-xl shadow-xl'
    }`}>
      
      {/* Top Section: Stories + Add Button + View Toggle */}
      <div className={`px-4 py-3 border-b transition-colors duration-300 ${
        isDarkMode ? 'border-gray-700/20' : 'border-gray-200/20'
      }`}>
        <div className="flex items-center justify-between gap-4">
          
          {/* Stories Section (Left) */}
          <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
            {/* Add Story Button */}
            {storiesEnabled && (
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={onAddStory}
                  className={`flex-shrink-0 w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-300 transform hover:scale-105 ${
                    isDarkMode 
                      ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30' 
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <Plus className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </button>
                <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Story hinzufügen
                </span>
              </div>
            )}

            {/* User Stories */}
            {storiesEnabled && userStories.slice(0, 5).map((userStory) => (
              <button
                key={userStory.userName}
                onClick={() => handleStoryClick(userStory.userName)}
                className="relative flex-shrink-0 transform transition-all duration-300 hover:scale-105"
              >
                <div className={`w-12 h-12 rounded-full p-0.5 transition-all duration-300 ${
                  userStory.hasUnviewed
                    ? galleryTheme === 'hochzeit'
                      ? 'bg-gradient-to-tr from-pink-500 via-rose-500 to-red-500'
                      : galleryTheme === 'geburtstag'
                      ? 'bg-gradient-to-tr from-purple-500 via-violet-500 to-pink-500'
                      : galleryTheme === 'urlaub'
                      ? 'bg-gradient-to-tr from-blue-500 via-cyan-500 to-teal-500'
                      : 'bg-gradient-to-tr from-green-500 via-emerald-500 to-cyan-500'
                    : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                }`}>
                  <div className={`w-full h-full rounded-full overflow-hidden border-2 transition-colors duration-300 ${
                    isDarkMode ? 'border-gray-800' : 'border-white'
                  }`}>
                    <img 
                      src={userStory.latestStory.mediaUrl}
                      alt={`${userStory.userName}'s story`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = getAvatarUrl(userStory.userName);
                      }}
                    />
                  </div>
                </div>
                {userStory.stories.length > 1 && (
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-700 text-white border-2 border-gray-800' : 'bg-white text-gray-900 border-2 border-white shadow-lg'
                  }`}>
                    {userStory.stories.length}
                  </div>
                )}
              </button>
            ))}

            {/* Show more stories indicator if there are more than 5 */}
            {storiesEnabled && userStories.length > 5 && (
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'
              }`}>
                <span className={`text-xs font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  +{userStories.length - 5}
                </span>
              </div>
            )}
          </div>

          {/* View Toggle (Right) */}
          <div className={`flex-shrink-0 flex rounded-full p-1 transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-700/30' : 'bg-white/70'
          }`}>
            <button
              onClick={() => onViewModeChange('feed')}
              className={`flex items-center gap-1 px-3 py-2 rounded-full transition-all duration-300 transform hover:scale-105 whitespace-nowrap ${
                viewMode === 'feed'
                  ? `${themeColors.primary} ${themeColors.primaryText} shadow-lg`
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/70'
              }`}
            >
              <List className="w-3 h-3" />
              <span className="text-xs font-medium">Feed</span>
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`flex items-center gap-1 px-3 py-2 rounded-full transition-all duration-300 transform hover:scale-105 whitespace-nowrap ${
                viewMode === 'grid'
                  ? `${themeColors.primary} ${themeColors.primaryText} shadow-lg`
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/70'
              }`}
            >
              <Grid3X3 className="w-3 h-3" />
              <span className="text-xs font-medium">Raster</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Upload Options */}
      <div className="px-4 py-3">
        {!showUploadOptions && !showNoteInput && (
          <button
            onClick={() => setShowUploadOptions(true)}
            disabled={isUploading}
            className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 font-medium ${
              isUploading
                ? 'opacity-50 cursor-not-allowed'
                : `${themeColors.primary} ${themeColors.primaryHover} ${themeColors.primaryText} shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]`
            }`}
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm">
              Neuer Beitrag
            </span>
          </button>
        )}

        {showUploadOptions && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Photo/Video Upload */}
              <label className={`group flex flex-col items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                isDarkMode 
                  ? `${themeColors.primaryLight} hover:bg-gray-700/30 border ${themeColors.primaryBorder} backdrop-blur-sm` 
                  : `${themeColors.primaryLight} hover:bg-white/70 border ${themeColors.primaryBorder} backdrop-blur-sm`
              }`} style={{ minHeight: '80px' }}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isDarkMode ? 'bg-white/10 group-hover:bg-white/20' : 'bg-black/10 group-hover:bg-black/20'
                }`}>
                  <Camera className={`w-5 h-5 ${isDarkMode ? 'text-white/90' : 'text-gray-800'}`} />
                </div>
                <span className={`text-xs font-medium text-center leading-tight ${isDarkMode ? 'text-white/90' : 'text-gray-800'}`}>
                  Fotos & Videos
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>

              {/* Note */}
              <button
                onClick={() => {
                  setShowNoteInput(true);
                  setShowUploadOptions(false);
                }}
                className={`group flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                  isDarkMode 
                    ? `${themeColors.primaryLight} hover:bg-gray-700/30 border ${themeColors.primaryBorder} backdrop-blur-sm` 
                    : `${themeColors.primaryLight} hover:bg-white/70 border ${themeColors.primaryBorder} backdrop-blur-sm`
                }`}
                style={{ minHeight: '80px' }}
                disabled={isUploading}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isDarkMode ? 'bg-white/10 group-hover:bg-white/20' : 'bg-black/10 group-hover:bg-black/20'
                }`}>
                  <FileText className={`w-5 h-5 ${isDarkMode ? 'text-white/90' : 'text-gray-800'}`} />
                </div>
                <span className={`text-xs font-medium text-center leading-tight ${isDarkMode ? 'text-white/90' : 'text-gray-800'}`}>
                  {themeTexts?.noteTitle || 'Notiz'}
                </span>
              </button>
            </div>

            <button
              onClick={() => setShowUploadOptions(false)}
              className={`w-full py-2.5 px-4 rounded-xl transition-all duration-300 text-sm font-medium ${
                isDarkMode 
                  ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 backdrop-blur-sm' 
                  : 'bg-gray-100/80 hover:bg-gray-200/80 text-gray-600 backdrop-blur-sm'
              }`}
            >
              Abbrechen
            </button>
          </div>
        )}

        {showNoteInput && (
          <form onSubmit={handleNoteSubmit} className="space-y-4">
            <div className={`rounded-xl p-1 transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-700/30' : 'bg-white/70'
            }`}>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={themeTexts?.notePlaceholder || "Was möchtest du teilen?"}
                className={`w-full p-3 rounded-lg border-0 transition-colors duration-300 resize-none backdrop-blur-sm ${
                  isDarkMode 
                    ? 'bg-gray-700/50 text-white placeholder-gray-400 focus:bg-gray-700/70' 
                    : 'bg-white/50 text-gray-900 placeholder-gray-500 focus:bg-white/80'
                }`}
                rows={3}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!noteText.trim() || isUploading}
                className={`flex-1 py-2.5 px-4 rounded-xl transition-all duration-300 font-medium ${
                  !noteText.trim() || isUploading
                    ? 'opacity-50 cursor-not-allowed bg-gray-400'
                    : `${themeColors.primary} ${themeColors.primaryHover} ${themeColors.primaryText} shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]`
                }`}
              >
                <span className="text-sm">Teilen</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNoteInput(false);
                  setNoteText('');
                }}
                className={`px-4 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium ${
                  isDarkMode 
                    ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 backdrop-blur-sm' 
                    : 'bg-gray-100/80 hover:bg-gray-200/80 text-gray-600 backdrop-blur-sm'
                }`}
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}

        {/* Upload Progress */}
        {isUploading && progress > 0 && (
          <div className={`mt-4 p-3 rounded-xl backdrop-blur-sm ${
            isDarkMode ? 'bg-gray-700/30' : 'bg-white/70'
          }`}>
            <div className={`w-full rounded-full h-2 transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
            }`}>
              <div 
                className={`h-2 rounded-full transition-all duration-500 ease-out ${themeColors.primary}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Wird hochgeladen...
              </p>
              <p className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {Math.round(progress)}%
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};