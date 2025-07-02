import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { PersonTag, LocationTag, TextTag, MediaTag } from '../types/tagging';

interface NotificationData {
  type: 'tag' | 'comment' | 'like' | 'story_mention';
  fromUser: string;
  fromDisplayName?: string;
  toUser: string;
  toDeviceId: string;
  galleryId: string;
  mediaId?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  message: string;
  isRead: boolean;
  createdAt: any;
}

export class NotificationService {
  // Send tagging notifications
  static async sendTaggingNotifications(
    galleryId: string,
    mediaId: string,
    mediaUrl: string,
    mediaType: 'image' | 'video',
    tags: MediaTag[],
    fromUser: string,
    fromDisplayName?: string
  ) {
    try {
      // Filter only person tags for notifications
      const personTags = tags.filter(tag => tag.type === 'person') as PersonTag[];
      
      if (personTags.length === 0) return;

      // Create notification collection reference
      const notificationsRef = collection(db, 'galleries', galleryId, 'notifications');

      // Send notification to each tagged person
      const notificationPromises = personTags.map(async (tag) => {
        // Skip notification if user is tagging themselves
        if (tag.deviceId === localStorage.getItem('deviceId')) {
          return;
        }

        const notificationData: NotificationData = {
          type: 'tag',
          fromUser,
          fromDisplayName,
          toUser: tag.userName,
          toDeviceId: tag.deviceId,
          galleryId,
          mediaId,
          mediaUrl,
          mediaType,
          message: `${fromDisplayName || fromUser} hat dich in einem ${mediaType === 'image' ? 'Bild' : 'Video'} markiert`,
          isRead: false,
          createdAt: serverTimestamp()
        };

        return addDoc(notificationsRef, notificationData);
      });

      await Promise.all(notificationPromises);
      console.log(`✅ Sent ${personTags.length} tagging notifications`);
    } catch (error) {
      console.error('❌ Error sending tagging notifications:', error);
    }
  }

  // Send story mention notifications
  static async sendStoryMentionNotifications(
    galleryId: string,
    storyId: string,
    storyUrl: string,
    tags: MediaTag[],
    fromUser: string,
    fromDisplayName?: string
  ) {
    try {
      const personTags = tags.filter(tag => tag.type === 'person') as PersonTag[];
      
      if (personTags.length === 0) return;

      const notificationsRef = collection(db, 'galleries', galleryId, 'notifications');

      const notificationPromises = personTags.map(async (tag) => {
        if (tag.deviceId === localStorage.getItem('deviceId')) {
          return;
        }

        const notificationData: NotificationData = {
          type: 'story_mention',
          fromUser,
          fromDisplayName,
          toUser: tag.userName,
          toDeviceId: tag.deviceId,
          galleryId,
          mediaId: storyId,
          mediaUrl: storyUrl,
          mediaType: 'image',
          message: `${fromDisplayName || fromUser} hat dich in einer Story erwähnt`,
          isRead: false,
          createdAt: serverTimestamp()
        };

        return addDoc(notificationsRef, notificationData);
      });

      await Promise.all(notificationPromises);
      console.log(`✅ Sent ${personTags.length} story mention notifications`);
    } catch (error) {
      console.error('❌ Error sending story mention notifications:', error);
    }
  }

  // Send bulk tagging notifications (for multiple media items)
  static async sendBulkTaggingNotifications(
    galleryId: string,
    mediaItems: { id: string; url: string; type: 'image' | 'video' }[],
    allTags: MediaTag[],
    fromUser: string,
    fromDisplayName?: string
  ) {
    try {
      // Collect all unique person tags across all media
      const allPersonTags = allTags.filter(tag => tag.type === 'person') as PersonTag[];
      const uniqueUsers = new Map<string, PersonTag>();
      
      allPersonTags.forEach(tag => {
        if (tag.deviceId !== localStorage.getItem('deviceId')) {
          uniqueUsers.set(tag.deviceId, tag);
        }
      });

      if (uniqueUsers.size === 0) return;

      const notificationsRef = collection(db, 'galleries', galleryId, 'notifications');
      const mediaCount = mediaItems.length;
      
      // Send one notification per user for all media they're tagged in
      const notificationPromises = Array.from(uniqueUsers.values()).map(async (tag) => {
        const notificationData: NotificationData = {
          type: 'tag',
          fromUser,
          fromDisplayName,
          toUser: tag.userName,
          toDeviceId: tag.deviceId,
          galleryId,
          mediaId: mediaItems[0].id, // Use first media item as reference
          mediaUrl: mediaItems[0].url,
          mediaType: mediaItems[0].type,
          message: `${fromDisplayName || fromUser} hat dich in ${mediaCount} ${mediaCount === 1 ? 'Beitrag' : 'Beiträgen'} markiert`,
          isRead: false,
          createdAt: serverTimestamp()
        };

        return addDoc(notificationsRef, notificationData);
      });

      await Promise.all(notificationPromises);
      console.log(`✅ Sent bulk tagging notifications to ${uniqueUsers.size} users for ${mediaCount} media items`);
    } catch (error) {
      console.error('❌ Error sending bulk tagging notifications:', error);
    }
  }

  // Get user's device ID for notifications
  static getCurrentDeviceId(): string | null {
    return localStorage.getItem('deviceId');
  }

  // Get user's name for notifications
  static getCurrentUserName(): string | null {
    return localStorage.getItem('userName');
  }

  // Get user's display name for notifications
  static getCurrentDisplayName(): string | null {
    return localStorage.getItem('displayName');
  }
}

export default NotificationService;