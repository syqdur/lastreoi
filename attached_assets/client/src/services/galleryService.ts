import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc,
  deleteDoc,
  query, 
  where,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { GalleryCreationData } from '../components/LandingPage';

export interface Gallery {
  id: string;
  eventName: string;
  slug: string;
  theme: 'hochzeit' | 'geburtstag' | 'urlaub' | 'eigenes';
  password?: string;
  eventDate?: string;
  endDate?: string;
  description?: string;
  ownerName?: string;
  ownerEmail?: string;
  isActive: boolean;
  isPasswordProtected: boolean;
  createdAt: string;
  updatedAt: string;
  settings: GallerySettings;
  stats: GalleryStats;
}

export interface GallerySettings {
  allowComments: boolean;
  allowLikes: boolean;
  allowStories: boolean;
  allowAnonymous: boolean;
  autoDeleteAfterDays?: number;
  maxFileSize: number; // in MB
  allowedFileTypes: string[];
  moderationEnabled: boolean;
  spotifyIntegration: boolean;
  pushNotifications: boolean;
  geoTagging: boolean;
}

export interface GalleryStats {
  totalMedia: number;
  totalComments: number;
  totalLikes: number;
  totalUsers: number;
  totalViews: number;
  lastActivity: string;
}

export interface GalleryUser {
  id: string;
  galleryId: string;
  userName: string;
  deviceId: string;
  displayName?: string;
  profilePicture?: string;
  isOwner: boolean;
  isAdmin: boolean;
  joinedAt: string;
  lastSeen: string;
}

class GalleryService {
  private static instance: GalleryService;

  static getInstance(): GalleryService {
    if (!GalleryService.instance) {
      GalleryService.instance = new GalleryService();
    }
    return GalleryService.instance;
  }

