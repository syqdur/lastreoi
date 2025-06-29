# Netlify Deployment Guide

## Setup Instructions

### 1. Environment Variables in Netlify
Go to your Netlify dashboard → Site settings → Environment variables and add:

```
VITE_API_BASE_URL=https://telya.netlify.app/.netlify/functions
VITE_SPOTIFY_CLIENT_ID=00f80ab84d074aafacc982e93f47942c
VITE_SPOTIFY_CLIENT_SECRET=e403ceac0ab847b58a1386c4e815a033
VITE_SPOTIFY_REDIRECT_URI=https://telya.netlify.app/
```

### 2. Firebase Configuration
Add your Firebase environment variables (if not already present):

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

### 3. Build Settings
Your build settings should already be configured via `netlify.toml`:
- **Base directory**: (leave empty)
- **Build command**: `npm run build`
- **Publish directory**: `dist/public`
- **Functions directory**: `netlify/functions`

### 4. Root Admin Access
After deployment, you can access the root admin at:
- URL: `https://telya.netlify.app/`
- Username: `admin`
- Password: `Unhack85!$`

### 5. Testing the Deployment
1. Push your code to your connected GitHub repository
2. Netlify will automatically trigger a build
3. Test the root admin login functionality
4. Verify gallery creation works
5. Test Spotify integration

## Troubleshooting

### Build Issues
- If build times out, check the build logs in Netlify dashboard
- Ensure all environment variables are properly set
- Verify the repository connection is working

### API Issues
- Check that the Netlify Functions are properly deployed
- Verify CORS headers are working for your domain
- Test API endpoints directly: `https://telya.netlify.app/.netlify/functions/api/root-admin/login`

### Spotify Issues
- Ensure redirect URI matches exactly: `https://telya.netlify.app/`
- Verify client ID and secret are correctly set in environment variables
- Check Spotify app settings allow the correct redirect URI