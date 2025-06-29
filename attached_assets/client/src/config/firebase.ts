import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCqDlIxPDp-QU6mzthkWnmzM6rZ8rnJdiI",
  authDomain: "dev1-b3973.firebaseapp.com",
  projectId: "dev1-b3973",
  storageBucket: "dev1-b3973.firebasestorage.app",
  messagingSenderId: "658150387877",
  appId: "1:658150387877:web:ac90e7b1597a45258f5d4c",
  measurementId: "G-7W2BNH8MQ7"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);

// Add connection state management to prevent internal assertion errors
let isFirebaseConnected = true;

export const disconnectFirebase = async () => {
  try {
    if (isFirebaseConnected) {
      await disableNetwork(db);
      isFirebaseConnected = false;
      console.log('🔌 Firebase disconnected');
    }
  } catch (error) {
    console.error('❌ Error disconnecting Firebase:', error);
  }
};

export const reconnectFirebase = async () => {
  try {
    if (!isFirebaseConnected) {
      await enableNetwork(db);
      isFirebaseConnected = true;
      console.log('🔌 Firebase reconnected');
    }
  } catch (error) {
    console.error('❌ Error reconnecting Firebase:', error);
  }
};

// Handle page visibility changes to prevent connection issues
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page is hidden, temporarily disconnect to prevent assertion errors
    setTimeout(disconnectFirebase, 1000);
  } else {
    // Page is visible again, reconnect
    setTimeout(reconnectFirebase, 500);
  }
});

export default app;