import type { ScreenSize } from "../types";
import { Dot } from "./Dot";

/**
 * The player-controlled dot. Moves via gyro sensor input.
 * Bounds-clamped so it cannot leave the screen.
 */
export class PlayerDot extends Dot {
	private sensorX = 0;
	private sensorY = 0;

	constructor(x: number, y: number, color: string, size: number, speed: number) {
		super(x, y, 0, 0, color, size, speed);
	}

	/** Called when new sensor data arrives */
	updateOrientation(x: number, y: number): void {
		this.sensorX = x * this.velocity;
		this.sensorY = y * this.velocity;
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
