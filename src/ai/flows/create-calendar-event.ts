
'use server';

/**
 * @fileOverview A Genkit flow for creating a Google Calendar event.
 *
 * - createCalendarEvent - Creates a Google Calendar event.
 * - CreateCalendarEventInput - The input type for the createCalendarEvent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { google } from 'googleapis';

const CreateCalendarEventInputSchema = z.object({
  userAccessToken: z.string().describe('The Google OAuth2 access token for the user.'),
  userEmail: z.string().describe('The email of the user for whom the event is being created.'),
  startTime: z.string().describe('The start time of the event in ISO 8601 format.'),
  endTime: z.string().describe('The end time of the event in ISO 8601 format.'),
  appUrl: z.string().describe('The URL of the application to link in the event description.'),
  timeZone: z.string().describe("The user's IANA timezone name (e.g., 'America/New_York')."),
});

export type CreateCalendarEventInput = z.infer<typeof CreateCalendarEventInputSchema>;

export async function createCalendarEvent(input: CreateCalendarEventInput) {
  return await createCalendarEventFlow(input);
}

const createCalendarEventFlow = ai.defineFlow(
  {
    name: 'createCalendarEventFlow',
    inputSchema: CreateCalendarEventInputSchema,
    outputSchema: z.object({ eventId: z.string().optional() }),
  },
  async (input) => {
    const { userAccessToken, userEmail, startTime, endTime, appUrl, timeZone } = input;

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: userAccessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: "Log your day's activities",
      description: `Time to log your activities! Click here to open the app: <a href="${appUrl}">${appUrl}</a>`,
      start: {
        dateTime: startTime,
        timeZone: timeZone,
      },
      end: {
        dateTime: endTime,
        timeZone: timeZone,
      },
      recurrence: ['RRULE:FREQ=DAILY'],
      attendees: [{ email: userEmail }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 0 }, // Remind at the start of the event
        ],
      },
    };

    try {
      const createdEvent = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });
      return { eventId: createdEvent.data.id };
    } catch (error: any) {
      console.error('Error creating calendar event:', error);
      if (error.code === 401) {
        throw new Error('Google Calendar authorization failed. Please go to Settings and re-enable calendar sync.');
      }
      throw new Error('Failed to create calendar event. Please ensure you have granted calendar permissions.');
    }
  }
);
