export type GamePhase = 'KIOSK' | 'RUNNING' | 'PAUSED' | 'GAME_OVER';

export type DotKind = 'player' | 'small' | 'point';

export interface Vector2 {
  x: number;
  y: number;
}

export interface DotState {
  id: number;
  kind: DotKind;
  position: Vector2;
  velocity: Vector2;
  speed: number;
  radius: number;
  color: string;
  flagged: boolean;
  createdStep: number;
  value?: number;
  baseRadius?: number;
  pulseFrom?: number;
  pulseTo?: number;
  pointPhase?: 'GROW' | 'PULSE' | 'SHRINK';
  animationStartStep?: number;
  animationDuration?: number;
  animationFromRadius?: number;
  removeAfterStep?: number;
}

export interface SensorSample {
  x: number;
  y: number;
  timestampMs: number;
}

export interface DotView {
  id: string;
  kind: DotKind;
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface RenderFrame {
  phase: GamePhase;
  score: number;
  dots: DotView[];
}

export type EngineEvent =
  | { type: 'POINT_SPAWNED'; dotId: number }
  | { type: 'DOT_CONSUMED'; dotId: number }
  | { type: 'POINT_CONSUMED'; dotId: number }
  | { type: 'SCORE_CHANGED'; score: number; delta: number }
  | { type: 'GAME_OVER' }
  | { type: 'PHASE_CHANGED'; phase: GamePhase };

export interface EngineStepResult {
  frame: RenderFrame;
  events: EngineEvent[];
}

export interface RandomProvider {
  nextFloat: () => number;
  nextInt: (maxExclusive: number) => number;
}

export interface WorldBounds {
  width: number;
  height: number;
  density: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  gyroSensitivity: number;
}
