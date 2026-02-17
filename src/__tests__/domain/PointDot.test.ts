import { POINT_DOT_FADE_TIME, POINT_DOT_SIZE_ANIMATION_TIME } from "../../domain/constants";
import { resetDotIdCounter } from "../../domain/entities/Dot";
import { PointDot } from "../../domain/entities/PointDot";

describe("PointDot", () => {
	beforeEach(() => {
		resetDotIdCounter();
	});

	it("starts with size 0 (zoom-in animation)", () => {
		const pd = new PointDot(0, 100, 200, "#E91E63", 50, 5);
		expect(pd.size).toBe(0);
	});

	it("zoom-in reaches target size after animation time", () => {
		const pd = new PointDot(0, 100, 200, "#E91E63", 50, 5);
		for (let t = 1; t <= POINT_DOT_SIZE_ANIMATION_TIME; t++) {
			pd.update(t);
		}
		expect(pd.size).toBe(50);
	});

	it("starts pulsing after zoom-in completes", () => {
		const pd = new PointDot(0, 100, 200, "#E91E63", 50, 5);
		// Complete zoom-in
		for (let t = 1; t <= POINT_DOT_SIZE_ANIMATION_TIME + 1; t++) {
			pd.update(t);
		}
		// After zoom-in, should be pulsing (size starts shrinking)
		const sizeAfterZoomIn = pd.size;
		for (let t = POINT_DOT_SIZE_ANIMATION_TIME + 2; t <= POINT_DOT_SIZE_ANIMATION_TIME + 5; t++) {
			pd.update(t);
		}
		expect(pd.size).toBeLessThan(sizeAfterZoomIn);
	});

	it("flags for removal after POINT_DOT_FADE_TIME", () => {
		const pd = new PointDot(0, 100, 200, "#E91E63", 50, 5);
		for (let t = 1; t < POINT_DOT_FADE_TIME; t++) {
			pd.update(t);
		}
		expect(pd.isFlaggedForRemoval).toBe(false);

		// At fade time, should start zoom-out (but not immediately removable)
		pd.update(POINT_DOT_FADE_TIME);
		// During zoom-out, isFlaggedForRemoval returns false
		expect(pd.isFlaggedForRemoval).toBe(false);
	});

	it("becomes removable after zoom-out completes", () => {
		const pd = new PointDot(0, 100, 200, "#E91E63", 50, 5);
		// Trigger fade by advancing past POINT_DOT_FADE_TIME
		for (let t = 1; t <= POINT_DOT_FADE_TIME; t++) {
			pd.update(t);
		}
		// Advance through zoom-out animation
		for (
			let t = POINT_DOT_FADE_TIME + 1;
			t <= POINT_DOT_FADE_TIME + POINT_DOT_SIZE_ANIMATION_TIME + 1;
			t++
		) {
			pd.update(t);
		}
		expect(pd.isFlaggedForRemoval).toBe(true);
		expect(pd.size).toBe(0);
	});

	it("forceRemove makes it immediately removable", () => {
		const pd = new PointDot(0, 100, 200, "#E91E63", 50, 5);
		pd.forceRemove();
		expect(pd.isFlaggedForRemoval).toBe(true);
		expect(pd.size).toBe(0);
	});

	it("has correct value", () => {
		const pd = new PointDot(0, 100, 200, "#E91E63", 50, 5);
		expect(pd.value).toBe(5);
	});
});
