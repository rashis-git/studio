import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-unlogged-time.ts';
import '@/ai/flows/create-calendar-event.ts';
import '@/ai/flows/delete-calendar-event.ts';
import '@/ai/flows/generate-daily-summary.ts';
import '@/ai/flows/send-summary-email.ts';
