import type { GameEngine } from "../../domain/engine/GameEngine";
import type { StoragePort } from "../../domain/types";
import type { GameStore } from "../GameStore";

export async function handleGameOver(
	engine: GameEngine,
	store: GameStore,
	storage: StoragePort,
): Promise<number> {
	const score = engine.getScore();
	const highScore = await storage.loadHighScore();
	const newHigh = Math.max(score, highScore);

	if (score > highScore) {
		await storage.saveHighScore(score);
	}

	store.getState().setHighScore(newHigh);
	return newHigh;
}
