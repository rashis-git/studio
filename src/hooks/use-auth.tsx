
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
    console.log('AuthProvider: Setting up auth state listeners.');
    
    // This combined handler ensures we wait for both redirect results and auth state changes.
    const handleAuthChange = async () => {
      try {
        console.log('AuthProvider: Checking for redirect result...');
        const result = await getRedirectResult(auth);
        
        if (result) {
          console.log('AuthProvider: Google redirect result found. User:', result.user.uid);
          // Don't need to setUser here, onAuthStateChanged will handle it.
        } else {
          console.log('AuthProvider: No redirect result.');
        }
      } catch (error) {
        console.error("AuthProvider: Error processing redirect result", error);
      }

      // onAuthStateChanged listener to handle all auth state changes.
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log('onAuthStateChanged: User is signed in. UID:', user.uid);
          setUser(user);
        } else {
          console.log('onAuthStateChanged: User is signed out.');
          setUser(null);
        }
        // This is the single point where loading becomes false.
        setLoading(false); 
        console.log('onAuthStateChanged: Auth state resolved, loading set to false.');
      });

      return unsubscribe;
    };
    
    const unsubscribePromise = handleAuthChange();

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
    // The result is handled when the user is redirected back to the app.
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
