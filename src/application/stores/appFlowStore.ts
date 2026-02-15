import { create } from 'zustand';
import type { GamePhase } from '@/domain/types/GameTypes';

interface AppFlowState {
  phase: GamePhase;
  score: number;
  highScore: number;
  setPhase: (phase: GamePhase) => void;
  setScore: (score: number) => void;
  setHighScore: (score: number) => void;
}

export const useAppFlowStore = create<AppFlowState>((set) => ({
  phase: 'KIOSK',
  score: 0,
  highScore: 0,
  setPhase: (phase) => set({ phase }),
  setScore: (score) => set({ score }),
  setHighScore: (highScore) => set({ highScore }),
}));
