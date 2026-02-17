import { intersects } from '@/domain/engine/Collision';
import { applyCollision } from '@/domain/engine/ScoringSystem';
import { nextSpawnWait, spawnPointDot, spawnSmallDot } from '@/domain/engine/SpawnSystem';
import { createDot } from '@/domain/entities/Dot';
import { COLOR_SET, RULES } from '@/domain/rules/GameRules';
import type {
  DotState,
  EngineEvent,
  EngineStepResult,
  GamePhase,
  RandomProvider,
  RenderFrame,
  SensorSample,
  WorldBounds,
} from '@/domain/types/GameTypes';

interface EngineState {
  phase: GamePhase;
  score: number;
  dots: DotState[];
  player: DotState;
  pointDotId: number | null;
  timeStep: number;
  lastSmallDotStep: number;
  lastPointStep: number;
  nextPointWait: number;
  colorCounter: number;
  kiosk: boolean;
}

const defaultRandomProvider: RandomProvider = {
  nextFloat: () => Math.random(),
  nextInt: (maxExclusive) => Math.floor(Math.random() * maxExclusive),
};

export class GameEngine {
  private state: EngineState;
  private nextId = 1;
  private bounds: WorldBounds;
  private readonly random: RandomProvider;
  private pendingEvents: EngineEvent[] = [];

  constructor(bounds: WorldBounds, randomProvider: RandomProvider = defaultRandomProvider) {
    this.bounds = bounds;
    this.random = randomProvider;
    this.state = this.createInitialState(true);
  }

  private createPlayer(): DotState {
    const color = COLOR_SET[this.random.nextInt(COLOR_SET.length)] ?? COLOR_SET[0];
    return createDot({
      id: this.nextId++,
      kind: 'player',
      position: { x: this.bounds.width / 2, y: this.bounds.height / 2 },
      velocity: { x: 0, y: 0 },
      speed: RULES.PLAYER_DOT_SPEED_RATIO * this.bounds.density,
      radius: (RULES.PLAYER_DOT_SIZE_RATIO * this.bounds.density) / 2,
      color,
      createdStep: 0,
    });
  }

  private computeNextPointWait(): number {
    const interval = this.random.nextInt(RULES.POINT_DOT_TIME_BETWEEN);
    return interval + RULES.POINT_DOT_TIME_BETWEEN / 2;
  }

  private createInitialState(kiosk: boolean): EngineState {
    const player = this.createPlayer();
    return {
      phase: kiosk ? 'KIOSK' : 'RUNNING',
      score: 0,
      dots: kiosk ? [] : [player],
      player,
      pointDotId: null,
      timeStep: 0,
      lastSmallDotStep: 0,
      lastPointStep: 0,
      nextPointWait: this.computeNextPointWait(),
      colorCounter: this.random.nextInt(COLOR_SET.length),
      kiosk,
    };
  }

  private setPhase(phase: GamePhase): void {
    if (this.state.phase === phase) {
      return;
    }
    this.state.phase = phase;
    this.pendingEvents.push({ type: 'PHASE_CHANGED', phase });
  }

  private drainPendingEvents(): EngineEvent[] {
    const events = this.pendingEvents;
    this.pendingEvents = [];
    return events;
  }

  setBounds(bounds: WorldBounds): void {
    this.bounds = bounds;
  }

  start(mode: 'KIOSK' | 'NORMAL'): void {
    this.state = this.createInitialState(mode === 'KIOSK');
    this.pendingEvents.push({ type: 'PHASE_CHANGED', phase: this.state.phase });
  }

  pause(): void {
    if (this.state.phase === 'RUNNING' || this.state.phase === 'KIOSK') {
      this.setPhase('PAUSED');
    }
  }

  resume(): void {
    if (this.state.phase === 'PAUSED') {
      this.setPhase(this.state.kiosk ? 'KIOSK' : 'RUNNING');
    }
  }

  resetToKiosk(): void {
    this.start('KIOSK');
  }

  private isOutside(dot: DotState): { x: boolean; y: boolean } {
    const left = dot.position.x - dot.radius < 0;
    const right = dot.position.x + dot.radius > this.bounds.width;
    const top = dot.position.y - dot.radius < 0;
    const bottom = dot.position.y + dot.radius > this.bounds.height;
    return { x: left || right, y: top || bottom };
  }

