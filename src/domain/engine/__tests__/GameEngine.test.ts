import { GameEngine } from '@/domain/engine/GameEngine';
import { nextSpawnWait } from '@/domain/engine/SpawnSystem';
import { createDot } from '@/domain/entities/Dot';
import { RULES } from '@/domain/rules/GameRules';
import type { RandomProvider } from '@/domain/types/GameTypes';

const bounds = { width: 300, height: 600, density: 2 };

const createRandomProvider = (): RandomProvider => {
  let counter = 0;
  return {
    nextFloat: () => 0.25,
    nextInt: (maxExclusive) => {
      const value = counter % maxExclusive;
      counter += 1;
      return value;
    },
  };
};

describe('GameEngine', () => {
  test('state transitions kiosk -> running -> paused -> running -> kiosk', () => {
    const engine = new GameEngine(bounds, createRandomProvider());

    expect(engine.snapshot().phase).toBe('KIOSK');

    engine.start('NORMAL');
    expect(engine.snapshot().phase).toBe('RUNNING');

    engine.pause();
    expect(engine.snapshot().phase).toBe('PAUSED');

    engine.resume();
    expect(engine.snapshot().phase).toBe('RUNNING');

    engine.resetToKiosk();
    expect(engine.snapshot().phase).toBe('KIOSK');
  });

  test('spawn interval decreases with timestep in normal mode', () => {
    expect(nextSpawnWait(10, false)).toBeGreaterThan(nextSpawnWait(5000, false));
  });

  test('player remains bounded on extreme input', () => {
    const engine = new GameEngine(bounds, createRandomProvider());
    engine.start('NORMAL');
    engine.step(null);

    for (let i = 0; i < 200; i += 1) {
      engine.step({ x: -1000, y: -1000, timestampMs: i });
    }

    const player = engine.snapshot().dots.find((d) => d.kind === 'player');
    if (!player) {
      throw new Error('player dot missing');
    }
    expect(player.x - player.radius).toBeGreaterThanOrEqual(0);
    expect(player.y - player.radius).toBeGreaterThanOrEqual(0);
  });

  test('emits point spawn event once per spawn', () => {
    const engine = new GameEngine(bounds, createRandomProvider());
    engine.start('NORMAL');
    engine.step(null);

    const state = (engine as any).state;
    state.timeStep = 400;
    state.lastPointStep = 0;
    state.pointDotId = null;

    const result = engine.step(null);
    const spawns = result.events.filter((event) => event.type === 'POINT_SPAWNED');
    expect(spawns).toHaveLength(1);
  });

  test('same-color collision emits DOT_CONSUMED then SCORE_CHANGED', () => {
    const engine = new GameEngine(bounds, createRandomProvider());
    engine.start('NORMAL');
    engine.step(null);

    const state = (engine as any).state;
    const player = state.player;
    player.color = '#E91E63';

    state.dots.push(
      createDot({
        id: 999,
        kind: 'small',
        position: { ...player.position },
        velocity: { x: 0, y: 0 },
        speed: 0,
        radius: player.radius,
        color: '#E91E63',
        createdStep: state.timeStep,
      }),
    );

    const result = engine.step(null);
    expect(result.events.map((event) => event.type)).toEqual(['DOT_CONSUMED', 'SCORE_CHANGED']);
    expect(result.frame.score).toBe(1);
  });

  test('point collision emits POINT_CONSUMED then SCORE_CHANGED', () => {
    const engine = new GameEngine(bounds, createRandomProvider());
    engine.start('NORMAL');
    engine.step(null);

    const state = (engine as any).state;
    const player = state.player;

    state.dots.push(
      createDot({
        id: 1000,
        kind: 'point',
        position: { ...player.position },
        velocity: { x: 0, y: 0 },
        speed: 0,
        radius: player.radius,
        color: player.color,
        createdStep: state.timeStep,
        value: RULES.POINT_DOT_VALUE,
      }),
    );

    const result = engine.step(null);
    expect(result.events.map((event) => event.type)).toEqual(['POINT_CONSUMED', 'SCORE_CHANGED']);
    expect(result.frame.score).toBe(5);
  });

  test('wrong-color collision emits GAME_OVER and PHASE_CHANGED in same frame', () => {
    const engine = new GameEngine(bounds, createRandomProvider());
    engine.start('NORMAL');
    engine.step(null);

    const state = (engine as any).state;
    const player = state.player;
    player.color = '#E91E63';

    state.dots.push(
      createDot({
        id: 1001,
        kind: 'small',
        position: { ...player.position },
        velocity: { x: 0, y: 0 },
        speed: 0,
        radius: player.radius,
        color: '#2196F3',
        createdStep: state.timeStep,
      }),
    );

    const result = engine.step(null);
    expect(result.events.map((event) => event.type)).toEqual(['GAME_OVER', 'PHASE_CHANGED']);
    expect(result.frame.phase).toBe('GAME_OVER');
  });

  test('point lifecycle grows, pulses, fades, and removes', () => {
    const engine = new GameEngine(bounds, createRandomProvider());
    engine.start('KIOSK');
    engine.step(null);

    const state = (engine as any).state;
    const point = createDot({
      id: 1002,
      kind: 'point',
      position: { x: 220, y: 420 },
      velocity: { x: 0, y: 0 },
      speed: 0,
      radius: 0,
      color: '#E91E63',
      createdStep: state.timeStep,
      value: RULES.POINT_DOT_VALUE,
    });
    point.baseRadius = 12;
    point.pulseFrom = 12;
    point.pulseTo = 10.2;
    point.pointPhase = 'GROW';
    point.animationStartStep = state.timeStep;
    point.animationDuration = RULES.POINT_DOT_SIZE_ANIMATION_TIME;

    state.dots.push(point);
    state.pointDotId = point.id;

    for (let i = 0; i < RULES.POINT_DOT_SIZE_ANIMATION_TIME + 1; i += 1) {
      engine.step(null);
    }
    expect(point.pointPhase).toBe('PULSE');
    expect(point.radius).toBeGreaterThan(0);

    const maxWaitSteps = RULES.POINT_DOT_FADE_TIME + RULES.POINT_DOT_SIZE_ANIMATION_TIME + 200;
    for (let i = 0; i < maxWaitSteps; i += 1) {
      if (!engine.snapshot().dots.some((dot) => dot.id === String(point.id))) {
        break;
      }
      engine.step(null);
    }

    expect(engine.snapshot().dots.some((dot) => dot.id === String(point.id))).toBe(false);
  });
});
