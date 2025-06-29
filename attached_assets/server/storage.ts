import { users, rootAdmins, galleries, type User, type InsertUser, type RootAdmin, type InsertRootAdmin, type Gallery, type InsertGallery } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Root admin methods
  getRootAdminByUsername(username: string): Promise<RootAdmin | undefined>;
  createRootAdmin(admin: InsertRootAdmin): Promise<RootAdmin>;
  
  // Gallery management methods
  getAllGalleries(): Promise<Gallery[]>;
  getGalleryByFirebaseId(firebaseId: string): Promise<Gallery | undefined>;
  getGalleryBySlug(slug: string): Promise<Gallery | undefined>;
  createGallery(gallery: InsertGallery): Promise<Gallery>;
  updateGallery(id: number, gallery: Partial<Gallery>): Promise<Gallery>;
  deleteGallery(id: number): Promise<void>;
  updateGalleryStats(firebaseId: string, mediaCount: number, visitorCount: number): Promise<void>;
}

// In-memory storage for development/fallback
export class MemoryStorage implements IStorage {
  private users: User[] = [];
  private rootAdmins: RootAdmin[] = [];
  private galleries: Gallery[] = [];
  private nextUserId = 1;
  private nextRootAdminId = 1;
  private nextGalleryId = 1;

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.nextUserId++,
      username: insertUser.username,
      password: insertUser.password
    };
    this.users.push(user);
    return user;
  }

  async getRootAdminByUsername(username: string): Promise<RootAdmin | undefined> {
    return this.rootAdmins.find(a => a.username === username);
  }

  async createRootAdmin(insertAdmin: InsertRootAdmin): Promise<RootAdmin> {
    const admin: RootAdmin = {
      id: this.nextRootAdminId++,
      username: insertAdmin.username,
      password: insertAdmin.password,
      createdAt: new Date()
    };
    this.rootAdmins.push(admin);
    return admin;
  }

  async getAllGalleries(): Promise<Gallery[]> {
    return [...this.galleries];
  }

  async getGalleryByFirebaseId(firebaseId: string): Promise<Gallery | undefined> {
    return this.galleries.find(g => g.firebaseId === firebaseId);
  }

  async getGalleryBySlug(slug: string): Promise<Gallery | undefined> {
    return this.galleries.find(g => g.slug === slug);
  }

  async createGallery(insertGallery: InsertGallery): Promise<Gallery> {
    const gallery: Gallery = {
      id: this.nextGalleryId++,
      firebaseId: insertGallery.firebaseId,
      slug: insertGallery.slug,
      eventName: insertGallery.eventName,
      password: insertGallery.password || null,
      eventDate: insertGallery.eventDate || null,
      endDate: insertGallery.endDate || null,
      description: insertGallery.description || null,
      ownerName: insertGallery.ownerName || null,
      ownerEmail: insertGallery.ownerEmail || null,
      mediaCount: 0,
      visitorCount: 0,
      createdAt: new Date()
    };
    this.galleries.push(gallery);
    return gallery;
  }

  async updateGallery(id: number, galleryUpdate: Partial<Gallery>): Promise<Gallery> {
    const index = this.galleries.findIndex(g => g.id === id);
    if (index === -1) {
      throw new Error('Gallery not found');
    }
    
    const updatedGallery = {
      ...this.galleries[index],
      ...galleryUpdate
    };
    this.galleries[index] = updatedGallery;
    return updatedGallery;
  }

  async deleteGallery(id: number): Promise<void> {
    const index = this.galleries.findIndex(g => g.id === id);
    if (index === -1) {
      throw new Error('Gallery not found');
    }
    this.galleries.splice(index, 1);
  }

  async updateGalleryStats(firebaseId: string, mediaCount: number, visitorCount: number): Promise<void> {
    const gallery = this.galleries.find(g => g.firebaseId === firebaseId);
    if (gallery) {
      gallery.mediaCount = mediaCount;
      gallery.visitorCount = visitorCount;
    }
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Root admin methods
  async getRootAdminByUsername(username: string): Promise<RootAdmin | undefined> {
    const [admin] = await db.select().from(rootAdmins).where(eq(rootAdmins.username, username));
    return admin || undefined;
  }

  async createRootAdmin(insertAdmin: InsertRootAdmin): Promise<RootAdmin> {
    const [admin] = await db
      .insert(rootAdmins)
      .values(insertAdmin)
      .returning();
    return admin;
  }

  // Gallery management methods
  async getAllGalleries(): Promise<Gallery[]> {
    return await db.select().from(galleries);
  }

  async getGalleryByFirebaseId(firebaseId: string): Promise<Gallery | undefined> {
    const [gallery] = await db.select().from(galleries).where(eq(galleries.firebaseId, firebaseId));
    return gallery || undefined;
  }

  async getGalleryBySlug(slug: string): Promise<Gallery | undefined> {
    const [gallery] = await db.select().from(galleries).where(eq(galleries.slug, slug));
    return gallery || undefined;
  }

  async createGallery(insertGallery: InsertGallery): Promise<Gallery> {
    const [gallery] = await db
      .insert(galleries)  
      .values(insertGallery)
      .returning();
    return gallery;
  }

  async updateGallery(id: number, galleryUpdate: Partial<Gallery>): Promise<Gallery> {
    const [gallery] = await db
      .update(galleries)
      .set(galleryUpdate)
      .where(eq(galleries.id, id))
      .returning();
    return gallery;
  }

  async deleteGallery(id: number): Promise<void> {
    await db.delete(galleries).where(eq(galleries.id, id));
  }

  async updateGalleryStats(firebaseId: string, mediaCount: number, visitorCount: number): Promise<void> {
    await db
      .update(galleries)
      .set({ mediaCount, visitorCount })
      .where(eq(galleries.firebaseId, firebaseId));
  }
}

// Use in-memory storage if DATABASE_URL is not set, otherwise use database
export const storage = process.env.DATABASE_URL && process.env.DATABASE_URL !== "postgresql://user:pass@localhost:5432/temp" 
  ? new DatabaseStorage() 
  : new MemoryStorage();
