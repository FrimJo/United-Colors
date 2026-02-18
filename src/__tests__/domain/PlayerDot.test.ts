import { PlayerDot } from "../../domain/entities/PlayerDot";
import { resetDotIdCounter } from "../../domain/entities/Dot";

describe("PlayerDot", () => {
	beforeEach(() => {
		resetDotIdCounter();
	});

	it("starts at given position", () => {
		const player = new PlayerDot(200, 400, "#E91E63", 50, 10);
		expect(player.x).toBe(200);
		expect(player.y).toBe(400);
	});

	it("moves based on sensor input", () => {
		const player = new PlayerDot(200, 400, "#E91E63", 50, 10);
		player.updateOrientation(1, 0);
		player.updateWithBounds({ width: 800, height: 600 });
		expect(player.x).toBe(210); // 200 + 1 * 10 velocity
		expect(player.y).toBe(400);
	});

	it("clamps to left screen edge", () => {
		const player = new PlayerDot(30, 400, "#E91E63", 50, 10);
		player.updateOrientation(-1, 0);
		player.updateWithBounds({ width: 800, height: 600 });
		// Would go to 20, but 20 - 25 (halfSize) < 0, so sensorX zeroed
		expect(player.x).toBe(30); // unchanged
	});

	it("clamps to right screen edge", () => {
		const player = new PlayerDot(770, 400, "#E91E63", 50, 10);
		player.updateOrientation(1, 0);
		player.updateWithBounds({ width: 800, height: 600 });
		// Would go to 780, but 780 + 25 > 800, so sensorX zeroed
		expect(player.x).toBe(770);
	});

	it("clamps to top screen edge", () => {
		const player = new PlayerDot(200, 30, "#E91E63", 50, 10);
		player.updateOrientation(0, -1);
		player.updateWithBounds({ width: 800, height: 600 });
		expect(player.y).toBe(30);
	});

	it("clamps to bottom screen edge", () => {
		const player = new PlayerDot(200, 570, "#E91E63", 50, 10);
		player.updateOrientation(0, 1);
		player.updateWithBounds({ width: 800, height: 600 });
		expect(player.y).toBe(570);
	});

	it("moves freely when within bounds", () => {
		const player = new PlayerDot(400, 300, "#E91E63", 50, 10);
		player.updateOrientation(0.5, -0.3);
		player.updateWithBounds({ width: 800, height: 600 });
		expect(player.x).toBeCloseTo(405);
		expect(player.y).toBeCloseTo(297);
	});

	it("applyMovementDelta moves by pixel delta and clamps to bounds", () => {
		const screen = { width: 800, height: 600 };
		const player = new PlayerDot(400, 300, "#E91E63", 50, 10);
		player.applyMovementDelta(20, -10, screen);
		expect(player.x).toBe(420);
		expect(player.y).toBe(290);
		player.applyMovementDelta(-1000, 0, screen);
		expect(player.x).toBe(25); // halfSize = 25, clamped left
		player.applyMovementDelta(0, 1000, screen);
		expect(player.y).toBe(575); // 600 - 25, clamped bottom
	});
});
