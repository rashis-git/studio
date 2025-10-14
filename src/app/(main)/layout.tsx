
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { MainNav } from '@/components/main-nav';
import { Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNotifications } from '@/hooks/use-notifications';
import { useToast } from '@/hooks/use-toast';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  useNotifications(); // Initialize notification listener

  useEffect(() => {
    // This effect handles authentication state and user profile creation.
    // It waits until Firebase has finished loading the auth state.
    if (loading) {
      return; // Do nothing while loading.
    }

    // If loading is finished and there's no user, redirect to login.
    if (!user) {
      router.push('/login');
      return;
    }

    // If there is a user, ensure their profile document exists in Firestore.
    const userDocRef = doc(db, 'users', user.uid);
    getDoc(userDocRef).then(userDocSnap => {
      if (!userDocSnap.exists()) {
        console.log('MainLayout: User document not found. Creating now...');
        setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
        }).then(() => {
          console.log('MainLayout: Successfully created user document in Firestore.');
          // Avoid showing toast on every login, only on creation.
          if (pathname !== '/login') { // A simple check to see if we came from a login flow.
             toast({
              title: "Welcome!",
              description: "Your user profile has been created.",
            });
          }
        }).catch(error => {
           console.error('MainLayout: Error creating user document:', error);
           toast({
            title: "Database Error",
            description: `Could not create your user profile: ${error.message}`,
            variant: "destructive",
          });
        });
      } else {
         console.log('MainLayout: User document already exists. No action taken.');
      }
    }).catch(error => {
      console.error('MainLayout: Error checking user document:', error);
      toast({
        title: "Database Error",
        description: `Could not verify your user profile: ${error.message}`,
        variant: "destructive",
      });
    });

  }, [user, loading, router, toast, pathname]);


  // While loading, show a full-screen spinner. This covers the initial load
  // and the time after a redirect from Google sign-in.
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is complete and we have a user, render the main app.
  return (
    <div className="flex flex-col min-h-dvh pb-16">
      <main className="flex-1 w-full max-w-lg mx-auto">{children}</main>
      <MainNav />
    </div>
  );
}
