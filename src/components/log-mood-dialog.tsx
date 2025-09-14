'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface LogMoodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (mood: { energy: number, focus: number, mood: number }) => void;
  isPending: boolean;
}

export function LogMoodDialog({
  open,
  onOpenChange,
  onSave,
  isPending,
}: LogMoodDialogProps) {
  const [energy, setEnergy] = useState(5);
  const [focus, setFocus] = useState(5);
  const [mood, setMood] = useState(5);

  const handleSave = () => {
    onSave({ energy, focus, mood });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How are you feeling?</DialogTitle>
          <DialogDescription>
            Rate your energy, focus, and mood from 1 to 10.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-8">
            <div className="grid gap-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="energy">Energy</Label>
                    <span className="text-lg font-bold font-headline">{energy}</span>
                </div>
                <Slider
                    id="energy"
                    value={[energy]}
                    onValueChange={(value) => setEnergy(value[0])}
                    max={10}
                    step={1}
                />
            </div>
            <div className="grid gap-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="focus">Focus</Label>
                    <span className="text-lg font-bold font-headline">{focus}</span>
                </div>
                <Slider
                    id="focus"
                    value={[focus]}
                    onValueChange={(value) => setFocus(value[0])}
                    max={10}
                    step={1}
                />
            </div>
            <div className="grid gap-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="mood">Mood</Label>
                    <span className="text-lg font-bold font-headline">{mood}</span>
                </div>
                <Slider
                    id="mood"
                    value={[mood]}
                    onValueChange={(value) => setMood(value[0])}
                    max={10}
                    step={1}
                />
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Mood
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