  // Create new gallery
  async createGallery(data: GalleryCreationData): Promise<Gallery> {
    try {
      console.log('🔄 Creating gallery with data:', data);
      
      // Check if slug already exists
      const existingGallery = await this.getGalleryBySlug(data.slug);
      if (existingGallery) {
        console.error('❌ Slug already exists:', data.slug);
        throw new Error('Diese URL ist bereits vergeben. Bitte wählen Sie eine andere.');
      }

    const defaultSettings: GallerySettings = {
      allowComments: true,
      allowLikes: true,
      allowStories: true,
      allowAnonymous: true,
      maxFileSize: 10, // 10MB
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'],
      moderationEnabled: false,
      spotifyIntegration: true,
      pushNotifications: true,
      geoTagging: true
    };

    const defaultStats: GalleryStats = {
      totalMedia: 0,
      totalComments: 0,
      totalLikes: 0,
      totalUsers: 0,
      totalViews: 0,
      lastActivity: new Date().toISOString()
    };

    const galleryData: any = {
      eventName: data.eventName,
      slug: data.slug,
      theme: data.theme,
      isActive: true,
      isPasswordProtected: !!data.password,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: defaultSettings,
      stats: defaultStats
    };

    // Only add optional fields if they have values
    if (data.password && data.password.trim()) {
      galleryData.password = data.password.trim();
    }
    if (data.eventDate && data.eventDate.trim()) {
      galleryData.eventDate = data.eventDate.trim();
    }
    if (data.endDate && data.endDate.trim()) {
      galleryData.endDate = data.endDate.trim();
    }
    if (data.description && data.description.trim()) {
      galleryData.description = data.description.trim();
    }
    if (data.ownerName && data.ownerName.trim()) {
      galleryData.ownerName = data.ownerName.trim();
    }
    if (data.ownerEmail && data.ownerEmail.trim()) {
      galleryData.ownerEmail = data.ownerEmail.trim();
    }

    console.log('📦 Final gallery data to save:', galleryData);

    // Clean undefined values from nested objects
    const cleanData = JSON.parse(JSON.stringify(galleryData, (key, value) => 
      value === undefined ? null : value
    ));

    const docRef = await addDoc(collection(db, 'galleries'), cleanData);
    
    console.log('✅ Gallery document created successfully:', docRef.id);

    // Also save to PostgreSQL for root admin
    try {
      await fetch('/api/galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseId: docRef.id,
          slug: data.slug,
          eventName: data.eventName,
          theme: data.theme,
          ownerName: data.ownerName || null,
          ownerEmail: data.ownerEmail || null,
          password: data.password || null,
          description: data.description || null,
          eventDate: data.eventDate || null,
          endDate: data.endDate || null,
          mediaCount: 0,
          visitorCount: 0,
        }),
      });
      console.log('✅ Gallery saved to PostgreSQL for root admin tracking');
    } catch (dbError) {
      console.warn('⚠️ Failed to save gallery to PostgreSQL (root admin won\'t see it):', dbError);
      // Don't fail the gallery creation if database save fails
    }
    
    return {
      id: docRef.id,
      ...galleryData
    } as Gallery;
    } catch (error: any) {
      console.error('❌ Error creating gallery:', error);
      throw new Error(error.message || 'Fehler beim Erstellen der Galerie');
    }
  }

  // Get galleries by owner email
  async getGalleriesByOwnerEmail(ownerEmail: string): Promise<Gallery[]> {
    try {
      const q = query(collection(db, 'galleries'), where('ownerEmail', '==', ownerEmail));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Gallery));
    } catch (error) {
      console.error('Error fetching galleries by owner email:', error);
      return [];
    }
  }

  // Get gallery by slug
  async getGalleryBySlug(slug: string): Promise<Gallery | null> {
    const q = query(collection(db, 'galleries'), where('slug', '==', slug));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as Gallery;
  }

  // Get gallery by ID
  async getGalleryById(id: string): Promise<Gallery | null> {
    const docRef = doc(db, 'galleries', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Gallery;
  }

  // Verify gallery password
  async verifyGalleryPassword(slug: string, password: string): Promise<boolean> {
    const gallery = await this.getGalleryBySlug(slug);
    if (!gallery || !gallery.isPasswordProtected) {
      return true;
    }
    return gallery.password === password;
  }

  // Update gallery settings
  async updateGallerySettings(galleryId: string, settings: Partial<GallerySettings>): Promise<void> {
    const galleryRef = doc(db, 'galleries', galleryId);
    await updateDoc(galleryRef, {
      'settings': settings,
      updatedAt: new Date().toISOString()
    });
  }

  // Update gallery stats
  async updateGalleryStats(galleryId: string, stats: Partial<GalleryStats>): Promise<void> {
    const galleryRef = doc(db, 'galleries', galleryId);
    await updateDoc(galleryRef, {
      'stats': stats,
      'stats.lastActivity': new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // Add user to gallery
  async addUserToGallery(galleryId: string, userData: Omit<GalleryUser, 'id' | 'galleryId' | 'joinedAt' | 'lastSeen'>): Promise<GalleryUser> {
    const userCollectionPath = `galleries/${galleryId}/users`;
    
    // Check if user already exists
    const existingUserQuery = query(
      collection(db, userCollectionPath),
      where('deviceId', '==', userData.deviceId)
    );
    const existingUsers = await getDocs(existingUserQuery);
    
    if (!existingUsers.empty) {
      const existingUser = existingUsers.docs[0];
      const user = { id: existingUser.id, ...existingUser.data() } as GalleryUser;
      
      // Update last seen
      await updateDoc(doc(db, userCollectionPath, user.id), {
        lastSeen: new Date().toISOString()
      });
      
      return user;
    }

    const newUserData = {
      ...userData,
      galleryId,
      joinedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, userCollectionPath), newUserData);
    
    // Update gallery stats
    await this.incrementGalleryStats(galleryId, { totalUsers: 1 });
    
    return {
      id: docRef.id,
      ...newUserData
    };
  }

  // Get gallery users
  async getGalleryUsers(galleryId: string): Promise<GalleryUser[]> {
    const usersSnapshot = await getDocs(collection(db, `galleries/${galleryId}/users`));
    return usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GalleryUser[];
  }

  // Delete gallery and all associated data
  async deleteGallery(galleryId: string): Promise<void> {
    const batch = writeBatch(db);
    
    // Delete main gallery document
    batch.delete(doc(db, 'galleries', galleryId));
    
    // Delete all subcollections (users, media, comments, likes, stories, etc.)
    const subcollections = ['users', 'media', 'comments', 'likes', 'stories', 'timeline', 'spotify'];
    
    for (const subcollection of subcollections) {
      const snapshot = await getDocs(collection(db, `galleries/${galleryId}/${subcollection}`));
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
    }
    
    await batch.commit();
  }

  // Helper method to increment stats
  private async incrementGalleryStats(galleryId: string, incrementData: Partial<GalleryStats>): Promise<void> {
    const galleryRef = doc(db, 'galleries', galleryId);
    const galleryDoc = await getDoc(galleryRef);
    
    if (galleryDoc.exists()) {
      const currentStats = galleryDoc.data().stats as GalleryStats;
      const updatedStats = { ...currentStats };
      
      Object.entries(incrementData).forEach(([key, value]) => {
        if (typeof value === 'number') {
          const currentValue = currentStats[key as keyof GalleryStats];
          if (typeof currentValue === 'number') {
            (updatedStats as any)[key] = currentValue + value;
          }
        }
      });
      
      updatedStats.lastActivity = new Date().toISOString();
      
      await updateDoc(galleryRef, {
        stats: updatedStats,
        updatedAt: new Date().toISOString()
      });
    }
  }

  // Get collection name for gallery-specific data
  getGalleryCollection(galleryId: string, collectionName: string): string {
    return `galleries/${galleryId}/${collectionName}`;
  }

  // Check if slug is available
  async isSlugAvailable(slug: string): Promise<boolean> {
    const gallery = await this.getGalleryBySlug(slug);
    return !gallery;
  }

  // Generate unique slug suggestion
  async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    
    while (!(await this.isSlugAvailable(slug))) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    return slug;
  }

  // Update gallery view count
  async incrementViewCount(galleryId: string): Promise<void> {
    await this.incrementGalleryStats(galleryId, { totalViews: 1 });
  }

  // Update last activity
  async updateLastActivity(galleryId: string): Promise<void> {
    const galleryRef = doc(db, 'galleries', galleryId);
    await updateDoc(galleryRef, {
      'stats.lastActivity': new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // Get all galleries (for root admin)
  async getAllGalleries(): Promise<Gallery[]> {
    const galleriesSnapshot = await getDocs(collection(db, 'galleries'));
    return galleriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Gallery[];
  }
}

export const galleryService = GalleryService.getInstance();
