import type { GameEngine } from "../../domain/engine/GameEngine";
import type { GameStore } from "../GameStore";

export function pauseGame(engine: GameEngine, store: GameStore): void {
	engine.pause();
	store.getState().updateFrame(engine.getFrame());
}
