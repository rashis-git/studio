'use client';

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode,
  FC
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
  login: (email: string, pass: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  signup: (email: string, pass: string) => Promise<UserCredential>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const login = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  }

  const signup = async (email: string, pass: string) => {
    return createUserWithEmailAndPassword(auth, email, pass);
  }

  const logout = () => {
    return signOut(auth);
  }

  const value = {
    user,
    loading,
    login,
    logout,
    signup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
