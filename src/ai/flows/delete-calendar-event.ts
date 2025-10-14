
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
        // If the event is already deleted (410 Gone), we can consider it a success for our purposes.
        if (error.code === 410) {
            console.log(`Event ${eventId} was already deleted.`);
            return { success: true };
        }
      console.error('Error deleting calendar event:', error);
      throw new Error('Failed to delete calendar event.');
    }
  }
);
