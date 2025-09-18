import { useState, useEffect, useRef } from 'react';

interface AudioSettings {
  backgroundMusic: boolean;
  soundEffects: boolean;
  volume: number;
}

export function useAudio() {
  const [settings, setSettings] = useState<AudioSettings>(() => {
    const saved = localStorage.getItem('audioSettings');
    return saved ? JSON.parse(saved) : {
      backgroundMusic: true,
      soundEffects: true,
      volume: 0.5
    };
  });

  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const soundEffectsRef = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    localStorage.setItem('audioSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    // Initialize background music (disabled to prevent vibrating sound)
    if (!backgroundMusicRef.current) {
      backgroundMusicRef.current = new Audio();
      backgroundMusicRef.current.loop = true;
      backgroundMusicRef.current.volume = settings.volume * 0.3; // Lower volume for background music
      
      // Remove the Web Audio API oscillator that was causing the vibrating sound
      // Background music is now disabled to prevent creepy vibrating sounds
    }

    // Initialize sound effects
    const sounds = ['move', 'win', 'lose', 'draw', 'click', 'celebrate'];
    sounds.forEach(sound => {
      if (!soundEffectsRef.current[sound]) {
        soundEffectsRef.current[sound] = new Audio();
        soundEffectsRef.current[sound].volume = settings.volume;
      }
    });

    return () => {
      // Cleanup audio resources
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
      }
      Object.values(soundEffectsRef.current).forEach(audio => {
        audio.pause();
      });
    };
  }, []);

  const generateTone = (frequency: number, duration: number, volume: number = settings.volume) => {
    if (!settings.soundEffects || typeof window === 'undefined') return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      gainNode.gain.setValueAtTime(volume * 0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Audio generation failed:', error);
    }
  };

  const playSound = (soundType: string) => {
    if (!settings.soundEffects) return;

    switch (soundType) {
      case 'move':
        generateTone(800, 0.1);
        break;
      case 'win':
        generateTone(523, 0.2); // C5
        setTimeout(() => generateTone(659, 0.2), 100); // E5
        setTimeout(() => generateTone(784, 0.3), 200); // G5
        break;
      case 'celebrate':
        // Victory celebration sound - ascending major scale
        generateTone(523, 0.15); // C5
        setTimeout(() => generateTone(587, 0.15), 120); // D5
        setTimeout(() => generateTone(659, 0.15), 240); // E5
        setTimeout(() => generateTone(698, 0.15), 360); // F5
        setTimeout(() => generateTone(784, 0.15), 480); // G5
        setTimeout(() => generateTone(880, 0.15), 600); // A5
        setTimeout(() => generateTone(988, 0.15), 720); // B5
        setTimeout(() => generateTone(1047, 0.4), 840); // C6 (triumphant finale)
        break;
      case 'lose':
        generateTone(392, 0.2); // G4
        setTimeout(() => generateTone(349, 0.2), 100); // F4
        setTimeout(() => generateTone(311, 0.3), 200); // E♭4
        break;
      case 'draw':
        generateTone(440, 0.5); // A4
        break;
      case 'click':
        generateTone(1000, 0.05);
        break;
      default:
        generateTone(440, 0.1);
    }
  };

  const toggleBackgroundMusic = () => {
    setSettings(prev => ({
      ...prev,
      backgroundMusic: !prev.backgroundMusic
    }));
  };

  const toggleSoundEffects = () => {
    setSettings(prev => ({
      ...prev,
      soundEffects: !prev.soundEffects
    }));
  };

  const setVolume = (volume: number) => {
    setSettings(prev => ({
      ...prev,
      volume: Math.max(0, Math.min(1, volume))
    }));
  };

  return {
    settings,
    playSound,
    toggleBackgroundMusic,
    toggleSoundEffects,
    setVolume
  };
}