
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';


// This component listens for custom Firestore permission errors and displays them.
// In a real app, this might be a toast, a modal, or a log to a service.
// For the dev experience, we will throw the error to make it visible in the Next.js overlay.
export function FirebaseErrorListener() {
    const { toast } = useToast();

    useEffect(() => {
        const handleError = (error: FirestorePermissionError) => {
            console.error(
                'A detailed Firestore security rule error was caught. See the Next.js error overlay for more details.',
                error.context
            );

            // Throwing the error here will cause it to be displayed in the Next.js
            // development error overlay, which is exactly what we want for debugging.
            // This makes the security rule violation obvious to the developer.
            throw error;
        };

        errorEmitter.on('permission-error', handleError);

        return () => {
            errorEmitter.off('permission-error', handleError);
        };
    }, [toast]);

    return null; // This component does not render anything.
}
