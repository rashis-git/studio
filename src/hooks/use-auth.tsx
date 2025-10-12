
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
    console.log('AuthProvider: Setting up onAuthStateChanged listener.');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('onAuthStateChanged: User is signed in. UID:', user.uid);
        setUser(user);
      } else {
        console.log('onAuthStateChanged: User is signed out.');
        setUser(null);
      }
      setLoading(false);
    });

    // This handles the user coming back from a Google Sign-in redirect
    getRedirectResult(auth)
        .then((result) => {
            if (result) {
                console.log('Redirect result successful, user:', result.user.uid);
                // The onAuthStateChanged listener above will handle setting the user state
            }
        })
        .catch((error) => {
            // This is where you would handle errors from the redirect.
            // For example, if the user closes the popup.
            console.error("Error getting redirect result", error);
        })
        // The loading state will be set to false by onAuthStateChanged
        // so we don't need a .finally() here.


    return () => {
      console.log('AuthProvider: Cleaning up onAuthStateChanged listener.');
      unsubscribe();
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
    // Note: The code execution will stop here because of the redirect.
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
