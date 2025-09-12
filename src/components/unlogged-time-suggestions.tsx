'use client';

import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { suggestUnloggedTime, SuggestUnloggedTimeOutput } from '@/ai/flows/suggest-unlogged-time';
import { mockActivities } from '@/lib/data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function UnloggedTimeSuggestions() {
  const [suggestions, setSuggestions] = useState<SuggestUnloggedTimeOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuggest = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestions(null);
    try {
      const input = {
        pastActivities: [
          { activity: 'Deep Work', durationMinutes: 180, timestamp: '2024-07-30T09:00:00Z' },
          { activity: 'Take a Walk', durationMinutes: 30, timestamp: '2024-07-30T12:30:00Z' },
        ],
        unloggedTimeStart: '2024-07-30T13:00:00Z',
        unloggedTimeEnd: '2024-07-30T14:00:00Z',
        availableActivities: mockActivities.map(a => a.name),
      };
      const result = await suggestUnloggedTime(input);
      setSuggestions(result);
    } catch (e) {
      setError('Could not get suggestions. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="text-primary" />
          Fill in the Gaps
        </CardTitle>
        <CardDescription>
          Have unlogged time? Let AI suggest what you might have been doing from 1:00 PM to 2:00 PM.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {error && (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {suggestions && (
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <Alert key={index}>
                <AlertTitle>{suggestion.activity}</AlertTitle>
                <AlertDescription>{suggestion.reasoning}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}
        {!isLoading && !suggestions && (
          <Button onClick={handleSuggest} className="w-full">
            Get Suggestions
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
