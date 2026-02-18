import {
	GAME_COLORS,
	PLAYER_DOT_SIZE_RATIO,
	PLAYER_DOT_SPEED_RATIO,
	POINT_DOT_VALUE,
} from "../constants";
import type { Dot } from "../entities/Dot";
import { PlayerDot } from "../entities/PlayerDot";
import { PointDot } from "../entities/PointDot";
import type { AudioPort, DotView, RenderFrame, ScreenSize } from "../types";
import { didCollide } from "./Collision";
import { SpawnSystem } from "./SpawnSystem";
import { StateMachine } from "./StateMachine";

export interface GameEngineOptions {
	density: number;
	screen: ScreenSize;
	audio?: AudioPort;
	random?: () => number;
}

/**
 * Core game engine. Drives the simulation each tick.
 * Pure logic -- no React/Expo imports.
 */
export class GameEngine {
	readonly stateMachine: StateMachine;
	private spawnSystem: SpawnSystem;
	private player!: PlayerDot;
	private dots: Dot[] = [];
	private score = 0;
	private timeStep = 0;
	private density: number;
	private screen: ScreenSize;
	private audio?: AudioPort;
	private random: () => number;

	constructor(options: GameEngineOptions) {
		this.density = options.density;
		this.screen = options.screen;
		this.audio = options.audio;
		this.random = options.random ?? Math.random;
		this.stateMachine = new StateMachine("KIOSK");
		this.spawnSystem = new SpawnSystem(this.random);
		this.initPlayer();
	}

	/** Update screen dimensions (e.g. from Canvas onSize) */
	setScreen(screen: ScreenSize): void {
		this.screen = screen;
	}

	/** Start a new game (non-kiosk) */
	startGame(): void {
		this.stateMachine.transition("RUNNING");
		this.dots = [];
		this.score = 0;
		this.timeStep = 0;
		this.spawnSystem.reset();
		this.initPlayer();
		this.dots.push(this.player);
	}

	/** Start kiosk mode */
	startKiosk(): void {
		this.stateMachine.reset();
		this.dots = [];
		this.score = 0;
		this.timeStep = 0;
		this.spawnSystem.reset();
		this.initPlayer();
	}

	pause(): boolean {
		return this.stateMachine.transition("PAUSED");
	}

	resume(): boolean {
		return this.stateMachine.transition("RUNNING");
	}

	/** Feed sensor data to the player dot (gyro) */
	onSensorInput(x: number, y: number): void {
		this.player.updateOrientation(x, y);
	}

	/** Move player by pixel delta (e.g. touch drag). No-op when not RUNNING. */
	onMovementDelta(dx: number, dy: number): void {
		if (this.stateMachine.phase !== "RUNNING") return;
		this.player.applyMovementDelta(dx, dy, this.screen);
	}

	/** Run one simulation tick (30 Hz) */
	tick(): void {
		const phase = this.stateMachine.phase;
		if (phase === "PAUSED" || phase === "GAME_OVER") return;

		const isKiosk = phase === "KIOSK";
		this.timeStep++;

		// Spawn small dots
		const newDot = this.spawnSystem.trySpawnSmallDot(
			this.timeStep,
			this.dots.length,
			this.screen,
			this.density,
			isKiosk,
		);
		if (newDot) this.dots.push(newDot);

		// Spawn point dots (not in kiosk)
		if (!isKiosk) {
			const newPoint = this.spawnSystem.trySpawnPointDot(
				this.timeStep,
				this.player,
				this.screen,
				this.density,
			);
			if (newPoint) {
				this.dots.push(newPoint);
				this.audio?.playPointSpawn();
			}
		}

		// Update all dots
		for (const dot of this.dots) {
			if (dot instanceof PlayerDot) {
				dot.updateWithBounds(this.screen);
			} else {
				dot.update(this.timeStep);
			}
		}

		// Bounce small dots off screen edges
		for (const dot of this.dots) {
			if (dot instanceof PlayerDot || dot instanceof PointDot) continue;
			this.bounceOffEdges(dot);
		}

		// Check collisions (skip in kiosk)
		if (!isKiosk) {
			this.checkCollisions();
		}

		// Remove flagged dots
		this.dots = this.dots.filter((d) => !d.isFlaggedForRemoval);

		// Clean up point dot reference if removed
		const pd = this.spawnSystem.getPointDot();
		if (pd?.isFlaggedForRemoval) {
			this.spawnSystem.clearPointDot();
		}
	}

	/** Produce a RenderFrame for the presentation layer */
	getFrame(): RenderFrame {
		const dots: DotView[] = this.dots.map((dot) => ({
			id: dot.id,
			x: dot.x,
			y: dot.y,
			radius: dot.size / 2,
			color: dot.color,
			kind: dot instanceof PlayerDot ? "player" : dot instanceof PointDot ? "point" : "small",
		}));

		return {
			phase: this.stateMachine.phase,
			score: this.score,
			dots,
		};
	}

	getScore(): number {
		return this.score;
	}

	private initPlayer(): void {
		const color = GAME_COLORS[Math.floor(this.random() * GAME_COLORS.length)];
		this.player = new PlayerDot(
			this.screen.width / 2,
			this.screen.height / 2,
			color,
			PLAYER_DOT_SIZE_RATIO * this.density,
			PLAYER_DOT_SPEED_RATIO * this.density,
		);
	}

	private bounceOffEdges(dot: Dot): void {
		const halfSize = dot.size / 2;
		if (dot.x - halfSize < 0 || dot.x + halfSize > this.screen.width) {
			dot.vx *= -1;
		}
		if (dot.y - halfSize < 0 || dot.y + halfSize > this.screen.height) {
			dot.vy *= -1;
		}
	}

	private checkCollisions(): void {
		for (const dot of this.dots) {
			if (dot === this.player) continue;
			if (dot.isFlaggedForRemoval) continue;

			if (!didCollide(this.player, dot)) continue;

			if (dot instanceof PointDot) {
				this.score += POINT_DOT_VALUE;
				this.switchPlayerColor();
				(dot as PointDot).forceRemove();
				this.spawnSystem.onPointDotCollected();
			} else if (dot.color === this.player.color) {
				this.score += 1;
				dot.flagForRemoval();
			} else {
				// Wrong color -- game over
				this.stateMachine.transition("GAME_OVER");
				return;
			}

			this.audio?.playCollect();
		}
	}

	private switchPlayerColor(): void {
		let newIndex: number;
		do {
			newIndex = Math.floor(this.random() * GAME_COLORS.length);
		} while (GAME_COLORS[newIndex] === this.player.color);

		this.player.color = GAME_COLORS[newIndex];
	}
}
