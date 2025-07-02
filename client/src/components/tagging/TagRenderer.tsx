import React, { useState } from 'react';
import { MediaTag, TagPosition } from '../../types/tagging';

interface TagRendererProps {
  tags: MediaTag[];
  mediaType: 'image' | 'video';
  showLabels?: boolean;
  interactive?: boolean;
  onTagClick?: (tag: MediaTag) => void;
  onTagRemove?: (tagId: string) => void;
}

const TagRenderer: React.FC<TagRendererProps> = ({
  tags,
  mediaType,
  showLabels = false,
  interactive = true,
  onTagClick,
  onTagRemove
}) => {
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  // Tag position calculations
  const getTagStyle = (position: TagPosition) => ({
    left: `${position.x}%`,
    top: `${position.y}%`,
    transform: 'translate(-50%, -50%)'
  });

  const getLabelPosition = (position: TagPosition) => {
    const isRight = position.x > 50;
    const isBottom = position.y > 70;
    
    return {
      [isRight ? 'right' : 'left']: '100%',
      [isBottom ? 'bottom' : 'top']: '50%',
      transform: `translateY(${isBottom ? '50%' : '-50%'})`,
      marginLeft: isRight ? '-8px' : '8px'
    };
  };

  const getTagContent = (tag: MediaTag) => {
    switch (tag.type) {
      case 'person':
        return tag.displayName || tag.userName;
      case 'location':
        return tag.name;
      case 'text':
        return tag.text;
      default:
        return '';
    }
  };

  const getTagColor = (tag: MediaTag) => {
    switch (tag.type) {
      case 'person':
        return 'border-purple-500';
      case 'location':
        return 'border-green-500';
      case 'text':
        return 'border-blue-500';
      default:
        return 'border-gray-500';
    }
  };

  if (tags.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {tags.map(tag => (
        <div
          key={tag.id}
          className={`absolute group ${interactive ? 'pointer-events-auto' : ''}`}
          style={getTagStyle(tag.position)}
          onMouseEnter={() => interactive && setHoveredTag(tag.id)}
          onMouseLeave={() => interactive && setHoveredTag(null)}
          onClick={() => interactive && onTagClick?.(tag)}
        >
          {/* Tag Dot */}
          <div className="relative">
            <div 
              className={`w-6 h-6 bg-white border-2 ${getTagColor(tag)} rounded-full shadow-lg transition-all duration-200 ${
                interactive ? 'hover:scale-110 cursor-pointer' : ''
              } ${
                hoveredTag === tag.id || showLabels ? 'animate-pulse' : ''
              }`}
            />
            
            {/* Tag Label */}
            <div 
              className={`absolute z-10 px-2 py-1 bg-black/80 text-white text-xs rounded-md whitespace-nowrap transition-opacity duration-200 ${
                showLabels || hoveredTag === tag.id ? 'opacity-100' : 'opacity-0'
              }`}
              style={getLabelPosition(tag.position)}
            >
              {getTagContent(tag)}
              {onTagRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagRemove(tag.id);
                  }}
                  className="ml-1 text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Text Tag Overlay (for text tags only) */}
          {tag.type === 'text' && (
            <div 
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: tag.fontSize || 16,
                color: tag.color || '#ffffff',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}
            >
              {tag.text}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TagRenderer;