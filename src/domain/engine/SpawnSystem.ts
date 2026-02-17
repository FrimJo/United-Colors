import { createDot } from '@/domain/entities/Dot';
import { COLOR_SET, RULES } from '@/domain/rules/GameRules';
import type { DotState, RandomProvider, WorldBounds } from '@/domain/types/GameTypes';

const normalize = (x: number, y: number) => {
  const len = Math.sqrt(x * x + y * y) || 1;
  return { x: x / len, y: y / len };
};

export const nextSpawnWait = (timeStep: number, kiosk: boolean): number => {
  if (kiosk) {
    return RULES.SMALL_DOT_CREATE_INTERVAL;
  }
  const percent = Math.min(1, timeStep / RULES.MAX_TIME_DIFFICULTY);
  const interval = RULES.SMALL_DOT_CREATE_INTERVAL * (1 - percent);
  return Math.max(RULES.MIN_SPAWN_INTERVAL, interval);
};

export const spawnSmallDot = (
  id: number,
  timeStep: number,
  bounds: WorldBounds,
  colorCounter: number,
  random: RandomProvider,
): { dot: DotState; nextColorCounter: number } => {
  const size = RULES.SMALL_DOT_SIZE_RATIO * bounds.density;
  const maxX = bounds.width - size;
  const maxY = bounds.height - size;
  let x = Math.ceil(size / 2);
  let y = x;
  let vx = 1;
  let vy = 1;

  const side = random.nextInt(4);
  const halfY = maxY / 2 + size / 2;
  const halfX = maxX / 2 + size / 2;

  switch (side) {
    case 0: {
      y = random.nextFloat() * maxY + size;
      const k = y / halfY - 1;
      vx = Math.abs(k);
      vy = random.nextFloat() - k;
      break;
    }
    case 1: {
      x = Math.floor(maxX + size / 2);
      y = random.nextFloat() * maxY + size;
      const k = y / halfY - 1;
      vx = -Math.abs(k);
      vy = random.nextFloat() - k;
      break;
    }
    case 2: {
      x = random.nextFloat() * maxX + size;
      const k = x / halfX - 1;
      vx = random.nextFloat() - k;
      vy = Math.abs(k);
      break;
    }
    default: {
      x = random.nextFloat() * maxX + size;
      y = Math.floor(maxY + size / 2);
      const k = x / halfX - 1;
      vx = random.nextFloat() - k;
      vy = -Math.abs(k);
      break;
    }
  }

  const dir = normalize(vx, vy);
  const dot = createDot({
    id,
    kind: 'small',
    position: { x, y },
    velocity: dir,
    speed: RULES.SMALL_DOT_SPEED_RATIO * bounds.density,
    radius: size / 2,
    color: colorAt(colorCounter),
    createdStep: timeStep,
  });

  return { dot, nextColorCounter: colorCounter + 1 };
};

export const spawnPointDot = (
  id: number,
  timeStep: number,
  bounds: WorldBounds,
  color: string,
  random: RandomProvider,
  player: DotState,
): DotState => {
  const size = RULES.POINT_DOT_SIZE_RATIO * bounds.density;
  const radius = size / 2;
  const minX = size;
  const maxX = bounds.width - size;
  const minY = size;
  const maxY = bounds.height - size;

  let x = random.nextFloat() * (maxX - minX) + minX;
  let y = random.nextFloat() * (maxY - minY) + minY;

  // Keep legacy behavior where point dots should not spawn on top of player.
  const maxAttempts = 10;
  for (let i = 0; i < maxAttempts; i += 1) {
    const dx = player.position.x - x;
    const dy = player.position.y - y;
    const maxDistance = player.radius + radius;
    if (dx * dx + dy * dy > maxDistance * maxDistance) {
      break;
    }
    x = random.nextFloat() * (maxX - minX) + minX;
    y = random.nextFloat() * (maxY - minY) + minY;
  }

  const dot = createDot({
    id,
    kind: 'point',
    position: { x, y },
    velocity: { x: 0, y: 0 },
    speed: 0,
    radius: 0,
    color,
    createdStep: timeStep,
    value: RULES.POINT_DOT_VALUE,
  });
  dot.baseRadius = radius;
  dot.pulseFrom = radius;
  dot.pulseTo = radius * 0.85;
  dot.pointPhase = 'GROW';
  dot.animationStartStep = timeStep;
  dot.animationDuration = RULES.POINT_DOT_SIZE_ANIMATION_TIME;
  return dot;
};
const colorAt = (index: number): string => COLOR_SET[index % COLOR_SET.length] ?? COLOR_SET[0];
