export interface TagPosition {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export interface UserTag {
  userId: string;
  userName: string;
  displayName?: string;
}

export interface PlaceTag {
  placeId: string;
  name: string;
  address: string;
  geometry?: {
    lat: number;
    lng: number;
  };
}

export interface CustomTag {
  text: string;
}

export interface MediaTag {
  id: string;
  position: TagPosition;
  type: 'user' | 'place' | 'custom';
  data: UserTag | PlaceTag | CustomTag;
  createdAt: string;
  createdBy: string;
}

export interface TaggableMediaProps {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  tags: MediaTag[];
  canAddTags: boolean;
  onTagsUpdate: (tags: MediaTag[]) => void;
  onTagClick?: (tag: MediaTag) => void;
  isDarkMode?: boolean;
}

export interface PlaceSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  rating?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
}