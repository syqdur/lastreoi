#!/bin/bash
set -e

echo "Fixing Netlify build..."

# Remove problematic dependencies
rm -rf node_modules package-lock.json

# Install with specific flags to avoid Rollup issues
npm install --legacy-peer-deps --no-optional

# Force reinstall Rollup with correct platform binary
npm install @rollup/rollup-linux-x64-gnu --save-dev --legacy-peer-deps

# Build frontend only
npx vite build

echo "Build completed successfully!"