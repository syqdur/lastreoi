import React from 'react';
import { Router } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { GalleryRouter } from './components/GalleryRouter';
import { useDarkMode } from './hooks/useDarkMode';
import { queryClient } from './lib/queryClient';

function App() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className={`min-h-screen transition-colors duration-300 ${
          isDarkMode ? 'dark' : ''
        }`}>
          <GalleryRouter 
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
