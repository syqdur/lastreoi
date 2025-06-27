# Telya Deployment Guide

## Current Deployment Status

Your frontend is successfully deployed at **telya.netlify.app**, but the admin login requires a backend server to function properly.

## Deployment Architecture

```
Frontend (Netlify) ← → Backend (Required for Admin)
     ↓                      ↓
  Static Files         API + Database
  - React App          - Express Server
  - Firebase Auth      - PostgreSQL
  - Gallery Features   - Admin Functions
```

## Solution Options

### Option 1: Deploy Backend to Replit (Recommended)
1. Your current Replit instance can serve as the backend
2. Set `VITE_API_BASE_URL` to your Replit domain
3. Update Netlify environment variables

### Option 2: Deploy to Railway/Render
1. Connect your GitHub repository
2. Deploy the Express server
3. Set up PostgreSQL database
4. Configure environment variables

### Option 3: Vercel Full-Stack
1. Deploy entire project to Vercel
2. Automatic API routes handling
3. Built-in database integration

## Quick Fix for Current Setup

### 1. Configure API Base URL
Add to your Netlify environment variables:
```
VITE_API_BASE_URL=https://your-replit-domain.replit.dev
```

### 2. Enable Replit Always-On
- Upgrade your Replit to keep the backend running
- Or use a service like UptimeRobot to ping your backend

### 3. CORS Configuration
Update your Express server to allow requests from telya.netlify.app

## Environment Variables Needed

### For Netlify (Frontend)
```
VITE_SPOTIFY_CLIENT_ID=00f80a484d076aafacc982e934f9742c
VITE_SPOTIFY_CLIENT_SECRET=e403eac0ab847b58af386c6a815e033
VITE_API_BASE_URL=https://your-backend-url.com
```

### For Backend Server
```
DATABASE_URL=postgresql://username:password@host:port/database
PORT=5000
```

## Current Admin Credentials
- Username: `admin`
- Password: `Unhack85!$`

## Next Steps
1. Choose deployment option
2. Deploy backend server
3. Update environment variables
4. Test admin login functionality

## Gallery Features (Working)
- Gallery creation ✅
- Photo/video sharing ✅
- Real-time comments ✅
- Stories ✅
- Spotify integration ✅
- Live users ✅

## Admin Features (Requires Backend)
- Root admin login ❌
- Gallery management ❌
- User management ❌
- Bulk operations ❌