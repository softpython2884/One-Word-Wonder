'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';

const SOUNDS = {
  click: 'https://cdn.pixabay.com/audio/2022/03/15/audio_2433c6439b.mp3', // UI click
  correct: 'https://cdn.pixabay.com/audio/2022/11/22/audio_13f89c90f0.mp3', // Correct answer
  incorrect: 'https://cdn.pixabay.com/audio/2021/08/04/audio_c668156e23.mp3', // Incorrect answer
  start: 'https://cdn.pixabay.com/audio/2022/08/27/audio_394451a89c.mp3', // Game start
  gameOver: 'https://cdn.pixabay.com/audio/2022/05/17/audio_472b0a8874.mp3', // Game over
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
