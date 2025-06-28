import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Settings, Users, Music, Image, Download, ToggleLeft, ToggleRight } from 'lucide-react';

interface AdminTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  galleryTheme: 'hochzeit' | 'geburtstag' | 'urlaub' | 'eigenes';
}

interface AdminTutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

const getThemeColors = (theme: 'hochzeit' | 'geburtstag' | 'urlaub' | 'eigenes') => {
  switch (theme) {
    case 'hochzeit':
      return {
        primary: 'from-pink-500 to-rose-500',
        light: 'from-pink-100 to-rose-100',
        text: 'text-pink-600',
        bg: 'bg-pink-50',
        border: 'border-pink-200',
        button: 'bg-pink-500 hover:bg-pink-600',
        accent: 'bg-pink-100 text-pink-800'
      };
    case 'geburtstag':
      return {
        primary: 'from-purple-500 to-violet-500',
        light: 'from-purple-100 to-violet-100',
        text: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        button: 'bg-purple-500 hover:bg-purple-600',
        accent: 'bg-purple-100 text-purple-800'
      };
    case 'urlaub':
      return {
        primary: 'from-blue-500 to-cyan-500',
        light: 'from-blue-100 to-cyan-100',
        text: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        button: 'bg-blue-500 hover:bg-blue-600',
        accent: 'bg-blue-100 text-blue-800'
      };
    case 'eigenes':
      return {
        primary: 'from-green-500 to-emerald-500',
        light: 'from-green-100 to-emerald-100',
        text: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        button: 'bg-green-500 hover:bg-green-600',
        accent: 'bg-green-100 text-green-800'
      };
    default:
      return {
        primary: 'from-pink-500 to-rose-500',
        light: 'from-pink-100 to-rose-100',
        text: 'text-pink-600',
        bg: 'bg-pink-50',
        border: 'border-pink-200',
        button: 'bg-pink-500 hover:bg-pink-600',
        accent: 'bg-pink-100 text-pink-800'
      };
  }
};

export const AdminTutorial: React.FC<AdminTutorialProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  galleryTheme
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const colors = getThemeColors(galleryTheme);

  const adminSteps: AdminTutorialStep[] = [
    {
      id: 'welcome',
      title: 'Admin-Modus aktiviert',
      description: 'Willkommen im Admin-Bereich! Als Galerie-Ersteller haben Sie Zugriff auf erweiterte Verwaltungsfunktionen.',
      icon: <Settings className="w-8 h-8" />,
      highlight: 'Sie sind der einzige Admin dieser Galerie'
    },
    {
      id: 'user-management',
      title: 'Benutzer-Verwaltung',
      description: 'Verwalten Sie alle Besucher Ihrer Galerie. Sie können Profile bearbeiten, Benutzer löschen und deren Aktivitäten überwachen.',
      icon: <Users className="w-8 h-8" />,
      highlight: 'Vollständige Kontrolle über alle Benutzer'
    },
    {
      id: 'feature-toggles',
      title: 'Feature-Einstellungen',
      description: 'Aktivieren oder deaktivieren Sie verschiedene Funktionen: Galerie, Musik-Wunschliste und Stories nach Bedarf.',
      icon: <ToggleRight className="w-8 h-8" />,
      highlight: 'Galerie • Musik • Stories'
    },
    {
      id: 'content-moderation',
      title: 'Inhalts-Moderation',
      description: 'Als Admin können Sie alle Inhalte bearbeiten oder löschen - Fotos, Videos, Kommentare und Notizen von allen Benutzern.',
      icon: <Image className="w-8 h-8" />,
      highlight: 'Bearbeiten und löschen Sie beliebige Inhalte'
    },
    {
      id: 'spotify-admin',
      title: 'Spotify-Verwaltung',
      description: 'Verwalten Sie die Musik-Wunschliste und Spotify-Integration. Verbinden Sie Ihr Spotify-Konto für erweiterte Funktionen.',
      icon: <Music className="w-8 h-8" />,
      highlight: 'Musik-Playlist und Spotify-Einstellungen'
    },
    {
      id: 'download',
      title: 'ZIP-Download',
      description: 'Laden Sie alle Galerie-Inhalte als ZIP-Datei herunter. Perfekt für Backups oder um alle Erinnerungen zu sammeln.',
      icon: <Download className="w-8 h-8" />,
      highlight: 'Alle Fotos und Videos herunterladen'
    }
  ];

  const currentStepData = adminSteps[currentStep];
  const totalSteps = adminSteps.length;

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 ${isDarkMode ? 'bg-black/70' : 'bg-black/50'} backdrop-blur-sm`}
        onClick={handleSkip}
      />
      
      {/* Tutorial Modal */}
      <div className={`relative w-full max-w-md mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl overflow-hidden`}>
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${colors.primary} p-6 text-white relative`}>
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-white/20 rounded-full">
              {currentStepData.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold">{currentStepData.title}</h2>
              <div className="text-white/80 text-sm">Admin-Tutorial</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
          <div className="text-white/80 text-sm mt-2">
            Schritt {currentStep + 1} von {totalSteps}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className={`text-base leading-relaxed mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {currentStepData.description}
            </p>
            
            {currentStepData.highlight && (
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-200' : colors.accent} text-sm font-medium`}>
                💡 {currentStepData.highlight}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === 0
                  ? isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Zurück</span>
            </button>

            <div className="flex space-x-2">
              {adminSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep
                      ? `bg-gradient-to-r ${colors.primary}`
                      : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {currentStep === totalSteps - 1 ? (
              <button
                onClick={handleSkip}
                className={`${colors.button} text-white px-6 py-2 rounded-lg font-medium transition-colors`}
              >
                Fertig
              </button>
            ) : (
              <button
                onClick={nextStep}
                className={`flex items-center space-x-2 ${colors.button} text-white px-4 py-2 rounded-lg transition-colors`}
              >
                <span>Weiter</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Skip option */}
          <div className="mt-4 text-center">
            <button
              onClick={handleSkip}
              className={`text-sm ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'} transition-colors`}
            >
              Tutorial überspringen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};