import type { GameEngine } from "../../domain/engine/GameEngine";
import type { GameStore } from "../GameStore";

export function resumeGame(engine: GameEngine, store: GameStore): void {
	engine.resume();
	store.getState().updateFrame(engine.getFrame());
}
