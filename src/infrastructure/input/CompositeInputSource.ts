import type { InputSource } from '@/application/ports/InputSource';
import type { SensorSample } from '@/domain/types/GameTypes';

/**
 * Merges two InputSources with a "primary overrides fallback" policy.
 * getSample() returns the primary's sample when non-null, otherwise
 * falls through to the fallback.
 */
export class CompositeInputSource implements InputSource {
  constructor(
    private readonly primary: InputSource,
    private readonly fallback: InputSource,
  ) {}

  async start(sensitivity: number, onReady?: (ready: boolean) => void): Promise<void> {
    await Promise.all([this.primary.start(sensitivity), this.fallback.start(sensitivity, onReady)]);
  }

  stop(): void {
    this.primary.stop();
    this.fallback.stop();
  }

  getSample(): SensorSample | null {
    return this.primary.getSample() ?? this.fallback.getSample();
  }
}
