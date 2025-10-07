
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Loader2, AlertCircle, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { startOfWeek, endOfWeek, format, eachDayOfInterval, getDay } from 'date-fns';

interface ActivityLog {
  activityName: string;
  durationMinutes: number;
  date: string; // YYYY-MM-DD
}

const distinctColors: string[] = [
  'hsl(210, 80%, 60%)', 'hsl(145, 70%, 55%)', 'hsl(35, 90%, 65%)', 'hsl(340, 85%, 60%)', 'hsl(260, 75%, 65%)',
  'hsl(50, 95%, 60%)', 'hsl(190, 75%, 50%)', 'hsl(310, 60%, 60%)', 'hsl(95, 60%, 55%)', 'hsl(0, 80%, 65%)',
  'hsl(230, 85%, 70%)', 'hsl(120, 50%, 60%)', 'hsl(20, 85%, 60%)', 'hsl(290, 70%, 70%)', 'hsl(170, 70%, 50%)',
  'hsl(70, 80%, 60%)', 'hsl(350, 80%, 70%)', 'hsl(245, 65%, 65%)', 'hsl(10, 70%, 60%)', 'hsl(160, 80%, 50%)',
  'hsl(275, 70%, 65%)', 'hsl(85, 70%, 55%)', 'hsl(200, 90%, 60%)', 'hsl(325, 75%, 65%)', 'hsl(135, 60%, 50%)',
  'hsl(25, 80%, 60%)', 'hsl(220, 70%, 70%)', 'hsl(5, 75%, 65%)', 'hsl(180, 65%, 55%)', 'hsl(40, 85%, 60%)',
];

const getActivityColor = (activityName: string) => {
    // Generate a consistent hash for the activity name
    const hash = activityName.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    const index = Math.abs(hash % distinctColors.length);
    return distinctColors[index];
};

export default function AnalysisPage() {
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [allActivities, setAllActivities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

        const q = query(
          collection(db, 'activity-logs'),
          where('userId', '==', user.uid),
          where('date', '>=', format(weekStart, 'yyyy-MM-dd')),
          where('date', '<=', format(weekEnd, 'yyyy-MM-dd'))
        );
        
        const querySnapshot = await getDocs(q);
        const logs: ActivityLog[] = [];
        querySnapshot.forEach(doc => {
            logs.push(doc.data() as ActivityLog);
        });

        if (logs.length === 0) {
            setWeeklyData([]);
            setAllActivities([]);
            setIsLoading(false);
            return;
        }

        const activitiesSet = new Set(logs.map(log => log.activityName));
        setAllActivities(Array.from(activitiesSet));

        const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
        const processedData = weekDays.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayName = format(day, 'E'); // Mon, Tue, etc.
            
            const dayLogs = logs.filter(log => log.date === dayStr);
            
            const dailySummary: { [key: string]: any } = { name: dayName };
            
            dayLogs.forEach(log => {
                if (!dailySummary[log.activityName]) {
                    dailySummary[log.activityName] = 0;
                }
                dailySummary[log.activityName] += log.durationMinutes / 60; // Convert to hours
            });

            return dailySummary;
        });

        setWeeklyData(processedData);

      } catch (err: any) {
        console.error("Error fetching activity logs:", err);
        // This is a common error if the composite index is not created in Firestore.
        if (err.code === 'failed-precondition') {
             setError("This query requires a Firestore index. Please create a composite index on the 'userId' and 'date' fields in your Firestore database.");
        } else {
            setError("Failed to fetch analysis data. Please try again later.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const yAxisFormatter = (value: number) => `${value}h`;
  const tooltipFormatter = (value: number, name: string) => [`${value.toFixed(1)} hours`, name];


  return (
    <div className="p-4 pt-8 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline">Weekly Analysis</h1>
        <p className="text-muted-foreground">Your activity breakdown for this week.</p>
      </header>

       <Card>
        <CardHeader>
          <CardTitle>This Week's Activities</CardTitle>
          <CardDescription>Total hours spent per activity each day.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading && (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}

            {!isLoading && error && (
                <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {!isLoading && !error && weeklyData.length > 0 && (
                 <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={yAxisFormatter} />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                }}
                                formatter={tooltipFormatter}
                             />
                            <Legend wrapperStyle={{fontSize: "12px"}} />
                            {allActivities.map((activity, index) => (
                                <Bar key={index} dataKey={activity} stackId="a" fill={getActivityColor(activity)} radius={[4, 4, 0, 0]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
            
            {!isLoading && !error && weeklyData.length === 0 && (
                 <div className="flex flex-col items-center justify-center h-48 text-center bg-muted/50 rounded-lg">
                    <BarChart3 className="w-12 h-12 mb-4 text-muted-foreground" />
                    <p className="font-semibold">No activities logged this week.</p>
                    <p className="text-sm text-muted-foreground">Log some activities to see your analysis.</p>
                </div>
            )}
        </CardContent>
       </Card>
    </div>
  );
}
