
'use server';

/**
 * @fileOverview A Genkit flow for deleting a Google Calendar event.
 *
 * - deleteCalendarEvent - Deletes a Google Calendar event.
 * - DeleteCalendarEventInput - The input type for the deleteCalendarEvent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { google } from 'googleapis';

const DeleteCalendarEventInputSchema = z.object({
  userAccessToken: z.string().describe('The Google OAuth2 access token for the user.'),
  eventId: z.string().describe('The ID of the calendar event to delete.'),
});

export type DeleteCalendarEventInput = z.infer<typeof DeleteCalendarEventInputSchema>;

export async function deleteCalendarEvent(input: DeleteCalendarEventInput) {
  return await deleteCalendarEventFlow(input);
}

const deleteCalendarEventFlow = ai.defineFlow(
  {
    name: 'deleteCalendarEventFlow',
    inputSchema: DeleteCalendarEventInputSchema,
    outputSchema: z.object({ success: z.boolean() }),
  },
  async (input) => {
    const { userAccessToken, eventId } = input;

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: userAccessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });
      return { success: true };
    } catch (error: any) {
        if (error.code === 410) {
            console.log(`Event ${eventId} was already deleted.`);
            return { success: true };
        }
        if (error.code === 401) {
            throw new Error('Google Calendar authorization failed. Please go to Settings and re-enable calendar sync.');
        }
      console.error('Error deleting calendar event:', error);
      throw new Error('Failed to delete calendar event.');
    }
  }
);
