import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Gallery } from '../services/galleryService';

interface GalleryPasswordPromptProps {
  gallery: Gallery;
  isDarkMode: boolean;
  onSubmit: (password: string) => Promise<void>;
  onCancel: () => void;
}

export const GalleryPasswordPrompt: React.FC<GalleryPasswordPromptProps> = ({
  gallery,
  isDarkMode,
  onSubmit,
  onCancel
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Bitte geben Sie das Passwort ein');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(password);
    } catch (error: any) {
      setError(error.message || 'Falsches Passwort');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-pink-50 via-white to-purple-50'
    }`}>
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${
          isDarkMode ? 'bg-pink-500' : 'bg-pink-300'
        }`}></div>
        <div className={`absolute bottom-20 right-20 w-24 h-24 rounded-full blur-2xl opacity-30 ${
          isDarkMode ? 'bg-purple-500' : 'bg-purple-300'
        }`}></div>
      </div>

      <div className={`relative max-w-md w-full p-8 rounded-3xl border backdrop-blur-xl ${
        isDarkMode 
          ? 'bg-gray-800/90 border-gray-700/50 shadow-2xl' 
          : 'bg-white/90 border-gray-200/50 shadow-2xl'
      }`}>
        {/* Back Button */}
        <button
          onClick={onCancel}
          className={`absolute top-6 left-6 p-2 rounded-full transition-colors ${
            isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          {/* Lock Icon */}
          <div className={`inline-flex p-4 rounded-full mb-6 ${
            isDarkMode ? 'bg-pink-600/20 text-pink-400' : 'bg-pink-100 text-pink-600'
          }`}>
            <Lock className="w-8 h-8" />
          </div>

          {/* Title */}
          <h2 className={`text-2xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Geschützte Galerie
          </h2>

          {/* Gallery Info */}
          <div className={`mb-6 p-4 rounded-xl ${
            isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <h3 className={`font-semibold mb-1 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {gallery.eventName}
            </h3>
            {gallery.description && (
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {gallery.description}
              </p>
            )}
            {gallery.eventDate && (
              <p className={`text-sm mt-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                📅 {new Date(gallery.eventDate).toLocaleDateString('de-DE')}
              </p>
            )}
          </div>

          <p className={`text-sm mb-6 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Diese Galerie ist passwortgeschützt. Bitte geben Sie das Passwort ein, um fortzufahren.
          </p>

          {/* Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Passwort eingeben"
                className={`w-full px-4 py-3 pr-12 rounded-xl border transition-colors ${
                  error
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500/20' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-pink-500 focus:ring-pink-500/20'
                } focus:outline-none focus:ring-2`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-left">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className={`flex-1 px-4 py-3 rounded-xl border transition-colors ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !password.trim()}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                  isSubmitting || !password.trim()
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : isDarkMode
                      ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white'
                      : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Prüfe...
                  </div>
                ) : (
                  'Zugang'
                )}
              </button>
            </div>
          </form>

          <p className={`text-xs mt-4 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Das Passwort wurde von den Gastgebern festgelegt
          </p>
        </div>
      </div>
    </div>
  );
};
