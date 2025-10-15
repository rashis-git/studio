
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, doc, writeBatch, where, addDoc, serverTimestamp, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import type { Activity } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, ArrowRight, CheckCircle, Trash2 } from 'lucide-react';
import { mockActivities } from '@/lib/data';
import { AddActivityDialog } from '@/components/add-activity-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';


export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [savedActivities, setSavedActivities] = useState<Activity[]>([]);
  const [userGoals, setUserGoals] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchUserData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);

    try {
      // Fetch saved activities
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

      // Fetch user goals
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
  };

  useEffect(() => {
    if(user) {
      fetchUserData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

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
                // Save user goals
                const userDocRef = doc(db, 'users', user.uid);
                await setDoc(userDocRef, { goals: userGoals }, { merge: true });
            } catch (error) {
                 toast({ title: "Error", description: "Could not save your goals.", variant: "destructive"});
                 return; // Don't proceed if goals fail to save
            }
        }
        
        // Save selected activities to localStorage and navigate
        if (savedActivities.length > 0) {
            const activityIds = savedActivities.map(a => a.id);
            localStorage.setItem('selectedActivities', JSON.stringify(activityIds));
        }
        router.push('/log');
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
}
