import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Users, User, Plus, Navigation } from 'lucide-react';

interface TagPosition {
  x: number;
  y: number;
}

interface PersonTag {
  id: string;
  type: 'person';
  position: TagPosition;
  userName: string;
  displayName?: string;
}

type MediaTag = PersonTag;

interface GalleryUser {
  userName: string;
  deviceId: string;
  displayName?: string;
  profilePicture?: string;
}

interface MediaTaggingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tags: MediaTag[]) => void;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  isDarkMode: boolean;
  galleryUsers: GalleryUser[];
}

interface SearchPopupProps {
  position: TagPosition;
  onSelectPerson: (user: GalleryUser) => void;
  onCancel: () => void;
  galleryUsers: GalleryUser[];
  isDarkMode: boolean;
}

const SearchPopup: React.FC<SearchPopupProps> = ({
  position,
  onSelectPerson,
  onCancel,
  galleryUsers,
  isDarkMode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filteredUsers = galleryUsers.filter(user =>
    (user.displayName || user.userName).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
      className="absolute z-[2147483647] min-w-[280px]"
      style={{
        left: position.x > 70 ? 'auto' : '10px',
        right: position.x > 70 ? '10px' : 'auto',
        top: position.y > 70 ? 'auto' : '10px',
        bottom: position.y > 70 ? '10px' : 'auto',
      }}
    >
      <div className={`rounded-xl shadow-2xl border ${
        isDarkMode 
          ? 'bg-gray-900/95 border-gray-700 backdrop-blur-lg' 
          : 'bg-white/95 border-gray-200 backdrop-blur-lg'
      }`}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Wen möchtest du markieren?
          </h3>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nach Person suchen..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
        </div>

        {/* Recent Users Section */}
        {galleryUsers.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Kürzlich markiert
            </p>
            <div className="flex space-x-2 overflow-x-auto">
              {galleryUsers.slice(0, 5).map((user) => (
                <button
                  key={`${user.userName}_${user.deviceId}`}
                  onClick={() => onSelectPerson(user)}
                  className="flex-shrink-0 flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                    {(user.displayName || user.userName).charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 max-w-[60px] truncate">
                    {(user.displayName || user.userName).split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* User List */}
        <div className="max-h-60 overflow-y-auto">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <button
                key={`${user.userName}_${user.deviceId}`}
                onClick={() => onSelectPerson(user)}
                className={`w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                  {(user.displayName || user.userName).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.displayName || user.userName}
                  </p>
                  {user.displayName && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      @{user.userName}
                    </p>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
              <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Keine Personen gefunden</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};

export const MediaTaggingModal: React.FC<MediaTaggingModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  mediaUrl,
  mediaType,
  isDarkMode,
  galleryUsers
}) => {
  const [tags, setTags] = useState<MediaTag[]>([]);
  const [isTagMode, setIsTagMode] = useState(false);
  const [pendingTag, setPendingTag] = useState<{ position: TagPosition } | null>(null);
  const [tagsVisible, setTagsVisible] = useState(true);
  const mediaRef = useRef<HTMLDivElement>(null);

  const handleMediaClick = useCallback((event: React.MouseEvent) => {
    if (!isTagMode) return;

    const rect = mediaRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    // Ensure tag is within bounds
    const boundedX = Math.max(5, Math.min(95, x));
    const boundedY = Math.max(5, Math.min(95, y));

    setPendingTag({ position: { x: boundedX, y: boundedY } });
  }, [isTagMode]);

  const handlePersonSelect = useCallback((user: GalleryUser) => {
    if (!pendingTag) return;

    const newTag: PersonTag = {
      id: Date.now().toString(),
      type: 'person',
      position: pendingTag.position,
      userName: user.userName,
      displayName: user.displayName
    };

    setTags(prev => [...prev, newTag]);
    setPendingTag(null);
  }, [pendingTag]);

  const handleRemoveTag = useCallback((tagId: string) => {
    setTags(prev => prev.filter(tag => tag.id !== tagId));
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(tags);
    onClose();
  }, [tags, onConfirm, onClose]);

  if (!isOpen) return null;

  const personTags = tags.filter(tag => tag.type === 'person') as PersonTag[];

  return (
    <div className="fixed inset-0 z-[2147483646] bg-black/90 flex items-center justify-center p-4">
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] mx-auto flex flex-col bg-black rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 text-white">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">Markierungen hinzufügen</h1>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Fertig
          </button>
        </div>

        {/* Media Container */}
        <div className="flex-1 flex items-center justify-center p-4 min-h-0">
          <div
            ref={mediaRef}
            className={`relative max-w-full max-h-full rounded-lg overflow-hidden ${
              isTagMode ? 'cursor-crosshair' : 'cursor-default'
            }`}
            onClick={handleMediaClick}
            style={{ maxHeight: '60vh' }}
          >
            {mediaType === 'image' ? (
              <img
                src={mediaUrl}
                alt="Media zum Markieren"
                className="max-w-full max-h-full object-contain select-none"
                draggable={false}
                style={{ maxHeight: '60vh' }}
              />
            ) : (
              <video
                src={mediaUrl}
                className="max-w-full max-h-full object-contain"
                controls={!isTagMode}
                playsInline
                muted
                style={{ maxHeight: '60vh' }}
              />
            )}

            {/* Existing Tags */}
            {tagsVisible && tags.map((tag) => (
              <div
                key={tag.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{
                  left: `${tag.position.x}%`,
                  top: `${tag.position.y}%`
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isTagMode) {
                    handleRemoveTag(tag.id);
                  }
                }}
              >
                {/* Tag Dot */}
                <div className="w-6 h-6 bg-white rounded-full border-2 border-blue-500 animate-pulse shadow-lg" />
                
                {/* Tag Label */}
                <div className={`absolute mt-2 px-3 py-1 bg-black/80 text-white text-xs rounded-full whitespace-nowrap transform -translate-x-1/2 ${
                  tag.position.y > 80 ? 'bottom-8' : 'top-8'
                }`}>
                  {tag.type === 'person' 
                    ? (tag as PersonTag).displayName || (tag as PersonTag).userName
                    : ''
                  }
                </div>
              </div>
            ))}

            {/* Pending Tag Search Popup */}
            {pendingTag && (
              <SearchPopup
                position={pendingTag.position}
                onSelectPerson={handlePersonSelect}
                onCancel={() => setPendingTag(null)}
                galleryUsers={galleryUsers}
                isDarkMode={isDarkMode}
              />
            )}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="flex-shrink-0 p-3 space-y-2 bg-black/80 border-t border-white/10">
          {/* Tag Mode Toggle */}
          <button
            onClick={() => setIsTagMode(!isTagMode)}
            className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg font-medium transition-colors ${
              isTagMode
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-sm">{isTagMode ? 'Tagging aktiv' : 'Personen markieren'}</span>
          </button>

          {/* Tag Info Row */}
          <div className="flex items-center justify-between">
            {/* Tag Counter */}
            {personTags.length > 0 ? (
              <div className="text-white/80 text-xs">
                {personTags.length} {personTags.length === 1 ? 'Person' : 'Personen'} markiert
              </div>
            ) : (
              <div className="text-white/60 text-xs">
                {isTagMode ? 'Foto antippen zum Markieren' : 'Keine Markierungen'}
              </div>
            )}

            {/* Clear All Tags */}
            {tags.length > 0 && (
              <button
                onClick={() => setTags([])}
                className="text-white/60 hover:text-white text-xs transition-colors"
              >
                Alle entfernen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};