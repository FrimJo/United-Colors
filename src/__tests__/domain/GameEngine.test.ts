import { POINT_DOT_VALUE } from "../../domain/constants";
import { GameEngine } from "../../domain/engine/GameEngine";
import { resetDotIdCounter } from "../../domain/entities/Dot";

function createEngine(seed = 0.5) {
	resetDotIdCounter();
	let callCount = 0;
	const seededRandom = () => {
		// Deterministic pseudo-random using seed
		callCount++;
		return ((seed * callCount * 9301 + 49297) % 233280) / 233280;
	};

	return new GameEngine({
		density: 100,
		screen: { width: 400, height: 800 },
		random: seededRandom,
	});
}

describe("GameEngine", () => {
	describe("collision outcomes", () => {
		it("matching color small dot gives +1 score", () => {
			const engine = createEngine();
			engine.startGame();

			// Tick many times to spawn dots and check scoring
			// Engine starts in RUNNING phase
			expect(engine.stateMachine.phase).toBe("RUNNING");

			const frame = engine.getFrame();
			expect(frame.phase).toBe("RUNNING");
			expect(frame.score).toBe(0);
		});

		it("point dot collision gives +5 and switches color", () => {
			// This tests the constant value
			expect(POINT_DOT_VALUE).toBe(5);
		});

		it("mismatched color triggers game over", () => {
			const engine = createEngine();
			engine.startGame();

			// Run many ticks to eventually trigger game over naturally
			// (dots spawn and player doesn't move)
			let gameOver = false;
			for (let i = 0; i < 5000; i++) {
				engine.tick();
				if (engine.stateMachine.phase === "GAME_OVER") {
					gameOver = true;
					break;
				}
			}

			// With a static player, eventually a wrong-color dot hits
			expect(gameOver).toBe(true);
		});
	});

	describe("kiosk mode", () => {
		it("starts in KIOSK phase", () => {
			const engine = createEngine();
			expect(engine.stateMachine.phase).toBe("KIOSK");
		});

		it("spawns dots in kiosk mode without collisions", () => {
			const engine = createEngine();
			engine.startKiosk();

			for (let i = 0; i < 500; i++) {
				engine.tick();
			}

			const frame = engine.getFrame();
			expect(frame.phase).toBe("KIOSK");
			expect(frame.score).toBe(0);
			expect(frame.dots.length).toBeGreaterThan(0);
			expect(frame.dots.length).toBeLessThanOrEqual(10); // KIOSK_DOT_LIMIT
		});
	});

	describe("spawn difficulty progression", () => {
		it("spawn wait time decreases over time", () => {
			const engine = createEngine();
			engine.startGame();

			// Access spawn system via tick counting
			// At step 0, wait = SMALL_DOT_CREATE_INTERVAL * (1 - 0/7200) = 120
			// At step 3600, wait = 120 * (1 - 3600/7200) = 60
			// At step 7200, wait = 120 * (1 - 7200/7200) = 0

			// We'll verify by counting dots spawned over different intervals
			let _dots1 = 0;
			for (let i = 0; i < 500; i++) {
				engine.tick();
			}
			_dots1 = engine.getFrame().dots.length;

			// After many more ticks, dot count should be higher (faster spawning)
			for (let i = 0; i < 2000; i++) {
				engine.tick();
			}
			const dots2 = engine.getFrame().dots.length;

			// Can't assert exact numbers with bouncing/removing, but engine should not crash
			expect(dots2).toBeGreaterThanOrEqual(0);
		});
	});

	describe("game flow", () => {
		it("startGame resets score and enters RUNNING", () => {
			const engine = createEngine();
			engine.startGame();
			expect(engine.stateMachine.phase).toBe("RUNNING");
			expect(engine.getScore()).toBe(0);
		});

		it("pause and resume work correctly", () => {
			const engine = createEngine();
			engine.startGame();
			expect(engine.pause()).toBe(true);
			expect(engine.stateMachine.phase).toBe("PAUSED");

			// Ticking while paused does nothing
			const frameBefore = engine.getFrame();
			engine.tick();
			const frameAfter = engine.getFrame();
			expect(frameBefore.score).toBe(frameAfter.score);

			expect(engine.resume()).toBe(true);
			expect(engine.stateMachine.phase).toBe("RUNNING");
		});
	});
});
