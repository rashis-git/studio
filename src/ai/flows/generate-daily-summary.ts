
'use server';

/**
 * @fileOverview An AI agent that generates a detailed daily summary for a user.
 * It analyzes activity logs, mood states, and user goals to provide insights.
 *
 * - generateDailySummary - The main function to generate the summary.
 * - GenerateDailySummaryInput - The input type for the flow.
 * - GenerateDailySummaryOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { format, startOfDay, endOfDay } from 'date-fns';

// Define schemas for sub-objects in the output
const MoodAnalysisSchema = z.object({
  trend: z.string().describe('A one-sentence summary of the mood and energy trend (e.g., "stable and positive", "declined in the afternoon").'),
  highestEnergy: z.string().optional().describe('The time or context when energy was highest.'),
  lowestEnergy: z.string().optional().describe('The time or context when energy was lowest.'),
});

const ProductivityAnalysisSchema = z.object({
  mostProductiveActivity: z.string().optional().describe('The activity where the user spent the most time and reported high productivity.'),
  totalProductiveHours: z.number().describe('Total hours spent on activities typically considered productive (like Deep Work, Office).'),
  peakProductivityTime: z.string().describe('Inferred peak productivity period (e.g., "late morning", "after lunch").'),
});

const SuggestionSchema = z.object({
  suggestion: z.string().describe('A concrete, actionable suggestion for the user.'),
  reasoning: z.string().describe('The reasoning behind this suggestion, linking it to the user\'s data and goals.'),
});

// Define schemas for the main flow input and output
const GenerateDailySummaryInputSchema = z.object({
  userId: z.string().describe('The ID of the user for whom to generate the summary.'),
  date: z.string().describe('The date for the summary in YYYY-MM-DD format.'),
});
export type GenerateDailySummaryInput = z.infer<typeof GenerateDailySummaryInputSchema>;

const GenerateDailySummaryOutputSchema = z.object({
  overallSummary: z.string().describe('A two-to-three sentence narrative summarizing the entire day.'),
  moodAnalysis: MoodAnalysisSchema,
  productivityAnalysis: ProductivityAnalysisSchema,
  keyInsights: z.array(z.string()).describe('Three to four bullet points of the most interesting findings from the day.'),
  suggestionsForTomorrow: z.array(SuggestionSchema).describe('Personalized suggestions for the next day based on goals and activity.'),
});
export type GenerateDailySummaryOutput = z.infer<typeof GenerateDailySummaryOutputSchema>;

// Exported wrapper function for the client
export async function generateDailySummary(input: GenerateDailySummaryInput): Promise<GenerateDailySummaryOutput> {
  return generateDailySummaryFlow(input);
}


// Internal data-fetching function
async function getDailyData(userId: string, dateStr: string) {
    const targetDate = new Date(dateStr + 'T00:00:00'); // Ensure we are parsing the date correctly
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    // Fetch user goals
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    const userGoals = userDocSnap.exists() ? userDocSnap.data().goals || 'Not specified' : 'Not specified';

    // Fetch activity logs
    const activityQuery = query(
        collection(db, 'activity-logs'),
        where('userId', '==', userId),
        where('timestamp', '>=', dayStart),
        where('timestamp', '<=', dayEnd)
    );
    const activitySnap = await getDocs(activityQuery);
    const activities = activitySnap.docs.map(d => {
        const data = d.data();
        const ts = (data.timestamp as Timestamp).toDate();
        return {
            ...data,
            // Format timestamp for the prompt
            loggedAt: format(ts, 'p') 
        };
    });

    // Fetch mood logs
    const moodQuery = query(
        collection(db, 'state-logs'),
        where('userId', '==', userId),
        where('checkInTime', '>=', dayStart),
        where('checkInTime', '<=', dayEnd)
    );
    const moodSnap = await getDocs(moodQuery);
    const moods = moodSnap.docs.map(d => {
        const data = d.data();
        const ts = (data.checkInTime as Timestamp).toDate();
        return {
            ...data,
            loggedAt: format(ts, 'p')
        };
    });

    return { activities, moods, userGoals };
}


const prompt = ai.definePrompt({
    name: 'generateDailySummaryPrompt',
    input: { schema: z.any() }, // Input is complex, handled by the flow itself
    output: { schema: GenerateDailySummaryOutputSchema },
    prompt: `You are an expert life coach and data analyst named 'DayFlow Insights'. Your task is to provide a comprehensive, empathetic, and actionable daily summary for a user based on their logged activities and mood.

    Here is the data for the user's day:

    **User's Stated Goals:**
    {{userGoals}}

    **Activity Logs:**
    {{#if activities}}
    {{#each activities}}
    - Activity: {{this.activityName}}, Duration: {{this.durationMinutes}} minutes (Logged at {{this.loggedAt}})
    {{/each}}
    {{else}}
    No activities were logged today.
    {{/if}}

    **Mood & Energy Logs:**
    {{#if moods}}
    {{#each moods}}
    - Logged at {{this.loggedAt}}: Energy={{this.energy}}/10, Productivity={{this.productivity}}/10, Happiness={{this.happinessIndex}}/10. Context: {{this.context}}
    {{/each}}
    {{else}}
    No mood or energy levels were logged today.
    {{/if}}

    **Your Task:**

    Analyze the provided data and generate a JSON response with the following structure. Be insightful and supportive in your tone.

    1.  **overallSummary**: Write a narrative summary (2-3 sentences) of the day. Mention key activities and the general mood.
    2.  **moodAnalysis**:
        *   `trend`: Describe the mood/energy trend. Did it improve, decline, or stay stable?
        *   `highestEnergy`: Note when energy was highest, linking it to an activity or time if possible.
        *   `lowestEnergy`: Note when energy was lowest.
    3.  **productivityAnalysis**:
        *   `mostProductiveActivity`: Identify the activity that seems most productive (e.g., 'Deep Work', 'Office').
        *   `totalProductiveHours`: Calculate and sum the hours for productive activities.
        *   `peakProductivityTime`: Based on the logging times and activity types, infer a 'peak productivity' period. For example, if most work was logged in the morning, that's the peak.
    4.  **keyInsights**: Provide 3-4 bullet points of interesting connections or observations. For example, "Your energy was highest after you took a walk," or "You spent 4 hours in deep work, which aligns with your goal of improving focus."
    5.  **suggestionsForTomorrow**: Provide 2 actionable suggestions. Each suggestion should be directly linked to the user's data and their stated goals. Explain the 'why' behind each suggestion.

    **Crucial Instructions:**
    - If data is missing (e.g., no mood logs), state that clearly in the relevant analysis section (e.g., "No mood data was logged to analyze.") and do not fabricate insights.
    - Your entire response MUST be a valid JSON object matching the specified output schema.
    `,
});


const generateDailySummaryFlow = ai.defineFlow(
    {
        name: 'generateDailySummaryFlow',
        inputSchema: GenerateDailySummaryInputSchema,
        outputSchema: GenerateDailySummaryOutputSchema,
    },
    async ({ userId, date }) => {
        // 1. Fetch all the data for the day
        const dailyData = await getDailyData(userId, date);

        // 2. Call the AI prompt with the fetched data
        const { output } = await prompt(dailyData);

        // 3. Return the structured output
        if (!output) {
            throw new Error("The AI failed to generate a summary.");
        }
        
        return output;
    }
);
