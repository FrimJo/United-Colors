import type { Dot } from "../entities/Dot";

/**
 * Circle-circle collision using distance-squared (no sqrt).
 * Legacy formula: distance = dx^2 + dy^2 - ((r1 + r2) / 2)^2
 * Returns true when distance <= 0.
 */
export function didCollide(a: Dot, b: Dot): boolean {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	const combinedRadius = (a.size + b.size) / 2;
	const distSq = dx * dx + dy * dy;
	return distSq <= combinedRadius * combinedRadius;
}
