
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertCircle, BarChart3 } from 'lucide-react';
import { mockActivities } from '@/lib/data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { LucideIcon } from 'lucide-react';

interface ActivityLog {
  activityName: string;
  durationMinutes: number;
  date: string;
}

interface AggregatedActivity {
  name: string;
  totalMinutes: number;
  icon: LucideIcon;
  percentage: number;
}

const getActivityIcon = (name: string): LucideIcon => {
    const activity = mockActivities.find(a => a.name === name);
    return activity ? activity.icon : BarChart3;
};

const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [aggregatedData, setAggregatedData] = useState<AggregatedActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        const q = query(
          collection(db, 'activity-logs'),
          where('userId', '==', user.uid),
          where('date', '==', todayStr)
        );

        const querySnapshot = await getDocs(q);
        const logs: ActivityLog[] = [];
        querySnapshot.forEach((doc) => {
          logs.push(doc.data() as ActivityLog);
        });

        if (logs.length === 0) {
            setAggregatedData([]);
            setIsLoading(false);
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
          icon: getActivityIcon(name),
          percentage: totalMinutesAllActivities > 0 ? (totalMinutes / totalMinutesAllActivities) * 100 : 0,
        })).sort((a, b) => b.totalMinutes - a.totalMinutes); // Sort by most time spent

        setAggregatedData(aggregated);

      } catch (err: any) {
        console.error("Error fetching activity logs:", err);
        setError("Failed to fetch your activity data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
     return (
        <div className="p-4 pt-8">
             <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
     )
  }

  return (
    <div className="p-4 pt-8 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline">Your Day's Dashboard</h1>
        <p className="text-muted-foreground">A summary of your activities logged today.</p>
      </header>
      
      {aggregatedData.length > 0 ? (
        <div className="space-y-4">
            {aggregatedData.map((activity, index) => {
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
        <Card>
            <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center h-48 text-center bg-muted/50 rounded-lg">
                    <BarChart3 className="w-12 h-12 mb-4 text-muted-foreground" />
                    <p className="font-semibold">No activities logged today.</p>
                    <p className="text-sm text-muted-foreground">Go to the 'Log' page to add your activities.</p>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
