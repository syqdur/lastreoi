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

// Handle all routes with proper path mapping
app.all('*', async (req, res) => {
  const path = req.path;
  const method = req.method;
  
  console.log(`${method} ${path}`);
  
  try {
    if (path === '/test' && method === 'GET') {
      return res.json({ message: 'Netlify function is working!', timestamp: new Date().toISOString() });
    }
    
    if (path === '/root-admin/login' && method === 'POST') {
      const { username, password } = req.body;
      const admin = await storage.getRootAdminByUsername(username);
      
      if (!admin || !(await storage.comparePasswords(password, admin.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      return res.json({ success: true, admin: { id: admin.id, username: admin.username } });
    }
    
    if (path === '/root-admin/galleries' && method === 'GET') {
      const galleries = await storage.getAllGalleries();
      return res.json(galleries);
    }
    
    if (path === '/galleries' && method === 'POST') {
      const gallery = await storage.createGallery(req.body);
      return res.status(201).json(gallery);
    }
    
    if (path.startsWith('/galleries/') && path.endsWith('/stats') && method === 'PUT') {
      const firebaseId = path.split('/')[2];
      const { mediaCount, visitorCount } = req.body;
      await storage.updateGalleryStats(firebaseId, mediaCount, visitorCount);
      return res.json({ success: true });
    }
    
    if (path.startsWith('/root-admin/galleries/') && method === 'DELETE') {
      const id = parseInt(path.split('/')[3]);
      await storage.deleteGallery(id);
      return res.json({ success: true });
    }
    
    // Default 404
    res.status(404).json({ error: 'Endpoint not found', path, method });
    
  } catch (error) {
    console.error('Function error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const handler = serverless(app);