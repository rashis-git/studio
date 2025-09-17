
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';

interface AddActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddActivity: (name: string) => void;
  user: User | null;
}

export function AddActivityDialog({ open, onOpenChange, onAddActivity, user }: AddActivityDialogProps) {
  const [name, setName] = useState('');
  const [savePermanently, setSavePermanently] = useState(true);
  const { toast } = useToast();

  const handleAdd = async () => {
    if (!name.trim()) return;

    if (savePermanently) {
      if (!user) {
        toast({
          title: "Not Authenticated",
          description: "You must be logged in to save an activity.",
          variant: "destructive",
        });
        return;
      }
      try {
        await addDoc(collection(db, 'savedActivities'), {
          activityName: name.trim(),
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        toast({
            title: "Activity Saved",
            description: `"${name.trim()}" has been saved for future use.`
        });
      } catch (error: any) {
        toast({
          title: "Error Saving Activity",
          description: error.message || "Could not save the activity to the database.",
          variant: "destructive",
        });
        return; // Stop if saving fails
      }
    }
    
    // Add to the current session's log regardless
    onAddActivity(name.trim());
    
    // Reset and close
    setName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Activity</DialogTitle>
          <DialogDescription>
            Add a custom activity to your log. You can save it for future use.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Meditate"
            />
          </div>
          <div className="flex items-center space-x-2 justify-end col-span-4">
            <Checkbox id="save-permanently" checked={savePermanently} onCheckedChange={(checked) => setSavePermanently(!!checked)} />
            <Label htmlFor="save-permanently">Save for future days</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAdd}>Add to Log</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
