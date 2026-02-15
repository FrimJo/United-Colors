import type { DotKind, DotState, Vector2 } from '@/domain/types/GameTypes';

export const createDot = (args: {
  id: number;
  kind: DotKind;
  position: Vector2;
  velocity: Vector2;
  speed: number;
  radius: number;
  color: string;
  createdStep: number;
  value?: number;
}): DotState => {
  const dot: DotState = {
    id: args.id,
    kind: args.kind,
    position: args.position,
    velocity: args.velocity,
    speed: args.speed,
    radius: args.radius,
    color: args.color,
    flagged: false,
    createdStep: args.createdStep,
  };

  if (args.value !== undefined) {
    dot.value = args.value;
  }

  return dot;
};
