
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { MainNav } from '@/components/main-nav';
import { Loader2 } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useNotifications(); // Initialize notification listener

  useEffect(() => {
    // This effect has one responsibility: protect the route.
    // If auth state is resolved and there is no user, redirect to login.
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


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
