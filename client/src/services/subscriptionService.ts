import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export type PlanType = 'free' | 'basic' | 'pro';

export interface SubscriptionPlan {
  id: PlanType;
  name: string;
  price: number;
  features: {
    maxPhotos: number | 'unlimited';
    hasStories: boolean;
    hasTimeline: boolean;
    hasMusicWishlist: boolean;
    hasLocationTagging: boolean;
    hasPushNotifications: boolean;
    hasZipDownload: boolean;
    hasAdvancedAdmin: boolean;
    hasUserManagement: boolean;
    hasCustomThemes: boolean;
    hasPrioritySupport: boolean;
    maxStorageDays: number;
  };
}

export interface GallerySubscription {
  galleryId: string;
  planType: PlanType;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  paymentStatus?: 'pending' | 'completed' | 'failed';
  features: SubscriptionPlan['features'];
}

// Plan definitions
export const SUBSCRIPTION_PLANS: Record<PlanType, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Kostenlos',
    price: 0,
    features: {
      maxPhotos: 50,
      hasStories: false,
      hasTimeline: false,
      hasMusicWishlist: false,
      hasLocationTagging: false,
      hasPushNotifications: false,
      hasZipDownload: false,
      hasAdvancedAdmin: false,
      hasUserManagement: false,
      hasCustomThemes: false,
      hasPrioritySupport: false,
      maxStorageDays: 90 // 3 months
    }
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 9,
    features: {
      maxPhotos: 'unlimited',
      hasStories: true,
      hasTimeline: false,
      hasMusicWishlist: false,
      hasLocationTagging: true,
      hasPushNotifications: true,
      hasZipDownload: true,
      hasAdvancedAdmin: true,
      hasUserManagement: true,
      hasCustomThemes: false,
      hasPrioritySupport: false,
      maxStorageDays: 180 // 6 months
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 19,
    features: {
      maxPhotos: 'unlimited',
      hasStories: true,
      hasTimeline: true,
      hasMusicWishlist: true,
      hasLocationTagging: true,
      hasPushNotifications: true,
      hasZipDownload: true,
      hasAdvancedAdmin: true,
      hasUserManagement: true,
      hasCustomThemes: true,
      hasPrioritySupport: true,
      maxStorageDays: 180 // 6 months
    }
  }
};

class SubscriptionService {
  // Create subscription for gallery
  async createSubscription(galleryId: string, planType: PlanType): Promise<GallerySubscription> {
    const plan = SUBSCRIPTION_PLANS[planType];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (plan.features.maxStorageDays * 24 * 60 * 60 * 1000));
    
    const subscription: GallerySubscription = {
      galleryId,
      planType,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isActive: true,
      paymentStatus: planType === 'free' ? 'completed' : 'pending',
      features: plan.features
    };

    const subscriptionData = {
      galleryId: subscription.galleryId,
      planType: subscription.planType,
      createdAt: subscription.createdAt,
      expiresAt: subscription.expiresAt,
      isActive: subscription.isActive,
      paymentStatus: subscription.paymentStatus,
      features: {
        maxPhotos: subscription.features.maxPhotos,
        hasStories: subscription.features.hasStories,
        hasTimeline: subscription.features.hasTimeline,
        hasMusicWishlist: subscription.features.hasMusicWishlist,
        hasLocationTagging: subscription.features.hasLocationTagging,
        hasPushNotifications: subscription.features.hasPushNotifications,
        hasZipDownload: subscription.features.hasZipDownload,
        hasAdvancedAdmin: subscription.features.hasAdvancedAdmin,
        hasUserManagement: subscription.features.hasUserManagement,
        hasCustomThemes: subscription.features.hasCustomThemes,
        hasPrioritySupport: subscription.features.hasPrioritySupport,
        maxStorageDays: subscription.features.maxStorageDays
      }
    };
    
    await setDoc(doc(db, 'subscriptions', galleryId), subscriptionData);
    
