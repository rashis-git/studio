
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
  UserCredential,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass:string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  signup: (email: string, pass: string) => Promise<UserCredential>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Setting up onAuthStateChanged listener.');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('onAuthStateChanged: User is signed in.', user.uid);
        setUser(user);
      } else {
        console.log('onAuthStateChanged: User is signed out.');
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      console.log('AuthProvider: Cleaning up onAuthStateChanged listener.');
      unsubscribe();
    };
  }, []);

  const login = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = (email: string, pass: string) => {
    return createUserWithEmailAndPassword(auth, email, pass);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    signup,
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
