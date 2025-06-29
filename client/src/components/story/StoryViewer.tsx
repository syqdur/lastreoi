import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { useStoryStore } from '../../stores/storyStore';

interface Story {
  id: string;
  userId: string;
  userName: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  createdAt: string;
  duration?: number; // for videos
}

interface StoryViewerProps {
  stories: Story[];
  initialStoryIndex: number;
  initialUserIndex: number;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  initialStoryIndex,
  initialUserIndex,
  onClose,
  isDarkMode = false
}) => {
  const { markAsViewed, removeRing } = useStoryStore();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout>();

  // Group stories by user
  const storiesByUser = React.useMemo(() => {
    const grouped = stories.reduce((acc, story) => {
      if (!acc[story.userId]) {
        acc[story.userId] = [];
      }
      acc[story.userId].push(story);
      return acc;
    }, {} as Record<string, Story[]>);
    
    return Object.entries(grouped).map(([userId, userStories]) => ({
      userId,
      userName: userStories[0].userName,
      stories: userStories.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }));
  }, [stories]);

  const currentUserStories = storiesByUser[currentUserIndex];
  const currentStory = currentUserStories?.stories[currentStoryIndex];

  const STORY_DURATION = 5000; // 5 seconds for images
  
  // Mark story as viewed and handle ring removal
  useEffect(() => {
    if (currentStory) {
      markAsViewed(currentStory.id);
      
      // Check if this is the last story for this user
      const isLastStoryForUser = currentStoryIndex === currentUserStories.stories.length - 1;
      if (isLastStoryForUser) {
        removeRing(currentStory.userId);
      }
    }
  }, [currentStory, currentStoryIndex, currentUserStories, markAsViewed, removeRing]);

  // Progress tracking
  useEffect(() => {
    if (!currentStory || isPaused) return;

    const duration = currentStory.mediaType === 'video' 
      ? (currentStory.duration || 15) * 1000 
      : STORY_DURATION;

    setProgress(0);
    
    if (currentStory.mediaType === 'video' && videoRef.current) {
      const video = videoRef.current;
      const updateProgress = () => {
        if (video.duration > 0) {
          setProgress((video.currentTime / video.duration) * 100);
        }
      };
      
      video.addEventListener('timeupdate', updateProgress);
      return () => video.removeEventListener('timeupdate', updateProgress);
    } else {
      // Image story
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (100 / (duration / 100));
          if (newProgress >= 100) {
            advanceStory();
            return 100;
          }
          return newProgress;
        });
      }, 100);
      
      progressIntervalRef.current = interval;
      return () => clearInterval(interval);
    }
  }, [currentStory, isPaused]);

  const advanceStory = useCallback(() => {
    if (currentStoryIndex < currentUserStories.stories.length - 1) {
      // Next story for current user
      setCurrentStoryIndex(prev => prev + 1);
    } else if (currentUserIndex < storiesByUser.length - 1) {
      // Next user's first story
      setCurrentUserIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      // End of all stories
      onClose();
    }
  }, [currentStoryIndex, currentUserIndex, currentUserStories, storiesByUser, onClose]);

  const goToPreviousStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      // Previous story for current user
      setCurrentStoryIndex(prev => prev - 1);
    } else if (currentUserIndex > 0) {
      // Previous user's last story
      const prevUserIndex = currentUserIndex - 1;
      setCurrentUserIndex(prevUserIndex);
      setCurrentStoryIndex(storiesByUser[prevUserIndex].stories.length - 1);
    }
  }, [currentStoryIndex, currentUserIndex, storiesByUser]);

  const togglePlayPause = useCallback(() => {
    if (currentStory?.mediaType === 'video' && videoRef.current) {
      if (isPaused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
    setIsPaused(!isPaused);
  }, [currentStory, isPaused]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        goToPreviousStory();
        break;
      case 'ArrowRight':
        advanceStory();
        break;
      case ' ':
        e.preventDefault();
        togglePlayPause();
        break;
    }
  }, [onClose, goToPreviousStory, advanceStory, togglePlayPause]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 z-50">
        <div className="flex gap-1">
          {currentUserStories.stories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width: index === currentStoryIndex 
                    ? `${progress}%` 
                    : index < currentStoryIndex 
                    ? '100%' 
                    : '0%'
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
              {currentStory.userName.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <div className="text-white font-medium text-sm">{currentStory.userName}</div>
            <div className="text-white/70 text-xs">
              {new Date(currentStory.createdAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation areas */}
      <button
        onClick={goToPreviousStory}
        className="absolute left-0 top-0 w-1/3 h-full z-40 focus:outline-none"
        disabled={currentUserIndex === 0 && currentStoryIndex === 0}
      />
      
      <button
        onClick={advanceStory}
        className="absolute right-0 top-0 w-1/3 h-full z-40 focus:outline-none"
      />

      {/* Content area for play/pause */}
      <button
        onClick={togglePlayPause}
        className="absolute left-1/3 top-0 w-1/3 h-full z-40 flex items-center justify-center focus:outline-none"
      >
        {isPaused && currentStory.mediaType === 'video' && (
          <div className="bg-black/50 rounded-full p-4">
            <Play className="w-8 h-8 text-white" />
          </div>
        )}
      </button>

      {/* Story content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {currentStory.mediaType === 'image' ? (
          <img
            src={currentStory.mediaUrl}
            alt="Story"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            src={currentStory.mediaUrl}
            className="max-w-full max-h-full object-contain"
            autoPlay
            muted
            playsInline
            onEnded={advanceStory}
            onPlay={() => setIsPaused(false)}
            onPause={() => setIsPaused(true)}
          />
        )}
      </div>

      {/* Navigation indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
        <ChevronLeft className="w-6 h-6 text-white/50" />
        <span className="text-white/70 text-sm">
          {currentUserIndex + 1} / {storiesByUser.length}
        </span>
        <ChevronRight className="w-6 h-6 text-white/50" />
      </div>
    </div>
  );
};