  private updatePlayer(input: SensorSample | null): void {
    if (this.state.kiosk || this.state.phase !== 'RUNNING' || !input) {
      return;
    }

    const player = this.state.player;
    const nextX = player.position.x + input.x * player.speed;
    const nextY = player.position.y + input.y * player.speed;

    if (nextX - player.radius >= 0 && nextX + player.radius <= this.bounds.width) {
      player.position.x = nextX;
    }
    if (nextY - player.radius >= 0 && nextY + player.radius <= this.bounds.height) {
      player.position.y = nextY;
    }
  }

  private maybeSpawnSmallDot(): void {
    const wait = nextSpawnWait(this.state.timeStep, this.state.kiosk);
    const kioskUnderLimit = !this.state.kiosk || this.state.dots.length < 10;
    if (
      this.state.timeStep - this.state.lastSmallDotStep > wait &&
      kioskUnderLimit &&
      this.state.dots.length < RULES.DOT_LIMIT
    ) {
      const { dot, nextColorCounter } = spawnSmallDot(
        this.nextId++,
        this.state.timeStep,
        this.bounds,
        this.state.colorCounter,
        this.random,
      );
      this.state.colorCounter = nextColorCounter;
      this.state.lastSmallDotStep = this.state.timeStep;
      this.state.dots.push(dot);
    }
  }

  private maybeSpawnPointDot(events: EngineEvent[]): void {
    if (this.state.kiosk) {
      return;
    }

    const currentPoint = this.state.pointDotId
      ? this.state.dots.find((d) => d.id === this.state.pointDotId)
      : undefined;

    if (!currentPoint) {
      if (this.state.timeStep > this.state.nextPointWait) {
        const dot = spawnPointDot(
          this.nextId++,
          this.state.timeStep,
          this.bounds,
          this.state.player.color,
          this.random,
          this.state.player,
        );
        this.state.pointDotId = dot.id;
        this.state.lastPointStep = this.state.timeStep;
        this.state.nextPointWait = this.state.timeStep + this.computeNextPointWait();
        this.state.dots.push(dot);
        events.push({ type: 'POINT_SPAWNED', dotId: dot.id });
      }
      return;
    }

    if (currentPoint.flagged) {
      if (this.state.timeStep > this.state.nextPointWait) {
        const dot = spawnPointDot(
          this.nextId++,
          this.state.timeStep,
          this.bounds,
          this.state.player.color,
          this.random,
          this.state.player,
        );
        this.state.pointDotId = dot.id;
        this.state.lastPointStep = this.state.timeStep;
        this.state.nextPointWait = this.state.timeStep + this.computeNextPointWait();
        this.state.dots.push(dot);
        events.push({ type: 'POINT_SPAWNED', dotId: dot.id });
      }
      return;
    }

    this.state.lastPointStep = this.state.timeStep;
  }

  private updatePointDotAnimation(dot: DotState): void {
    if (dot.kind !== 'point') {
      return;
    }

    if (
      !dot.flagged &&
      this.state.timeStep - dot.createdStep >= RULES.POINT_DOT_FADE_TIME &&
      dot.pointPhase !== 'SHRINK'
    ) {
      dot.flagged = true;
      dot.pointPhase = 'SHRINK';
      dot.animationStartStep = this.state.timeStep;
      dot.animationDuration = RULES.POINT_DOT_SIZE_ANIMATION_TIME;
      dot.animationFromRadius = dot.radius;
    }

    if (
      dot.pointPhase === 'GROW' &&
      dot.animationStartStep !== undefined &&
      dot.animationDuration !== undefined &&
      dot.baseRadius !== undefined
    ) {
      const elapsed = this.state.timeStep - dot.animationStartStep;
      const percent = Math.max(0, Math.min(1, elapsed / dot.animationDuration));
      dot.radius = dot.baseRadius * percent;
      if (percent >= 1) {
        dot.radius = dot.baseRadius;
        dot.pointPhase = 'PULSE';
        delete dot.animationStartStep;
        delete dot.animationDuration;
        delete dot.animationFromRadius;
      }
      return;
    }

    if (dot.pointPhase === 'PULSE' && dot.pulseFrom !== undefined && dot.pulseTo !== undefined) {
      const value =
        (Math.sin((this.state.timeStep / RULES.POINT_DOT_PULSE_SPEED) % (2 * Math.PI)) + 1) / 2;
      dot.radius = dot.pulseFrom + (dot.pulseTo - dot.pulseFrom) * value;
      return;
    }

    if (
      dot.pointPhase === 'SHRINK' &&
      dot.animationStartStep !== undefined &&
      dot.animationDuration !== undefined
    ) {
      const elapsed = this.state.timeStep - dot.animationStartStep;
      const percent = Math.max(0, Math.min(1, elapsed / dot.animationDuration));
      const fromRadius = dot.animationFromRadius ?? dot.radius;
      dot.radius = fromRadius * (1 - percent);
      if (percent >= 1) {
        dot.radius = 0;
        if (dot.removeAfterStep === undefined) {
          dot.removeAfterStep = this.state.timeStep + 1;
        }
        delete dot.animationStartStep;
        delete dot.animationDuration;
        delete dot.animationFromRadius;
        delete dot.pointPhase;
      }
    }
  }

