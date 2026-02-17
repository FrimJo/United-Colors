import type { GameSettings, StoragePort } from "../../domain/types";
import type { GameStore } from "../GameStore";

export async function updateSettings(
	settings: GameSettings,
	store: GameStore,
	storage: StoragePort,
): Promise<void> {
	store.getState().updateSettings(settings);
	await storage.saveSettings(settings);
}
