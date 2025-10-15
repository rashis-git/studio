
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  FC,
  useCallback,
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
  getAdditionalUserInfo,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Helper function to create user profile in Firestore
const getOrCreateUserProfile = async (user: User) => {
  const userDocRef = doc(db, 'users', user.uid);
  try {
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
     console.error('useAuth: Error getting or creating user document:', error);
  }
};


interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass:string) => Promise<UserCredential | null>;
  loginWithGoogle: () => Promise<string | null>;
  logout: () => Promise<void>;
  signup: (email: string, pass: string) => Promise<UserCredential | null>;
  sendPasswordReset: (email: string) => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('google-access-token');
    if (savedToken) {
        setAccessToken(savedToken);
    }
    setLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await getOrCreateUserProfile(user); 
        setUser(user);
      } else {
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('google-access-token');
      }
      setLoading(false);
    });

    return () => {
        unsubscribe();
    }
  }, []);

  const login = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const loginWithGoogle = async (): Promise<string | null> => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    provider.setCustomParameters({
      access_type: 'offline',
      prompt: 'consent' 
    });

    try {
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          const token = credential.accessToken;
          setAccessToken(token);
          localStorage.setItem('google-access-token', token);
          return token;
        }
        return null;
    } catch (error) {
        console.error("AuthProvider: Error during signInWithPopup.", error);
        setAccessToken(null);
        localStorage.removeItem('google-access-token');
        throw error;
    }
  };

  const getAccessToken = useCallback(async (): Promise<string | null> => {
     const tokenFromStorage = localStorage.getItem('google-access-token');
     if (!tokenFromStorage) {
        // This is not an error, just means we need to re-auth.
        return null;
     }
     return tokenFromStorage;
  }, []);

  const signup = (email: string, pass: string) => {
    return createUserWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('google-access-token');
    localStorage.removeItem('calendar-sync-enabled');
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
    getAccessToken,
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
