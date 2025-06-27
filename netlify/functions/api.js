import express from 'express';
import serverless from 'serverless-http';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// In-memory storage for Netlify deployment
class NetlifyStorage {
  constructor() {
    this.rootAdmins = [];
    this.galleries = [];
    this.nextRootAdminId = 1;
    this.nextGalleryId = 1;
    this.initialized = false;
  }

  async init() {
    if (!this.initialized) {
      // Create default root admin
      const hashedPassword = await this.hashPassword("Unhack85!$");
      this.rootAdmins.push({
        id: this.nextRootAdminId++,
        username: "admin",
        password: hashedPassword,
        createdAt: new Date().toISOString()
      });
      this.initialized = true;
    }
  }

  async hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const buf = await scryptAsync(password, salt, 64);
    return `${buf.toString("hex")}.${salt}`;
  }

  async comparePasswords(supplied, stored) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    return timingSafeEqual(hashedBuf, suppliedBuf);
  }

  async getRootAdminByUsername(username) {
    return this.rootAdmins.find(admin => admin.username === username);
  }

  async getAllGalleries() {
    return this.galleries;
  }

  async createGallery(galleryData) {
    const gallery = {
      id: this.nextGalleryId++,
      ...galleryData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.galleries.push(gallery);
    return gallery;
  }

  async updateGalleryStats(firebaseId, mediaCount, visitorCount) {
    const gallery = this.galleries.find(g => g.firebaseId === firebaseId);
    if (gallery) {
      gallery.mediaCount = mediaCount;
      gallery.visitorCount = visitorCount;
      gallery.updatedAt = new Date().toISOString();
    }
  }

  async deleteGallery(id) {
    const index = this.galleries.findIndex(g => g.id === id);
    if (index !== -1) {
      this.galleries.splice(index, 1);
    }
  }
}

const storage = new NetlifyStorage();

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Initialize storage
app.use(async (req, res, next) => {
  await storage.init();
  next();
});

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Netlify function is working!', timestamp: new Date().toISOString() });
});

// Root admin login
app.post('/root-admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const admin = await storage.getRootAdminByUsername(username);
    if (!admin || !(await storage.comparePasswords(password, admin.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    res.json({ success: true, admin: { id: admin.id, username: admin.username } });
  } catch (error) {
    console.error("Root admin login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get all galleries for root admin
app.get('/root-admin/galleries', async (req, res) => {
  try {
    const galleries = await storage.getAllGalleries();
    res.json(galleries);
  } catch (error) {
    console.error("Get galleries error:", error);
    res.status(500).json({ error: "Failed to fetch galleries" });
  }
});

// Create gallery
app.post('/galleries', async (req, res) => {
  try {
    const gallery = await storage.createGallery(req.body);
    res.status(201).json(gallery);
  } catch (error) {
    console.error("Create gallery error:", error);
    res.status(500).json({ error: "Failed to create gallery" });
  }
});

// Update gallery stats
app.put('/galleries/:firebaseId/stats', async (req, res) => {
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
app.delete('/root-admin/galleries/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteGallery(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete gallery error:", error);
    res.status(500).json({ error: "Failed to delete gallery" });
  }
});

// Export the serverless function
export const handler = serverless(app);