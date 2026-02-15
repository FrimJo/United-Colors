import { create } from 'zustand';
import type { GameSettings } from '@/domain/types/GameTypes';

interface SettingsState extends GameSettings {
  setSoundEnabled: (value: boolean) => void;
  setGyroSensitivity: (value: number) => void;
  hydrate: (settings: GameSettings) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  soundEnabled: true,
  gyroSensitivity: 1,
  setSoundEnabled: (value) => set({ soundEnabled: value }),
  setGyroSensitivity: (value) => set({ gyroSensitivity: value }),
  hydrate: (settings) => set(settings),
}));
