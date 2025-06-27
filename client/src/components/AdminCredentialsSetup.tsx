import React, { useState } from 'react';
import { X, Save, Eye, EyeOff, Shield } from 'lucide-react';

interface AdminCredentialsSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSetup: (credentials: { username: string; password: string }) => Promise<void>;
  isDarkMode: boolean;
  galleryName: string;
}

export const AdminCredentialsSetup: React.FC<AdminCredentialsSetupProps> = ({
  isOpen,
  onClose,
  onSetup,
  isDarkMode,
  galleryName
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!username.trim()) {
      setError('Benutzername ist erforderlich');
      return;
    }
    if (username.length < 3) {
      setError('Benutzername muss mindestens 3 Zeichen lang sein');
      return;
    }
    if (!password) {
      setError('Passwort ist erforderlich');
      return;
    }
    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    setIsLoading(true);
    try {
      await onSetup({ username: username.trim(), password });
      onClose();
    } catch (error: any) {
      setError(error.message || 'Fehler beim Einrichten der Admin-Zugangsdaten');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-lg shadow-xl ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'border-gray-600' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold">Admin-Zugangsdaten einrichten</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full hover:bg-gray-100 ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className={`mb-4 p-4 rounded-lg ${
            isDarkMode ? 'bg-blue-900/30 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'
          }`}>
            <h3 className="font-medium mb-2">Willkommen bei {galleryName}!</h3>
            <p className="text-sm opacity-75">
              Als Galerie-Ersteller müssen Sie Admin-Zugangsdaten festlegen, um später auf die Verwaltungsfunktionen zugreifen zu können.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Admin-Benutzername
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="z.B. admin oder ihr-name"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Admin-Passwort
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-3 py-2 pr-10 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Mindestens 6 Zeichen"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 opacity-50" />
                  ) : (
                    <Eye className="w-4 h-4 opacity-50" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Passwort bestätigen
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Passwort wiederholen"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Einrichten...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Admin-Zugangsdaten einrichten</span>
                </div>
              )}
            </button>
          </form>

          <div className={`mt-4 text-xs opacity-75 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            💡 Diese Zugangsdaten werden benötigt, um später auf Galerie-Einstellungen, Benutzerverwaltung und andere Admin-Funktionen zuzugreifen.
          </div>
        </div>
      </div>
    </div>
  );
};
