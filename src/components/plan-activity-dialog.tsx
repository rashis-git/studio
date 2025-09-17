
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

interface PlanActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | undefined;
  onSave: (details: { activityName: string, time: string }) => void;
}

export function PlanActivityDialog({ open, onOpenChange, selectedDate, onSave }: PlanActivityDialogProps) {
  const [activityName, setActivityName] = useState('');
  const [time, setTime] = useState('12:00');

  useEffect(() => {
    // Reset state when dialog opens or date changes
    if (open) {
      setActivityName('');
      setTime('12:00');
    }
  }, [open, selectedDate]);

  const handleSave = () => {
    if (!activityName.trim() || !time.trim()) {
        // Simple validation, can be improved with toasts
        return;
    }
    onSave({ activityName, time });
    onOpenChange(false);
  };
  
  if (!selectedDate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Plan an Activity</DialogTitle>
          <DialogDescription>
            Schedule an activity for {format(selectedDate, 'MMMM d, yyyy')}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="activityName" className="text-right">
              Activity
            </Label>
            <Input
              id="activityName"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Go for a run"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="time" className="text-right">
              Time
            </Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Plan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
