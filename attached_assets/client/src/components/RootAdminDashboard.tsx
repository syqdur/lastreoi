import React, { useState, useEffect } from 'react';
import { Eye, Trash2, Users, Camera, Globe, ArrowLeft, LogOut, Shield, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface RootAdminDashboardProps {
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

interface LoginData {
  username: string;
  password: string;
}

export const RootAdminDashboard: React.FC<RootAdminDashboardProps> = ({ isDarkMode, onBack }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState<LoginData>({ username: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState<GalleryData | null>(null);
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const toast = (message: {title: string, description: string, variant?: string}) => {
    setShowToast({
      message: message.description,
      type: message.variant === 'destructive' ? 'error' : 'success'
    });
    setTimeout(() => setShowToast(null), 3000);
  };

  const [galleries, setGalleries] = useState<GalleryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingGallery, setIsDeletingGallery] = useState<number | null>(null);

  const fetchGalleries = async () => {
    if (!isLoggedIn) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/root-admin/galleries');
      if (response.ok) {
        const data = await response.json();
        setGalleries(data);
      } else {
        toast({ title: "Error", description: "Failed to fetch galleries", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch galleries", variant: "destructive" });
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
      const response = await fetch('/api/root-admin/login', {
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
    if (confirm(`Are you sure you want to delete "${gallery.eventName}"? This action cannot be undone.`)) {
      setIsDeletingGallery(gallery.id);
      try {
        const response = await fetch(`/api/root-admin/galleries/${gallery.id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          // Remove gallery from local state
          setGalleries(prev => prev.filter(g => g.id !== gallery.id));
          toast({
            title: "Success",
            description: `Gallery "${gallery.eventName}" deleted successfully`,
          });
        } else {
          const result = await response.json();
          toast({
            title: "Error",
            description: result.error || "Failed to delete gallery",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete gallery",
          variant: "destructive",
        });
      }
      setIsDeletingGallery(null);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginData({ username: '', password: '' });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  // Login form
  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isDarkMode ? 'bg-neutral-900' : 'bg-gradient-to-br from-pink-50 to-purple-50'
      }`}>
        <Card className={`w-full max-w-md ${
          isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white/80 backdrop-blur-sm'
        }`}>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Shield className="h-6 w-6 text-purple-600" />
              Root Admin Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={loginData.username}
                onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                className={isDarkMode ? 'bg-neutral-700 border-neutral-600' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className={isDarkMode ? 'bg-neutral-700 border-neutral-600' : ''}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={onBack}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleLogin}
                disabled={isLoggingIn || !loginData.username || !loginData.password}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {isLoggingIn && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard
  return (
    <div className={`min-h-screen p-4 ${
      isDarkMode ? 'bg-neutral-900' : 'bg-gradient-to-br from-pink-50 to-purple-50'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Landing
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-purple-600" />
              Root Admin Dashboard
            </h1>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className={isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white/80 backdrop-blur-sm'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Galleries</p>
                  <p className="text-2xl font-bold">{galleries?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white/80 backdrop-blur-sm'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Media</p>
                  <p className="text-2xl font-bold">{galleries?.reduce((sum, g) => sum + (g.mediaCount || 0), 0) || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white/80 backdrop-blur-sm'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Visitors</p>
                  <p className="text-2xl font-bold">{galleries?.reduce((sum, g) => sum + (g.visitorCount || 0), 0) || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Galleries Table */}
        <Card className={isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white/80 backdrop-blur-sm'}>
          <CardHeader>
            <CardTitle>All Galleries</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : galleries?.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No galleries found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
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
                      <tr key={gallery.id} className="border-b hover:bg-muted/20">
                        <td className="p-2 font-medium">{gallery.eventName}</td>
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{gallery.ownerName || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{gallery.ownerEmail || 'No email'}</p>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">{gallery.slug}</Badge>
                        </td>
                        <td className="p-2 text-center">{gallery.mediaCount || 0}</td>
                        <td className="p-2 text-center">{gallery.visitorCount || 0}</td>
                        <td className="p-2">{formatDate(gallery.createdAt)}</td>
                        <td className="p-2">
                          <div className="flex gap-1 justify-center">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedGallery(gallery)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Gallery Details</DialogTitle>
                                </DialogHeader>
                                {selectedGallery && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Event Name</Label>
                                        <p className="font-medium">{selectedGallery.eventName}</p>
                                      </div>
                                      <div>
                                        <Label>Slug</Label>
                                        <p className="font-medium">{selectedGallery.slug}</p>
                                      </div>
                                      <div>
                                        <Label>Owner Name</Label>
                                        <p className="font-medium">{selectedGallery.ownerName || 'Not set'}</p>
                                      </div>
                                      <div>
                                        <Label>Owner Email</Label>
                                        <p className="font-medium">{selectedGallery.ownerEmail || 'Not set'}</p>
                                      </div>
                                      <div>
                                        <Label>Password</Label>
                                        <p className="font-medium font-mono bg-muted p-2 rounded">
                                          {selectedGallery.password || 'No password'}
                                        </p>
                                      </div>
                                      <div>
                                        <Label>Firebase ID</Label>
                                        <p className="font-mono text-sm">{selectedGallery.firebaseId}</p>
                                      </div>
                                      <div>
                                        <Label>Event Date</Label>
                                        <p className="font-medium">{formatDate(selectedGallery.eventDate)}</p>
                                      </div>
                                      <div>
                                        <Label>End Date</Label>
                                        <p className="font-medium">{formatDate(selectedGallery.endDate)}</p>
                                      </div>
                                      <div>
                                        <Label>Media Count</Label>
                                        <p className="font-medium">{selectedGallery.mediaCount || 0}</p>
                                      </div>
                                      <div>
                                        <Label>Visitor Count</Label>
                                        <p className="font-medium">{selectedGallery.visitorCount || 0}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <Label>Description</Label>
                                      <p className="mt-1">{selectedGallery.description || 'No description'}</p>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteGallery(gallery)}
                              disabled={isDeletingGallery === gallery.id}
                            >
                              {isDeletingGallery === gallery.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};