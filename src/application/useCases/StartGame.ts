import type { GameEngine } from "../../domain/engine/GameEngine";
import type { GameStore } from "../GameStore";

export function startGame(engine: GameEngine, store: GameStore): void {
	engine.startGame();
	store.getState().updateFrame(engine.getFrame());
}
