import type { GamePhase } from "../types";

export type StateTransition =
	| { from: "KIOSK"; to: "RUNNING" }
	| { from: "RUNNING"; to: "PAUSED" }
	| { from: "RUNNING"; to: "GAME_OVER" }
	| { from: "PAUSED"; to: "RUNNING" }
	| { from: "PAUSED"; to: "KIOSK" }
	| { from: "GAME_OVER"; to: "KIOSK" }
	| { from: "GAME_OVER"; to: "RUNNING" };

const VALID_TRANSITIONS: ReadonlySet<string> = new Set<string>([
	"KIOSK->RUNNING",
	"RUNNING->PAUSED",
	"RUNNING->GAME_OVER",
	"PAUSED->RUNNING",
	"PAUSED->KIOSK",
	"GAME_OVER->KIOSK",
	"GAME_OVER->RUNNING",
]);

export class StateMachine {
	private _phase: GamePhase;
	private listeners: Array<(phase: GamePhase) => void> = [];

	constructor(initial: GamePhase = "KIOSK") {
		this._phase = initial;
	}

	get phase(): GamePhase {
		return this._phase;
	}

	transition(to: GamePhase): boolean {
		const key = `${this._phase}->${to}`;
		if (!VALID_TRANSITIONS.has(key)) {
			return false;
		}
		this._phase = to;
		for (const listener of this.listeners) {
			listener(this._phase);
		}
		return true;
	}

	onPhaseChange(listener: (phase: GamePhase) => void): () => void {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter((l) => l !== listener);
		};
	}

	reset(): void {
		this._phase = "KIOSK";
	}
}
