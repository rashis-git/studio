
'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { mockActivities } from '@/lib/data';
import type { Activity } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Sparkles, Loader2, Smile } from 'lucide-react';
import { LogTimeDialog } from '@/components/log-time-dialog';
import { AddActivityDialog } from '@/components/add-activity-dialog';
import { LogMoodDialog } from '@/components/log-mood-dialog';
import { UnloggedTimeSuggestions } from '@/components/unlogged-time-suggestions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

type LoggedActivity = {
  activity: Activity;
  duration: number; // in minutes
};

const ActivityBubble = ({
  activity,
  duration,
  onClick,
}: {
  activity: Activity;
  duration: number;
  onClick: () => void;
}) => {
  const size = useMemo(() => {
    return 60 + Math.sqrt(duration) * 5;
  }, [duration]);

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center text-center transition-all duration-300 ease-in-out rounded-full shadow-lg bg-gradient-to-br from-card to-muted/40 text-card-foreground hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <activity.icon className="w-1/3 h-1/3 text-primary" />
      <span className="text-xs font-medium px-1 break-words">{activity.name}</span>
      {duration > 0 && (
        <span className="text-xs text-muted-foreground">
          {Math.floor(duration / 60)}h {duration % 60}m
        </span>
      )}
    </button>
  );
};

export default function LogTimePage() {
  const [loggedActivities, setLoggedActivities] = useState<LoggedActivity[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLogTimeDialogOpen, setIsLogTimeDialogOpen] = useState(false);
  const [isLogMoodDialogOpen, setIsLogMoodDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<LoggedActivity | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const fetchActivitiesByIds = async (ids: string[]) => {
    if (!user || ids.length === 0) {
      setLoggedActivities([]);
      return;
    }
    const q = query(collection(db, 'users', user.uid, 'savedActivities'), where('__name__', 'in', ids));
    const querySnapshot = await getDocs(q);
    const userActivities: Activity[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().activityName,
        icon: mockActivities.find(a => a.name === doc.data().activityName)?.icon || Sparkles
    }));

    const activitiesToLog = userActivities.map(activity => ({ activity, duration: 0 }));
    setLoggedActivities(activitiesToLog);
  }

  useEffect(() => {
    setIsClient(true);
    if (user) {
      try {
        const storedIds = JSON.parse(localStorage.getItem('selectedActivities') || '[]');
        fetchActivitiesByIds(storedIds);
      } catch (error) {
        console.error("Failed to parse activities from localStorage", error);
        setLoggedActivities([]);
      }
    }
  }, [user]);

  const handleUpdateDuration = (duration: number) => {
    if (selectedActivity) {
      setLoggedActivities((prev) =>
        prev.map((la) =>
          la.activity.id === selectedActivity.activity.id ? { ...la, duration } : la
        )
      );
    }
  };

  const handleAddActivity = () => {
    // This function will now just refresh the page to get the latest activities
    // after a new one is added via the dialog.
    router.push('/');
  };

  const openLogTimeDialog = (loggedActivity: LoggedActivity) => {
    setSelectedActivity(loggedActivity);
    setIsLogTimeDialogOpen(true);
  };
  
  const handleSaveLog = () => {
    if (!user) {
      toast({ title: "Not authenticated", description: "You must be logged in to save.", variant: "destructive" });
      return;
    }

    const activitiesToSave = loggedActivities
      .filter(la => la.duration > 0)
      .map(la => ({
        activityName: la.activity.name,
        durationMinutes: la.duration,
        date: new Date().toISOString().split('T')[0],
        entryType: 'Log',
        timestamp: serverTimestamp(),
        userId: user.uid,
      }));
      
    if(activitiesToSave.length === 0) {
      toast({
        title: "No activities to save",
        description: "Please log time for at least one activity.",
        variant: "destructive"
      });
      return;
    }
    
    startTransition(async () => {
      try {
        const activityPromises = activitiesToSave.map(activity => {
          return addDoc(collection(db, 'activity-logs'), activity);
        });

        await Promise.all(activityPromises);
        
        toast({
          title: "Log Saved!",
          description: "Your activities have been saved.",
        });
        // Reset durations after saving
        setLoggedActivities(prev => prev.map(la => ({...la, duration: 0})));
        localStorage.removeItem('selectedActivities');

      } catch (error: any) {
        toast({
          title: "Error Saving Log",
          description: error.message || "An unknown error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  const handleSaveMood = (mood: { energy: number, productivity: number, happinessIndex: number, context: string }) => {
    if (!user) {
      toast({ title: "Not authenticated", description: "You must be logged in to save.", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      try {
        await addDoc(collection(db, 'state-logs'), {
          ...mood,
          userId: user.uid,
          checkInTime: serverTimestamp(),
        });

        toast({
            title: "Mood Saved!",
            description: "Your mood has been logged.",
        });
      } catch (error: any) {
          toast({
              title: "Error Saving Mood",
              description: error.message || "An unknown error occurred.",
              variant: "destructive",
          });
      }
    });
  };

  if (!isClient) {
    return (
      <div className="p-4 pt-8 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-center gap-4 p-4 min-h-[40vh] bg-muted/30 rounded-xl">
             <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 pt-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold font-headline">Log Your Day</h1>
        <p className="text-muted-foreground">Tap an activity to log time, or log your mood.</p>
      </header>
      
      <div className="mb-6 text-center">
        <Button variant="outline" onClick={() => setIsLogMoodDialogOpen(true)}>
            <Smile className="mr-2" />
            Log Mood & Energy
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 p-4 min-h-[40vh] bg-muted/30 rounded-xl">
        {loggedActivities.length > 0 ? (
          loggedActivities.map((la) => (
            <ActivityBubble
              key={la.activity.id}
              activity={la.activity}
              duration={la.duration}
              onClick={() => openLogTimeDialog(la)}
            />
          ))
        ) : (
          <div className="text-center text-muted-foreground">
            <p>No activities selected.</p>
            <p>Go to the 'Today' tab to start.</p>
          </div>
        )}
        <button
          onClick={() => setIsAddDialogOpen(true)}
          className="flex flex-col items-center justify-center w-20 h-20 text-center transition-all duration-300 border-2 border-dashed rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        >
          <PlusCircle className="w-8 h-8" />
          <span className="text-xs font-medium">Add New</span>
        </button>
      </div>

      <div className="mt-8">
        <UnloggedTimeSuggestions />
      </div>

      <div className="py-8 mt-4 text-center">
        <Button size="lg" onClick={handleSaveLog} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Day's Log
        </Button>
      </div>

      <AddActivityDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onActivityAdded={handleAddActivity}
        user={user}
      />
      
      {selectedActivity && (
        <LogTimeDialog
          open={isLogTimeDialogOpen}
          onOpenChange={setIsLogTimeDialogOpen}
          activityName={selectedActivity.activity.name}
          initialDuration={selectedActivity.duration}
          onSave={handleUpdateDuration}
        />
      )}

      <LogMoodDialog
        open={isLogMoodDialogOpen}
        onOpenChange={setIsLogMoodDialogOpen}
        onSave={handleSaveMood}
        isPending={isPending}
      />
    </div>
  );
}

    