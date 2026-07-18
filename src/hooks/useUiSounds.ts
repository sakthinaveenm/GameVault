import { useRef } from "react";

export function useUiSounds() {
  const audioContext = useRef<AudioContext | null>(null);
  function playTone(frequency: number, duration: number, gain: number) {
    const context = audioContext.current ?? new AudioContext();
    audioContext.current = context;
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    oscillator.frequency.value = frequency;
    volume.gain.setValueAtTime(gain, context.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(volume).connect(context.destination);
    oscillator.start(); oscillator.stop(context.currentTime + duration);
  }
  return { playFocus: () => playTone(440, 0.045, 0.025), playConfirm: () => playTone(660, 0.07, 0.04) };
}
