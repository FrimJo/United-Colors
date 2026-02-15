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
import { DeviceMotionAdapter } from '@/infrastructure/sensors/DeviceMotionAdapter';

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

interface SensorPort {
  start: (
    listener: (sample: SensorSample) => void,
    sensitivity: number,
    onReady?: (ready: boolean) => void,
  ) => Promise<void>;
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
  sensors?: SensorPort;
  audio?: AudioPort;
}

export class GameSessionOrchestrator {
  private readonly engine: EnginePort;
  private readonly clock: ClockPort;
  private readonly sensors: SensorPort;
  private readonly audio: AudioPort;
  private readonly onFrame: (frame: RenderFrame) => void;
  private readonly isSoundEnabled: () => boolean;
  private readonly onSensorReadyChange: ((ready: boolean) => void) | undefined;
  private sample: SensorSample | null = null;

  constructor(bounds: WorldBounds, onFrame: (frame: RenderFrame) => void, options: Options = {}) {
    this.engine = options.engine ?? new GameEngine(bounds, options.randomProvider);
    this.clock = options.clock ?? new FrameClock();
    this.sensors = options.sensors ?? new DeviceMotionAdapter();
    this.audio = options.audio ?? new AudioService();
    this.onFrame = onFrame;
    this.isSoundEnabled = options.isSoundEnabled ?? (() => true);
    this.onSensorReadyChange = options.onSensorReadyChange;
  }

  setBounds(bounds: WorldBounds): void {
    this.engine.setBounds(bounds);
  }

  async startKiosk(): Promise<void> {
    this.sample = null;
    this.sensors.stop();
    this.onSensorReadyChange?.(true);
    await this.audio.preload();
    this.engine.start('KIOSK');
    this.startClock();
  }

  async startGame(gyroSensitivity: number): Promise<void> {
    this.sample = null;
    await this.audio.preload();
    this.engine.start('NORMAL');
    await this.sensors.start(
      (sample) => {
        this.sample = sample;
      },
      gyroSensitivity,
      (ready) => {
        this.onSensorReadyChange?.(ready);
      },
    );
    this.startClock();
  }

  pause(): void {
    this.engine.pause();
    this.sensors.stop();
  }

  async resume(gyroSensitivity: number): Promise<void> {
    this.engine.resume();
    await this.sensors.start(
      (sample) => {
        this.sample = sample;
      },
      gyroSensitivity,
      (ready) => {
        this.onSensorReadyChange?.(ready);
      },
    );
  }

  async backToKiosk(): Promise<void> {
    this.sample = null;
    this.sensors.stop();
    this.onSensorReadyChange?.(true);
    this.engine.resetToKiosk();
  }

  stop(): void {
    this.clock.stop();
    this.sensors.stop();
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
      const result = this.engine.step(this.sample);
      this.onEvents(result.events);
      this.onFrame(result.frame);
    });
  }
}
