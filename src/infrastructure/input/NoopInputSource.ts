import type { InputSource } from '@/application/ports/InputSource';
import type { SensorSample } from '@/domain/types/GameTypes';

/**
 * InputSource that is always ready and never produces samples.
 * Used when no hardware sensor is available and touch is the sole source.
 */
export class NoopInputSource implements InputSource {
  async start(_sensitivity: number, onReady?: (ready: boolean) => void): Promise<void> {
    onReady?.(true);
  }

  stop(): void {
    // no-op
  }

  getSample(): SensorSample | null {
    return null;
  }
}
