import Constants from 'expo-constants';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
};

// Debug logging
console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? 'present' : 'missing',
  authDomain: firebaseConfig.authDomain ? 'present' : 'missing',
  projectId: firebaseConfig.projectId ? 'present' : 'missing',
  storageBucket: firebaseConfig.storageBucket ? 'present' : 'missing'
});

// Initialize Firebase only if it hasn't been initialized yet
let app;
try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
  } else {
    app = getApp();
    console.log('Using existing Firebase app');
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
  throw error;
}

// Initialize Auth with AsyncStorage persistence
let auth;
try {
  auth = getAuth(app);
  console.log('Auth initialized successfully');
} catch (error) {
  console.error("Auth initialization error:", error);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

// Initialize Firestore with settings for React Native
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  experimentalAutoDetectLongPolling: true
});

console.log('Firestore initialized successfully');

// Initialize Firebase Storage
const storage = getStorage(app);
console.log('Storage initialized successfully');

export { auth, firebaseConfig, db, storage };