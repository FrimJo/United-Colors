jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    seekTo: jest.fn(async () => {}),
    play: jest.fn(),
    remove: jest.fn(),
  })),
  setAudioModeAsync: jest.fn(async () => {}),
}));

import { GameSessionOrchestrator } from '@/application/orchestrators/GameSessionOrchestrator';
import type { EngineEvent, RenderFrame } from '@/domain/types/GameTypes';

const bounds = { width: 300, height: 600, density: 2 };

class FakeClock {
  start = jest.fn();
  stop = jest.fn();
  private tick: (() => void) | null = null;

  constructor() {
    this.start.mockImplementation((tick) => {
      this.tick = tick;
    });
  }

  fire(): void {
    this.tick?.();
  }
}

class FakeSensors {
  start = jest.fn();
  stop = jest.fn();

  constructor() {
    this.start.mockImplementation(async (_listener, _sensitivity, onReady) => {
      onReady?.(false);
      onReady?.(true);
    });
  }
}

class FakeAudio {
  preload = jest.fn(async () => {});
  playBlop = jest.fn(async () => {});
  playJump = jest.fn(async () => {});
  dispose = jest.fn();
}

class FakeEngine {
  setBounds = jest.fn();
  start = jest.fn();
  pause = jest.fn();
  resume = jest.fn();
  resetToKiosk = jest.fn();
  snapshot = jest.fn((): RenderFrame => ({ phase: 'KIOSK', score: 0, dots: [] }));
  private events: EngineEvent[] = [];
  private frame: RenderFrame = { phase: 'RUNNING', score: 0, dots: [] };

  setStepResult(frame: RenderFrame, events: EngineEvent[]): void {
    this.frame = frame;
    this.events = events;
  }

  step = jest.fn(() => ({ frame: this.frame, events: this.events }));
}

describe('GameSessionOrchestrator', () => {
  test('routes engine events to audio when sound is enabled', async () => {
    const onFrame = jest.fn();
    const clock = new FakeClock();
    const sensors = new FakeSensors();
    const audio = new FakeAudio();
    const engine = new FakeEngine();
    engine.setStepResult({ phase: 'RUNNING', score: 6, dots: [] }, [
      { type: 'POINT_SPAWNED', dotId: 1 },
      { type: 'DOT_CONSUMED', dotId: 2 },
      { type: 'POINT_CONSUMED', dotId: 3 },
    ]);

    const orchestrator = new GameSessionOrchestrator(bounds, onFrame, {
      clock,
      sensors,
      audio,
      engine,
      isSoundEnabled: () => true,
    });

    await orchestrator.startGame(1);
    clock.fire();

    expect(audio.playJump).toHaveBeenCalledTimes(1);
    expect(audio.playBlop).toHaveBeenCalledTimes(2);
    expect(onFrame).toHaveBeenCalledWith({ phase: 'RUNNING', score: 6, dots: [] });
  });

  test('skips audio when sound is disabled', async () => {
    const onFrame = jest.fn();
    const clock = new FakeClock();
    const sensors = new FakeSensors();
    const audio = new FakeAudio();
    const engine = new FakeEngine();
    engine.setStepResult({ phase: 'RUNNING', score: 5, dots: [] }, [
      { type: 'POINT_SPAWNED', dotId: 1 },
    ]);

    const orchestrator = new GameSessionOrchestrator(bounds, onFrame, {
      clock,
      sensors,
      audio,
      engine,
      isSoundEnabled: () => false,
    });

    await orchestrator.startGame(1);
    clock.fire();

    expect(audio.playJump).not.toHaveBeenCalled();
    expect(audio.playBlop).not.toHaveBeenCalled();
  });

  test('forwards sensor readiness and back-to-kiosk lifecycle', async () => {
    const readiness: boolean[] = [];
    const clock = new FakeClock();
    const sensors = new FakeSensors();
    const audio = new FakeAudio();
    const engine = new FakeEngine();

    const orchestrator = new GameSessionOrchestrator(bounds, jest.fn(), {
      clock,
      sensors,
      audio,
      engine,
      onSensorReadyChange: (ready) => {
        readiness.push(ready);
      },
    });

    await orchestrator.startGame(1);
    orchestrator.pause();
    await orchestrator.backToKiosk();

    expect(engine.pause).toHaveBeenCalledTimes(1);
    expect(engine.resetToKiosk).toHaveBeenCalledTimes(1);
    expect(sensors.stop).toHaveBeenCalledTimes(2);
    expect(readiness).toEqual([false, true, true]);
  });
});
