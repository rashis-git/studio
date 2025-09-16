
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
  console.log('Server Action: saveActivitiesToFirestore started.');
  try {
    if (!activities.length || !activities[0].userId) {
      throw new Error('User ID is missing.');
    }
    const userId = activities[0].userId;
    console.log(`Saving ${activities.length} activities for userId: ${userId}`);
    
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
    console.log('Server Action: saveActivitiesToFirestore successful.');
    return { success: true };
  } catch (error: any) {
    console.error('Error in saveActivitiesToFirestore:', error);
    return { success: false, error: error.message || 'Failed to save activities.' };
  }
}

export async function saveMoodToFirestore(moodData: MoodData) {
  console.log('Server Action: saveMoodToFirestore started for userId:', moodData.userId);
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
    console.log('Server Action: saveMoodToFirestore successful.');
    return { success: true };
  } catch (error: any) {
    console.error('Error in saveMoodToFirestore:', error);
    return { success: false, error: error.message || 'Failed to save mood.' };
  }
}
