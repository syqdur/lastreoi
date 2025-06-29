import React from 'react';
import { Router } from 'wouter';
import { GalleryRouter } from './components/GalleryRouter';
import { useDarkMode } from './hooks/useDarkMode';

function App() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
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
  );
}

export default App;
