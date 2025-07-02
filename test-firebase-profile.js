// Test script to verify Firebase profile data structure
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCvhf3bFNJwL0qSDfWNa1VCWGR4MnyZ8y8",
  authDomain: "hochzeitsgalerie-f8b84.firebaseapp.com",
  projectId: "hochzeitsgalerie-f8b84",
  storageBucket: "hochzeitsgalerie-f8b84.appspot.com",
  messagingSenderId: "294137773337",
  appId: "1:294137773337:web:e6d6589e37b4c0df57bb81"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test function to check gallery profile structure
async function testGalleryProfile(galleryId) {
  console.log('Testing gallery ID:', galleryId);
  
  try {
    // Try to read existing profile
    const profileRef = doc(db, 'galleries', galleryId, 'profile', 'main');
    console.log('Profile path:', `galleries/${galleryId}/profile/main`);
    
    const profileDoc = await getDoc(profileRef);
    
    if (profileDoc.exists()) {
      console.log('✅ Profile exists:', profileDoc.data());
    } else {
      console.log('❌ Profile does not exist - creating test profile...');
      
      // Create a test profile
      const testProfile = {
        name: 'Test Gallery Profile',
        bio: 'Test description',
        profilePicture: null,
        countdownDate: null,
        countdownEndMessage: 'Test message',
        countdownMessageDismissed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(profileRef, testProfile);
      console.log('✅ Test profile created');
      
      // Read it back
      const newProfileDoc = await getDoc(profileRef);
      if (newProfileDoc.exists()) {
        console.log('✅ New profile verified:', newProfileDoc.data());
      }
    }
    
    // Setup real-time listener
    console.log('Setting up real-time listener...');
    const unsubscribe = onSnapshot(profileRef, (doc) => {
      if (doc.exists()) {
        console.log('🔔 Real-time update:', doc.data());
      } else {
        console.log('🔔 Profile was deleted');
      }
    });
    
    // Keep listener active for 5 seconds
    setTimeout(() => {
      unsubscribe();
      console.log('Test completed');
    }, 5000);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Use the gallery ID from the current session
testGalleryProfile('FtAE7tK233ny9vpbdOpS');