import { Audio } from "expo-av";
import type { AVPlaybackSource } from "expo-av";
import type { AudioPort } from "../domain/types";

/**
 * Audio service using expo-av.
 * Pre-loads game sounds and plays them on demand.
 */
export class AudioService implements AudioPort {
	private enabled = true;
	private collectSound: Audio.Sound | null = null;
	private pointSpawnSound: Audio.Sound | null = null;
	private loaded = false;

	async preload(
		collectSource: AVPlaybackSource,
		pointSpawnSource: AVPlaybackSource,
	): Promise<void> {
		try {
			await Audio.setAudioModeAsync({
				playsInSilentModeIOS: true,
				staysActiveInBackground: false,
			});

			const [collectResult, pointResult] = await Promise.all([
				Audio.Sound.createAsync(collectSource),
				Audio.Sound.createAsync(pointSpawnSource),
			]);

			this.collectSound = collectResult.sound;
			this.pointSpawnSound = pointResult.sound;
			this.loaded = true;
		} catch {
			// Audio unavailable (e.g. simulator) -- degrade gracefully
			this.loaded = false;
		}
	}

	playCollect(): void {
		if (!this.enabled || !this.loaded || !this.collectSound) return;
		this.collectSound.setPositionAsync(0).then(() => {
			this.collectSound?.playAsync();
		});
	}

	playPointSpawn(): void {
		if (!this.enabled || !this.loaded || !this.pointSpawnSound) return;
		this.pointSpawnSound.setPositionAsync(0).then(() => {
			this.pointSpawnSound?.playAsync();
		});
	}

	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
	}

	async unload(): Promise<void> {
		await this.collectSound?.unloadAsync();
		await this.pointSpawnSound?.unloadAsync();
		this.collectSound = null;
		this.pointSpawnSound = null;
		this.loaded = false;
	}
}
