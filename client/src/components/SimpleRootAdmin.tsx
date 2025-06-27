import React, { useState, useEffect } from 'react';
import { Eye, Trash2, Users, Camera, Globe, ArrowLeft, LogOut, Shield, Loader2 } from 'lucide-react';
import { galleryService, Gallery } from '../services/galleryService';
import { getAllGalleryUserProfiles } from '../services/galleryFirebaseService';
import { apiRequest } from '../config/api';

interface SimpleRootAdminProps {
  isDarkMode: boolean;
  onBack: () => void;
}

interface GalleryData extends Gallery {
  visitorCount: number;
  mediaCount: number;
}

interface LoginData {
  username: string;
  password: string;
}

export const SimpleRootAdmin: React.FC<SimpleRootAdminProps> = ({ isDarkMode, onBack }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState<LoginData>({ username: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState<GalleryData | null>(null);
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [galleries, setGalleries] = useState<GalleryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingGallery, setIsDeletingGallery] = useState<string | null>(null);
  const [showGalleryDetails, setShowGalleryDetails] = useState(false);
  const [selectedGalleries, setSelectedGalleries] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const toast = (message: {title: string, description: string, variant?: string}) => {
    setShowToast({
      message: message.description,
      type: message.variant === 'destructive' ? 'error' : 'success'
    });
    setTimeout(() => setShowToast(null), 3000);
  };

  const fetchGalleries = async () => {
    if (!isLoggedIn) return;
    
    setIsLoading(true);
    try {
      // Fetch all galleries from Firebase
      const firebaseGalleries = await galleryService.getAllGalleries();
      
      // For each gallery, get visitor count and media count
      const galleriesWithStats = await Promise.all(
        firebaseGalleries.map(async (gallery) => {
          try {
            // Get visitor profiles for this gallery
            const userProfiles = await getAllGalleryUserProfiles(gallery.id);
            const visitorCount = userProfiles.length;
            
            // Use stats from gallery if available, otherwise default to 0
            const mediaCount = gallery.stats?.totalMedia || 0;
            
            return {
              ...gallery,
              visitorCount,
              mediaCount
            } as GalleryData;
          } catch (error) {
            console.error(`Error fetching stats for gallery ${gallery.id}:`, error);
            return {
              ...gallery,
              visitorCount: 0,
              mediaCount: gallery.stats?.totalMedia || 0
            } as GalleryData;
          }
        })
      );
      
      setGalleries(galleriesWithStats);
    } catch (error) {
      console.error("Error fetching galleries:", error);
      toast({ title: "Error", description: "Failed to fetch galleries from Firebase", variant: "destructive" });
    }
    setIsLoading(false);
  };

  // Fetch galleries when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchGalleries();
    }
  }, [isLoggedIn]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const response = await fetch('/.netlify/functions/root-admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setIsLoggedIn(true);
        toast({
          title: "Success",
          description: "Logged in successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Login failed",
        variant: "destructive",
      });
    }
    setIsLoggingIn(false);
  };

  const handleDeleteGallery = async (gallery: GalleryData) => {
    if (confirm(`Are you sure you want to delete "${gallery.eventName}"? This action cannot be undone and will remove all associated data including visitor profiles, media, and comments.`)) {
      setIsDeletingGallery(gallery.id);
      try {
        // Delete gallery from Firebase using galleryService
        await galleryService.deleteGallery(gallery.id);
        
        // Remove gallery from local state
        setGalleries(prev => prev.filter(g => g.id !== gallery.id));
        toast({
          title: "Success",
          description: `Gallery "${gallery.eventName}" deleted successfully`,
        });
      } catch (error) {
        console.error("Error deleting gallery:", error);
        toast({
          title: "Error",
          description: "Failed to delete gallery from Firebase",
          variant: "destructive",
        });
      }
      setIsDeletingGallery(null);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginData({ username: '', password: '' });
    setGalleries([]);
    setSelectedGalleries(new Set());
  };

  // Handle individual gallery selection
  const handleGallerySelect = (galleryId: string) => {
    const newSelected = new Set(selectedGalleries);
    if (newSelected.has(galleryId)) {
      newSelected.delete(galleryId);
    } else {
      newSelected.add(galleryId);
    }
    setSelectedGalleries(newSelected);
  };

  // Handle select all galleries
  const handleSelectAll = () => {
    if (selectedGalleries.size === galleries.length) {
      setSelectedGalleries(new Set());
    } else {
      setSelectedGalleries(new Set(galleries.map(g => g.id)));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedGalleries.size === 0) {
      toast({ title: "Error", description: "No galleries selected", variant: "destructive" });
      return;
    }

    const selectedCount = selectedGalleries.size;
    if (confirm(`Are you sure you want to delete ${selectedCount} gallery(ies)? This action cannot be undone and will remove all associated data including visitor profiles, media, and comments.`)) {
      setIsBulkDeleting(true);
      
      try {
        // Delete galleries in parallel for better performance
        const deletePromises = Array.from(selectedGalleries).map(async (galleryId) => {
          try {
            await galleryService.deleteGallery(galleryId);
            return { galleryId, success: true };
          } catch (error) {
            console.error(`Error deleting gallery ${galleryId}:`, error);
            return { galleryId, success: false, error };
          }
        });

        const results = await Promise.all(deletePromises);
        
        // Count successes and failures
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        // Remove successfully deleted galleries from state
        if (successful.length > 0) {
          const successfulIds = new Set(successful.map(r => r.galleryId));
          setGalleries(prev => prev.filter(g => !successfulIds.has(g.id)));
          setSelectedGalleries(new Set());
        }

        // Show results
        if (failed.length === 0) {
          toast({
            title: "Success",
            description: `Successfully deleted ${successful.length} gallery(ies)`,
          });
        } else {
          toast({
            title: "Partial Success",
            description: `Deleted ${successful.length} galleries, failed to delete ${failed.length}`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Bulk delete error:", error);
        toast({
          title: "Error",
          description: "Failed to delete galleries",
          variant: "destructive",
        });
      }
      
      setIsBulkDeleting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  // Login form with Instagram 2.0 styling
  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen relative overflow-hidden flex items-center justify-center p-4 ${
        isDarkMode ? 'bg-neutral-900' : 'bg-white'
      }`}>
        {/* Modern Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute inset-0 opacity-20 ${
            isDarkMode ? 'opacity-10' : 'opacity-20'
          }`} style={{
            background: `
              radial-gradient(circle at 20% 80%, #ec4899 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, #06b6d4 0%, transparent 50%)
            `
          }} />
          
          {/* Floating shapes */}
          <div className="absolute top-20 left-20 w-32 h-32 rounded-3xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 animate-float" />
          <div className="absolute bottom-32 right-32 w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 animate-float-delay-1" />
        </div>

        <div className={`w-full max-w-md rounded-3xl shadow-2xl backdrop-blur-xl border relative z-10 ${
          isDarkMode 
            ? 'bg-neutral-800/80 border-neutral-700/50' 
            : 'bg-white/90 border-white/20'
        }`}>
          <div className="p-8">
            {/* Header with enhanced styling */}
            <div className="text-center mb-8">
              <div className="relative mb-4">
                <div className="p-4 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl w-fit mx-auto shadow-lg">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-pink-500/20 to-purple-600/20 rounded-2xl blur-xl" />
              </div>
              <h2 className={`text-3xl font-bold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Root Admin Access
              </h2>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Secure access to Telya administration
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="username" className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-neutral-700/50 border-neutral-600/50 text-white placeholder-gray-400 backdrop-blur-sm' 
                      : 'bg-white/70 border-gray-200/50 text-gray-900 placeholder-gray-500 backdrop-blur-sm'
                  }`}
                  placeholder="Enter admin username"
                />
              </div>
              
              <div>
                <label htmlFor="password" className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-neutral-700/50 border-neutral-600/50 text-white placeholder-gray-400 backdrop-blur-sm' 
                      : 'bg-white/70 border-gray-200/50 text-gray-900 placeholder-gray-500 backdrop-blur-sm'
                  }`}
                  placeholder="Enter admin password"
                />
              </div>

              <div className="space-y-3 pt-4">
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className={`w-full py-4 px-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 ${
                    isLoggingIn ? 'animate-pulse' : ''
                  }`}
                >
                  {isLoggingIn ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Access Admin Panel
                    </>
                  )}
                </button>
                
                <button
                  onClick={onBack}
                  className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 border ${
                    isDarkMode
                      ? 'bg-neutral-700/50 hover:bg-neutral-600/50 text-white border-neutral-600/50 backdrop-blur-sm'
                      : 'bg-white/50 hover:bg-gray-50/50 text-gray-900 border-gray-200/50 backdrop-blur-sm'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4 inline mr-2" />
                  Back to Gallery
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard with Instagram 2.0 styling
  return (
    <div className={`min-h-screen relative overflow-hidden ${
      isDarkMode ? 'bg-neutral-900' : 'bg-white'
    }`}>
      {/* Modern Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute inset-0 opacity-15 ${
          isDarkMode ? 'opacity-10' : 'opacity-15'
        }`} style={{
          background: `
            radial-gradient(circle at 20% 80%, #ec4899 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, #06b6d4 0%, transparent 50%)
          `
        }} />
        
        {/* Floating shapes */}
        <div className="absolute top-10 left-10 w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-500/5 to-purple-500/5 animate-float" />
        <div className="absolute bottom-20 right-20 w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/5 to-cyan-500/5 animate-float-delay-1" />
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
        {/* Toast notification */}
        {showToast && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            showToast.type === 'error' 
              ? 'bg-red-500 text-white' 
              : 'bg-green-500 text-white'
          }`}>
            {showToast.message}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack} 
              className={`px-3 py-1 border rounded-md flex items-center gap-2 ${
                isDarkMode 
                  ? 'border-neutral-600 hover:bg-neutral-700' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Landing
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-purple-600" />
              Root Admin Dashboard
            </h1>
          </div>
          <button 
            onClick={handleLogout} 
            className={`px-3 py-1 border rounded-md flex items-center gap-2 ${
              isDarkMode 
                ? 'border-neutral-600 hover:bg-neutral-700' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-lg shadow ${
            isDarkMode ? 'bg-neutral-800 border border-neutral-700' : 'bg-white/80 backdrop-blur-sm'
          }`}>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Total Galleries</p>
                <p className="text-2xl font-bold">{galleries?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-lg shadow ${
            isDarkMode ? 'bg-neutral-800 border border-neutral-700' : 'bg-white/80 backdrop-blur-sm'
          }`}>
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Total Media</p>
                <p className="text-2xl font-bold">{galleries?.reduce((sum, g) => sum + (g.mediaCount || 0), 0) || 0}</p>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-lg shadow ${
            isDarkMode ? 'bg-neutral-800 border border-neutral-700' : 'bg-white/80 backdrop-blur-sm'
          }`}>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Total Visitors</p>
                <p className="text-2xl font-bold">{galleries?.reduce((sum, g) => sum + (g.visitorCount || 0), 0) || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Galleries Table */}
        <div className={`rounded-lg shadow ${
          isDarkMode ? 'bg-neutral-800 border border-neutral-700' : 'bg-white/80 backdrop-blur-sm'
        }`}>
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold">All Galleries</h3>
            {galleries.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {selectedGalleries.size > 0 ? `${selectedGalleries.size} selected` : 'Select galleries for bulk actions'}
                </span>
                {selectedGalleries.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    disabled={isBulkDeleting}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 flex items-center gap-1"
                  >
                    {isBulkDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Delete Selected ({selectedGalleries.size})
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : galleries?.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No galleries found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-center p-2 w-12">
                        <input
                          type="checkbox"
                          checked={galleries.length > 0 && selectedGalleries.size === galleries.length}
                          onChange={handleSelectAll}
                          className="w-4 h-4"
                        />
                      </th>
                      <th className="text-left p-2">Event Name</th>
                      <th className="text-left p-2">Owner</th>
                      <th className="text-left p-2">Slug</th>
                      <th className="text-center p-2">Media</th>
                      <th className="text-center p-2">Visitors</th>
                      <th className="text-left p-2">Created</th>
                      <th className="text-center p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {galleries?.map((gallery) => (
                      <tr key={gallery.id} className="border-b hover:bg-gray-50/50">
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedGalleries.has(gallery.id)}
                            onChange={() => handleGallerySelect(gallery.id)}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="p-2 font-medium">{gallery.eventName}</td>
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{gallery.ownerName || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{gallery.ownerEmail || 'No email'}</p>
                          </div>
                        </td>
                        <td className="p-2">
                          <span className="px-2 py-1 bg-gray-200 rounded text-sm">{gallery.slug}</span>
                        </td>
                        <td className="p-2 text-center">{gallery.mediaCount || 0}</td>
                        <td className="p-2 text-center">{gallery.visitorCount || 0}</td>
                        <td className="p-2">{formatDate(gallery.createdAt)}</td>
                        <td className="p-2">
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => {
                                setSelectedGallery(gallery);
                                setShowGalleryDetails(true);
                              }}
                              className="p-1 border border-gray-300 rounded hover:bg-gray-50"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteGallery(gallery)}
                              disabled={isDeletingGallery === gallery.id}
                              className="p-1 border border-red-300 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                            >
                              {isDeletingGallery === gallery.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
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
        {showGalleryDetails && selectedGallery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`max-w-2xl w-full rounded-lg shadow-lg ${
              isDarkMode ? 'bg-neutral-800' : 'bg-white'
            }`}>
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Gallery Details</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium">Event Name</label>
                    <p className="font-medium">{selectedGallery.eventName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Slug</label>
                    <p className="font-medium">{selectedGallery.slug}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Owner Name</label>
                    <p className="font-medium">{selectedGallery.ownerName || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Owner Email</label>
                    <p className="font-medium">{selectedGallery.ownerEmail || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Password</label>
                    <p className="font-medium font-mono bg-gray-100 p-2 rounded">
                      {selectedGallery.password || 'No password'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Gallery ID</label>
                    <p className="font-mono text-sm">{selectedGallery.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Event Date</label>
                    <p className="font-medium">{formatDate(selectedGallery.eventDate || null)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">End Date</label>
                    <p className="font-medium">{formatDate(selectedGallery.endDate || null)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Media Count</label>
                    <p className="font-medium">{selectedGallery.mediaCount || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Visitor Count</label>
                    <p className="font-medium">{selectedGallery.visitorCount || 0}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium">Description</label>
                  <p className="mt-1">{selectedGallery.description || 'No description'}</p>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowGalleryDetails(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};