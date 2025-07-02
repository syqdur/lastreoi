// Core Tagging Types
export interface TagPosition {
  x: number; // Percentage (0-100)
  y: number; // Percentage (0-100)
}

export interface PersonTag {
  id: string;
  userName: string;
  displayName?: string;
  deviceId: string;
  position: TagPosition;
  type: 'person';
}

export interface LocationTag {
  id: string;
  name: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  position: TagPosition;
  type: 'location';
}

export interface TextTag {
  id: string;
  text: string;
  position: TagPosition;
  fontSize?: number;
  color?: string;
  type: 'text';
}

export type MediaTag = PersonTag | LocationTag | TextTag;

export interface GalleryUser {
  userName: string;
  displayName?: string;
  deviceId: string;
  profilePicture?: string;
  lastSeen?: Date;
  isOnline?: boolean;
}

export interface TaggingState {
  mode: 'idle' | 'person' | 'location' | 'text';
  tags: MediaTag[];
  selectedPosition: TagPosition | null;
}

export interface MediaItemWithTags {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  tags: MediaTag[];
  createdAt: Date;
  author: string;
}