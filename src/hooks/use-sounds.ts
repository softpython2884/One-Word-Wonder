'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';

const SOUNDS = {
  click: 'https://actions.google.com/sounds/v1/ui/button_press.ogg',
  correct: 'https://actions.google.com/sounds/v1/achievements/achievement_unlocked.ogg',
  incorrect: 'https://actions.google.com/sounds/v1/cartoon/buzz.ogg',
  start: 'https://actions.google.com/sounds/v1/jingles/jingle_start_game.ogg',
  gameOver: 'https://actions.google.com/sounds/v1/jingles/jingle_lose_nice.ogg',
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
         soundsLoaded++;
      }
    });

    if (soundsLoaded === totalSounds) {
        setIsLoaded(true);
    }
    
    return () => {
      // We don't unload sounds anymore on unmount to keep them in cache
      // This is generally better for SPA-like experiences.
      // Object.values(soundBank).forEach(sound => sound?.unload());
      // soundBank = {};
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
