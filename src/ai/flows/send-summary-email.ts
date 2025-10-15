
'use server';

/**
 * @fileOverview A Genkit flow for sending a daily summary email to the user.
 * 
 * This flow uses the Resend API to dispatch emails. You must have a RESEND_API_KEY
 * environment variable set for this flow to work.
 *
 * - sendSummaryEmail - Sends a formatted email with the daily summary.
 * - SendSummaryEmailInput - The input type for the sendSummaryEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Resend } from 'resend';
import { GenerateDailySummaryOutput } from './generate-daily-summary'; // Reuse the type

const resend = new Resend(process.env.RESEND_API_KEY);

const SendSummaryEmailInputSchema = z.object({
  userEmail: z.string().email().describe("The recipient's email address."),
  userName: z.string().describe("The recipient's name."),
  summaryData: z.any().describe("The JSON object containing the daily summary data."), // Using z.any() to pass the complex object
});
export type SendSummaryEmailInput = z.infer<typeof SendSummaryEmailInputSchema>;


export async function sendSummaryEmail(input: SendSummaryEmailInput) {
  return await sendSummaryEmailFlow(input);
}

// Helper to convert the JSON summary into a simple HTML string
const formatSummaryToHtml = (summary: GenerateDailySummaryOutput, userName: string): string => {
  return `
    <div style="font-family: sans-serif; line-height: 1.6;">
      <h2>Hello ${userName}, here is your daily summary!</h2>
      <p>${summary.overallSummary}</p>
      
      <h3>Key Insights</h3>
      <ul>
        ${summary.keyInsights.map(insight => `<li>${insight}</li>`).join('')}
      </ul>

      <h3>Suggestions for Tomorrow</h3>
       ${summary.suggestionsForTomorrow.map(s => `<p><strong>${s.suggestion}</strong><br>${s.reasoning}</p>`).join('')}

      <hr>

      <h4>Productivity Analysis</h4>
      <p><strong>Most Productive Activity:</strong> ${summary.productivityAnalysis.mostProductiveActivity || 'N/A'}</p>
      <p><strong>Total Productive Hours:</strong> ${summary.productivityAnalysis.totalProductiveHours.toFixed(1)}</p>
      
      <h4>Mood Analysis</h4>
      <p>${summary.moodAnalysis.trend}</p>
      
      <p><em>Keep up the great work!</em></p>
    </div>
  `;
};


const sendSummaryEmailFlow = ai.defineFlow(
  {
    name: 'sendSummaryEmailFlow',
    inputSchema: SendSummaryEmailInputSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async ({ userEmail, userName, summaryData }) => {
    if (!process.env.RESEND_API_KEY) {
      console.error("Resend API key is not configured.");
      return { success: false, message: "Email server is not configured." };
    }
    
    const htmlBody = formatSummaryToHtml(summaryData, userName);

    try {
      const { data, error } = await resend.emails.send({
        from: 'DayFlow <onboarding@resend.dev>', // Must be a verified domain on Resend
        to: [userEmail],
        subject: `Your DayFlow Daily Summary`,
        html: htmlBody,
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, message: `Email sent successfully to ${userEmail}` };
    } catch (error: any) {
      console.error("Error sending email:", error);
      return { success: false, message: "Failed to send email." };
    }
  }
);
