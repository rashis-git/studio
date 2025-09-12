import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
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
              <AvatarImage src="https://picsum.photos/seed/user/100/100" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Sample User" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="user@example.com" />
          </div>
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

      <div className="pt-4 text-center">
        <Button size="lg">Save Changes</Button>
      </div>
    </div>
  );
}
