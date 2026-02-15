import { COLOR_SET, RULES } from '@/domain/rules/GameRules';
import type { DotState, RandomProvider } from '@/domain/types/GameTypes';

export interface CollisionResult {
  scoreDelta: number;
  gameOver: boolean;
}

export const applyCollision = (
  player: DotState,
  other: DotState,
  random: RandomProvider,
): CollisionResult => {
  if (other.kind === 'point') {
    let next = player.color;
    while (next === player.color) {
      next = COLOR_SET[random.nextInt(COLOR_SET.length)] ?? COLOR_SET[0];
    }
    player.color = next;
    player.radius += RULES.PLAYER_DOT_SIZE_INCREMENT_POINT;
    return { scoreDelta: RULES.POINT_DOT_VALUE, gameOver: false };
  }

  if (player.color === other.color) {
    player.radius += RULES.PLAYER_DOT_SIZE_INCREMENT_SMALL;
    return { scoreDelta: RULES.PLAYER_DOT_COLOR_INCREMENT_SMALL, gameOver: false };
  }

  return { scoreDelta: 0, gameOver: true };
};
