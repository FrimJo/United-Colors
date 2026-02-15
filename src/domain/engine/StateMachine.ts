import type { GamePhase } from '@/domain/types/GameTypes';

export const toRunning = (): GamePhase => 'RUNNING';
export const toKiosk = (): GamePhase => 'KIOSK';
export const toPaused = (): GamePhase => 'PAUSED';
export const toGameOver = (): GamePhase => 'GAME_OVER';
