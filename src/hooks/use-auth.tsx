
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
    console.log('AuthProvider: useEffect started.');

    const handleAuthChange = async () => {
      console.log('AuthProvider: 1. Inside handleAuthChange async function.');
      try {
        console.log('AuthProvider: 2. Checking for redirect result...');
        const result = await getRedirectResult(auth);
        
        if (result) {
          console.log('AuthProvider: 3. SUCCESS: Google redirect result FOUND for user:', result.user.uid);
        } else {
          console.log('AuthProvider: 3. No redirect result found. This is normal on initial load.');
        }
      } catch (error) {
        console.error("AuthProvider: 3. ERROR processing redirect result", error);
      }

      console.log('AuthProvider: 4. Setting up onAuthStateChanged listener.');
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log('AuthProvider: 5. onAuthStateChanged FIRED: User is SIGNED IN. UID:', user.uid);
          setUser(user);
        } else {
          console.log('AuthProvider: 5. onAuthStateChanged FIRED: User is SIGNED OUT.');
          setUser(null);
        }
        console.log('AuthProvider: 6. Auth state resolved, setting loading to false.');
        setLoading(false); 
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
    console.log('AuthProvider: loginWithGoogle called. Setting loading state and redirecting.');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    await signInWithRedirect(auth, provider);
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
