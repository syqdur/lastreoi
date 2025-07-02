export interface MediaItem {
  id: string;
  name: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  deviceId: string;
  type: 'image' | 'video' | 'note';
  noteText?: string;
  note?: string; // Legacy support
  isUnavailable?: boolean;
  tags?: (PersonTag | LocationTagWithPosition | TextTag)[]; // Tagged users, locations, and text in this media (Instagram-style tags)
  // NEW: Structured tag fields for better organization
  textTags?: TextTag[];
  personTags?: PersonTag[];
  locationTags?: LocationTagWithPosition[];
  location?: LocationTag; // Geographic location where media was taken
  galleryTheme?: 'hochzeit' | 'geburtstag' | 'urlaub' | 'eigenes'; // Theme for event-based styling
}

// Instagram-style person tag with position
export interface PersonTag {
  id: string;
  type: 'person';
  position?: {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
  };
  userName: string;
  deviceId?: string;
  displayName?: string;
}

// Instagram-style location tag with position
export interface LocationTagWithPosition {
  id: string;
  type: 'location';
  position?: {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
  };
  locationName: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface LocationTag {
  id: string;
  mediaId: string;
  name: string; // Display name (e.g., "Eiffel Tower, Paris")
  address?: string; // Full address
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  placeId?: string; // Google Places ID or similar
  addedBy: string;
  addedByDeviceId: string;
  createdAt: string;
}

// Instagram-style location tag with position
export interface LocationTagWithPosition {
  id: string;
  type: 'location';
  position?: {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
  };
  locationName: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Instagram-style text tag
export interface TextTag {
  id: string;
  type: 'text';
  position?: {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
  };
  text: string;
  fontSize?: number;
  color?: string;
}

export interface MediaTag {
  id: string;
  mediaId: string;
  userName: string;
  deviceId: string;
  taggedBy: string;
  taggedByDeviceId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  mediaId: string;
  text: string;
  userName: string;
  deviceId: string;
  createdAt: string;
}

export interface Like {
  id: string;
  mediaId: string;
  userName: string;
  deviceId: string;
  createdAt: string;
}

// Timeline Types
export interface TimelineEvent {
  id: string;
  title: string;
  customEventName?: string; // For custom event types
  date: string;
  description: string;
  location?: string;
  type: 'first_date' | 'first_kiss' | 'first_vacation' | 'engagement' | 'moving_together' | 'anniversary' | 'custom' | 'other';
  createdBy: string;
  createdAt: string;
  mediaUrls?: string[]; // Array of media URLs
  mediaTypes?: string[]; // Array of media types ('image' or 'video')
  mediaFileNames?: string[]; // For deletion from storage
}

// Spotify Types
export interface SpotifyCredentials {
  id: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  createdAt: string;
}

export interface SelectedPlaylist {
  id: string;
  playlistId: string;
  name: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  uri: string;
}

export interface ProfileData {
  id: string;
  name: string;
  bio: string;
  profilePicture?: string;
  countdownDate?: string;
  countdownEndMessage?: string;
  countdownMessageDismissed?: boolean;
  updatedAt: string;
  updatedBy: string;
}