
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertCircle, BarChart3, ListTodo, Clock } from 'lucide-react';
import { mockActivities } from '@/lib/data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { LucideIcon } from 'lucide-react';

interface ActivityLog {
  activityName: string;
  durationMinutes: number;
  date: string;
}

interface PlannedActivity {
    id: string;
    activityName: string;
    time?: string;
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
  const [plannedActivities, setPlannedActivities] = useState<PlannedActivity[]>([]);
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
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        // Fetch Logged Activities
        const logsQuery = query(
          collection(db, 'activity-logs'),
          where('userId', '==', user.uid),
          where('date', '==', todayStr)
        );
        const logsSnapshot = await getDocs(logsQuery);
        const logs: ActivityLog[] = [];
        logsSnapshot.forEach((doc) => {
          logs.push(doc.data() as ActivityLog);
        });

        if (logs.length > 0) {
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
            })).sort((a, b) => b.totalMinutes - a.totalMinutes);

            setAggregatedData(aggregated);
        } else {
            setAggregatedData([]);
        }

        // Fetch Planned Activities
        const plansQuery = query(
            collection(db, 'planned-activities'),
            where('userId', '==', user.uid),
            where('date', '==', todayStr)
        );
        const plansSnapshot = await getDocs(plansQuery);
        const plans: PlannedActivity[] = [];
        plansSnapshot.forEach(doc => {
            plans.push({ id: doc.id, ...doc.data()} as PlannedActivity);
        });
        
        const sortedPlans = plans.sort((a, b) => {
            if (a.time && b.time) {
                return a.time.localeCompare(b.time);
            }
            return 0;
        });
        setPlannedActivities(sortedPlans);


      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
         if (err.code === 'failed-precondition') {
             setError("A Firestore index is required for this query. The error console should provide a link to create it automatically.");
        } else {
            setError("Failed to fetch your activity data. Please try again later.");
        }
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
        <p className="text-muted-foreground">A summary of your activities for today.</p>
      </header>

      {plannedActivities.length > 0 && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ListTodo /> Today's Plan</CardTitle>
                <CardDescription>What you've got scheduled for today.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {plannedActivities.map(plan => (
                        <div key={plan.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                            <span className="font-semibold">{plan.activityName}</span>
                            {plan.time && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="w-4 h-4" />
                                    <span>{plan.time}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      )}
      
      {aggregatedData.length > 0 ? (
        <Card>
            <CardHeader>
                <CardTitle>Logged Activities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
        </Card>
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
