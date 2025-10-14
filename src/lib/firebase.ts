

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, browserSessionPersistence, setPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD-OOvczl91yzLGF80sAivuOuRgHvMvkLs",
  authDomain: "ai-daily-planner-4a1f7.firebaseapp.com",
  projectId: "ai-daily-planner-4a1f7",
  storageBucket: "ai-daily-planner-4a1f7.appspot.com",
  messagingSenderId: "765323928487",
  appId: "1:765323928487:web:1d0d42b638af52e267cc82",
  measurementId: "G-T905C97YCV"
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
