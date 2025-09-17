
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
        global.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (!user) {
      clearInterval();
      return;
    }

    // Set up a listener for real-time updates to notification preferences
    const unsub = onSnapshot(doc(db, 'notification-preferences', user.uid), (doc) => {
      clearInterval();

      const areNotificationsEnabled = localStorage.getItem('notifications-enabled') === 'true';
      if (!areNotificationsEnabled || Notification.permission !== 'granted') {
        return; // Don't schedule if disabled or permission not granted
      }

      if (doc.exists()) {
        const times = doc.data().times as string[] | undefined;
        if (times && times.length > 0) {
          startNotificationChecker(times);
        }
      }
    });
    
    const startNotificationChecker = (times: string[]) => {
        // This function runs every 30 seconds to check if a notification should be fired.
        // This is more robust than a single large setTimeout, especially across timezones.
        intervalRef.current = setInterval(() => {
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            // Check if the current time matches any of the user's preferred times
            if (times.includes(currentTime)) {
                // To avoid firing multiple notifications in the same minute,
                // we check if we've already fired for this specific time.
                if (lastFiredRef.current !== currentTime) {
                    console.log(`Time match: ${currentTime}. Triggering notification.`);
                    new Notification('DayFlow Reminder', {
                        body: "Don't forget to log your activities for the day!",
                        icon: '/logo.svg',
                    });
                    lastFiredRef.current = currentTime;
                }
            } else {
                // If the current time doesn't match any target time, reset the last fired ref
                // This ensures that if the user sets a notification for the *next* minute, it will fire.
                if (lastFiredRef.current !== null) {
                    lastFiredRef.current = null;
                }
            }
        }, 30 * 1000); // Check every 30 seconds
    };


    // Cleanup function: clear interval and unsubscribe from Firestore on component unmount
    return () => {
      clearInterval();
      unsub();
    };
  }, [user]);

  // The hook doesn't need to return anything, it just works in the background.
};
