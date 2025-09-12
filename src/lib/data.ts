import { BrainCircuit, Coffee, Sprout, Footprints, Phone, BookOpen, Dumbbell, Briefcase } from 'lucide-react';
import type { Activity } from './types';

export const mockActivities: Activity[] = [
  { id: '1', name: 'Deep Work', icon: BrainCircuit },
  { id: '2', name: 'Shallow Work', icon: Briefcase },
  { id: '3', name: 'Exercise', icon: Dumbbell },
  { id: '4', name: 'Take a Walk', icon: Footprints },
  { id: '5', name: 'Talk to Family/Friends', icon: Phone },
  { id: '6', name: 'Read a Book', icon: BookOpen },
  { id: '7', name: 'Relax / Break', icon: Coffee },
  { id: '8', 'name': 'Gardening', 'icon': Sprout },
];
