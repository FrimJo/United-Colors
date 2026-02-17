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
    this.accumulator = 0;
    this.last = 0;
    const stepMs = 1000 / GAME_HZ;
    const maxAccumulator = stepMs * 4;

    const frame = (rafTime: number) => {
      if (!this.running) {
        return;
      }
      const now = rafTime;
      if (this.last === 0) {
        this.last = now;
      } else {
        this.accumulator += now - this.last;
        this.last = now;
      }
      this.accumulator = Math.min(this.accumulator, maxAccumulator);

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
