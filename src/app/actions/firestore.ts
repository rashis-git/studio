'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ActivityData {
  name: string;
  duration: number; // in minutes
  userId: string;
}

interface MoodData {
  energy: number;
  focus: number;
  mood: number;
  userId: string;
}

export async function saveActivitiesToFirestore(activities: ActivityData[]) {
  try {
    if (!activities.length || !activities[0].userId) {
      throw new Error('User ID is missing.');
    }
    const activityPromises = activities.map(activity => {
      return addDoc(collection(db, 'activity-logs'), {
        activityName: activity.name,
        durationMinutes: activity.duration,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        entryType: 'Log',
        timestamp: serverTimestamp(),
        userId: activity.userId,
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
    if (!moodData.userId) {
      throw new Error('User ID is missing.');
    }
    await addDoc(collection(db, 'state-logs'), {
      checkInTime: serverTimestamp(),
      energy: moodData.energy,
      focus: moodData.focus,
      mood: moodData.mood,
      userId: moodData.userId,
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error saving mood to Firestore:', error);
    return { success: false, error: error.message || 'Failed to save mood to Firestore.' };
  }
}
