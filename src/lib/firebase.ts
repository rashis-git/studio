

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, browserSessionPersistence, setPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);
const auth = getAuth(app);

// Set persistence to session explicitly. This is crucial for redirect-based auth flows in some environments.
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log('Firebase auth persistence set to session.');
  })
  .catch((error) => {
    console.error('Error setting Firebase auth persistence:', error);
  });


export { app, db, auth };



