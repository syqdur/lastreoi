import { debounce, BatchProcessor } from './performanceService';
import { db } from '../config/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, limit, updateDoc, doc } from 'firebase/firestore';

// Optimized notification interface
interface OptimizedNotification {
  id?: string;
  galleryId: string;
  recipientDeviceId: string;
  type: 'tag' | 'comment' | 'like' | 'story';
  message: string;
  mediaId?: string;
  mediaType?: string;
  senderName: string;
  senderDeviceId: string;
  timestamp: string;
  read: boolean;
}

class OptimizedNotificationService {
  private static instance: OptimizedNotificationService;
  private subscriptions = new Map<string, () => void>();
  private notificationCache = new Map<string, OptimizedNotification[]>();
  private batchProcessor: BatchProcessor<OptimizedNotification>;
  
  // Debounced subscription management
  private debouncedSubscribe = debounce((galleryId: string, deviceId: string, callback: (notifications: OptimizedNotification[]) => void) => {
    this.subscribeToNotificationsInternal(galleryId, deviceId, callback);
  }, 500);

  constructor() {
    // Batch notifications for better performance
    this.batchProcessor = new BatchProcessor<OptimizedNotification>(
      async (notifications) => {
        await this.processBatchNotifications(notifications);
      },
      5, // Batch size
      200 // Delay in ms
    );
  }

  static getInstance(): OptimizedNotificationService {
    if (!OptimizedNotificationService.instance) {
      OptimizedNotificationService.instance = new OptimizedNotificationService();
    }
    return OptimizedNotificationService.instance;
  }

  // Optimized notification creation with batching
  async createNotification(notification: Omit<OptimizedNotification, 'id' | 'timestamp' | 'read'>): Promise<void> {
    const optimizedNotification: OptimizedNotification = {
      ...notification,
      timestamp: new Date().toISOString(),
      read: false
    };

    // Add to batch processor instead of direct Firebase write
    this.batchProcessor.add(optimizedNotification);
  }

  // Process batch notifications
  private async processBatchNotifications(notifications: OptimizedNotification[]): Promise<void> {
    try {
      // Group notifications by gallery for efficiency
      const groupedByGallery = notifications.reduce((acc, notification) => {
        if (!acc[notification.galleryId]) {
          acc[notification.galleryId] = [];
        }
        acc[notification.galleryId].push(notification);
        return acc;
      }, {} as Record<string, OptimizedNotification[]>);

      // Process each gallery in parallel
      await Promise.all(
        Object.entries(groupedByGallery).map(([galleryId, galleryNotifications]) =>
          Promise.all(
            galleryNotifications.map(notification =>
              addDoc(collection(db, `galleries/${galleryId}/notifications`), notification)
            )
          )
        )
      );

      console.log(`✅ Processed batch of ${notifications.length} notifications`);
    } catch (error) {
      console.error('❌ Error processing batch notifications:', error);
    }
  }

  // Optimized subscription with caching and debouncing
  subscribeToNotifications(
    galleryId: string,
    deviceId: string,
    callback: (notifications: OptimizedNotification[]) => void
  ): () => void {
    const subscriptionKey = `${galleryId}_${deviceId}`;
    
    // Use cached data if available
    const cached = this.notificationCache.get(subscriptionKey);
    if (cached) {
      callback(cached);
    }

    // Debounced subscription to prevent rapid Firebase calls
    this.debouncedSubscribe(galleryId, deviceId, callback);

    return () => {
      const unsubscribe = this.subscriptions.get(subscriptionKey);
      if (unsubscribe) {
        unsubscribe();
        this.subscriptions.delete(subscriptionKey);
        this.notificationCache.delete(subscriptionKey);
      }
    };
  }

  private subscribeToNotificationsInternal(
    galleryId: string,
    deviceId: string,
    callback: (notifications: OptimizedNotification[]) => void
  ): void {
    const subscriptionKey = `${galleryId}_${deviceId}`;
    
    // Clean up existing subscription
    const existingUnsubscribe = this.subscriptions.get(subscriptionKey);
    if (existingUnsubscribe) {
      existingUnsubscribe();
    }

    const notificationsRef = collection(db, `galleries/${galleryId}/notifications`);
    const q = query(
      notificationsRef,
      where('recipientDeviceId', '==', deviceId),
      orderBy('timestamp', 'desc'),
      limit(50) // Limit for performance
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications: OptimizedNotification[] = [];
      
      snapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data()
        } as OptimizedNotification);
      });

      // Cache the results
      this.notificationCache.set(subscriptionKey, notifications);
      callback(notifications);
    }, (error) => {
      console.error('❌ Error subscribing to notifications:', error);
    });

    this.subscriptions.set(subscriptionKey, unsubscribe);
  }

  // Batch mark notifications as read
  async markNotificationsAsRead(galleryId: string, notificationIds: string[]): Promise<void> {
    try {
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < notificationIds.length; i += batchSize) {
        batches.push(notificationIds.slice(i, i + batchSize));
      }

      await Promise.all(
        batches.map(batch =>
          Promise.all(
            batch.map(id =>
              updateDoc(doc(db, `galleries/${galleryId}/notifications`, id), { read: true })
            )
          )
        )
      );

      console.log(`✅ Marked ${notificationIds.length} notifications as read`);
    } catch (error) {
      console.error('❌ Error marking notifications as read:', error);
    }
  }

  // Clear all subscriptions and cache
  cleanup(): void {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
    this.notificationCache.clear();
    this.batchProcessor.flush();
  }

  // Get cached notification count
  getCachedUnreadCount(galleryId: string, deviceId: string): number {
    const cached = this.notificationCache.get(`${galleryId}_${deviceId}`);
    return cached ? cached.filter(n => !n.read).length : 0;
  }
}

export const optimizedNotificationService = OptimizedNotificationService.getInstance();

// Helper function for creating tag notifications efficiently
export const createTagNotifications = async (
  galleryId: string,
  mediaId: string,
  mediaType: string,
  senderName: string,
  senderDeviceId: string,
  taggedUsers: Array<{ deviceId: string; userName: string }>
): Promise<void> => {
  const notifications = taggedUsers.map(user => ({
    galleryId,
    recipientDeviceId: user.deviceId,
    type: 'tag' as const,
    message: `${senderName} hat dich in einem ${mediaType === 'video' ? 'Video' : 'Bild'} markiert`,
    mediaId,
    mediaType,
    senderName,
    senderDeviceId
  }));

  // Use batch processor for efficient creation
  notifications.forEach(notification => 
    optimizedNotificationService.createNotification(notification)
  );
};