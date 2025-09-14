'use server';

import Airtable from 'airtable';

const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_ACTIVITY_LOGS_TABLE_NAME, AIRTABLE_STATE_LOGS_TABLE_NAME } = process.env;

interface ActivityData {
  name: string;
  duration: number; // in minutes
}

interface MoodData {
  energy: number;
  focus: number;
  mood: number;
}

function getAirtableConfig() {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_ACTIVITY_LOGS_TABLE_NAME || !AIRTABLE_STATE_LOGS_TABLE_NAME) {
    return { 
      isValid: false, 
      error: "Airtable configuration is missing on the server. Please check your .env file for AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_ACTIVITY_LOGS_TABLE_NAME, and AIRTABLE_STATE_LOGS_TABLE_NAME." 
    };
  }
  const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID!);
  return {
    isValid: true,
    activityLogsTable: base(AIRTABLE_ACTIVITY_LOGS_TABLE_NAME!),
    stateLogsTable: base(AIRTABLE_STATE_LOGS_TABLE_NAME!),
  };
}


export async function saveActivitiesToAirtable(activities: ActivityData[]) {
  const config = getAirtableConfig();
  if (!config.isValid) {
    return { success: false, error: config.error };
  }
  
  const { activityLogsTable } = config;

  const records = activities.map(activity => ({
    fields: {
      'Activity name': activity.name,
      'duration (minutes)': activity.duration,
      'date': new Date().toISOString(),
      'Entry Type': 'Log'
    },
  }));

  try {
    await activityLogsTable!.create(records);
    return { success: true };
  } catch (error) {
    console.error('Error saving activities to Airtable:', error);
    return { success: false, error: 'Failed to save activities to Airtable.' };
  }
}

export async function saveMoodToAirtable(moodData: MoodData) {
  const config = getAirtableConfig();
  if (!config.isValid) {
    return { success: false, error: config.error };
  }

  const { stateLogsTable } = config;

  const record = {
    fields: {
      'Check-in time': new Date().toISOString(),
      'energy (1-10)': moodData.energy,
      'focus (1-10)': moodData.focus,
      'mood (1-10)': moodData.mood,
    },
  };

  try {
    await stateLogsTable!.create([record]);
    return { success: true };
  } catch (error) {
    console.error('Error saving mood to Airtable:', error);
    return { success: false, error: 'Failed to save mood to Airtable.' };
  }
}
