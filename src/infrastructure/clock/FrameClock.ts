import { GAME_HZ } from '@/domain/rules/GameRules';

type Tick = () => void;

export class FrameClock {
  private running = false;
  private raf: number | null = null;
  private accumulator = 0;
  private last = 0;

  start(tick: Tick): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.last = Date.now();
    const stepMs = 1000 / GAME_HZ;

    const frame = () => {
      if (!this.running) {
        return;
      }
      const now = Date.now();
      this.accumulator += now - this.last;
      this.last = now;

      while (this.accumulator >= stepMs) {
        tick();
        this.accumulator -= stepMs;
      }

      this.raf = requestAnimationFrame(frame);
    };

    this.raf = requestAnimationFrame(frame);
  }

  stop(): void {
    this.running = false;
    if (this.raf !== null) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
  }
}
