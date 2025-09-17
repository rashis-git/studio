
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check } from 'lucide-react';

const themes = [
  { name: 'Forest', value: 'theme-forest' },
  { name: 'Sunset', value: 'theme-sunset' },
  { name: 'Azure', value: 'theme-azure' },
];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [currentTheme, setCurrentTheme] = useState('theme-forest');

  useEffect(() => {
    const savedTheme = localStorage.getItem('dayflow-theme') || 'theme-forest';
    setCurrentTheme(savedTheme);
    document.documentElement.className = savedTheme;
  }, []);

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.className = theme;
    localStorage.setItem('dayflow-theme', theme);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
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
                  <div className={`w-4 h-4 rounded-full bg-secondary border`}></div>
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
          <CardDescription>How often should we remind you to log your day?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <Label htmlFor="notifications-enabled" className="text-base">
              Enable Notifications
            </Label>
            <Switch id="notifications-enabled" defaultChecked />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notification-interval">Remind me every</Label>
            <Select defaultValue="4">
              <SelectTrigger id="notification-interval">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Hour</SelectItem>
                <SelectItem value="2">2 Hours</SelectItem>
                <SelectItem value="4">4 Hours</SelectItem>
                <SelectItem value="6">6 Hours</SelectItem>
                <SelectItem value="8">8 Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="pt-4 text-center space-y-4">
        <Button size="lg">Save Changes</Button>
        <Button size="lg" variant="destructive" onClick={handleLogout}>Sign Out</Button>
      </div>
    </div>
  );
}
