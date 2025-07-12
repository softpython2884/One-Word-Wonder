'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';

const SOUNDS = {
  click: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_c631a29a47.mp3', // UI click
  correct: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_c6cc9b3922.mp3', // Correct answer
  incorrect: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_94c60a221f.mp3', // Incorrect answer
  start: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_17152f2096.mp3', // Game start
  gameOver: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_74c9055486.mp3', // Game over
};

type SoundType = keyof typeof SOUNDS;

// This will hold the Howl instances.
// We keep it outside the component to prevent re-creation.
let soundBank: Partial<Record<SoundType, Howl>> = {};

export function useSounds() {
  const [isLoaded, setIsLoaded] = useState(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    let soundsLoaded = 0;
    const totalSounds = Object.keys(SOUNDS).length;

    Object.entries(SOUNDS).forEach(([key, src]) => {
      const soundType = key as SoundType;
      if (!soundBank[soundType]) {
        const sound = new Howl({
          src: [src],
          volume: 0.7,
          html5: true, // Helps with compatibility
          onload: () => {
            soundsLoaded++;
            if (soundsLoaded === totalSounds) {
              setIsLoaded(true);
            }
          },
          onloaderror: (id, error) => {
            console.error(`Error loading sound ${soundType}:`, error);
             // Still count it to not block loading forever
            soundsLoaded++;
            if (soundsLoaded === totalSounds) {
              setIsLoaded(true);
            }
          }
        });
        soundBank[soundType] = sound;
      } else {
         // If already in bank, count as loaded
         const sound = soundBank[soundType];
         if (sound?.state() === 'loaded') {
            soundsLoaded++;
         }
      }
    });

    if (soundsLoaded === totalSounds) {
        setIsLoaded(true);
    }
    
    return () => {
      // We don't unload sounds anymore on unmount to keep them in cache
    };
  }, []);

  const playSound = useCallback((soundType: SoundType) => {
    const sound = soundBank[soundType];
    if (sound && sound.state() === 'loaded') {
      sound.play();
    } else {
      console.warn(`Sound "${soundType}" is not loaded or does not exist.`);
    }
  }, []);

  return { playSound, isLoaded };
}
