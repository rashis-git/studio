
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
  OAuthProvider,
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
        const result = await signInWithPopup(auth, provider);
        const additionalInfo = getAdditionalUserInfo(result);
        if (additionalInfo?.profile && 'id_token' in additionalInfo.profile) {
            const id_token = (additionalInfo.profile as any).id_token;
            // The access token is part of the credential, not the profile
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential?.accessToken) {
              // Note: This is a short-lived access token.
              // For long-term server-side access, you'd need a refresh token.
              console.log("Access Token:", credential.accessToken);
            }
        }
    } catch (error) {
        console.error("AuthProvider: Error during signInWithPopup.", error);
    } finally {
        // onAuthStateChanged will handle setting the user and loading state
        setLoading(false);
    }
  };

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    try {
      // This forces a refresh of the token if it's expired.
      const idTokenResult = await auth.currentUser.getIdTokenResult(true);

      // This is not the OAuth access token for Google APIs.
      // We need to trigger the OAuth flow again to get a fresh one if needed,
      // or ideally, handle this on the server with a refresh token.
      // For a client-side only app, re-prompting is one way.
      // A simpler way for this specific use case is to get it from the last login.
      
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/calendar.events');
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      return credential?.accessToken || null;
      
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  }, []);

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
