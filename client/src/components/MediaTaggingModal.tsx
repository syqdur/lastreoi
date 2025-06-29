import React, { useState, useRef, useCallback } from 'react';
import { X, Users, Check, Plus, User, MapPin, Type } from 'lucide-react';
import { MediaTag, TagPosition } from '../types/tagging';
import { TagCreator } from './tagging/TagCreator';
import { TagRenderer } from './tagging/TagRenderer';

interface MediaTaggingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tags: MediaTag[]) => void;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  isDarkMode: boolean;
  galleryUsers: Array<{
    userName: string;
    deviceId: string;
    displayName?: string;
  }>;
}

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

  const handleTagCreate = useCallback((tagData: any) => {
    if (!pendingTag) return;

    const newTag: MediaTag = {
      id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: pendingTag.position,
      type: tagData.type,
      data: tagData.data,
      createdAt: new Date().toISOString(),
      createdBy: 'current_user' // Will be set properly when saving
    };

    setTags(prev => [...prev, newTag]);
    setPendingTag(null);
  }, [pendingTag]);

  const handleCancelTag = useCallback(() => {
    setPendingTag(null);
  }, []);

  const handleDeleteTag = useCallback((tagId: string) => {
    setTags(prev => prev.filter(tag => tag.id !== tagId));
  }, []);

  const handleConfirm = () => {
    onConfirm(tags);
    setTags([]);
    setIsTagMode(false);
    setPendingTag(null);
  };

  const handleCancel = () => {
    setTags([]);
    setIsTagMode(false);
    setPendingTag(null);
    onClose();
  };

  if (!isOpen) return null;

  const personTagCount = tags.filter(tag => tag.type === 'user').length;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className={`w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <h3 className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Foto markieren
            </h3>
            {personTagCount > 0 && (
              <div className={`px-2 py-1 rounded-full text-xs ${
                isDarkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'
              }`}>
                {personTagCount} {personTagCount === 1 ? 'Person' : 'Personen'}
              </div>
            )}
          </div>
          <button
            onClick={handleCancel}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Container */}
        <div className="p-6">
          <div 
            ref={mediaRef}
            className={`relative w-full aspect-square rounded-xl overflow-hidden ${
              isTagMode ? 'cursor-crosshair' : 'cursor-default'
            }`}
            onClick={handleMediaClick}
          >
            {mediaType === 'image' ? (
              <img
                src={mediaUrl}
                alt="Zu markierendes Foto"
                className="w-full h-full object-cover select-none"
                draggable={false}
              />
            ) : (
              <video
                src={mediaUrl}
                className="w-full h-full object-cover"
                controls={!isTagMode}
                playsInline
                muted
              />
            )}

            {/* Tagging Mode Overlay */}
            {isTagMode && (
              <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px]" />
            )}

            {/* Existing Tags */}
            {tags.map(tag => (
              <TagRenderer
                key={tag.id}
                tag={tag}
                onDelete={handleDeleteTag}
                isDarkMode={isDarkMode}
                isTagMode={isTagMode}
              />
            ))}

            {/* Pending Tag */}
            {pendingTag && (
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-[9999]"
                style={{
                  left: `${pendingTag.position.x}%`,
                  top: `${pendingTag.position.y}%`
                }}
              >
                <TagCreator
                  position={pendingTag.position}
                  onTagCreate={handleTagCreate}
                  onCancel={handleCancelTag}
                  isDarkMode={isDarkMode}
                />
              </div>
            )}

            {/* Crosshair Cursor Enhancement */}
            {isTagMode && (
              <style>{`
                .cursor-crosshair {
                  cursor: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIgZmlsbD0id2hpdGUiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMSIvPgo8cGF0aCBkPSJNMTIgNlYyIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz4KPHA9aWQiIGQ9Ik0xMiAxOFYyMiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik02IDEySDIiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTggMTJIMjIiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K') 12 12, crosshair;
                }
              `}</style>
            )}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className={`px-6 py-4 border-t ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsTagMode(!isTagMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isTagMode
                    ? isDarkMode 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-purple-500 text-white'
                    : isDarkMode 
                      ? 'text-purple-400 hover:bg-purple-900/30 border border-purple-700' 
                      : 'text-purple-600 hover:bg-purple-50 border border-purple-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>
                  {isTagMode ? 'Markierung beenden' : 'Personen markieren'}
                </span>
              </button>

              {isTagMode && (
                <div className={`text-xs px-3 py-2 rounded-full ${
                  isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  Tippe auf das Foto, um jemanden zu markieren
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:bg-gray-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Abbrechen
              </button>

              <button
                onClick={handleConfirm}
                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Posten</span>
              </button>
            </div>
          </div>

          {/* All Tags Summary */}
          {tags.length > 0 && (
            <div className={`mt-4 pt-3 border-t ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className={`text-xs font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Markierte Inhalte:
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <div
                    key={tag.id}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                      isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {tag.type === 'user' && <User className="w-3 h-3" />}
                    {tag.type === 'place' && <MapPin className="w-3 h-3" />}
                    {tag.type === 'custom' && <Type className="w-3 h-3" />}
                    <span>
                      {tag.type === 'user' 
                        ? (tag.data as any).displayName || (tag.data as any).userName
                        : tag.type === 'place'
                        ? (tag.data as any).name
                        : (tag.data as any).text
                      }
                    </span>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="ml-1 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};