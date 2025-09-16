
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
  console.log('Server Action: Received data:', activities);
  
  try {
    if (!activities || activities.length === 0) {
      console.error('Server Action Error: No activities provided.');
      throw new Error('No activities to save.');
    }
    const userId = activities[0].userId;
    if (!userId) {
      console.error('Server Action Error: User ID is missing in the first activity.');
      throw new Error('User ID is missing.');
    }
    console.log(`Server Action: Processing ${activities.length} activities for userId: ${userId}`);
    
    const activityPromises = activities.map(activity => {
      console.log('Server Action: Preparing to write activity:', activity);
      if (activity.userId !== userId) {
        console.error('Server Action Error: Mismatched user IDs in batch.');
        // Potentially throw an error or handle this case
      }
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
    console.log('Server Action: All activities saved successfully to Firestore.');
    return { success: true };
  } catch (error: any) {
    console.error('Server Action: Firestore write failed. Full error object:', error);
    return { success: false, error: error.message || 'Failed to save activities.' };
  }
}

export async function saveMoodToFirestore(moodData: MoodData) {
  console.log('Server Action: saveMoodToFirestore started for userId:', moodData.userId);
  try {
    if (!moodData.userId) {
      throw new Error('User ID is missing.');
    }
    console.log('Saving mood for user:', moodData.userId);
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
