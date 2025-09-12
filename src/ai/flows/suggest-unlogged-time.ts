'use server';

/**
 * @fileOverview An AI agent that suggests activities for unlogged time based on user activity patterns.
 *
 * - suggestUnloggedTime - A function that suggests activities for unlogged time.
 * - SuggestUnloggedTimeInput - The input type for the suggestUnloggedTime function.
 * - SuggestUnloggedTimeOutput - The return type for the suggestUnloggedTime function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestUnloggedTimeInputSchema = z.object({
  pastActivities: z
    .array(
      z.object({
        activity: z.string().describe('The name of the activity.'),
        durationMinutes: z.number().describe('The duration of the activity in minutes.'),
        timestamp: z.string().describe('The timestamp of when the activity occurred.'),
      })
    )
    .describe('A list of past activities with their durations and timestamps.'),
  unloggedTimeStart: z.string().describe('The start time of the unlogged time period.'),
  unloggedTimeEnd: z.string().describe('The end time of the unlogged time period.'),
  availableActivities: z.array(z.string()).describe('A list of available activities to choose from.'),
});
export type SuggestUnloggedTimeInput = z.infer<typeof SuggestUnloggedTimeInputSchema>;

const SuggestUnloggedTimeOutputSchema = z.array(
  z.object({
    activity: z.string().describe('The suggested activity for the unlogged time.'),
    reasoning: z.string().describe('The reasoning behind the suggestion.'),
  })
);
export type SuggestUnloggedTimeOutput = z.infer<typeof SuggestUnloggedTimeOutputSchema>;

export async function suggestUnloggedTime(input: SuggestUnloggedTimeInput): Promise<SuggestUnloggedTimeOutput> {
  return suggestUnloggedTimeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestUnloggedTimePrompt',
  input: {schema: SuggestUnloggedTimeInputSchema},
  output: {schema: SuggestUnloggedTimeOutputSchema},
  prompt: `You are an AI assistant that analyzes user activity patterns and suggests possible activities for unlogged time periods.

You are given the following information:

Past Activities:
{{#each pastActivities}}
- Activity: {{this.activity}}, Duration: {{this.durationMinutes}} minutes, Timestamp: {{this.timestamp}}
{{/each}}

Unlogged Time Period: From {{unloggedTimeStart}} to {{unloggedTimeEnd}}

Available Activities: {{availableActivities}}

Based on this information, suggest activities that the user might have been doing during the unlogged time period. Provide reasoning for each suggestion.

Format your response as a JSON array of objects, where each object has an "activity" field and a "reasoning" field.
`,
});

const suggestUnloggedTimeFlow = ai.defineFlow(
  {
    name: 'suggestUnloggedTimeFlow',
    inputSchema: SuggestUnloggedTimeInputSchema,
    outputSchema: SuggestUnloggedTimeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
