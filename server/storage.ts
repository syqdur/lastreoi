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

export const storage = new DatabaseStorage();
