
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Progress } from '@/components/ui/progress';
import { Bar, BarChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, AlertCircle, BarChart3 as BarChartIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { mockActivities } from '@/lib/data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';

interface ActivityLog {
  activityName: string;
  durationMinutes: number;
  date: string; // YYYY-MM-DD
}

interface AggregatedActivity {
  name: string;
  totalMinutes: number;
  icon: LucideIcon;
  percentage: number;
}

const getActivityData = (name: string) => {
    const activity = mockActivities.find(a => a.name === name);
    // Simple hash function for consistent color generation
    const colorHash = name.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    const color = `hsl(${colorHash % 360}, 70%, 50%)`;
    
    return {
        icon: activity ? activity.icon : BarChartIcon,
        color: color
    };
};

const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
};

export default function CalendarPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dailyData, setDailyData] = useState<AggregatedActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !selectedDate) {
      setDailyData([]);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

        const q = query(
          collection(db, 'activity-logs'),
          where('userId', '==', user.uid),
          where('date', '==', selectedDateStr)
        );

        const querySnapshot = await getDocs(q);
        const logs: ActivityLog[] = [];
        querySnapshot.forEach(doc => {
            const data = doc.data() as ActivityLog;
            logs.push(data);
        });
        
        if (logs.length === 0) {
            setDailyData([]);
            return;
        }

        const activityMap = new Map<string, number>();
        logs.forEach(log => {
            const currentDuration = activityMap.get(log.activityName) || 0;
            activityMap.set(log.activityName, currentDuration + log.durationMinutes);
        });

        const totalMinutesAllActivities = Array.from(activityMap.values()).reduce((acc, curr) => acc + curr, 0);

        const aggregated = Array.from(activityMap.entries()).map(([name, totalMinutes]) => ({
            name,
            totalMinutes,
            icon: getActivityData(name).icon,
            percentage: totalMinutesAllActivities > 0 ? (totalMinutes / totalMinutesAllActivities) * 100 : 0,
        })).sort((a, b) => b.totalMinutes - a.totalMinutes);
        
        setDailyData(aggregated);

      } catch (err: any) {
        console.error("Error fetching activity logs:", err);
        setError("Failed to fetch activity data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, selectedDate]);


  return (
    <div className="p-4 pt-8 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline">Your Activity Calendar</h1>
        <p className="text-muted-foreground">Look back at your logged days.</p>
      </header>

      <Card>
        <CardContent className="p-2 flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md"
          />
        </CardContent>
      </Card>
      
      {isLoading && (
          <div className="flex items-center justify-center h-32">
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

      {!isLoading && !error && selectedDate && (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Activities for {format(selectedDate, 'MMMM d, yyyy')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {dailyData.length > 0 ? (
                        <div className="space-y-4">
                            {dailyData.map((activity, index) => {
                                const Icon = activity.icon;
                                return (
                                    <Card key={index} className="overflow-hidden bg-gradient-to-br from-card to-muted/30">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <Icon className="w-8 h-8 text-primary" />
                                                    <span className="font-semibold">{activity.name}</span>
                                                </div>
                                                <span className="font-bold font-headline text-lg">
                                                    {formatTime(activity.totalMinutes)}
                                                </span>
                                            </div>
                                            <Progress value={activity.percentage} className="mt-3 h-2" />
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-24 text-center bg-muted/50 rounded-lg">
                            <p className="font-semibold">No activities logged on this day.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
      )}
    </div>
  );
}
