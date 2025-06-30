import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

interface MediaCleanupResult {
  deletedMedia: number;
  deletedComments: number;
  deletedLikes: number;
  deletedTags: number;
  errors: string[];
}

export class MediaCleanupService {
  /**
   * Clean up orphaned media that no longer exists in the gallery feed
   * This removes media entries from database/storage that are not found in the current gallery
   */
  static async cleanupOrphanedMedia(galleryId: string, currentMediaIds: string[]): Promise<MediaCleanupResult> {
    const result: MediaCleanupResult = {
      deletedMedia: 0,
      deletedComments: 0,
      deletedLikes: 0,
      deletedTags: 0,
      errors: []
    };

    try {
      console.log('🧹 Starting media cleanup for gallery:', galleryId);
      console.log('📊 Current media IDs:', currentMediaIds.length);

      // Get all media in database
      const mediaCollectionRef = collection(db, `galleries/${galleryId}/media`);
      const mediaSnapshot = await getDocs(mediaCollectionRef);
      
      const databaseMediaIds = mediaSnapshot.docs.map(doc => doc.id);
      console.log('💾 Database media IDs:', databaseMediaIds.length);

      // Find orphaned media (in database but not in current feed)
      const orphanedMediaIds = databaseMediaIds.filter(id => !currentMediaIds.includes(id));
      console.log('🗑️ Orphaned media found:', orphanedMediaIds.length);

      // Delete orphaned media and related data
      for (const mediaId of orphanedMediaIds) {
        try {
          // Delete media document
          await deleteDoc(doc(db, `galleries/${galleryId}/media`, mediaId));
          result.deletedMedia++;

          // Delete related comments
          const commentsQuery = query(
            collection(db, `galleries/${galleryId}/comments`),
            where('mediaId', '==', mediaId)
          );
          const commentsSnapshot = await getDocs(commentsQuery);
          for (const commentDoc of commentsSnapshot.docs) {
            await deleteDoc(commentDoc.ref);
            result.deletedComments++;
          }

          // Delete related likes
          const likesQuery = query(
            collection(db, `galleries/${galleryId}/likes`),
            where('mediaId', '==', mediaId)
          );
          const likesSnapshot = await getDocs(likesQuery);
          for (const likeDoc of likesSnapshot.docs) {
            await deleteDoc(likeDoc.ref);
            result.deletedLikes++;
          }

          // Delete related tags
          const tagsQuery = query(
            collection(db, `galleries/${galleryId}/tags`),
            where('mediaId', '==', mediaId)
          );
          const tagsSnapshot = await getDocs(tagsQuery);
          for (const tagDoc of tagsSnapshot.docs) {
            await deleteDoc(tagDoc.ref);
            result.deletedTags++;
          }

          console.log(`✅ Cleaned up orphaned media: ${mediaId}`);
        } catch (error) {
          const errorMsg = `Failed to cleanup media ${mediaId}: ${error}`;
          console.error('❌', errorMsg);
          result.errors.push(errorMsg);
        }
      }

      console.log('🧹 Media cleanup completed:', result);
      return result;

    } catch (error) {
      const errorMsg = `Media cleanup failed: ${error}`;
      console.error('❌', errorMsg);
      result.errors.push(errorMsg);
      return result;
    }
  }

  /**
   * Run cleanup automatically when media is deleted from the feed
   */
  static async autoCleanupOnMediaDelete(galleryId: string, deletedMediaId: string): Promise<void> {
    try {
      console.log('🔄 Auto-cleanup triggered for deleted media:', deletedMediaId);
      
      // Delete related comments
      const commentsQuery = query(
        collection(db, `galleries/${galleryId}/comments`),
        where('mediaId', '==', deletedMediaId)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      for (const commentDoc of commentsSnapshot.docs) {
        await deleteDoc(commentDoc.ref);
      }

      // Delete related likes
      const likesQuery = query(
        collection(db, `galleries/${galleryId}/likes`),
        where('mediaId', '==', deletedMediaId)
      );
      const likesSnapshot = await getDocs(likesQuery);
      for (const likeDoc of likesSnapshot.docs) {
        await deleteDoc(likeDoc.ref);
      }

      // Delete related tags
      const tagsQuery = query(
        collection(db, `galleries/${galleryId}/tags`),
        where('mediaId', '==', deletedMediaId)
      );
      const tagsSnapshot = await getDocs(tagsQuery);
      for (const tagDoc of tagsSnapshot.docs) {
        await deleteDoc(tagDoc.ref);
      }

      console.log('✅ Auto-cleanup completed for media:', deletedMediaId);
    } catch (error) {
      console.error('❌ Auto-cleanup failed:', error);
    }
  }

  /**
   * Check media availability and mark unavailable ones
   */
  static async checkMediaAvailability(galleryId: string): Promise<string[]> {
    const unavailableMediaIds: string[] = [];

    try {
      const mediaCollectionRef = collection(db, `galleries/${galleryId}/media`);
      const mediaSnapshot = await getDocs(mediaCollectionRef);

      for (const mediaDoc of mediaSnapshot.docs) {
        const mediaData = mediaDoc.data();
        const mediaUrl = mediaData.url;

        if (mediaUrl && !mediaUrl.startsWith('data:')) {
          // Check if external URL is still accessible
          try {
            const response = await fetch(mediaUrl, { method: 'HEAD' });
            if (!response.ok) {
              unavailableMediaIds.push(mediaDoc.id);
              console.log(`📷 Media unavailable: ${mediaDoc.id}`);
            }
          } catch (error) {
            unavailableMediaIds.push(mediaDoc.id);
            console.log(`📷 Media check failed: ${mediaDoc.id}`);
          }
        }
      }

      return unavailableMediaIds;
    } catch (error) {
      console.error('❌ Media availability check failed:', error);
      return [];
    }
  }
}