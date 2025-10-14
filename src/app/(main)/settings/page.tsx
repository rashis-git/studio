
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, X, PlusCircle, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { createCalendarEvent } from '@/ai/flows/create-calendar-event';
import { addMinutes, format, parse } from 'date-fns';

const themes = [
  { name: 'Forest', value: 'theme-forest', colors: ['#2F5D62', '#5E8C61', '#A77B5A'] },
  { name: 'Sunset', value: 'theme-sunset', colors: ['#FF8C42', '#FFA69E', '#FFD000'] },
  { name: 'Azure', value: 'theme-azure', colors: ['#6e85b7', '#F2DDC1', '#9FE2BF'] },
];

export default function SettingsPage() {
  const { user, logout, getAccessToken } = useAuth();
  const router = useRouter();
  const [currentTheme, setCurrentTheme] = useState('theme-forest');
  const [notificationTimes, setNotificationTimes] = useState<string[]>([]);
  const [newTime, setNewTime] = useState('09:00');
  const [isSaving, startSaving] = useTransition();
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [isCalendarSyncEnabled, setIsCalendarSyncEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Theme
    const savedTheme = localStorage.getItem('dayflow-theme') || 'theme-forest';
    setCurrentTheme(savedTheme);
    document.documentElement.className = savedTheme;

    // Notifications Enabled Toggle
    const notificationsEnabled = localStorage.getItem('notifications-enabled') === 'true';
    setIsNotificationsEnabled(notificationsEnabled);

    // Calendar Sync Toggle
    const calendarSyncEnabled = localStorage.getItem('calendar-sync-enabled') === 'true';
    setIsCalendarSyncEnabled(calendarSyncEnabled);

    // Fetch notification times from Firestore
    const fetchTimes = async () => {
      if (user) {
        const docRef = doc(db, 'notification-preferences', user.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setNotificationTimes(data.times || []);
            // Also update the local state for calendar sync from what's saved
            const savedSyncPref = data.calendarSyncEnabled === true;
            setIsCalendarSyncEnabled(savedSyncPref);
            localStorage.setItem('calendar-sync-enabled', String(savedSyncPref));
          } else {
            await setDoc(docRef, { userId: user.uid, times: [], calendarSyncEnabled: false });
          }
        } catch (e) {
            console.error("Could not fetch or create notification preferences doc:", e);
            toast({ title: "Error", description: "Could not load notification settings.", variant: "destructive"});
        }
      }
    };
    fetchTimes();
  }, [user, toast]);

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.className = theme;
    localStorage.setItem('dayflow-theme', theme);
  };
  
  const handleNotificationToggle = async (enabled: boolean) => {
    setIsNotificationsEnabled(enabled);
    localStorage.setItem('notifications-enabled', String(enabled));

    if (enabled && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          toast({ title: "Browser Notifications Enabled!", description: "You will receive reminders at your chosen times."});
        } else {
          toast({ title: "Notifications Not Granted", description: "You can enable notifications in your browser settings later."});
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to request notification permissions.", variant: "destructive"});
        setIsNotificationsEnabled(false);
        localStorage.setItem('notifications-enabled', 'false');
      }
    }
  };

  const handleCalendarSyncToggle = (enabled: boolean) => {
    setIsCalendarSyncEnabled(enabled);
    localStorage.setItem('calendar-sync-enabled', String(enabled));
    if (enabled) {
      toast({ title: "Calendar Sync Enabled", description: "Reminders will be added to your Google Calendar on save."});
    }
  };


  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleAddTime = () => {
    if (newTime && !notificationTimes.includes(newTime)) {
      const updatedTimes = [...notificationTimes, newTime].sort();
      setNotificationTimes(updatedTimes);
    }
  };

  const handleRemoveTime = (timeToRemove: string) => {
    setNotificationTimes(notificationTimes.filter(time => time !== timeToRemove));
  };
  
  const handleSaveNotificationPrefs = async () => {
    if (!user || !user.email) {
        toast({ title: "Error", description: "You must be logged in.", variant: "destructive"});
        return;
    }
    
    startSaving(async () => {
        try {
            const docRef = doc(db, 'notification-preferences', user.uid);
            await setDoc(docRef, { 
              userId: user.uid, 
              times: notificationTimes,
              calendarSyncEnabled: isCalendarSyncEnabled,
            }, { merge: true });
            
            toast({ title: "Preferences Saved!", description: "Your notification settings have been updated."});

            if (isCalendarSyncEnabled) {
              const accessToken = await getAccessToken();
              if (!accessToken) {
                throw new Error("Could not retrieve access token for Google Calendar. Please try signing out and in again.");
              }

              const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
              const today = new Date();

              const eventCreationPromises = notificationTimes.map(time => {
                const startTime = parse(time, 'HH:mm', today);
                const endTime = addMinutes(startTime, 15);

                return createCalendarEvent({
                  userAccessToken: accessToken,
                  userEmail: user.email!,
                  startTime: format(startTime, "yyyy-MM-dd'T'HH:mm:ss"),
                  endTime: format(endTime, "yyyy-MM-dd'T'HH:mm:ss"),
                  appUrl: window.location.origin,
                  timeZone,
                });
              });

              await Promise.all(eventCreationPromises);

              toast({ title: "Calendar Sync Complete", description: "Your reminders have been added to Google Calendar." });
            }
            
        } catch(e: any) {
            console.error("Error during save/sync:", e);
            toast({ title: "Error", description: e.message || "Failed to save preferences or sync calendar.", variant: "destructive"});
        }
    });
  };

  return (
    <div className="p-4 pt-8 space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline">Settings</h1>
        <p className="text-muted-foreground">Manage your app preferences.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user?.photoURL ?? "https://picsum.photos/seed/user/100/100"} />
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={user?.displayName ?? "Sample User"} readOnly />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user?.email ?? ""} readOnly />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Personalize the look and feel of the app.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={currentTheme} onValueChange={handleThemeChange} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themes.map((theme) => (
              <Label
                key={theme.value}
                htmlFor={theme.value}
                className="flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer hover:bg-accent hover:text-accent-foreground data-[state=checked]:border-primary data-[state=checked]:ring-2 data-[state=checked]:ring-primary relative"
              >
                <RadioGroupItem value={theme.value} id={theme.value} className="sr-only" />
                <div className="flex items-center justify-center w-full gap-2">
                  <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: theme.colors[0] }}></div>
                  <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: theme.colors[1] }}></div>
                  <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: theme.colors[2] }}></div>
                </div>
                <span className="mt-2 text-sm font-medium">{theme.name}</span>
                {currentTheme === theme.value && <Check className="absolute w-5 h-5 top-2 right-2 text-primary" />}
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose when and how to be reminded to log your day.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <Label htmlFor="notifications-enabled" className="text-base font-medium">
              Enable Browser Notifications
            </Label>
            <Switch 
              id="notifications-enabled" 
              checked={isNotificationsEnabled} 
              onCheckedChange={handleNotificationToggle}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <Label htmlFor="calendar-sync-enabled" className="text-base font-medium">
             Sync to Google Calendar
            </Label>
            <Switch 
              id="calendar-sync-enabled" 
              checked={isCalendarSyncEnabled} 
              onCheckedChange={handleCalendarSyncToggle}
            />
          </div>

          {(isNotificationsEnabled || isCalendarSyncEnabled) && (
            <div className="p-4 border-t">
                <Label className="font-semibold">Reminder times</Label>
                <div className="flex items-center gap-2 mt-2">
                    <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="flex-1"/>
                    <Button variant="outline" size="icon" onClick={handleAddTime} aria-label="Add time">
                        <PlusCircle />
                    </Button>
                </div>
                <div className="mt-4 space-y-2">
                    {notificationTimes.length > 0 ? (
                        notificationTimes.map(time => (
                            <div key={time} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                <span className="font-mono text-sm">{time}</span>
                                <Button variant="ghost" size="icon" className="w-6 h-6 text-muted-foreground" onClick={() => handleRemoveTime(time)} aria-label={`Remove ${time}`}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-center text-muted-foreground py-4">No reminder times set.</p>
                    )}
                </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="pt-4 text-center space-y-4">
        <Button size="lg" onClick={handleSaveNotificationPrefs} disabled={isSaving}>
          {isSaving && <Loader2 className="animate-spin mr-2" />}
          Save Changes
        </Button>
        <Button size="lg" variant="destructive" onClick={handleLogout}>Sign Out</Button>
      </div>
    </div>
  );
}

    