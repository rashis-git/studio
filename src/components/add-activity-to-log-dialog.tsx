
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

interface AddActivityToLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivityAdded: (activityName: string) => void;
  user: User | null;
}

export function AddActivityToLogDialog({ open, onOpenChange, onActivityAdded, user }: AddActivityToLogDialogProps) {
  const [name, setName] = useState('');
  const [saveForFuture, setSaveForFuture] = useState(false);
  const { toast } = useToast();

  const handleAdd = async () => {
    if (!name.trim()) return;

    // Add to the local state for immediate logging on the page
    onActivityAdded(name.trim());
    
    if (saveForFuture) {
        if (!user) {
          toast({
            title: "Not Authenticated",
            description: "You must be logged in to save an activity for future use.",
            variant: "destructive",
          });
          // Still add locally, just don't save to DB.
        } else {
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
                    description: error.message || "Could not save the activity.",
                    variant: "destructive",
                });
            }
        }
    }
    
    // Reset and close
    setName('');
    setSaveForFuture(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Activity to Today's Log</DialogTitle>
          <DialogDescription>
            Add an activity just for today, or save it to your permanent list for future use.
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
              placeholder="e.g., Run errands"
            />
          </div>
          <div className="flex items-center space-x-2 justify-end mt-4">
            <Checkbox 
                id="save-for-future" 
                checked={saveForFuture}
                onCheckedChange={() => setSaveForFuture(prev => !prev)}
            />
            <Label htmlFor="save-for-future" className="cursor-pointer">
                Save for future use
            </Label>
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
