
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface MoodData {
  energy: number;
  productivity: number;
  happinessIndex: number;
  context: string;
  userId: string;
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
      productivity: moodData.productivity,
      happinessIndex: moodData.happinessIndex,
      context: moodData.context,
      userId: moodData.userId,
    });
    console.log('Server Action: saveMoodToFirestore successful.');
    return { success: true };
  } catch (error: any) {
    console.error('Error in saveMoodToFirestore:', error);
    return { success: false, error: error.message || 'Failed to save mood.' };
  }
}
