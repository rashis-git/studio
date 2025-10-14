
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  FC,
} from 'react';
import {
  onAuthStateChanged,
  User,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass:string) => Promise<UserCredential | null>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, pass: string) => Promise<UserCredential | null>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to create user profile in Firestore
const getOrCreateUserProfile = async (user: User) => {
  const userDocRef = doc(db, 'users', user.uid);
  try {
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      console.log('useAuth: User document not found. Creating now...');
      await setDoc(userDocRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
      });
      console.log('useAuth: Successfully created user document in Firestore.');
    } else {
       console.log('useAuth: User document already exists. No action taken.');
    }
  } catch (error) {
     console.error('useAuth: Error getting or creating user document:', error);
  }
};


export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Setting up auth state listener.');
    setLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('AuthProvider: onAuthStateChanged - User FOUND. UID:', user.uid);
        // User is signed in. Ensure their profile exists in Firestore.
        await getOrCreateUserProfile(user); 
        setUser(user);
      } else {
        console.log('AuthProvider: onAuthStateChanged - User is SIGNED OUT.');
        setUser(null);
      }
      setLoading(false);
      console.log('AuthProvider: Auth state resolved, loading is now false.');
    });

    // Cleanup subscription on unmount
    return () => {
        console.log('AuthProvider: Cleaning up onAuthStateChanged listener.');
        unsubscribe();
    }
  }, []);

  const login = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const loginWithGoogle = async () => {
    console.log('AuthProvider: loginWithGoogle called. Using signInWithPopup.');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    try {
        await signInWithPopup(auth, provider);
        // onAuthStateChanged will handle setting the user and loading state.
    } catch (error) {
        console.error("AuthProvider: Error during signInWithPopup.", error);
        setLoading(false);
    }
  };

  const signup = (email: string, pass: string) => {
    return createUserWithEmailAndPassword(auth, email, pass);
  };

  const logout = () => {
    return signOut(auth);
  };

  const sendPasswordReset = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  const value = {
    user,
    loading,
    login,
    loginWithGoogle,
    logout,
    signup,
    sendPasswordReset,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
