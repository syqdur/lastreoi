import React, { useState } from 'react';
import { Camera, Tag } from 'lucide-react';
import AuthenticInstagramTagging from './AuthenticInstagramTagging';

// Mock gallery users for testing
const mockGalleryUsers = [
  {
    userName: "maxmuster",
    deviceId: "device1",
    displayName: "Max Mustermann",
    profilePicture: "https://picsum.photos/44/44?random=1",
    lastVisited: new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 min ago
  },
  {
    userName: "annaschmidt", 
    deviceId: "device2",
    displayName: "Anna Schmidt",
    profilePicture: "https://picsum.photos/44/44?random=2",
    lastVisited: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  },
  {
    userName: "tomweber",
    deviceId: "device3", 
    displayName: "Tom Weber",
    profilePicture: "https://picsum.photos/44/44?random=3",
    lastVisited: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  },
  {
    userName: "sarahmueller",
    deviceId: "device4",
    displayName: "Sarah Müller", 
    profilePicture: "https://picsum.photos/44/44?random=4",
    lastVisited: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
  },
  {
    userName: "martinlang",
    deviceId: "device5",
    displayName: "Martin Lang",
    profilePicture: "https://picsum.photos/44/44?random=5", 
    lastVisited: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week ago
  }
];

const InstagramTaggingTest: React.FC = () => {
  const [isTaggingOpen, setIsTaggingOpen] = useState(false);
  const [savedTags, setSavedTags] = useState<any[]>([]);
  
  // Test image URL
  const testImageUrl = "https://picsum.photos/800/600?random=10";

  const handleOpenTagging = () => {
    setIsTaggingOpen(true);
  };

  const handleCloseTagging = () => {
    setIsTaggingOpen(false);
  };

  const handleConfirmTags = (tags: any[]) => {
    console.log('Tags saved:', tags);
    setSavedTags(tags);
    setIsTaggingOpen(false);
    
    // Show success message
    alert(`${tags.length} Person(en) erfolgreich getaggt!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Instagram Tagging System Test
          </h1>
          <p className="text-white/80">
            Teste das neue 1:1 Instagram-Tagging-System
          </p>
        </div>

        {/* Test Image Card */}
        <div className="bg-black rounded-2xl overflow-hidden shadow-2xl mb-6">
          <div className="relative">
            <img 
              src={testImageUrl}
              alt="Test Image"
              className="w-full h-auto object-cover"
            />
            
            {/* Existing Tags Overlay */}
            {savedTags.map((tag) => (
              <div
                key={tag.id}
                className="absolute w-6 h-6 rounded-full bg-white border-2 border-blue-500"
                style={{
                  left: `${tag.x * 100}%`,
                  top: `${tag.y * 100}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            ))}
            
            {/* Tag Button */}
            <button
              onClick={handleOpenTagging}
              className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/70 transition-all"
            >
              <Tag className="w-5 h-5" />
            </button>
          </div>
          
          {/* Image Info */}
          <div className="p-4 bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Test Bild</div>
                <div className="text-sm text-gray-500">Für Instagram Tagging Test</div>
              </div>
            </div>
            
            {/* Tags Info */}
            {savedTags.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <div className="text-sm text-gray-600 mb-2">
                  {savedTags.length} Person(en) getaggt:
                </div>
                <div className="flex flex-wrap gap-2">
                  {savedTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {tag.user.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h3 className="text-white font-semibold text-lg mb-4">Test Controls</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleOpenTagging}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Tag className="w-4 h-4" />
              Tagging öffnen
            </button>
            
            <button
              onClick={() => setSavedTags([])}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Tags löschen
            </button>
          </div>
          
          {/* Gallery Users Info */}
          <div className="mt-6 p-4 bg-black/20 rounded-lg">
            <h4 className="text-white font-medium mb-3">
              Test Gallery Users ({mockGalleryUsers.length})
            </h4>
            <div className="space-y-2">
              {mockGalleryUsers.map((user) => (
                <div key={`${user.userName}_${user.deviceId}`} className="flex items-center gap-3">
                  <img 
                    src={user.profilePicture}
                    alt={user.displayName || user.userName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">
                      {user.displayName}
                    </div>
                    <div className="text-white/60 text-xs">
                      @{user.userName}
                    </div>
                  </div>
                  <div className="text-white/60 text-xs">
                    {new Date(user.lastVisited!).toLocaleString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit'
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Instagram Tagging System */}
      <AuthenticInstagramTagging
        isOpen={isTaggingOpen}
        onClose={handleCloseTagging}
        onConfirm={handleConfirmTags}
        mediaUrl={testImageUrl}
        mediaType="image"
        galleryUsers={mockGalleryUsers}
      />
    </div>
  );
};

export default InstagramTaggingTest;