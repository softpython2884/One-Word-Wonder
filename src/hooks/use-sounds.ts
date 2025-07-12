'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Howl } from 'howler';

const SOUNDS = {
  click: 'https://actions.google.com/sounds/v1/ui/button_press.ogg',
  correct: 'https://actions.google.com/sounds/v1/cartoon/magic_chime.ogg',
  incorrect: 'https://actions.google.com/sounds/v1/cartoon/buzz.ogg',
  start: 'https://actions.google.com/sounds/v1/jingles/jingle_start_game.ogg',
  gameOver: 'https://actions.google.com/sounds/v1/jingles/jingle_lose_nice.ogg',
};

type SoundType = keyof typeof SOUNDS;

export function useSounds() {
  const soundRefs = useRef<Partial<Record<SoundType, Howl>>>({});

  useEffect(() => {
    // Preload sounds
    for (const key in SOUNDS) {
      const soundType = key as SoundType;
      if (!soundRefs.current[soundType]) {
        soundRefs.current[soundType] = new Howl({
          src: [SOUNDS[soundType]],
          volume: 0.7,
        });
      }
    }

    // Cleanup on unmount
    return () => {
      Object.values(soundRefs.current).forEach(sound => sound?.unload());
    };
  }, []);

  const playSound = useCallback((soundType: SoundType) => {
    const sound = soundRefs.current[soundType];
    if (sound) {
      sound.play();
    }
  }, []);

  return { playSound };
}
