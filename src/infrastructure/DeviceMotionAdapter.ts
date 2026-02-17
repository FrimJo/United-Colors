import { DeviceMotion } from "expo-sensors";
import type { Subscription } from "expo-sensors/build/DeviceSensor";
import type { SensorPort, SensorSample } from "../domain/types";

/**
 * Adapter wrapping Expo DeviceMotion for gyroscope-only player input.
 * Provides SensorSample { x, y, timestampMs } from gyroscope rotation rate.
 */
export class DeviceMotionAdapter implements SensorPort {
	private subscription: Subscription | null = null;
	private callback: ((sample: SensorSample) => void) | null = null;
	private updateIntervalMs = 16; // ~60 Hz sensor polling

	start(): void {
		if (this.subscription) return;

		DeviceMotion.setUpdateInterval(this.updateIntervalMs);

		this.subscription = DeviceMotion.addListener((data) => {
			if (!this.callback) return;
			if (!data.rotation) return;

			this.callback({
				x: data.rotation.gamma, // left-right tilt
				y: data.rotation.beta, // forward-back tilt
				timestampMs: Date.now(),
			});
		});
	}

	stop(): void {
		if (this.subscription) {
			this.subscription.remove();
			this.subscription = null;
		}
	}

	onSample(callback: (sample: SensorSample) => void): void {
		this.callback = callback;
	}
}
