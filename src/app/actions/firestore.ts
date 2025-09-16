'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ActivityData {
  name: string;
  duration: number; // in minutes
}

interface MoodData {
  energy: number;
  focus: number;
  mood: number;
}

export async function saveActivitiesToFirestore(activities: ActivityData[]) {
  try {
    const activityPromises = activities.map(activity => {
      return addDoc(collection(db, 'activity-logs'), {
        activityName: activity.name,
        durationMinutes: activity.duration,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        entryType: 'Log',
        timestamp: serverTimestamp()
      });
    });
    await Promise.all(activityPromises);
    return { success: true };
  } catch (error: any) {
    console.error('Error saving activities to Firestore:', error);
    return { success: false, error: error.message || 'Failed to save activities to Firestore.' };
  }
}

export async function saveMoodToFirestore(moodData: MoodData) {
  try {
    await addDoc(collection(db, 'state-logs'), {
      checkInTime: serverTimestamp(),
      energy: moodData.energy,
      focus: moodData.focus,
      mood: moodData.mood,
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error saving mood to Firestore:', error);
    return { success: false, error: error.message || 'Failed to save mood to Firestore.' };
  }
}
