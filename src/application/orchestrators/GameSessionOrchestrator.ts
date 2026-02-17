import type { InputSource } from '@/application/ports/InputSource';
import { GameEngine } from '@/domain/engine/GameEngine';
import type {
  EngineEvent,
  RandomProvider,
  RenderFrame,
  SensorSample,
  WorldBounds,
} from '@/domain/types/GameTypes';
import { AudioService } from '@/infrastructure/audio/AudioService';
import { FrameClock } from '@/infrastructure/clock/FrameClock';
import { GyroInputSource } from '@/infrastructure/input/GyroInputSource';

interface EnginePort {
  setBounds: (bounds: WorldBounds) => void;
  start: (mode: 'KIOSK' | 'NORMAL') => void;
  pause: () => void;
  resume: () => void;
  resetToKiosk: () => void;
  step: (sample: SensorSample | null) => { frame: RenderFrame; events: EngineEvent[] };
  snapshot: () => RenderFrame;
}

interface ClockPort {
  start: (tick: () => void) => void;
  stop: () => void;
}

interface AudioPort {
  preload: () => Promise<void>;
  playBlop: () => Promise<void>;
  playJump: () => Promise<void>;
  dispose: () => void;
}

interface Options {
  isSoundEnabled?: () => boolean;
  onSensorReadyChange?: (ready: boolean) => void;
  randomProvider?: RandomProvider;
  engine?: EnginePort;
  clock?: ClockPort;
  input?: InputSource;
  audio?: AudioPort;
}

export class GameSessionOrchestrator {
  private readonly engine: EnginePort;
  private readonly clock: ClockPort;
  private readonly input: InputSource;
  private readonly audio: AudioPort;
  private readonly onFrame: (frame: RenderFrame) => void;
  private readonly isSoundEnabled: () => boolean;
  private readonly onSensorReadyChange: ((ready: boolean) => void) | undefined;

  constructor(bounds: WorldBounds, onFrame: (frame: RenderFrame) => void, options: Options = {}) {
    this.engine = options.engine ?? new GameEngine(bounds, options.randomProvider);
    this.clock = options.clock ?? new FrameClock();
    this.input = options.input ?? new GyroInputSource();
    this.audio = options.audio ?? new AudioService();
    this.onFrame = onFrame;
    this.isSoundEnabled = options.isSoundEnabled ?? (() => true);
    this.onSensorReadyChange = options.onSensorReadyChange;
  }

  setBounds(bounds: WorldBounds): void {
    this.engine.setBounds(bounds);
  }

  async startKiosk(): Promise<void> {
    this.input.stop();
    this.onSensorReadyChange?.(true);
    await this.audio.preload();
    this.engine.start('KIOSK');
    this.startClock();
  }

  async startGame(gyroSensitivity: number): Promise<void> {
    await this.audio.preload();
    this.engine.start('NORMAL');
    await this.input.start(gyroSensitivity, (ready) => {
      this.onSensorReadyChange?.(ready);
    });
  }

  pause(): void {
    this.engine.pause();
    this.input.stop();
  }

  async resume(gyroSensitivity: number): Promise<void> {
    this.engine.resume();
    await this.input.start(gyroSensitivity, (ready) => {
      this.onSensorReadyChange?.(ready);
    });
  }

  async backToKiosk(): Promise<void> {
    this.input.stop();
    this.onSensorReadyChange?.(true);
    this.engine.resetToKiosk();
  }

  stop(): void {
    this.clock.stop();
    this.input.stop();
    this.audio.dispose();
  }

  snapshot(): RenderFrame {
    return this.engine.snapshot();
  }

  private onEvents(events: EngineEvent[]): void {
    if (!this.isSoundEnabled()) {
      return;
    }

    for (const event of events) {
      if (event.type === 'POINT_SPAWNED') {
        void this.audio.playJump();
      } else if (event.type === 'DOT_CONSUMED' || event.type === 'POINT_CONSUMED') {
        void this.audio.playBlop();
      }
    }
  }

  private startClock(): void {
    this.clock.stop();
    this.clock.start(() => {
      const result = this.engine.step(this.input.getSample());
      this.onEvents(result.events);
      this.onFrame(result.frame);
    });
  }
}
