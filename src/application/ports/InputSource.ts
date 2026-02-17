import type { SensorSample } from '@/domain/types/GameTypes';

/**
 * Abstraction for any player-input source (gyro, touch, etc.).
 *
 * start/stop manage the lifecycle of the underlying hardware or event stream.
 * getSample returns the most recent input sample, or null when idle.
 */
export interface InputSource {
  start(sensitivity: number, onReady?: (ready: boolean) => void): Promise<void>;
  stop(): void;
  getSample(): SensorSample | null;
}
