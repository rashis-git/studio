'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface LogMoodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (mood: { energy: number, productivity: number, happinessIndex: number, context: string }) => void;
  isPending: boolean;
}

export function LogMoodDialog({
  open,
  onOpenChange,
  onSave,
  isPending,
}: LogMoodDialogProps) {
  const [energy, setEnergy] = useState(5);
  const [productivity, setProductivity] = useState(5);
  const [happinessIndex, setHappinessIndex] = useState(5);
  const [context, setContext] = useState('');

  const handleSave = () => {
    onSave({ energy, productivity, happinessIndex, context });
    onOpenChange(false);
    // Reset fields
    setEnergy(5);
    setProductivity(5);
    setHappinessIndex(5);
    setContext('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How are you feeling?</DialogTitle>
          <DialogDescription>
            Rate your energy, productivity, and happiness. Add any notes.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-8">
            <div className="grid gap-2">
                <Label htmlFor="context">Context / Notes</Label>
                <Textarea 
                  id="context"
                  placeholder="What's on your mind?"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                />
            </div>
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
                    <Label htmlFor="productivity">Productivity</Label>
                    <span className="text-lg font-bold font-headline">{productivity}</span>
                </div>
                <Slider
                    id="productivity"
                    value={[productivity]}
                    onValueChange={(value) => setProductivity(value[0])}
                    max={10}
                    step={1}
                />
            </div>
            <div className="grid gap-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="happinessIndex">Happiness Index</Label>
                    <span className="text-lg font-bold font-headline">{happinessIndex}</span>
                </div>
                <Slider
                    id="happinessIndex"
                    value={[happinessIndex]}
                    onValueChange={(value) => setHappinessIndex(value[0])}
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
