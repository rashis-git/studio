
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
  loginWithGoogle: () => Promise<void>;
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
    // On initial load, try to get token from localStorage
    const savedToken = localStorage.getItem('google-access-token');
    if (savedToken) {
        console.log('[DEBUG] Found saved access token in localStorage.');
        setAccessToken(savedToken);
    }
    setLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await getOrCreateUserProfile(user); 
        setUser(user);
      } else {
        // If user logs out, clear everything
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
  
  const loginWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    // This is the crucial part: request offline access to get a refresh token,
    // and prompt for consent to ensure calendar scope is re-approved if needed.
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
          console.log('[DEBUG] Access Token captured on login:', token);
          setAccessToken(token);
          // Persist the token in localStorage
          localStorage.setItem('google-access-token', token);
        } else {
          console.log('[DEBUG] No access token found in credential after login.');
        }
    } catch (error) {
        console.error("AuthProvider: Error during signInWithPopup.", error);
        // Clear any lingering tokens if login fails
        setAccessToken(null);
        localStorage.removeItem('google-access-token');
    } finally {
        // Auth state change will set loading to false
    }
  };

  const getAccessToken = useCallback(async (): Promise<string | null> => {
     console.log('[DEBUG] getAccessToken called. Returning stored token:', accessToken);
     if (!accessToken) {
        console.error("[DEBUG] Access token is null.");
        return null;
     }
     return accessToken;
  }, [accessToken]);

  const signup = (email: string, pass: string) => {
    return createUserWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await signOut(auth);
    // Explicitly clear state and storage on logout
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('google-access-token');
    console.log('[DEBUG] User logged out, token cleared.');
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
