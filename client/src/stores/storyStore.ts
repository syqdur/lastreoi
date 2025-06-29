import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoryState {
  viewedStories: string[];
  hiddenRings: string[];
}

interface StoryStore extends StoryState {
  markAsViewed: (storyId: string) => void;
  removeRing: (userId: string) => void;
  isStoryViewed: (storyId: string) => boolean;
  shouldShowRing: (userId: string) => boolean;
  clearViewedStories: () => void;
}

export const useStoryStore = create<StoryStore>()(
  persist(
    (set, get) => ({
      viewedStories: [],
      hiddenRings: [],
      
      markAsViewed: (storyId: string) => {
        set((state) => ({
          viewedStories: state.viewedStories.includes(storyId) 
            ? state.viewedStories 
            : [...state.viewedStories, storyId]
        }));
      },
      
      removeRing: (userId: string) => {
        set((state) => ({
          hiddenRings: state.hiddenRings.includes(userId) 
            ? state.hiddenRings 
            : [...state.hiddenRings, userId]
        }));
      },
      
      isStoryViewed: (storyId: string) => {
        return get().viewedStories.includes(storyId);
      },
      
      shouldShowRing: (userId: string) => {
        return !get().hiddenRings.includes(userId);
      },
      
      clearViewedStories: () => {
        set({ viewedStories: [], hiddenRings: [] });
      }
    }),
    {
      name: 'story-store'
    }
  )
);