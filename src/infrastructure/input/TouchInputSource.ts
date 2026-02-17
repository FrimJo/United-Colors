import type { InputSource } from '@/application/ports/InputSource';
import type { SensorSample } from '@/domain/types/GameTypes';

/**
 * InputSource driven by touch events from the presentation layer.
 *
 * The view calls setPosition(x, y, playerX, playerY) on touch-move and
 * clearPosition() on touch-end.  getSample() returns a normalised direction
 * vector pointing from the player toward the finger, or null when idle.
 */
export class TouchInputSource implements InputSource {
  private sample: SensorSample | null = null;

  async start(_sensitivity: number, onReady?: (ready: boolean) => void): Promise<void> {
    this.sample = null;
    onReady?.(true);
  }

  stop(): void {
    this.sample = null;
  }

  getSample(): SensorSample | null {
    return this.sample;
  }

  /** Call from the view's touch-move handler. */
  setPosition(touchX: number, touchY: number, playerX: number, playerY: number): void {
    const dx = touchX - playerX;
    const dy = touchY - playerY;
    const len = Math.hypot(dx, dy);
    if (len < 1) return;
    this.sample = {
      x: Math.max(-1, Math.min(1, dx / len)),
      y: Math.max(-1, Math.min(1, dy / len)),
      timestampMs: Date.now(),
    };
  }

  /** Call from the view's touch-end / touch-cancel handler. */
  clearPosition(): void {
    this.sample = null;
  }
}
