
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
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

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

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This function now orchestrates the entire auth state loading process.
    const handleAuthChange = async () => {
      try {
        // Step 1: Explicitly wait for any redirect result. This is crucial.
        console.log('AuthProvider: Checking for redirect result...');
        const result = await getRedirectResult(auth);
        
        if (result) {
          // If there was a redirect, this block will run, but the onAuthStateChanged
          // listener below will be the single source of truth for setting the user.
          console.log('AuthProvider: Google redirect result found for user:', result.user.uid);
        } else {
          console.log('AuthProvider: No redirect result.');
        }
      } catch (error) {
        console.error("AuthProvider: Error processing redirect result", error);
      }

      // Step 2: Set up the definitive state listener. This will fire after the redirect
      // is processed, giving us the final, stable user state.
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log('onAuthStateChanged: User is signed in. UID:', user.uid);
          setUser(user);
        } else {
          console.log('onAuthStateChanged: User is signed out.');
          setUser(null);
        }
        // Step 3: Only set loading to false here, after everything is resolved.
        setLoading(false); 
        console.log('onAuthStateChanged: Auth state resolved, loading set to false.');
      });

      return unsubscribe;
    };
    
    const unsubscribePromise = handleAuthChange();

    // Cleanup function to unsubscribe from the listener on component unmount
    return () => {
      unsubscribePromise.then(unsub => {
        if (unsub) {
          console.log('AuthProvider: Cleaning up onAuthStateChanged listener.');
          unsub();
        }
      });
    };
  }, []);

  const login = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const loginWithGoogle = async () => {
    setLoading(true); // Set loading to true before redirect
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    await signInWithRedirect(auth, provider);
    // The code execution will stop here because of the redirect.
    // The result is handled when the user is redirected back to the app by the useEffect hook.
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
