
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
    console.log('AuthProvider: Setting up auth state listener.');
    setLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('AuthProvider: onAuthStateChanged - User FOUND. UID:', user.uid);
        await getOrCreateUserProfile(user); 
        setUser(user);
      } else {
        console.log('AuthProvider: onAuthStateChanged - User is SIGNED OUT.');
        setUser(null);
        setAccessToken(null);
      }
      setLoading(false);
      console.log('AuthProvider: Auth state resolved, loading is now false.');
    });

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
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          console.log("Access Token captured on login.");
          setAccessToken(credential.accessToken);
        }
    } catch (error) {
        console.error("AuthProvider: Error during signInWithPopup.", error);
    } finally {
        // Auth state change will set loading to false
    }
  };

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (accessToken) return accessToken;

    if (auth.currentUser) {
        try {
            const idTokenResult = await auth.currentUser.getIdTokenResult(true); // Force refresh
            // Note: This is an ID token, not an OAuth access token for Google APIs.
            // The access token for Google APIs is best captured right after sign-in.
            // If the access token is expired or gone, you might need to re-authenticate for specific scopes.
            // For now, we rely on the one captured at login.
            console.log("getAccessToken: No stored access token, returning ID token as fallback.");
            return idTokenResult.token;
        } catch (error) {
            console.error("Error refreshing token:", error);
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
