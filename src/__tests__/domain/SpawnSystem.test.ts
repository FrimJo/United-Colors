import {
	KIOSK_DOT_LIMIT,
	MAX_TIME_DIFFICULTY,
	SMALL_DOT_CREATE_INTERVAL,
} from "../../domain/constants";
import { SpawnSystem } from "../../domain/engine/SpawnSystem";
import { resetDotIdCounter } from "../../domain/entities/Dot";

describe("SpawnSystem", () => {
	let spawn: SpawnSystem;

	beforeEach(() => {
		resetDotIdCounter();
		spawn = new SpawnSystem(() => 0.5);
		spawn.reset();
	});

	describe("spawn wait time", () => {
		it("returns full interval at time step 0", () => {
			expect(spawn.getSpawnWaitTime(0, false)).toBe(SMALL_DOT_CREATE_INTERVAL);
		});

		it("returns half interval at midpoint", () => {
			const mid = MAX_TIME_DIFFICULTY / 2;
			expect(spawn.getSpawnWaitTime(mid, false)).toBe(SMALL_DOT_CREATE_INTERVAL * 0.5);
		});

		it("returns 0 at max difficulty", () => {
			expect(spawn.getSpawnWaitTime(MAX_TIME_DIFFICULTY, false)).toBe(0);
		});

		it("caps at 0 beyond max difficulty", () => {
			expect(spawn.getSpawnWaitTime(MAX_TIME_DIFFICULTY + 1000, false)).toBe(0);
		});

		it("always returns full interval in kiosk mode", () => {
			expect(spawn.getSpawnWaitTime(MAX_TIME_DIFFICULTY, true)).toBe(SMALL_DOT_CREATE_INTERVAL);
		});
	});

	describe("small dot spawning", () => {
		it("does not spawn before wait time", () => {
			const dot = spawn.trySpawnSmallDot(1, 0, { width: 400, height: 800 }, 100, false);
			expect(dot).toBeNull();
		});

		it("spawns after wait time elapses", () => {
			const dot = spawn.trySpawnSmallDot(
				SMALL_DOT_CREATE_INTERVAL + 1,
				0,
				{ width: 400, height: 800 },
				100,
				false,
			);
			expect(dot).not.toBeNull();
		});

		it("does not exceed kiosk dot limit", () => {
			const dot = spawn.trySpawnSmallDot(
				SMALL_DOT_CREATE_INTERVAL + 1,
				KIOSK_DOT_LIMIT,
				{ width: 400, height: 800 },
				100,
				true,
			);
			expect(dot).toBeNull();
		});
	});
});
