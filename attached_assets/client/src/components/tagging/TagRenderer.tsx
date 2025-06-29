import React from 'react';
import { X, User, MapPin, Type } from 'lucide-react';
import { MediaTag } from '../../types/tagging';

interface TagRendererProps {
  tag: MediaTag;
  onClick?: (tag: MediaTag) => void;
  onDelete?: (tagId: string) => void;
  isDarkMode?: boolean;
  isTagMode?: boolean;
}

export const TagRenderer: React.FC<TagRendererProps> = ({
  tag,
  onClick,
  onDelete,
  isDarkMode = false,
  isTagMode = false
}) => {
  const getTagContent = () => {
    switch (tag.type) {
      case 'user':
        const userData = tag.data as { userName: string; displayName?: string };
        return {
          icon: <User className="w-3 h-3" />,
          text: userData.displayName || userData.userName,
          className: 'bg-blue-500/90 text-white'
        };
      case 'place':
        const placeData = tag.data as { name: string };
        return {
          icon: <MapPin className="w-3 h-3" />,
          text: placeData.name,
          className: 'bg-green-500/90 text-white'
        };
      case 'custom':
        const customData = tag.data as { text: string };
        return {
          icon: <Type className="w-3 h-3" />,
          text: customData.text,
          className: 'bg-purple-500/90 text-white'
        };
      default:
        return {
          icon: <Type className="w-3 h-3" />,
          text: 'Unknown',
          className: 'bg-gray-500/90 text-white'
        };
    }
  };

  const { icon, text, className } = getTagContent();

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 group"
      style={{
        left: `${tag.position.x}%`,
        top: `${tag.position.y}%`
      }}
    >
      {/* Instagram-Style Tag Point */}
      <div className="relative">
        {/* Pulsing Animation Ring */}
        <div className="absolute inset-0 w-4 h-4 bg-white rounded-full animate-ping opacity-75 -translate-x-0.5 -translate-y-0.5" />
        
        {/* Main Tag Point */}
        <div className="relative w-3 h-3 bg-white rounded-full border-2 border-white shadow-lg transform transition-all duration-200 group-hover:scale-110" />
        
        {/* Instagram-Style Tag Label */}
        <div
          className={`absolute ${
            tag.position.x > 70 ? 'right-2' : 'left-2'
          } ${
            tag.position.y > 70 ? 'bottom-2' : 'top-2'
          } px-3 py-1.5 bg-black/80 text-white text-xs font-medium rounded-full backdrop-blur-md transition-all duration-200 cursor-pointer hover:bg-black/90 ${
            isTagMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          onClick={() => onClick?.(tag)}
        >
          <div className="flex items-center gap-1.5 max-w-32">
            {tag.type === 'user' && <User className="w-3 h-3 flex-shrink-0" />}
            {tag.type === 'place' && <MapPin className="w-3 h-3 flex-shrink-0" />}
            {tag.type === 'custom' && <Type className="w-3 h-3 flex-shrink-0" />}
            
            <span className="whitespace-nowrap truncate">{text}</span>
            
            {onDelete && isTagMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(tag.id);
                }}
                className="ml-1 p-0.5 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Touch Target for Mobile */}
        <div className="absolute -inset-4 cursor-pointer" onClick={() => onClick?.(tag)} />
      </div>
    </div>
  );
};