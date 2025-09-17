
'use client';

import { useCallback, useEffect, useState } from 'react';

// This is a browser-only hook.
// It will not work in server components or during server-side rendering.
export const useSound = (soundUrl: string, volume: number = 0.5) => {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // We can only create the Audio object on the client-side
    // after the component has mounted.
    const audioInstance = new Audio(soundUrl);
    audioInstance.volume = volume;
    setAudio(audioInstance);

    // Preload the audio file
    audioInstance.load();
  }, [soundUrl, volume]);

  const play = useCallback(() => {
    if (audio) {
      // Allow playing the sound again even if it's already playing.
      audio.currentTime = 0;
      audio.play().catch(error => {
        // Autoplay is often blocked by browsers until a user interaction.
        // We can ignore this error as it's not critical for the app's function.
        console.warn('Sound play failed:', error);
      });
    }
  }, [audio]);

  return play;
};
