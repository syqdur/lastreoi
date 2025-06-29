import React, { useState, useEffect, useRef } from 'react';
import { User, MapPin, Type, X, Search } from 'lucide-react';
import { TagPosition, MediaTag, UserTag, PlaceTag, CustomTag } from '../../types/tagging';
import { PlacePicker } from './PlacePicker';

interface TagCreatorProps {
  position: TagPosition;
  onTagCreate: (tag: Omit<MediaTag, 'id' | 'createdAt' | 'createdBy'>) => void;
  onCancel: () => void;
  isDarkMode?: boolean;
}

type TagType = 'user' | 'place' | 'custom';

export const TagCreator: React.FC<TagCreatorProps> = ({
  position,
  onTagCreate,
  onCancel,
  isDarkMode = false
}) => {
  const [selectedType, setSelectedType] = useState<TagType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedType === 'user') {
      loadUsers();
    }
  }, [selectedType]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedType]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement user loading from gallery service
      // const galleryUsers = await getGalleryUsers(galleryId);
      // setUsers(galleryUsers);
      
      // Mock data for now
      setUsers([
        { userId: '1', userName: 'john_doe', displayName: 'John Doe' },
        { userId: '2', userName: 'jane_smith', displayName: 'Jane Smith' },
        { userId: '3', userName: 'mike_wilson', displayName: 'Mike Wilson' },
      ]);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    (user.displayName?.toLowerCase() || user.userName.toLowerCase()).includes(searchTerm.toLowerCase())
  );

  const handleUserSelect = (user: UserTag) => {
    onTagCreate({
      position,
      type: 'user',
      data: user
    });
  };

  const handlePlaceSelect = (place: PlaceTag) => {
    onTagCreate({
      position,
      type: 'place',
      data: place
    });
  };

  const handleCustomTextSubmit = () => {
    if (searchTerm.trim()) {
      onTagCreate({
        position,
        type: 'custom',
        data: { text: searchTerm.trim() }
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (selectedType === 'custom') {
        handleCustomTextSubmit();
      } else if (selectedType === 'user' && filteredUsers.length === 1) {
        handleUserSelect(filteredUsers[0]);
      }
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const containerClass = `
    absolute z-[2147483647] p-4 rounded-xl shadow-2xl backdrop-blur-md border-2 transform transition-all duration-200
    ${isDarkMode 
      ? 'bg-gray-900/95 border-gray-700/50 text-white' 
      : 'bg-white/95 border-gray-200/50 text-gray-900'
    }
  `;

  // Calculate position to keep modal in view
  const modalStyle = {
    left: position.x > 50 ? 'auto' : '0',
    right: position.x > 50 ? '0' : 'auto',
    top: position.y > 50 ? 'auto' : '100%',
    bottom: position.y > 50 ? '100%' : 'auto',
    minWidth: '280px',
    maxWidth: '320px'
  };

  if (!selectedType) {
    return (
      <div className={containerClass} style={modalStyle}>
        <div className="flex flex-col gap-1">
          <div className="text-sm font-medium mb-3 text-center">Wen möchtest du markieren?</div>
          
          <button
            onClick={() => setSelectedType('user')}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all text-left hover:scale-[1.02] ${
              isDarkMode 
                ? 'hover:bg-gray-800/80 border border-gray-700/50' 
                : 'hover:bg-gray-50 border border-gray-200/50'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium">Person markieren</div>
              <div className="text-xs opacity-70">Jemanden in diesem Foto markieren</div>
            </div>
          </button>

          <button
            onClick={() => setSelectedType('place')}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all text-left hover:scale-[1.02] ${
              isDarkMode 
                ? 'hover:bg-gray-800/80 border border-gray-700/50' 
                : 'hover:bg-gray-50 border border-gray-200/50'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium">Ort hinzufügen</div>
              <div className="text-xs opacity-70">Standort zu diesem Foto hinzufügen</div>
            </div>
          </button>

          <button
            onClick={() => setSelectedType('custom')}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all text-left hover:scale-[1.02] ${
              isDarkMode 
                ? 'hover:bg-gray-800/80 border border-gray-700/50' 
                : 'hover:bg-gray-50 border border-gray-200/50'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Type className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium">Text hinzufügen</div>
              <div className="text-xs opacity-70">Benutzerdefinierten Text eingeben</div>
            </div>
          </button>

          <div className="border-t border-gray-200/50 dark:border-gray-700/50 mt-2 pt-2">
            <button
              onClick={onCancel}
              className={`w-full flex items-center justify-center gap-2 p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-800/50 text-gray-400' 
                  : 'hover:bg-gray-100/50 text-gray-600'
              }`}
            >
              <X className="w-4 h-4" />
              <span className="text-sm">Abbrechen</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedType === 'place') {
    return (
      <div className={containerClass} style={modalStyle}>
        <PlacePicker
          onPlaceSelect={handlePlaceSelect}
          onCancel={() => setSelectedType(null)}
          isDarkMode={isDarkMode}
        />
      </div>
    );
  }

  return (
    <div className={containerClass} style={modalStyle}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
            {selectedType === 'user' ? 'Person markieren' : 'Text eingeben'}
          </div>
          <button
            onClick={() => setSelectedType(null)}
            className={`p-1 rounded-full transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-800/50 text-gray-400' 
                : 'hover:bg-gray-100/50 text-gray-600'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              selectedType === 'user' ? 'Nach Person suchen...' : 'Text eingeben...'
            }
            className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm transition-colors ${
              isDarkMode
                ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-gray-600'
                : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
          />
        </div>

        {/* Instagram-Style Recent/Suggested Users */}
        {selectedType === 'user' && searchTerm.length === 0 && (
          <div className="space-y-1">
            <div className="text-xs opacity-70 mb-2">Kürzlich markiert</div>
            {users.slice(0, 3).map((user) => (
              <button
                key={user.userId}
                onClick={() => handleUserSelect(user)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                  isDarkMode 
                    ? 'hover:bg-gray-800/50' 
                    : 'hover:bg-gray-100/50'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                  {(user.displayName?.[0] || user.userName[0]).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {user.displayName || user.userName}
                  </div>
                  {user.displayName && (
                    <div className="text-xs opacity-70">@{user.userName}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedType === 'user' && (
          <div className="max-h-40 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 text-center text-sm opacity-70">Loading...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-3 text-center text-sm opacity-70">No users found</div>
            ) : (
              <div className="space-y-1">
                {filteredUsers.map((user) => (
                  <button
                    key={user.userId}
                    onClick={() => handleUserSelect(user)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                      isDarkMode 
                        ? 'hover:bg-gray-800/50' 
                        : 'hover:bg-gray-100/50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                      {(user.displayName?.[0] || user.userName[0]).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {user.displayName || user.userName}
                      </div>
                      {user.displayName && (
                        <div className="text-xs opacity-70">@{user.userName}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedType === 'custom' && (
          <button
            onClick={handleCustomTextSubmit}
            disabled={!searchTerm.trim()}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              searchTerm.trim()
                ? 'bg-purple-500 text-white hover:bg-purple-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Add Tag
          </button>
        )}
      </div>
    </div>
  );
};