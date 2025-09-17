
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { mockActivities } from '@/lib/data';
import type { Activity } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Check, RotateCcw, ArrowRight } from 'lucide-react';
import { useSound } from '@/hooks/use-sound';

const cardVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? '100vw' : '-100vw',
    opacity: 0,
    rotate: direction > 0 ? 30 : -30,
    scale: 0.8,
  }),
  animate: {
    x: 0,
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 100, damping: 20 },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '100vw' : '-100vw',
    opacity: 0,
    rotate: direction > 0 ? 30 : 30,
    scale: 0.8,
    transition: { ease: 'easeInOut', duration: 0.4 },
  }),
};

export default function ActivitySwipePage() {
  const router = useRouter();
  const [activities, setActivities] = useState(mockActivities);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [direction, setDirection] = useState(0);
  const { playSound } = useSound();

  const activeActivity = useMemo(() => activities[activities.length - 1], [activities]);

  const handleSwipe = (select: boolean) => {
    setDirection(select ? 1 : -1);
    playSound();
    
    if (activeActivity) {
      if (select) {
        setSelectedActivities((prev) => [...prev, activeActivity.id]);
      }
      setActivities((prev) => prev.slice(0, prev.length - 1));
    }
  };

  const handleDone = () => {
    localStorage.setItem('selectedActivities', JSON.stringify(selectedActivities));
    router.push('/log');
  };

  const handleReset = () => {
    setActivities(mockActivities);
    setSelectedActivities([]);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 pt-8 overflow-hidden">
      <header className="w-full mb-8 text-center">
        <h1 className="text-3xl font-bold font-headline">What have you been up to?</h1>
        <p className="text-muted-foreground">Swipe right for done, left for skip.</p>
      </header>

      <div className="relative flex items-center justify-center w-full h-[60dvh] max-h-[450px]">
        <AnimatePresence custom={direction}>
          {activeActivity ? (
            <motion.div
              key={activeActivity.id}
              custom={direction}
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > 100) {
                  handleSwipe(info.offset.x > 0);
                }
              }}
              className="absolute w-full max-w-xs h-full"
            >
              <Card className="relative w-full h-full shadow-xl bg-gradient-to-br from-card to-muted/30">
                <CardContent className="flex flex-col items-center justify-center h-full gap-6 p-6">
                  <activeActivity.icon className="w-24 h-24 text-primary" strokeWidth={1.5} />
                  <p className="text-2xl font-semibold text-center font-headline">{activeActivity.name}</p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card className="w-full max-w-xs h-full bg-gradient-to-br from-card to-muted/30">
              <CardContent className="flex flex-col items-center justify-center h-full gap-4 p-6">
                <Check className="w-24 h-24 text-green-500" />
                <h2 className="text-2xl font-semibold text-center font-headline">All done!</h2>
                <p className="text-center text-muted-foreground">
                  You've reviewed all activities. Ready to log your time?
                </p>
                <Button onClick={handleDone} className="w-full mt-4" size="lg">
                  Log Time <ArrowRight className="ml-2"/>
                </Button>
                <Button onClick={handleReset} variant="ghost" size="sm" className="mt-2">
                  <RotateCcw className="mr-2" />
                  Start Over
                </Button>
              </CardContent>
            </Card>
          )}
        </AnimatePresence>
      </div>
      
      {activeActivity && (
        <div className="flex justify-center w-full gap-6 mt-8">
          <Button variant="outline" size="icon" className="w-16 h-16 rounded-full shadow-lg" onClick={() => handleSwipe(false)}>
            <X className="w-8 h-8 text-destructive" />
          </Button>
          <Button variant="outline" size="icon" className="w-16 h-16 rounded-full shadow-lg" onClick={() => handleSwipe(true)}>
            <Check className="w-8 h-8 text-green-500" />
          </Button>
        </div>
      )}
    </div>
  );
}
