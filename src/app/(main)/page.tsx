
'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, doc, writeBatch, where, addDoc, serverTimestamp, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import type { Activity } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, ArrowRight, CheckCircle, Trash2, X, Check, Pencil } from 'lucide-react';
import { mockActivities } from '@/lib/data';
import { AddActivityDialog } from '@/components/add-activity-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { LogTimeDialog } from '@/components/log-time-dialog';

// =================================================================
// Onboarding View for New Users
// =================================================================
const OnboardingView = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [savedActivities, setSavedActivities] = useState<Activity[]>([]);
  const [userGoals, setUserGoals] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchUserData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);

    try {
      const activitiesCollectionRef = collection(db, 'users', user.uid, 'savedActivities');
      const q = query(activitiesCollectionRef);
      const querySnapshot = await getDocs(q);
      const userActivities: Activity[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const mockActivity = mockActivities.find(a => a.name === data.activityName);
        userActivities.push({
          id: doc.id,
          name: data.activityName,
          icon: mockActivity ? mockActivity.icon : PlusCircle,
        });
      });
      setSavedActivities(userActivities.sort((a, b) => a.name.localeCompare(b.name)));

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setUserGoals(userDocSnap.data().goals || '');
      }

    } catch (error) {
      console.error("Firebase error while fetching user data:", error);
      toast({ title: "Error", description: "Could not fetch your saved data.", variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleAddDefaultActivity = (activity: Activity) => {
    if (!user) return;
    
    if (savedActivities.some(sa => sa.name === activity.name)) {
        toast({ title: "Already Added", description: `You're already tracking "${activity.name}".`});
        return;
    }
    
    startTransition(async () => {
        try {
            const savedActivitiesRef = collection(db, 'users', user.uid, 'savedActivities');
            const newDocRef = await addDoc(savedActivitiesRef, {
                activityName: activity.name,
                createdAt: serverTimestamp(),
            });
             setSavedActivities(prev => [...prev, { ...activity, id: newDocRef.id }].sort((a,b) => a.name.localeCompare(b.name)));
        } catch (error) {
             toast({ title: "Error", description: `Could not add "${activity.name}".`, variant: "destructive"});
        }
    });
  };

  const handleRemoveActivity = (activityId: string) => {
    if (!user) return;

    startTransition(async () => {
        try {
            const activityDocRef = doc(db, 'users', user.uid, 'savedActivities', activityId);
            await deleteDoc(activityDocRef);
            setSavedActivities(prev => prev.filter(sa => sa.id !== activityId));
        } catch (error) {
            toast({ title: "Error", description: "Could not remove the activity.", variant: "destructive"});
        }
    });
  };

  const handleFinish = () => {
    startTransition(async () => {
        if(user) {
            try {
                const userDocRef = doc(db, 'users', user.uid);
                await setDoc(userDocRef, { goals: userGoals }, { merge: true });
            } catch (error) {
                 toast({ title: "Error", description: "Could not save your goals.", variant: "destructive"});
                 return;
            }
        }
        
        if (savedActivities.length > 0) {
            const activityIds = savedActivities.map(a => a.id);
            localStorage.setItem('selectedActivities', JSON.stringify(activityIds));
        } else {
             toast({ title: "No Activities", description: "Please add at least one activity to continue.", variant: "destructive"});
             return;
        }
        // Force a reload to trigger the view switch in the parent component
        window.location.reload();
    });
  }

  return (
    <div className="p-4 pt-8 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline">Welcome to DayFlow!</h1>
        <p className="text-muted-foreground">
            Lets start by adding activities you want to track daily.
        </p>
      </header>

      <Card>
        <CardHeader>
            <CardTitle>Suggested Activities</CardTitle>
            <CardDescription>Click to add common activities to your list.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
            {mockActivities.map(activity => {
                const isAdded = savedActivities.some(sa => sa.name === activity.name);
                const Icon = activity.icon;
                return (
                    <Button 
                        key={activity.id} 
                        variant={isAdded ? "secondary" : "outline"} 
                        size="sm" 
                        onClick={() => handleAddDefaultActivity(activity)}
                        disabled={isAdded || isPending}
                    >
                        {isAdded ? <CheckCircle className="mr-2 h-4 w-4" /> : <Icon className="mr-2 h-4 w-4" />}
                        {activity.name}
                    </Button>
                )
            })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Activities</CardTitle>
          <CardDescription>This is your personalized list of activities to track.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading && (
                 <div className="flex items-center justify-center h-24">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}
            {!isLoading && savedActivities.length > 0 && (
                <div className="space-y-2">
                    {savedActivities.map(activity => (
                        <div key={activity.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                           <div className="flex items-center gap-3">
                             <activity.icon className="w-5 h-5 text-primary" />
                             <span className="font-semibold">{activity.name}</span>
                           </div>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="w-8 h-8 text-muted-foreground hover:text-destructive"
                             onClick={() => handleRemoveActivity(activity.id)}
                             disabled={isPending}
                            >
                                <Trash2 className="w-4 h-4"/>
                           </Button>
                        </div>
                    ))}
                </div>
            )}
             {!isLoading && savedActivities.length === 0 && (
                <div className="text-center text-muted-foreground py-6">
                    <p>Your list is empty. Add some activities to get started!</p>
                </div>
            )}

            <Button onClick={() => setIsAddDialogOpen(true)} variant="outline" className="w-full mt-4">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Custom Activity
            </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Your Goals</CardTitle>
            <CardDescription>What do you want to achieve with DayFlow? The AI will use this to personalize your insights.</CardDescription>
        </CardHeader>
        <CardContent>
            <Label htmlFor="user-goals" className="sr-only">Your Goals</Label>
            <Textarea 
                id="user-goals"
                placeholder="e.g., Improve my focus on work, spend more quality time with family, exercise three times a week..."
                value={userGoals}
                onChange={(e) => setUserGoals(e.target.value)}
                rows={3}
            />
        </CardContent>
      </Card>

       <div className="pt-4 text-center">
            <Button size="lg" onClick={handleFinish} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                All Done, Go to Log Page <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
      </div>
      
      <AddActivityDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onActivityAdded={fetchUserData}
        user={user}
      />
    </div>
  );
};


// =================================================================
// Dashboard View for Returning Users
// =================================================================
const DashboardView = ({ activities, goals }: { activities: Activity[], goals: string }) => {
    const [activityStack, setActivityStack] = useState(activities);
    const [userGoals, setUserGoals] = useState(goals);
    const [isEditingGoals, setIsEditingGoals] = useState(false);
    const [isLogTimeOpen, setIsLogTimeOpen] = useState(false);
    const [activityToLog, setActivityToLog] = useState<Activity | null>(null);
    const [isPending, startTransition] = useTransition();
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        // Keep stack in sync if original activities prop changes
        setActivityStack(activities);
    }, [activities]);

    const handleSwipe = (activity: Activity) => {
        // Remove the swiped activity from the stack
        setActivityStack(prev => prev.filter(a => a.id !== activity.id));
    };

    const handleLogTime = (activity: Activity) => {
        setActivityToLog(activity);
        setIsLogTimeOpen(true);
    };

    const handleSaveLog = (duration: number) => {
        if (!user || !activityToLog || duration <= 0) {
            toast({ title: "Invalid Log", description: "Duration must be greater than 0.", variant: "destructive" });
            return;
        }

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        startTransition(async () => {
            try {
                await addDoc(collection(db, 'activity-logs'), {
                    activityName: activityToLog.name,
                    durationMinutes: duration,
                    date: todayStr,
                    entryType: 'SwipeLog',
                    timestamp: serverTimestamp(),
                    userId: user.uid,
                });
                toast({ title: "Logged!", description: `${activityToLog.name} logged for ${duration} minutes.`});
                handleSwipe(activityToLog);
            } catch (error: any) {
                toast({ title: "Error", description: "Could not save log.", variant: "destructive"});
            }
        });
    }
    
    const handleSaveGoals = () => {
        if (!user) return;
        startTransition(async () => {
             try {
                const userDocRef = doc(db, 'users', user.uid);
                await setDoc(userDocRef, { goals: userGoals }, { merge: true });
                toast({ title: "Goals Updated!", description: "Your goals have been saved." });
                setIsEditingGoals(false);
            } catch (error) {
                 toast({ title: "Error", description: "Could not save your goals.", variant: "destructive"});
            }
        });
    }

    const currentActivity = activityStack[activityStack.length - 1];

    return (
        <div className="p-4 pt-8 flex flex-col h-[calc(100dvh-4rem)]">
            <header className="text-center mb-4">
                <h1 className="text-3xl font-bold font-headline">Today's Activities</h1>
                <p className="text-muted-foreground">Swipe to log your day.</p>
            </header>

            <div className="flex-grow flex items-center justify-center">
                 <div className="relative w-full max-w-xs h-64">
                    <AnimatePresence>
                        {activityStack.map((activity, index) => (
                            <motion.div
                                key={activity.id}
                                className="absolute w-full h-full"
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                onDragEnd={(event, { offset, velocity }) => {
                                    const swipeConfidence = Math.abs(offset.x) * velocity.x;
                                    if (swipeConfidence < -10000) { // Swipe left
                                        handleSwipe(activity);
                                    } else if (swipeConfidence > 10000) { // Swipe right
                                        handleLogTime(activity);
                                    }
                                }}
                                initial={{ scale: 0.95, y: 10, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ x: offset => (offset.x < 0 ? -300 : 300), opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                style={{
                                    zIndex: activityStack.length - index,
                                    transform: `scale(${1 - (activityStack.length - 1 - index) * 0.05}) translateY(-${(activityStack.length - 1 - index) * 10}px)`
                                }}
                            >
                                <Card className="w-full h-full flex flex-col items-center justify-center bg-card shadow-xl">
                                    <activity.icon className="w-20 h-20 text-primary mb-4" />
                                    <h2 className="text-2xl font-semibold">{activity.name}</h2>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {activityStack.length === 0 && (
                        <div className="text-center text-muted-foreground">
                            <p className="font-semibold text-lg">All activities logged!</p>
                            <p>Come back tomorrow or go to the Log page to add more.</p>
                        </div>
                    )}
                 </div>
            </div>
            
            <div className="flex justify-center items-center gap-8 py-4">
                <Button variant="outline" size="icon" className="w-16 h-16 rounded-full border-4 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => currentActivity && handleSwipe(currentActivity)} disabled={!currentActivity}>
                    <X size={32} />
                </Button>
                <Button variant="outline" size="icon" className="w-12 h-12 rounded-full" >
                    <PlusCircle size={24} />
                </Button>
                 <Button variant="outline" size="icon" className="w-16 h-16 rounded-full border-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => currentActivity && handleLogTime(currentActivity)} disabled={!currentActivity}>
                    <Check size={32} />
                </Button>
            </div>

            <Card className="mt-auto">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Your Goals</CardTitle>
                        <CardDescription>Your focus for today and beyond.</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsEditingGoals(!isEditingGoals)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    {isEditingGoals ? (
                        <div className="space-y-4">
                            <Textarea 
                                id="user-goals-dashboard"
                                value={userGoals}
                                onChange={(e) => setUserGoals(e.target.value)}
                                rows={3}
                                className="text-sm"
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" onClick={() => setIsEditingGoals(false)}>Cancel</Button>
                                <Button onClick={handleSaveGoals} disabled={isPending}>
                                     {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">
                            {userGoals || "No goals set yet. Click the pencil to add some!"}
                        </p>
                    )}
                </CardContent>
            </Card>

            {activityToLog && (
                <LogTimeDialog
                    open={isLogTimeOpen}
                    onOpenChange={setIsLogTimeOpen}
                    activityName={activityToLog.name}
                    initialDuration={60}
                    onSave={handleSaveLog}
                />
            )}
        </div>
    );
};


// =================================================================
// Main Page Component
// =================================================================
export default function TodayPage() {
  const { user, loading: authLoading } = useAuth();
  const [view, setView] = useState<'loading' | 'onboarding' | 'dashboard'>('loading');
  const [initialData, setInitialData] = useState<{ activities: Activity[], goals: string }>({ activities: [], goals: '' });

  useEffect(() => {
    if (authLoading) {
      setView('loading');
      return;
    }
    if (!user) {
      // Auth hook will redirect, but we can stop processing here
      return;
    }

    const fetchInitialData = async () => {
      try {
        const activitiesCollectionRef = collection(db, 'users', user.uid, 'savedActivities');
        const activitiesSnapshot = await getDocs(activitiesCollectionRef);
        const userActivities: Activity[] = activitiesSnapshot.docs.map((doc) => {
          const data = doc.data();
          const mockActivity = mockActivities.find(a => a.name === data.activityName);
          return {
            id: doc.id,
            name: data.activityName,
            icon: mockActivity ? mockActivity.icon : PlusCircle,
          };
        });

        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userGoals = userDocSnap.exists() ? userDocSnap.data().goals || '' : '';
        
        setInitialData({ activities: userActivities, goals: userGoals });

        if (userActivities.length > 0) {
          setView('dashboard');
        } else {
          setView('onboarding');
        }
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        setView('onboarding'); // Fallback to onboarding on error
      }
    };

    fetchInitialData();
  }, [user, authLoading]);

  if (view === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (view === 'onboarding') {
    return <OnboardingView />;
  }

  if (view === 'dashboard') {
    return <DashboardView activities={initialData.activities} goals={initialData.goals} />;
  }

  return null;
}
