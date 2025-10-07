
'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// This hook manages setting up and tearing down notification timers
// based on user preferences in Firestore.
export const useNotifications = () => {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFiredRef = useRef<string | null>(null);

  useEffect(() => {
    // Function to clear any existing interval
    const clearInterval = () => {
      if (intervalRef.current) {
        console.log('[Debug] Clearing existing notification interval.');
        global.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (!user) {
      console.log('[Debug] No user found, clearing any existing notification setup.');
      clearInterval();
      return;
    }
    
    console.log(`[Debug] Setting up notifications for user: ${user.uid}`);

    // Set up a listener for real-time updates to notification preferences
    const unsub = onSnapshot(doc(db, 'notification-preferences', user.uid), (doc) => {
      console.log('[Debug] Firestore snapshot received for notification preferences.');
      clearInterval();

      const areNotificationsEnabled = localStorage.getItem('notifications-enabled') === 'true';
      console.log(`[Debug] Notifications enabled in localStorage: ${areNotificationsEnabled}`);
      
      const permission = Notification.permission;
      console.log(`[Debug] Browser notification permission state: ${permission}`);

      if (!areNotificationsEnabled) {
        console.log('[Debug] Aborting: Notifications are disabled in app settings.');
        return;
      }
      if (permission !== 'granted') {
         console.log('[Debug] Aborting: Browser permission not granted.');
        return;
      }

      if (doc.exists()) {
        const times = doc.data().times as string[] | undefined;
        console.log(`[Debug] Fetched notification times from Firestore: ${JSON.stringify(times)}`);
        if (times && times.length > 0) {
          console.log('[Debug] Times found, starting notification checker.');
          startNotificationChecker(times);
        } else {
            console.log('[Debug] No notification times are set in the database.');
        }
      } else {
          console.log('[Debug] Notification preferences document does not exist in Firestore.');
      }
    }, (error) => {
        console.error('[Debug] Error listening to Firestore snapshot:', error);
    });
    
    const startNotificationChecker = (times: string[]) => {
        console.log(`[Debug] Interval started. Will check every 30 seconds for times: ${times.join(', ')}`);
        // This function runs every 30 seconds to check if a notification should be fired.
        intervalRef.current = setInterval(() => {
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            // New enhanced logging
            console.log('--- Time Check ---');
            console.log(`[Timezone Debug] Browser's full local time: ${now.toString()}`);
            console.log(`[Timezone Debug] Extracted "HH:mm" for comparison: "${currentTime}"`);
            console.log(`[Timezone Debug] Checking against saved times: ${JSON.stringify(times)}`);
            // ---

            if (times.includes(currentTime)) {
                console.log(`[Debug] TIME MATCH: ${currentTime}.`);
                // To avoid firing multiple notifications in the same minute,
                // we check if we've already fired for this specific time.
                if (lastFiredRef.current !== currentTime) {
                    console.log(`[Debug] FIRING NOTIFICATION for ${currentTime}.`);
                    new Notification('DayFlow Reminder', {
                        body: "Don't forget to log your activities for the day!",
                        icon: '/logo.svg',
                    });
                    lastFiredRef.current = currentTime;
                } else {
                    console.log(`[Debug] Already fired for ${currentTime}, skipping.`);
                }
            } else {
                if (lastFiredRef.current !== null && !times.includes(lastFiredRef.current)) {
                   console.log(`[Debug] Resetting lastFiredRef from ${lastFiredRef.current}.`);
                   lastFiredRef.current = null;
                }
            }
        }, 30 * 1000); // Check every 30 seconds
    };


    // Cleanup function: clear interval and unsubscribe from Firestore on component unmount
    return () => {
      console.log('[Debug] Cleaning up notifications hook (unmounting).');
      clearInterval();
      unsub();
    };
  }, [user]);

  // The hook doesn't need to return anything, it just works in the background.
};
