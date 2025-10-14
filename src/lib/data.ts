import { BrainCircuit, Coffee, Sprout, Footprints, Phone, BookOpen, Dumbbell, Briefcase, Car, Users, Utensils } from 'lucide-react';
import type { Activity } from './types';

export const mockActivities: Activity[] = [
  { id: '1', name: 'Deep Work', icon: BrainCircuit },
  { id: '2', name: 'Office', icon: Briefcase },
  { id: '3', name: 'Meetings', icon: Users },
  { id: '4', name: 'Travelling', icon: Car },
  { id: '5', name: 'Cooking', icon: Utensils },
  { id: '6', 'name': 'Gardening', 'icon': Sprout },
  { id: '7', name: 'Exercise', icon: Dumbbell },
  { id: '8', name: 'Take a Walk', icon: Footprints },
  { id: '9', name: 'Talk to Family/Friends', icon: Phone },
  { id: '10', name: 'Read a Book', icon: BookOpen },
  { id: '11', name: 'Relax / Break', icon: Coffee },
];
