# Netlify Build Fix

## The Issue
Your build is failing due to missing Rollup platform-specific binaries. This is a common npm dependency resolution issue.

## Quick Fix

Replace your current `netlify.toml` with this configuration:

```toml
[build]
  publish = "dist/public"
  command = "npm install --legacy-peer-deps && npm install @rollup/rollup-linux-x64-gnu --save-dev && npx vite build"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"
  NPM_CONFIG_LEGACY_PEER_DEPS = "true"

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Environment Variables Required

In your Netlify dashboard, add these environment variables:

```
VITE_API_BASE_URL=https://telya.netlify.app/.netlify/functions
VITE_SPOTIFY_CLIENT_ID=00f80ab84d074aafacc982e93f47942c
VITE_SPOTIFY_CLIENT_SECRET=e403ceac0ab847b58a1386c4e815a033
VITE_SPOTIFY_REDIRECT_URI=https://telya.netlify.app/
```

Plus your Firebase configuration variables.

## Alternative Solution

If the build still fails, try this simpler approach:

1. Delete `node_modules` and `package-lock.json` from your repository
2. Commit and push the changes
3. The fresh build on Netlify should resolve dependencies correctly

## Root Admin Access

After successful deployment:
- URL: https://telya.netlify.app/
- Username: admin
- Password: Unhack85!$