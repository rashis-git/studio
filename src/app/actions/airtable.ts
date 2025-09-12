'use server';

import Airtable from 'airtable';

// Make sure to set these in your .env file
const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME } = process.env;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
  console.error("Airtable environment variables are not set.");
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID!);
const table = base(AIRTABLE_TABLE_NAME!);

interface ActivityData {
  name: string;
  duration: number; // in minutes
}

export async function saveActivitiesToAirtable(activities: ActivityData[]) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
    return { success: false, error: "Airtable configuration is missing on the server." };
  }

  const records = activities.map(activity => ({
    fields: {
      'Activity': activity.name,
      'Duration (minutes)': activity.duration,
      'Date': new Date().toISOString().split('T')[0], // a YYYY-MM-DD string
    },
  }));

  try {
    await table.create(records);
    return { success: true };
  } catch (error) {
    console.error('Error saving to Airtable:', error);
    return { success: false, error: 'Failed to save activities to Airtable.' };
  }
}
