'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface LogTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityName: string;
  initialDuration: number;
  onSave: (duration: number) => void;
}

export function LogTimeDialog({
  open,
  onOpenChange,
  activityName,
  initialDuration,
  onSave,
}: LogTimeDialogProps) {
  const [duration, setDuration] = useState(initialDuration);

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  const handleSave = () => {
    onSave(duration);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Time for {activityName}</DialogTitle>
          <DialogDescription>
            Use the slider to set how much time you spent.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <div className="text-center mb-4">
            <span className="text-4xl font-bold font-headline">{hours}</span>
            <span className="text-lg text-muted-foreground">h</span>{' '}
            <span className="text-4xl font-bold font-headline">{minutes}</span>
            <span className="text-lg text-muted-foreground">m</span>
          </div>
          <Slider
            value={[duration]}
            onValueChange={(value) => setDuration(value[0])}
            max={480} // 8 hours
            step={5}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
