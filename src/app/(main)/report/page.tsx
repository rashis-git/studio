
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, FileText, Wand2, BarChart2, Smile, Send } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateDailySummary, GenerateDailySummaryOutput } from '@/ai/flows/generate-daily-summary';
import { sendSummaryEmail } from '@/ai/flows/send-summary-email';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

function SummarySkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </CardContent>
            </Card>
        </div>
    )
}


export default function ReportPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<GenerateDailySummaryOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSendingEmail, startEmailTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchSummary = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const result = await generateDailySummary({ userId: user.uid, date: todayStr });
        setSummary(result);
      } catch (err: any) {
        console.error("Error generating daily summary:", err);
        setError("Failed to generate your daily summary. Please ensure you have logged some activities today.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [user]);

  const handleSendEmail = () => {
    if (!user || !user.email || !user.displayName || !summary) return;

    startEmailTransition(async () => {
        toast({ title: "Sending Email...", description: "Your summary is on its way."});
        try {
            const result = await sendSummaryEmail({
                userEmail: user.email!,
                userName: user.displayName!,
                summaryData: summary,
            });

            if (result.success) {
                toast({ title: "Email Sent!", description: result.message });
            } else {
                throw new Error(result.message);
            }
        } catch (e: any) {
            toast({ title: "Error Sending Email", description: e.message || "An unknown error occurred.", variant: "destructive" });
        }
    });
  }

  return (
    <div className="p-4 pt-8 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline">Your Daily Report</h1>
        <p className="text-muted-foreground">An AI-powered summary of your day: {format(new Date(), 'MMMM d')}.</p>
      </header>

      {isLoading && <SummarySkeleton />}

      {!isLoading && error && (
        <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && summary && (
        <div className="space-y-6">
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText /> Overall Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{summary.overallSummary}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Wand2 /> Key Insights</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                       {summary.keyInsights.map((insight, i) => <li key={i}>{insight}</li>)}
                    </ul>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart2 /> Productivity Analysis</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2">
                    <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm font-medium text-muted-foreground">Most Productive Activity</p>
                        <p className="text-lg font-semibold">{summary.productivityAnalysis.mostProductiveActivity || 'N/A'}</p>
                    </div>
                     <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm font-medium text-muted-foreground">Total Productive Hours</p>
                        <p className="text-lg font-semibold">{summary.productivityAnalysis.totalProductiveHours.toFixed(1)}h</p>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Smile /> Mood Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{summary.moodAnalysis.trend}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Suggestions for Tomorrow</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {summary.suggestionsForTomorrow.map((s, i) => (
                        <div key={i} className="p-4 border rounded-lg bg-background">
                            <p className="font-semibold">{s.suggestion}</p>
                            <p className="text-sm text-muted-foreground">{s.reasoning}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>
            
            <div className="text-center pt-4">
                <Button onClick={handleSendEmail} disabled={isSendingEmail}>
                    {isSendingEmail ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2" />}
                    Send to My Email
                </Button>
            </div>
        </div>
      )}

      {!isLoading && !error && !summary && (
        <div className="flex flex-col items-center justify-center h-48 text-center bg-muted/50 rounded-lg">
            <FileText className="w-12 h-12 mb-4 text-muted-foreground" />
            <p className="font-semibold">No summary available.</p>
            <p className="text-sm text-muted-foreground">Log some activities and moods to generate your daily report.</p>
        </div>
      )}
    </div>
  );
}
