import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, Trash2, Users, Camera, Globe, Shield } from 'lucide-react';

interface SimpleRootAdminProps {
  isDarkMode: boolean;
  onBack: () => void;
}

interface GalleryData {
  id: number;
  firebaseId: string;
  slug: string;
  eventName: string;
  ownerName: string;
  ownerEmail: string;
  password: string;
  description: string;
  eventDate: string;
  endDate: string;
  createdAt: string;
  mediaCount: number;
  visitorCount: number;
}

export const SimpleRootAdmin: React.FC<SimpleRootAdminProps> = ({ isDarkMode, onBack }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [galleries, setGalleries] = useState<GalleryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState<GalleryData | null>(null);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/root-admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setIsLoggedIn(true);
        showMessage('Logged in successfully', 'success');
        fetchGalleries();
      } else {
        showMessage(result.error || 'Invalid credentials', 'error');
      }
    } catch (error) {
      showMessage('Login failed', 'error');
    }
    setIsLoggingIn(false);
  };

  const fetchGalleries = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/root-admin/galleries');
      if (response.ok) {
        const data = await response.json();
        setGalleries(data);
      } else {
        showMessage('Failed to fetch galleries', 'error');
      }
    } catch (error) {
      showMessage('Failed to fetch galleries', 'error');
    }
    setIsLoading(false);
  };

  const handleDeleteGallery = async (gallery: GalleryData) => {
    if (!confirm(`Are you sure you want to delete "${gallery.eventName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/root-admin/galleries/${gallery.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showMessage('Gallery deleted successfully', 'success');
        fetchGalleries();
      } else {
        showMessage('Failed to delete gallery', 'error');
      }
    } catch (error) {
      showMessage('Failed to delete gallery', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const totalMedia = galleries.reduce((sum, g) => sum + (g.mediaCount || 0), 0);
  const totalVisitors = galleries.reduce((sum, g) => sum + (g.visitorCount || 0), 0);

  // Login form
  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isDarkMode ? 'bg-neutral-900' : 'bg-gradient-to-br from-pink-50 to-purple-50'
      }`}>
        <div className={`w-full max-w-md p-8 rounded-2xl shadow-xl ${
          isDarkMode ? 'bg-neutral-800 border border-neutral-700' : 'bg-white/90 backdrop-blur-sm'
        }`}>
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 text-2xl font-bold mb-2">
              <Shield className="h-6 w-6 text-purple-600" />
              Root Admin Access
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full p-3 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-neutral-700 border-neutral-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className={`w-full p-3 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-neutral-700 border-neutral-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              />
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={onBack}
                className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                  isDarkMode
                    ? 'border-neutral-600 text-gray-300 hover:bg-neutral-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ArrowLeft className="h-4 w-4 inline mr-2" />
                Back
              </button>
              <button
                onClick={handleLogin}
                disabled={isLoggingIn || !username || !password}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className={`min-h-screen p-4 ${
      isDarkMode ? 'bg-neutral-900' : 'bg-gradient-to-br from-pink-50 to-purple-50'
    }`}>
      {/* Message Toast */}
      {message && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          message.type === 'success' 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          {message.text}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className={`px-3 py-2 rounded-lg border transition-colors ${
                isDarkMode
                  ? 'border-neutral-600 text-gray-300 hover:bg-neutral-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ArrowLeft className="h-4 w-4 mr-2 inline" />
              Back to Landing
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-purple-600" />
              Root Admin Dashboard
            </h1>
          </div>
          <button 
            onClick={() => {
              setIsLoggedIn(false);
              setUsername('');
              setPassword('');
            }}
            className={`px-3 py-2 rounded-lg border transition-colors ${
              isDarkMode
                ? 'border-neutral-600 text-gray-300 hover:bg-neutral-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`p-6 rounded-xl shadow-lg ${
            isDarkMode ? 'bg-neutral-800 border border-neutral-700' : 'bg-white/90 backdrop-blur-sm'
          }`}>
            <div className="flex items-center gap-3">
              <Globe className="h-6 w-6 text-blue-600" />
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Galleries
                </p>
                <p className="text-2xl font-bold">{galleries.length}</p>
              </div>
            </div>
          </div>
          
          <div className={`p-6 rounded-xl shadow-lg ${
            isDarkMode ? 'bg-neutral-800 border border-neutral-700' : 'bg-white/90 backdrop-blur-sm'
          }`}>
            <div className="flex items-center gap-3">
              <Camera className="h-6 w-6 text-green-600" />
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Media
                </p>
                <p className="text-2xl font-bold">{totalMedia}</p>
              </div>
            </div>
          </div>
          
          <div className={`p-6 rounded-xl shadow-lg ${
            isDarkMode ? 'bg-neutral-800 border border-neutral-700' : 'bg-white/90 backdrop-blur-sm'
          }`}>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-purple-600" />
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Visitors
                </p>
                <p className="text-2xl font-bold">{totalVisitors}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Galleries Table */}
        <div className={`rounded-xl shadow-lg overflow-hidden ${
          isDarkMode ? 'bg-neutral-800 border border-neutral-700' : 'bg-white/90 backdrop-blur-sm'
        }`}>
          <div className="p-6 border-b border-gray-200 dark:border-neutral-700">
            <h2 className="text-xl font-bold">All Galleries</h2>
          </div>
          
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : galleries.length === 0 ? (
              <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No galleries found
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${isDarkMode ? 'border-neutral-700' : 'border-gray-200'}`}>
                      <th className="text-left p-3 font-medium">Event Name</th>
                      <th className="text-left p-3 font-medium">Owner</th>
                      <th className="text-left p-3 font-medium">Slug</th>
                      <th className="text-center p-3 font-medium">Media</th>
                      <th className="text-center p-3 font-medium">Visitors</th>
                      <th className="text-left p-3 font-medium">Password</th>
                      <th className="text-left p-3 font-medium">Created</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {galleries.map((gallery) => (
                      <tr 
                        key={gallery.id} 
                        className={`border-b hover:bg-opacity-50 ${
                          isDarkMode 
                            ? 'border-neutral-700 hover:bg-neutral-700' 
                            : 'border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <td className="p-3 font-medium">{gallery.eventName}</td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{gallery.ownerName || 'Unknown'}</p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {gallery.ownerEmail || 'No email'}
                            </p>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-mono ${
                            isDarkMode ? 'bg-neutral-700 text-purple-300' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {gallery.slug}
                          </span>
                        </td>
                        <td className="p-3 text-center">{gallery.mediaCount || 0}</td>
                        <td className="p-3 text-center">{gallery.visitorCount || 0}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-mono ${
                            isDarkMode ? 'bg-neutral-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {gallery.password || 'No password'}
                          </span>
                        </td>
                        <td className="p-3">{formatDate(gallery.createdAt)}</td>
                        <td className="p-3">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => setSelectedGallery(gallery)}
                              className={`p-2 rounded-lg transition-colors ${
                                isDarkMode
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteGallery(gallery)}
                              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Gallery Details Modal */}
        {selectedGallery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`max-w-2xl w-full rounded-xl shadow-xl ${
              isDarkMode ? 'bg-neutral-800 border border-neutral-700' : 'bg-white'
            }`}>
              <div className="p-6 border-b border-gray-200 dark:border-neutral-700">
                <h3 className="text-xl font-bold">Gallery Details</h3>
              </div>
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Event Name
                    </label>
                    <p className="mt-1">{selectedGallery.eventName}</p>
                  </div>
                  <div>
                    <label className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Slug
                    </label>
                    <p className="mt-1 font-mono">{selectedGallery.slug}</p>
                  </div>
                  <div>
                    <label className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Owner Name
                    </label>
                    <p className="mt-1">{selectedGallery.ownerName || 'Not set'}</p>
                  </div>
                  <div>
                    <label className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Owner Email
                    </label>
                    <p className="mt-1">{selectedGallery.ownerEmail || 'Not set'}</p>
                  </div>
                  <div>
                    <label className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Password
                    </label>
                    <p className={`mt-1 p-2 rounded font-mono text-sm ${
                      isDarkMode ? 'bg-neutral-700' : 'bg-gray-100'
                    }`}>
                      {selectedGallery.password || 'No password'}
                    </p>
                  </div>
                  <div>
                    <label className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Firebase ID
                    </label>
                    <p className="mt-1 font-mono text-xs break-all">{selectedGallery.firebaseId}</p>
                  </div>
                  <div>
                    <label className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Event Date
                    </label>
                    <p className="mt-1">{formatDate(selectedGallery.eventDate)}</p>
                  </div>
                  <div>
                    <label className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      End Date
                    </label>
                    <p className="mt-1">{formatDate(selectedGallery.endDate)}</p>
                  </div>
                  <div>
                    <label className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Media Count
                    </label>
                    <p className="mt-1">{selectedGallery.mediaCount || 0}</p>
                  </div>
                  <div>
                    <label className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Visitor Count
                    </label>
                    <p className="mt-1">{selectedGallery.visitorCount || 0}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <label className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description
                  </label>
                  <p className="mt-1">{selectedGallery.description || 'No description'}</p>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-neutral-700">
                <button
                  onClick={() => setSelectedGallery(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};