    console.log(`✅ Created ${planType} subscription for gallery ${galleryId}`);
    return subscription;
  }

  // Get subscription for gallery
  async getSubscription(galleryId: string): Promise<GallerySubscription | null> {
    try {
      const subscriptionDoc = await getDoc(doc(db, 'subscriptions', galleryId));
      
      if (!subscriptionDoc.exists()) {
        // Create default free subscription if none exists
        console.log(`📝 Creating default free subscription for gallery ${galleryId}`);
        return await this.createSubscription(galleryId, 'free');
      }
      
      const subscription = subscriptionDoc.data() as GallerySubscription;
      
      // Check if subscription is expired
      const now = new Date();
      const expiresAt = new Date(subscription.expiresAt);
      
      if (now > expiresAt && subscription.isActive) {
        console.log(`⏰ Subscription expired for gallery ${galleryId}, downgrading to free`);
        return await this.downgradeToFree(galleryId);
      }
      
      return subscription;
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  }

  // Upgrade subscription
  async upgradeSubscription(galleryId: string, newPlanType: PlanType): Promise<GallerySubscription> {
    const currentSubscription = await this.getSubscription(galleryId);
    
    if (!currentSubscription) {
      return await this.createSubscription(galleryId, newPlanType);
    }

    const plan = SUBSCRIPTION_PLANS[newPlanType];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (plan.features.maxStorageDays * 24 * 60 * 60 * 1000));

    const updatedSubscription: GallerySubscription = {
      ...currentSubscription,
      planType: newPlanType,
      expiresAt: expiresAt.toISOString(),
      isActive: true,
      paymentStatus: newPlanType === 'free' ? 'completed' : 'pending',
      features: plan.features
    };

    const updateData = {
      planType: updatedSubscription.planType,
      expiresAt: updatedSubscription.expiresAt,
      isActive: updatedSubscription.isActive,
      paymentStatus: updatedSubscription.paymentStatus,
      'features.maxPhotos': updatedSubscription.features.maxPhotos,
      'features.hasStories': updatedSubscription.features.hasStories,
      'features.hasTimeline': updatedSubscription.features.hasTimeline,
      'features.hasMusicWishlist': updatedSubscription.features.hasMusicWishlist,
      'features.hasLocationTagging': updatedSubscription.features.hasLocationTagging,
      'features.hasPushNotifications': updatedSubscription.features.hasPushNotifications,
      'features.hasZipDownload': updatedSubscription.features.hasZipDownload,
      'features.hasAdvancedAdmin': updatedSubscription.features.hasAdvancedAdmin,
      'features.hasUserManagement': updatedSubscription.features.hasUserManagement,
      'features.hasCustomThemes': updatedSubscription.features.hasCustomThemes,
      'features.hasPrioritySupport': updatedSubscription.features.hasPrioritySupport,
      'features.maxStorageDays': updatedSubscription.features.maxStorageDays
    };
    
    await updateDoc(doc(db, 'subscriptions', galleryId), updateData);
    
    console.log(`⬆️ Upgraded subscription to ${newPlanType} for gallery ${galleryId}`);
    return updatedSubscription;
  }

  // Downgrade to free plan
  async downgradeToFree(galleryId: string): Promise<GallerySubscription> {
    return await this.upgradeSubscription(galleryId, 'free');
  }

  // Check if feature is available
  async hasFeature(galleryId: string, feature: keyof SubscriptionPlan['features']): Promise<boolean> {
    const subscription = await this.getSubscription(galleryId);
    if (!subscription) return false;
    
    return !!subscription.features[feature];
  }

  // Check photo upload limit
  async canUploadPhoto(galleryId: string, currentPhotoCount: number): Promise<boolean> {
    const subscription = await this.getSubscription(galleryId);
    if (!subscription) return false;
    
    const maxPhotos = subscription.features.maxPhotos;
    if (maxPhotos === 'unlimited') return true;
    
    return currentPhotoCount < maxPhotos;
  }

  // Get remaining photo uploads
  async getRemainingUploads(galleryId: string, currentPhotoCount: number): Promise<number | 'unlimited'> {
    const subscription = await this.getSubscription(galleryId);
    if (!subscription) return 0;
    
    const maxPhotos = subscription.features.maxPhotos;
    if (maxPhotos === 'unlimited') return 'unlimited';
    
    return Math.max(0, maxPhotos - currentPhotoCount);
  }

  // Simulate payment processing (integrate with actual payment processor)
  async processPayment(galleryId: string, planType: PlanType): Promise<{ success: boolean; error?: string }> {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // Update payment status
      await updateDoc(doc(db, 'subscriptions', galleryId), {
        paymentStatus: 'completed',
        isActive: true
      });
      
      console.log(`💳 Payment processed successfully for gallery ${galleryId} (${planType} plan)`);
      return { success: true };
    } catch (error) {
      console.error('Payment processing failed:', error);
      return { success: false, error: 'Payment processing failed' };
    }
  }

  // Get plan comparison data
  getPlanComparison(): SubscriptionPlan[] {
    return Object.values(SUBSCRIPTION_PLANS);
  }

  // Check if gallery needs upgrade for feature
  async requiresUpgrade(galleryId: string, feature: keyof SubscriptionPlan['features']): Promise<{ needsUpgrade: boolean; suggestedPlan?: PlanType }> {
    const subscription = await this.getSubscription(galleryId);
    if (!subscription) return { needsUpgrade: true, suggestedPlan: 'basic' };
    
    if (subscription.features[feature]) {
      return { needsUpgrade: false };
    }
    
    // Find the cheapest plan that includes this feature
    const plans = Object.values(SUBSCRIPTION_PLANS);
    const planWithFeature = plans.find(plan => plan.features[feature]);
    
    return {
      needsUpgrade: true,
      suggestedPlan: planWithFeature?.id || 'basic'
    };
  }
}

export const subscriptionService = new SubscriptionService();

// Helper hooks for React components

export const useSubscription = (galleryId: string) => {
  const [subscription, setSubscription] = useState<GallerySubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!galleryId) return;
    
    subscriptionService.getSubscription(galleryId).then(sub => {
      setSubscription(sub);
      setLoading(false);
    });
  }, [galleryId]);

  return { subscription, loading };
};

export default subscriptionService;