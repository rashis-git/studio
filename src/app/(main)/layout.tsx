
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { MainNav } from '@/components/main-nav';
import { Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNotifications } from '@/hooks/use-notifications';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  useNotifications(); // Initialize notification listener

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
        console.log(`MainLayout: Auth state check. Loading: ${loading}, User: ${!!user}`);
        if (!loading && !user) {
            console.log('MainLayout: Not loading and no user, redirecting to /login');
            router.push('/login');
        }
    }
  }, [user, loading, router, isClient]);


  useEffect(() => {
    if (user) {
      const checkAndCreateUser = async () => {
        console.log('MainLayout: Auth state confirmed for user:', user.uid);
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (!userDocSnap.exists()) {
            console.log('MainLayout: User document not found in Firestore. Creating on client...');
            await setDoc(userDocRef, {
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              createdAt: serverTimestamp(),
            });
            console.log('MainLayout: Successfully created user document in Firestore.');
          } else {
            console.log('MainLayout: User document already exists in Firestore.');
          }
        } catch (error) {
          console.error('MainLayout: Error checking/creating user document:', error);
        }
      };

      checkAndCreateUser();
    }
  }, [user]);

  if (!isClient || loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh pb-16">
      <main className="flex-1 w-full max-w-lg mx-auto">{children}</main>
      <MainNav />
    </div>
  );
}
