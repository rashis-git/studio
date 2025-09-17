
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';

interface AddActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivityAdded: () => void;
  user: User | null;
}

export function AddActivityDialog({ open, onOpenChange, onActivityAdded, user }: AddActivityDialogProps) {
  const [name, setName] = useState('');
  const { toast } = useToast();

  const handleAdd = async () => {
    if (!name.trim()) return;

    if (!user) {
      toast({
        title: "Not Authenticated",
        description: "You must be logged in to save an activity.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Save to the user-specific sub-collection
      const savedActivitiesRef = collection(db, 'users', user.uid, 'savedActivities');
      await addDoc(savedActivitiesRef, {
        activityName: name.trim(),
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
    
    // Notify the parent component that an activity was added.
    onActivityAdded();
    
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
            Add a custom activity to track. It will be saved permanently for you to select from on the 'Today' screen.
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAdd}>Add Activity</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    