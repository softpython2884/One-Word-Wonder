'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';

const SOUNDS = {
  click: 'https://assets.mixkit.co/sfx/preview/mixkit-fast-simple-chop-915.mp3', // UI click
  correct: 'https://assets.mixkit.co/sfx/preview/mixkit-instant-win-2021.mp3', // Correct answer
  incorrect: 'https://assets.mixkit.co/sfx/preview/mixkit-player-losing-or-failing-2042.mp3', // Incorrect answer
  start: 'https://assets.mixkit.co/sfx/preview/mixkit-game-level-completed-2059.mp3', // Game start
  gameOver: 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-game-over-213.mp3', // Game over
};

type SoundType = keyof typeof SOUNDS;

let soundBank: Partial<Record<SoundType, Howl>> = {};

export function useSounds() {
  const [isLoaded, setIsLoaded] = useState(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current || Object.keys(soundBank).length > 0) {
      setIsLoaded(true);
      return;
    };
    isInitialized.current = true;

    let soundsLoaded = 0;
    const totalSounds = Object.keys(SOUNDS).length;

    Object.entries(SOUNDS).forEach(([key, src]) => {
      const soundType = key as SoundType;
      const sound = new Howl({
        src: [src],
        volume: 0.7,
        html5: true, 
        onload: () => {
          soundsLoaded++;
          if (soundsLoaded === totalSounds) {
            setIsLoaded(true);
          }
        },
        onloaderror: (id, error) => {
          console.error(`Error loading sound ${soundType}:`, error);
          soundsLoaded++;
          if (soundsLoaded === totalSounds) {
            setIsLoaded(true);
          }
        }
      });
      soundBank[soundType] = sound;
    });

    if (soundsLoaded === totalSounds) {
        setIsLoaded(true);
    }
    
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
