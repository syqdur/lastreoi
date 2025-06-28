import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Camera, Music, Heart, Users, MessageCircle, Calendar } from 'lucide-react';

interface GalleryTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  galleryTheme: 'hochzeit' | 'geburtstag' | 'urlaub' | 'eigenes';
}

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

export const GalleryTutorial: React.FC<GalleryTutorialProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  galleryTheme
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const getThemeColors = () => {
    switch (galleryTheme) {
      case 'hochzeit':
        return {
          primary: 'from-pink-500 to-rose-500',
          secondary: 'pink-500',
          accent: 'rose-500'
        };
      case 'geburtstag':
        return {
          primary: 'from-purple-500 to-violet-500',
          secondary: 'purple-500',
          accent: 'violet-500'
        };
      case 'urlaub':
        return {
          primary: 'from-blue-500 to-cyan-500',
          secondary: 'blue-500',
          accent: 'cyan-500'
        };
      case 'eigenes':
        return {
          primary: 'from-green-500 to-emerald-500',
          secondary: 'green-500',
          accent: 'emerald-500'
        };
    }
  };

  const themeColors = getThemeColors();

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Willkommen in der Event-Galerie!',
      description: 'Hier können Sie Fotos und Videos teilen, Erinnerungen festhalten und mit anderen Gästen interagieren. Lassen Sie uns die wichtigsten Funktionen erkunden.',
      icon: <Heart className="w-8 h-8" />
    },
    {
      id: 'upload',
      title: 'Fotos & Videos hochladen',
      description: 'Klicken Sie auf den Upload-Button, um Ihre Fotos und Videos zu teilen. Sie können auch direkt mit der Kamera aufnehmen oder Notizen hinterlassen.',
      icon: <Camera className="w-8 h-8" />,
      highlight: 'Upload-Bereich in der Mitte'
    },
    {
      id: 'interact',
      title: 'Mit Inhalten interagieren',
      description: 'Liken Sie Fotos mit einem Herz, kommentieren Sie Beiträge und taggen Sie andere Gäste in den Bildern. Jede Interaktion bringt Leben in die Galerie.',
      icon: <MessageCircle className="w-8 h-8" />,
      highlight: 'Herz- und Kommentar-Buttons unter den Bildern'
    },
    {
      id: 'music',
      title: 'Musikwünsche',
      description: 'Im Musik-Tab können Sie Ihre Lieblingssongs zur Playlist hinzufügen. Suchen Sie nach Songs und teilen Sie Ihre musikalischen Wünsche.',
      icon: <Music className="w-8 h-8" />,
      highlight: 'Musik-Tab in der Navigation'
    },
    {
      id: 'timeline',
      title: 'Event-Timeline',
      description: 'Verfolgen Sie wichtige Momente des Events in der Timeline. Hier werden besondere Ereignisse und Meilensteine festgehalten.',
      icon: <Calendar className="w-8 h-8" />,
      highlight: 'Timeline-Tab in der Navigation'
    },
    {
      id: 'profile',
      title: 'Ihr Profil',
      description: 'Personalisieren Sie Ihr Profil mit einem Foto und einem Namen. So erkennen andere Gäste Ihre Beiträge und können mit Ihnen interagieren.',
      icon: <Users className="w-8 h-8" />,
      highlight: 'Profil-Button oben rechts'
    }
  ];

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    onClose();
  };

  if (!isOpen) return null;

  const currentStepData = tutorialSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className={`max-w-md w-full rounded-3xl shadow-2xl transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gray-900/95 border border-gray-700/50' 
          : 'bg-white/95 border border-gray-200/50'
      }`}>
        {/* Header */}
        <div className="relative p-6 pb-4">
          <div className={`absolute inset-0 rounded-t-3xl bg-gradient-to-r ${themeColors.primary} opacity-10`} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl bg-gradient-to-r ${themeColors.primary} text-white shadow-lg`}>
                {currentStepData.icon}
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">
                  Schritt {currentStep + 1} von {tutorialSteps.length}
                </div>
                <h3 className={`text-lg font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {currentStepData.title}
                </h3>
              </div>
            </div>
            <button
              onClick={skipTutorial}
              className={`p-2 rounded-full transition-all duration-300 ${
                isDarkMode 
                  ? 'hover:bg-white/10 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pb-4">
          <div className={`w-full h-2 rounded-full ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div 
              className={`h-full rounded-full bg-gradient-to-r ${themeColors.primary} transition-all duration-500`}
              style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <p className={`text-sm leading-relaxed mb-4 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {currentStepData.description}
          </p>

          {currentStepData.highlight && (
            <div className={`p-3 rounded-xl border-2 border-dashed mb-6 ${
              isDarkMode 
                ? `border-${themeColors.secondary}/30 bg-${themeColors.secondary}/10` 
                : `border-${themeColors.secondary}/40 bg-${themeColors.secondary}/5`
            }`}>
              <p className={`text-xs font-medium ${
                isDarkMode ? `text-${themeColors.secondary}` : `text-${themeColors.accent}`
              }`}>
                💡 Hinweis: {currentStepData.highlight}
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                currentStep === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Zurück</span>
            </button>

            <button
              onClick={skipTutorial}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Tutorial überspringen
            </button>

            <button
              onClick={nextStep}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${themeColors.primary} text-white font-medium transition-all duration-300 hover:scale-105 shadow-lg`}
            >
              <span className="text-sm">
                {currentStep === tutorialSteps.length - 1 ? 'Fertig' : 'Weiter'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};