import type { DotState, Vector2 } from '@/domain/types/GameTypes';

export const intersects = (dot: DotState, point: Vector2, radius: number): boolean => {
  const dx = dot.position.x - point.x;
  const dy = dot.position.y - point.y;
  const sum = dot.radius + radius;
  return dx * dx + dy * dy <= sum * sum;
};
