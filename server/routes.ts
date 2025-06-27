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

  const httpServer = createServer(app);

  return httpServer;
}
