import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRootAdminSchema, insertGallerySchema } from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize root admin if not exists
  const initRootAdmin = async () => {
    const existingAdmin = await storage.getRootAdminByUsername("admin");
    if (!existingAdmin) {
      await storage.createRootAdmin({
        username: "admin",
        password: await hashPassword("Unhack85!$")
      });
      console.log("Root admin created successfully");
    }
  };
  
  // Call initialization
  await initRootAdmin();

  // Root admin login
  app.post("/api/root-admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const admin = await storage.getRootAdminByUsername(username);
      if (!admin || !(await comparePasswords(password, admin.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      res.json({ success: true, admin: { id: admin.id, username: admin.username } });
    } catch (error) {
      console.error("Root admin login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Get all galleries for root admin
  app.get("/api/root-admin/galleries", async (req, res) => {
    try {
      const galleries = await storage.getAllGalleries();
      res.json(galleries);
    } catch (error) {
      console.error("Get galleries error:", error);
      res.status(500).json({ error: "Failed to fetch galleries" });
    }
  });

  // Create gallery
  app.post("/api/galleries", async (req, res) => {
    try {
      const galleryData = insertGallerySchema.parse(req.body);
      const gallery = await storage.createGallery(galleryData);
      res.status(201).json(gallery);
    } catch (error) {
      console.error("Create gallery error:", error);
      res.status(500).json({ error: "Failed to create gallery" });
    }
  });

  // Update gallery stats
  app.put("/api/galleries/:firebaseId/stats", async (req, res) => {
    try {
      const { firebaseId } = req.params;
      const { mediaCount, visitorCount } = req.body;
      
      await storage.updateGalleryStats(firebaseId, mediaCount, visitorCount);
      res.json({ success: true });
    } catch (error) {
      console.error("Update gallery stats error:", error);
      res.status(500).json({ error: "Failed to update gallery stats" });
    }
  });

  // Delete gallery
  app.delete("/api/root-admin/galleries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGallery(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete gallery error:", error);
      res.status(500).json({ error: "Failed to delete gallery" });
    }
  });

  // Story viewing endpoints
  app.post("/api/stories/:id/view", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, deviceId } = req.body;
      
      // Store story view in database/storage
      // For now, just return success as story viewing is handled client-side with Zustand
      res.json({ success: true, storyId: id, viewedBy: userId });
    } catch (error) {
      console.error("Mark story viewed error:", error);
      res.status(500).json({ error: "Failed to mark story as viewed" });
    }
  });

  app.put("/api/stories/:id/ring/hide", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      // Hide story ring for user
      // Handled client-side with Zustand store
      res.json({ success: true, storyId: id, hiddenFor: userId });
    } catch (error) {
      console.error("Hide story ring error:", error);
      res.status(500).json({ error: "Failed to hide story ring" });
    }
  });

  // Media tagging endpoints
  app.post("/api/media/tags", async (req, res) => {
    try {
      const { mediaId, tags, userId } = req.body;
      
      // Validate tag data
      if (!mediaId || !tags || !Array.isArray(tags)) {
        return res.status(400).json({ error: "Invalid tag data" });
      }
      
      // Store tags - for now return mock data as tags are handled via Firebase
      const createdTags = tags.map(tag => ({
        ...tag,
        id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        createdBy: userId
      }));
      
      res.json({ success: true, tags: createdTags });
    } catch (error) {
      console.error("Create media tags error:", error);
      res.status(500).json({ error: "Failed to create media tags" });
    }
  });

  app.delete("/api/media/tags/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      // Delete tag with permission check
      // Handled via Firebase in client
      res.json({ success: true, deletedTagId: id });
    } catch (error) {
      console.error("Delete media tag error:", error);
      res.status(500).json({ error: "Failed to delete media tag" });
    }
  });

  // Google Places search endpoint (mock for now)
  app.get("/api/places/search", async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string' || q.length < 3) {
        return res.json({ results: [] });
      }
      
      // Mock Places API response
      const mockResults = [
        {
          place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
          name: 'Starbucks Coffee',
          formatted_address: '123 Main St, New York, NY 10001, USA',
          geometry: {
            location: { lat: 40.7128, lng: -74.0060 }
          },
          types: ['cafe', 'food', 'point_of_interest', 'establishment'],
          rating: 4.2
        },
        {
          place_id: 'ChIJKxjxuaNZwokRBHGBNe6u5P8',
          name: 'Central Park',
          formatted_address: 'New York, NY, USA',
          geometry: {
            location: { lat: 40.7829, lng: -73.9654 }
          },
          types: ['park', 'tourist_attraction', 'point_of_interest', 'establishment'],
          rating: 4.8
        }
      ].filter(place => 
        place.name.toLowerCase().includes(q.toLowerCase()) ||
        place.formatted_address.toLowerCase().includes(q.toLowerCase())
      );
      
      res.json({ results: mockResults });
    } catch (error) {
      console.error("Places search error:", error);
      res.status(500).json({ error: "Failed to search places" });
    }
  });

  // Media upload with compression metadata
  app.post("/api/media/upload", async (req, res) => {
    try {
      const { 
        file, 
        type, 
        originalSize, 
        compressedSize, 
        compressionRatio,
        userId,
        galleryId 
      } = req.body;
      
      // Handle media upload with compression metadata
      // Actual file handling is done via Firebase in client
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      res.json({ 
        success: true, 
        uploadId,
        metadata: {
          originalSize,
          compressedSize,
          compressionRatio,
          processingTime: Date.now()
        }
      });
    } catch (error) {
      console.error("Media upload error:", error);
      res.status(500).json({ error: "Failed to upload media" });
    }
  });

  // High-res gallery profile image endpoint
  app.get("/api/profile/gallery-image/:galleryId", async (req, res) => {
    try {
      const { galleryId } = req.params;
      
      // Get gallery profile image
      // Handled via Firebase in client
      res.json({ 
        success: true, 
        galleryId,
        imageUrl: null // Will be provided by Firebase
      });
    } catch (error) {
      console.error("Get gallery image error:", error);
      res.status(500).json({ error: "Failed to get gallery image" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
