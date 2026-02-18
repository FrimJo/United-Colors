import type { ScreenSize } from "../types";
import { Dot } from "./Dot";

/**
 * The player-controlled dot. Movement via gyro (orientation) or direct touch (pixel delta).
 * Bounds-clamped so it cannot leave the screen.
 */
export class PlayerDot extends Dot {
	private sensorX = 0;
	private sensorY = 0;

	constructor(x: number, y: number, color: string, size: number, speed: number) {
		super(x, y, 0, 0, color, size, speed);
	}

	/** Called when new sensor data arrives (gyro) */
	updateOrientation(x: number, y: number): void {
		this.sensorX = x * this.velocity;
		this.sensorY = y * this.velocity;
	}

	/** Apply a one-shot movement in pixels (e.g. touch drag). Clamped to screen bounds. */
	applyMovementDelta(dx: number, dy: number, screen: ScreenSize): void {
		const halfSize = this.size / 2;
		const newX = Math.max(halfSize, Math.min(screen.width - halfSize, this.x + dx));
		const newY = Math.max(halfSize, Math.min(screen.height - halfSize, this.y + dy));
		this.x = newX;
		this.y = newY;
	}

	/** Move player based on sensor, clamped to screen bounds */
	updateWithBounds(screen: ScreenSize): void {
		const newX = this.x + this.sensorX;
		const newY = this.y + this.sensorY;
		const halfSize = this.size / 2;

		// Check X bounds
		if (newX - halfSize < 0 || newX + halfSize > screen.width) {
			this.sensorX = 0;
		}

		// Check Y bounds
		if (newY - halfSize < 0 || newY + halfSize > screen.height) {
			this.sensorY = 0;
		}

		this.x += this.sensorX;
		this.y += this.sensorY;
	}

	/** Override base update -- player uses updateWithBounds instead */
	override update(_timeStep: number): void {
		// no-op: player movement is driven by updateWithBounds
	}
}
