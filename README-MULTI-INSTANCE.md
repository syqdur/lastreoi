# WeddingPix - Multi-Instance Wedding Gallery Platform

## Overview

WeddingPix has evolved from a single wedding gallery into a comprehensive multi-instance platform where users can create their own private, isolated wedding gallery instances. Each gallery operates independently with the full WeddingPix feature set but maintains complete data separation.

## Architecture

### Multi-Tenancy Model
- **Gallery-Specific Data**: Each gallery maintains its own isolated data collections in Firebase
- **Shared Codebase**: All galleries use the same React application code
- **Dynamic Routing**: URL-based routing to access different gallery instances
- **Independent Settings**: Each gallery can configure its own features and privacy settings

### Data Structure
```
Firebase Firestore:
├── galleries/                    # Gallery metadata
│   └── {galleryId}/
│       ├── media/               # Gallery-specific media
│       ├── comments/            # Gallery-specific comments  
│       ├── likes/               # Gallery-specific likes
│       ├── stories/             # Gallery-specific 24h stories
│       ├── userProfiles/        # Gallery-specific user profiles
│       ├── users/               # Gallery members
│       ├── timeline/            # Gallery timeline events
│       ├── spotify/             # Gallery music wishlist
│       └── notifications/       # Gallery notifications

Firebase Storage:
├── galleries/
│   └── {galleryId}/
│       ├── uploads/             # Media files
│       ├── stories/             # Story files (auto-delete)
│       └── profile-pictures/    # User avatars
```

## Core Features

### Landing Page
- Public gallery creation form
- Event name, optional password, date range
- Unique slug generation (e.g., `/julia-und-tim`)
- Feature overview and pricing (if applicable)

### Gallery Instance Features
Each gallery includes the complete WeddingPix feature set:

1. **Instagram-Style Feed**
   - Photo/video sharing with real-time updates
   - Comments and likes system
   - Note posting for text-only content

2. **24-Hour Stories**
   - Instagram-style ephemeral content
   - Auto-deletion after 24 hours
   - View tracking and story rings

3. **Live Features**
   - Real-time user presence indicators
   - Live comment and like updates
   - Push notifications for interactions

4. **Spotify Integration**
   - Song request system
   - Collaborative playlist management
   - Real-time playlist synchronization

5. **Interactive Timeline**
   - Wedding milestone tracking
   - Media attachments to events
   - Custom event creation

6. **Admin Panel**
   - Content moderation tools
   - User management
   - Feature toggles (stories, comments, etc.)

7. **User Profiles**
   - Custom display names and avatars
   - Camera capture for profile pictures
   - Guest identification system

### Privacy & Security
- **Private by Default**: All galleries are private unless made public
- **Password Protection**: Optional password for gallery access
- **No Mandatory Registration**: Guests can participate without accounts
- **Device-Based Identity**: Users identified by device ID + name
- **Admin Controls**: Gallery owners can moderate all content

## Technical Implementation

### Frontend Architecture
- **React 18** with TypeScript
- **Vite** for development and building
- **Tailwind CSS** with dark mode support
- **Wouter** for client-side routing
- **Firebase SDK** for real-time features

### Backend Services
- **Firebase Firestore**: Real-time database with multi-tenant structure
- **Firebase Storage**: File storage with gallery-specific paths
- **Firebase Functions**: Server-side logic (if needed)
- **Express.js**: Optional API server for extended functionality

### Gallery-Aware Services
All data operations are gallery-aware through dedicated service layers:

- `galleryService.ts`: Gallery CRUD operations
- `galleryFirebaseService.ts`: Gallery-specific data operations
- `notificationService.ts`: Cross-gallery notification system

### Routing System
```
Routes:
├── /                           # Landing page
├── /{gallerySlug}             # Gallery instance
├── /{gallerySlug}/admin       # Gallery admin panel
└── /{gallerySlug}/recap       # Post-wedding recap
```

## Setup Instructions

### 1. Firebase Configuration
1. Create a new Firebase project
2. Enable Firestore Database
3. Enable Storage
4. Enable Authentication (optional)
5. Update Firebase Security Rules (see `firebase-firestore-rules.txt`)
6. Update Storage Rules (see `firebase-storage-rules.txt`)

### 2. Environment Configuration
```bash
# Copy environment variables
cp .env.example .env

# Configure Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Optional: Spotify Integration
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
```

### 3. Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Deployment Options

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify
1. Connect your Git repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables

### Custom Server
```bash
# Build the application
npm run build

# Serve with any static file server
npx serve dist
```

## Gallery Management

### Creating a Gallery
1. Visit the landing page
2. Fill out the creation form:
   - Event name (required)
   - Optional password for privacy
   - Event date range
   - Description
3. Get redirected to your new gallery URL

### Gallery Settings
Each gallery can configure:
- **Privacy**: Public, password-protected, or invite-only
- **Features**: Enable/disable stories, comments, music, etc.
- **Moderation**: Auto-delete after X days, content approval
- **Limits**: Max file size, allowed file types

### Admin Functions
Gallery owners can:
- Delete any content
- Manage user profiles
- Export gallery data
- Close gallery access
- Generate post-wedding recap

## Migration from Single Instance

For existing WeddingPix installations:

1. **Data Migration**: Use the migration scripts to move data to gallery-specific collections
2. **URL Updates**: Update bookmarks to include gallery slug
3. **Admin Access**: Set gallery ownership for existing admin users

## Security Considerations

### Firebase Security Rules
- Gallery-specific read/write permissions
- User ownership validation for content
- Admin privilege checks
- Rate limiting for uploads

### Data Privacy
- All user data is gallery-isolated
- No cross-gallery data sharing
- Optional data export for users
- GDPR compliance features

## Performance Optimization

### Caching Strategy
- Firebase query caching
- Image optimization and CDN
- Progressive Web App features
- Offline-first approach for core features

### Scalability
- Horizontal scaling through gallery isolation
- Firebase auto-scaling
- CDN for global content delivery
- Lazy loading for large galleries

## Monitoring & Analytics

### Gallery Analytics
- User engagement metrics
- Popular content tracking
- Performance monitoring
- Error tracking and alerts

### Platform Metrics
- Total galleries created
- Active user counts
- Storage usage
- API usage patterns

## Support & Documentation

### User Documentation
- Gallery creation guide
- Feature tutorials
- Privacy settings guide
- Troubleshooting common issues

### Developer Documentation
- API reference
- Component documentation
- Database schema
- Deployment guides

## Future Enhancements

### Planned Features
- **Subdomain Support**: `julia-tim.weddingpix.app`
- **Custom Domains**: `photos.julia-tim.com`
- **Gallery Templates**: Pre-designed themes
- **Advanced Analytics**: Detailed engagement metrics
- **API Access**: Third-party integrations
- **White-Label Options**: Remove WeddingPix branding

### Integration Possibilities
- **Google Photos**: Import existing photos
- **WhatsApp**: Direct sharing integration
- **Calendar Apps**: Event synchronization
- **Email Services**: Automated thank-you cards
- **Social Media**: Cross-platform sharing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For technical support or feature requests:
- GitHub Issues: [Repository Issues](https://github.com/your-repo/issues)
- Email: support@weddingpix.app
- Documentation: [docs.weddingpix.app](https://docs.weddingpix.app)
