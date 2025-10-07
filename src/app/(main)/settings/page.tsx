
'use client';

import { useState, useEffect, useCallback } from 'react';
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

const themes = [
  { name: 'Forest', value: 'theme-forest' },
  { name: 'Sunset', value: 'theme-sunset' },
  { name: 'Azure', value: 'theme-azure' },
];

type NotificationPermission = 'default' | 'granted' | 'denied';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [currentTheme, setCurrentTheme] = useState('theme-forest');
  const [notificationTimes, setNotificationTimes] = useState<string[]>([]);
  const [newTime, setNewTime] = useState('09:00');
  const [isLoading, setIsLoading] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const { toast } = useToast();

  const updateNotificationPermissionState = useCallback(() => {
    if ('permission' in Notification) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    // Initial check
    updateNotificationPermissionState();

    // Listen for changes when the tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateNotificationPermissionState();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // More advanced: listen for direct permission changes if browser supports it
    let permissionStatus: PermissionStatus | undefined;
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'notifications' }).then((status) => {
        permissionStatus = status;
        permissionStatus.onchange = updateNotificationPermissionState;
      });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [updateNotificationPermissionState]);


  useEffect(() => {
    // Theme
    const savedTheme = localStorage.getItem('dayflow-theme') || 'theme-forest';
    setCurrentTheme(savedTheme);
    document.documentElement.className = savedTheme;

    // Notifications Enabled Toggle
    const enabled = localStorage.getItem('notifications-enabled') === 'true';
    setIsNotificationsEnabled(enabled);

    // Fetch notification times from Firestore
    const fetchTimes = async () => {
      if (user) {
        const docRef = doc(db, 'notification-preferences', user.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setNotificationTimes(docSnap.data().times || []);
          } else {
            // Attempt to create the doc if it doesn't exist.
            await setDoc(docRef, { userId: user.uid, times: [] });
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
    if (enabled && notificationPermission === 'denied') {
        toast({ title: "Notifications Blocked", description: "Please enable notifications in your browser settings first.", variant: "destructive"});
        // Allow toggle to be enabled anyway, but it won't work.
    }
    
    if (enabled && notificationPermission === 'default') {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission); // Update state immediately
        if (permission !== 'granted') {
            toast({ title: "Notifications Not Enabled", description: "You can enable notifications in your browser settings later.", variant: "destructive"});
            // Don't return, allow toggle to be enabled.
        }
    }

    setIsNotificationsEnabled(enabled);
    localStorage.setItem('notifications-enabled', String(enabled));
    if (enabled) {
        toast({ title: "Notifications Enabled!", description: "You will receive reminders if browser permissions are granted."});
    } else {
        toast({ title: "Notifications Disabled", description: "You will no longer receive reminders."});
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
    if (!user) {
        toast({ title: "Error", description: "You must be logged in.", variant: "destructive"});
        return;
    }
    setIsLoading(true);
    try {
        const docRef = doc(db, 'notification-preferences', user.uid);
        await setDoc(docRef, { userId: user.uid, times: notificationTimes }, { merge: true });
        
        toast({ title: "Preferences Saved!", description: "Your notification settings have been updated."});
    } catch(e: any) {
        toast({ title: "Error", description: e.message || "Failed to save preferences.", variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
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
                  <div className={`w-4 h-4 rounded-full bg-primary border`}></div>
                  <div className={`w-4 h-4 rounded-full bg-secondary border`.trim()} ></div>
                  <div className={`w-4 h-4 rounded-full bg-accent border`}></div>
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
          <CardDescription>Choose when to be reminded to log your day.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <Label htmlFor="notifications-enabled" className="text-base font-medium">
              Enable Notifications
            </Label>
            <Switch 
              id="notifications-enabled" 
              checked={isNotificationsEnabled} 
              onCheckedChange={handleNotificationToggle}
            />
          </div>

          {isNotificationsEnabled && (
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
        <Button size="lg" onClick={handleSaveNotificationPrefs} disabled={isLoading}>
          {isLoading && <Loader2 className="animate-spin mr-2" />}
          Save Changes
        </Button>
        <Button size="lg" variant="destructive" onClick={handleLogout}>Sign Out</Button>
      </div>
    </div>
  );
}