  private updateDots(): void {
    for (const dot of this.state.dots) {
      if (dot.kind === 'player') {
        continue;
      }

      if (dot.kind === 'small') {
        dot.position.x += dot.velocity.x * dot.speed;
        dot.position.y += dot.velocity.y * dot.speed;
        const outside = this.isOutside(dot);
        if (outside.x) {
          dot.velocity.x *= -1;
        }
        if (outside.y) {
          dot.velocity.y *= -1;
        }
      } else {
        this.updatePointDotAnimation(dot);
      }
    }
  }

  private handleCollisions(events: EngineEvent[]): void {
    if (this.state.kiosk || this.state.phase !== 'RUNNING') {
      return;
    }

    const player = this.state.player;
    for (const dot of this.state.dots) {
      if (dot.id === player.id) {
        continue;
      }
      if (dot.kind !== 'point' && dot.flagged) {
        continue;
      }
      if (!intersects(player, dot.position, dot.radius)) {
        continue;
      }

      const result = applyCollision(player, dot, this.random);

      if (dot.kind === 'point') {
        dot.flagged = true;
        dot.removeAfterStep = this.state.timeStep + 1;
        delete dot.pointPhase;
        delete dot.animationStartStep;
        delete dot.animationDuration;
        delete dot.animationFromRadius;
        dot.radius = 0;
        events.push({ type: 'POINT_CONSUMED', dotId: dot.id });
      } else {
        dot.flagged = true;
        dot.removeAfterStep = this.state.timeStep + 1;
        if (!result.gameOver) {
          events.push({ type: 'DOT_CONSUMED', dotId: dot.id });
        }
      }

      if (result.scoreDelta !== 0) {
        this.state.score += result.scoreDelta;
        events.push({
          type: 'SCORE_CHANGED',
          score: this.state.score,
          delta: result.scoreDelta,
        });
      }

      if (result.gameOver) {
        events.push({ type: 'GAME_OVER' });
        this.state.phase = 'GAME_OVER';
        events.push({ type: 'PHASE_CHANGED', phase: 'GAME_OVER' });
        return;
      }
    }
  }

  private compactDots(): void {
    this.state.dots = this.state.dots.filter((dot) => {
      if (!dot.flagged) {
        return true;
      }
      if (dot.kind === 'point' && dot.removeAfterStep === undefined) {
        return true;
      }
      if (dot.removeAfterStep !== undefined && this.state.timeStep < dot.removeAfterStep) {
        return true;
      }
      return false;
    });

    if (!this.state.kiosk && !this.state.dots.some((d) => d.id === this.state.player.id)) {
      this.state.dots.unshift(this.state.player);
    }

    if (this.state.pointDotId && !this.state.dots.some((d) => d.id === this.state.pointDotId)) {
      this.state.pointDotId = null;
    }
  }

  step(input: SensorSample | null): EngineStepResult {
    const events = this.drainPendingEvents();

    if (this.state.phase === 'PAUSED' || this.state.phase === 'GAME_OVER') {
      return {
        frame: this.snapshot(),
        events,
      };
    }

    this.updatePlayer(input);
    this.maybeSpawnSmallDot();
    this.maybeSpawnPointDot(events);
    this.updateDots();
    this.handleCollisions(events);
    this.compactDots();
    this.state.timeStep += 1;

    return {
      frame: this.snapshot(),
      events,
    };
  }

  snapshot(): RenderFrame {
    return {
      phase: this.state.phase,
      score: this.state.score,
      dots: this.state.dots.map((dot) => ({
        id: String(dot.id),
        kind: dot.kind,
        x: dot.position.x,
        y: dot.position.y,
        radius: dot.radius,
        color: dot.color,
      })),
    };
  }
}
