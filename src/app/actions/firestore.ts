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
        'Activity Name': activity.name,
        'Duration (minutes)': activity.duration,
        'Date': new Date(),
        'Entry Type': 'Log',
      });
    });
    await Promise.all(activityPromises);
    return { success: true };
  } catch (error) {
    console.error('Error saving activities to Firestore:', error);
    return { success: false, error: 'Failed to save activities to Firestore.' };
  }
}

export async function saveMoodToFirestore(moodData: MoodData) {
  try {
    await addDoc(collection(db, 'state-logs'), {
      'Check-in time': serverTimestamp(),
      'Energy (1-10)': moodData.energy,
      'Focus (1-10)': moodData.focus,
      'Mood (1-10)': moodData.mood,
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving mood to Firestore:', error);
    return { success: false, error: 'Failed to save mood to Firestore.' };
  }
}
