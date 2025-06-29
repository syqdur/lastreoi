# Netlify Environment Variables Setup

## Required Environment Variables

Copy these exact values to your Netlify environment variables:

### API Configuration
```
VITE_API_BASE_URL=https://telya.netlify.app/.netlify/functions
```

### Spotify Integration
```
VITE_SPOTIFY_CLIENT_ID=00f80ab84d074aafacc982e93f47942c
VITE_SPOTIFY_CLIENT_SECRET=e403ceac0ab847b58a1386c4e815a033
VITE_SPOTIFY_REDIRECT_URI=https://telya.netlify.app/
```

### Firebase Configuration (Add your actual values)
```
VITE_FIREBASE_API_KEY=your_actual_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_actual_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_actual_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_actual_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_actual_firebase_app_id
```

## Deployment Steps

1. **Set Environment Variables**: Add all variables above to Netlify
2. **Deploy from GitHub**: Push your code to trigger deployment
3. **Test Admin Login**: Use username `admin` and password `Unhack85!$`
4. **Verify Spotify**: Test music wishlist functionality
5. **Check Firebase**: Ensure galleries and media work properly

## Root Admin Access
- **URL**: https://telya.netlify.app/
- **Username**: admin  
- **Password**: Unhack85!$