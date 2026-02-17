import type { InputSource } from '@/application/ports/InputSource';
import type { SensorSample } from '@/domain/types/GameTypes';
import { DeviceMotionAdapter } from '@/infrastructure/sensors/DeviceMotionAdapter';

/**
 * InputSource backed by device gyroscope via DeviceMotionAdapter.
 * Caches the latest sample; getSample() returns it each tick.
 */
export class GyroInputSource implements InputSource {
  private readonly adapter = new DeviceMotionAdapter();
  private latestSample: SensorSample | null = null;

  async start(sensitivity: number, onReady?: (ready: boolean) => void): Promise<void> {
    this.latestSample = null;
    await this.adapter.start(
      (sample) => {
        this.latestSample = sample;
      },
      sensitivity,
      onReady,
    );
  }

  stop(): void {
    this.adapter.stop();
    this.latestSample = null;
  }

  getSample(): SensorSample | null {
    return this.latestSample;
  }
}
