import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Plus, X, User, MapPin, Type, Users } from 'lucide-react';
import { TaggableMediaProps, MediaTag, TagPosition } from '../../types/tagging';
import { TagCreator } from './TagCreator';
import { TagRenderer } from './TagRenderer';

export const TaggableMedia: React.FC<TaggableMediaProps> = ({
  mediaUrl,
  mediaType,
  tags,
  canAddTags,
  onTagsUpdate,
  onTagClick,
  isDarkMode = false
}) => {
  const [isTagMode, setIsTagMode] = useState(false);
  const [pendingTag, setPendingTag] = useState<{ position: TagPosition } | null>(null);
  const [tagsVisible, setTagsVisible] = useState(true);
  const mediaRef = useRef<HTMLDivElement>(null);

  const handleMediaClick = useCallback((event: React.MouseEvent) => {
    if (!canAddTags || !isTagMode) return;

    const rect = mediaRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    // Ensure tag is within bounds
    const clampedX = Math.max(5, Math.min(95, x));
    const clampedY = Math.max(5, Math.min(95, y));

    setPendingTag({ position: { x: clampedX, y: clampedY } });
  }, [canAddTags, isTagMode]);

  const handleTagCreate = useCallback((tag: Omit<MediaTag, 'id' | 'createdAt' | 'createdBy'>) => {
    const newTag: MediaTag = {
      ...tag,
      id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      createdBy: 'current_user' // TODO: Get from auth context
    };

    onTagsUpdate([...tags, newTag]);
    setPendingTag(null);
    setIsTagMode(false);
  }, [tags, onTagsUpdate]);

  const handleTagDelete = useCallback((tagId: string) => {
    onTagsUpdate(tags.filter(tag => tag.id !== tagId));
  }, [tags, onTagsUpdate]);

  const handleCancelTag = useCallback(() => {
    setPendingTag(null);
    setIsTagMode(false);
  }, []);

  const toggleTagMode = useCallback(() => {
    setIsTagMode(!isTagMode);
    setPendingTag(null);
  }, [isTagMode]);

  const renderedTags = useMemo(() => {
    if (!tagsVisible) return [];
    return tags.map(tag => (
      <TagRenderer
        key={tag.id}
        tag={tag}
        onClick={onTagClick}
        onDelete={canAddTags ? handleTagDelete : undefined}
        isDarkMode={isDarkMode}
        isTagMode={isTagMode}
      />
    ));
  }, [tags, onTagClick, canAddTags, handleTagDelete, isDarkMode, isTagMode, tagsVisible]);

  const toggleTagVisibility = useCallback(() => {
    setTagsVisible(!tagsVisible);
  }, [tagsVisible]);

  const tagCount = tags.filter(tag => tag.type === 'user').length;

  return (
    <div className="relative w-full h-full">
      {/* Media Container */}
      <div
        ref={mediaRef}
        className={`relative w-full h-full overflow-hidden rounded-lg ${
          isTagMode ? 'cursor-crosshair' : 'cursor-default'
        }`}
        onClick={handleMediaClick}
      >
        {mediaType === 'image' ? (
          <img
            src={mediaUrl}
            alt="Tagged media"
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
        {renderedTags}

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
      </div>

      {/* Instagram-Style Bottom Controls */}
      {canAddTags && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-40">
          <div className="flex items-center gap-4 px-6 py-3 bg-black/80 backdrop-blur-md rounded-full">
            {!isTagMode ? (
              <>
                {/* People Tagging Button */}
                <button
                  onClick={toggleTagMode}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all duration-200"
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Personen markieren</span>
                </button>

                {/* Tag Counter */}
                {tagCount > 0 && (
                  <div className="text-white/90 text-sm">
                    {tagCount} {tagCount === 1 ? 'Person' : 'Personen'} markiert
                  </div>
                )}

                {/* Toggle Tag Visibility */}
                {tags.length > 0 && (
                  <button
                    onClick={toggleTagVisibility}
                    className="p-2 text-white/80 hover:text-white transition-colors"
                    title={tagsVisible ? 'Tags ausblenden' : 'Tags anzeigen'}
                  >
                    <User className={`w-4 h-4 ${tagsVisible ? 'opacity-100' : 'opacity-50'}`} />
                  </button>
                )}
              </>
            ) : (
              <>
                {/* Tagging Mode Instructions */}
                <div className="text-white text-sm">
                  Tippen Sie auf eine Person, um sie zu markieren
                </div>
                
                {/* Finish Tagging Button */}
                <button
                  onClick={toggleTagMode}
                  className="px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Fertig
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Top Right Tag Controls */}
      {canAddTags && tags.length > 0 && !isTagMode && (
        <div className="absolute top-4 right-4 z-40">
          <div className="flex gap-2">
            {/* Remove All Tags */}
            <button
              onClick={() => onTagsUpdate([])}
              className="p-2 bg-red-500/90 text-white rounded-full backdrop-blur-md hover:bg-red-600/90 transition-all duration-200"
              title="Alle Tags entfernen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}


    </div>
  );
};