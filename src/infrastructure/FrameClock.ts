import { GAME_HERTZ } from "../domain/constants";

/**
 * Fixed-step simulation clock.
 * Drives the game engine at GAME_HERTZ (30 Hz) regardless of render FPS.
 * Will use requestAnimationFrame on the JS thread.
 */
export class FrameClock {
	private running = false;
	private rafId: number | null = null;
	private lastTime = 0;
	private accumulator = 0;
	private readonly stepMs = 1000 / GAME_HERTZ;

	constructor(private onTick: () => void) {}

	start(): void {
		if (this.running) return;
		this.running = true;
		this.lastTime = performance.now();
		this.accumulator = 0;
		this.loop();
	}

	stop(): void {
		this.running = false;
		if (this.rafId != null) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}
	}

	private loop = (): void => {
		if (!this.running) return;

		const now = performance.now();
		const dt = now - this.lastTime;
		this.lastTime = now;
		this.accumulator += dt;

		let updates = 0;
		const maxUpdates = 5;

		while (this.accumulator >= this.stepMs && updates < maxUpdates) {
			this.onTick();
			this.accumulator -= this.stepMs;
			updates++;
		}

		// Prevent spiral of death
		if (this.accumulator > this.stepMs) {
			this.accumulator = this.stepMs;
		}

		this.rafId = requestAnimationFrame(this.loop);
	};
}
