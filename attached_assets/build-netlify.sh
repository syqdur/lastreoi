#!/bin/bash
set -e

echo "🚀 Building for Netlify..."

# Clean install to avoid dependency issues
echo "📦 Installing dependencies..."
npm ci --production=false

# Only build the frontend (skip server build)
echo "🏗️ Building frontend..."
npx vite build

echo "✅ Netlify build complete!"