
'use client';

import { useCallback, useEffect, useRef } from 'react';

// This hook uses the Web Audio API to play a sound without needing an audio file.
export const useSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext on the client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // AudioContext is created on user interaction in playSound
    }
  }, []);

  const playSound = useCallback((type: 'tap' = 'tap') => {
    if (typeof window === 'undefined') return;

    // Create AudioContext on first user interaction (e.g., a click)
    // This is required by modern browsers.
    if (!audioContextRef.current) {
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.");
            return;
        }
    }
    
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    // If context is suspended, resume it.
    if(audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    let oscillator: OscillatorNode;
    let gainNode: GainNode;

    try {
        oscillator = audioContext.createOscillator();
        gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === 'tap') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(150, audioContext.currentTime); // Low pitch
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime); // Start with some volume

            // Create a short "tap" sound
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        }
    } catch (e) {
        console.error("Error playing sound:", e);
    }

  }, []);

  return { playSound };
};
