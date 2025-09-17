
'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// This hook manages setting up and tearing down notification timers
// based on user preferences in Firestore.
export const useNotifications = () => {
  const { user } = useAuth();
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Clear any existing timers
    const clearTimers = () => {
      timersRef.current.forEach(timerId => clearTimeout(timerId));
      timersRef.current = [];
    };

    if (!user) {
      clearTimers();
      return;
    }

    // Set up a listener for real-time updates to notification preferences
    const unsub = onSnapshot(doc(db, 'notification-preferences', user.uid), (doc) => {
      clearTimers();

      const areNotificationsEnabled = localStorage.getItem('notifications-enabled') === 'true';
      if (!areNotificationsEnabled || Notification.permission !== 'granted') {
        return; // Don't schedule if disabled or permission not granted
      }

      if (doc.exists()) {
        const times = doc.data().times as string[];
        if (times && times.length > 0) {
          scheduleNotifications(times);
        }
      }
    });

    const scheduleNotifications = (times: string[]) => {
      const now = new Date();
      
      times.forEach(timeStr => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        const notificationTime = new Date();
        notificationTime.setHours(hours, minutes, 0, 0);

        let timeout = notificationTime.getTime() - now.getTime();
        
        // If the time has already passed for today, schedule it for tomorrow
        if (timeout < 0) {
          timeout += 24 * 60 * 60 * 1000; // add 24 hours
        }
        
        const timerId = setTimeout(() => {
          new Notification('DayFlow Reminder', {
            body: "Don't forget to log your activities for the day!",
            icon: '/logo.svg', // Assumes a logo is in the public folder
          });
          // Reschedule for the next day
          scheduleNotifications([timeStr]);
        }, timeout);

        timersRef.current.push(timerId);
      });
    };

    // Cleanup function
    return () => {
      clearTimers();
      unsub();
    };
  }, [user]);

  // The hook doesn't need to return anything, it just works in the background.
};
