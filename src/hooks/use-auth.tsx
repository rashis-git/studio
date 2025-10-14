
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
    setLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await getOrCreateUserProfile(user); 
        setUser(user);
      } else {
        setUser(null);
        setAccessToken(null);
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
          console.log('[DEBUG] Access Token captured on login in useAuth:', credential.accessToken);
          setAccessToken(credential.accessToken);
        } else {
          console.log('[DEBUG] No access token found in credential after login.');
        }
    } catch (error) {
        console.error("AuthProvider: Error during signInWithPopup.", error);
    } finally {
        // Auth state change will set loading to false
    }
  };

  const getAccessToken = useCallback(async (): Promise<string | null> => {
     if (auth.currentUser) {
        try {
            const idTokenResult = await auth.currentUser.getIdTokenResult(true);
            // Firebase automatically refreshes the ID token. For OAuth access tokens,
            // the original sign-in must have requested offline access. If it did,
            // the new ID token can be used to get a new access token from your backend,
            // but in a client-side app, re-upping the login is the simplest way if it expires.
            // For now, we rely on the accessToken set at login.
            console.log('[DEBUG] getAccessToken returning stored token:', accessToken);
            return accessToken;
        } catch (error) {
            console.error("Error refreshing ID token:", error);
            // If token refresh fails, the user might need to sign in again.
            // Triggering a re-login here could be an option.
            return null;
        }
    }
    return null;
  }, [accessToken]);

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
