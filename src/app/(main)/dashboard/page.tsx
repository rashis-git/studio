
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, BarChart3, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { mockActivities } from '@/lib/data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ActivityLog {
  activityName: string;
  durationMinutes: number;
  date: string;
}

interface AggregatedActivity {
  name: string;
  totalMinutes: number;
}

// Helper to find the icon for a given activity name
const getActivityIcon = (name: string) => {
    const activity = mockActivities.find(a => a.name === name);
    return activity ? activity.icon : BarChart3;
};

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
        
        const aggregated = Array.from(activityMap.entries()).map(([name, totalMinutes]) => ({
          name,
          totalMinutes,
        }));

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

  const chartData = useMemo(() => {
    return aggregatedData.map(item => ({
        name: item.name,
        Time: item.totalMinutes,
    }));
  }, [aggregatedData]);

  const CustomYAxisTick = ({ y, payload }: any) => {
    const Icon = getActivityIcon(payload.value);
    return (
        <g transform={`translate(${y - 30}, ${payload.y})`}>
            <Icon className="w-5 h-5 text-muted-foreground" />
        </g>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const hours = Math.floor(payload[0].value / 60);
      const minutes = payload[0].value % 60;
      const timeString = `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;

      return (
        <div className="p-2 text-sm bg-background border rounded-lg shadow-lg">
          <p className="font-bold">{label}</p>
          <p className="text-primary">{`Time: ${timeString}`}</p>
        </div>
      );
    }
    return null;
  };

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
    <div className="p-4 pt-8 space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline">Your Day's Dashboard</h1>
        <p className="text-muted-foreground">A summary of your activities today.</p>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle>Activity Breakdown</CardTitle>
          <CardDescription>Total time spent on each activity today.</CardDescription>
        </CardHeader>
        <CardContent>
            {aggregatedData.length > 0 ? (
                <div className="w-full h-[50vh]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={chartData}
                            margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" unit="m" />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                tickLine={false} 
                                axisLine={false}
                                tick={<CustomYAxisTick />}
                                width={10}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                            <Bar dataKey="Time" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={25} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center bg-muted/50 rounded-lg">
                    <BarChart3 className="w-12 h-12 mb-4 text-muted-foreground" />
                    <p className="font-semibold">No activities logged today.</p>
                    <p className="text-sm text-muted-foreground">Go to the 'Log' page to add your activities.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
