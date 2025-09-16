
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { MainNav } from '@/components/main-nav';
import { Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createUserInFirestore } from '@/app/actions/firestore';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!loading && !user && isClient) {
      router.push('/login');
    }

    if (user) {
      const checkAndCreateUser = async () => {
        console.log('MainLayout: Auth state confirmed for user:', user.uid);
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (!userDocSnap.exists()) {
            console.log('MainLayout: User document not found in Firestore. Creating...');
            const result = await createUserInFirestore(user.uid, user.email);
            if (result.success) {
              console.log('MainLayout: Successfully created user document in Firestore.');
            } else {
              console.error('MainLayout: Failed to create user document.', result.error);
            }
          } else {
            console.log('MainLayout: User document already exists in Firestore.');
          }
        } catch (error) {
          console.error('MainLayout: Error checking/creating user document:', error);
        }
      };

      checkAndCreateUser();
    }
  }, [user, loading, router, isClient]);

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
