import { FrameClock } from '@/infrastructure/clock/FrameClock';

describe('FrameClock', () => {
  let rafCallback: ((time: number) => void) | null = null;
  let rafId = 0;

  beforeEach(() => {
    rafCallback = null;
    rafId = 0;
    jest
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((cb: (time: number) => void) => {
        rafCallback = cb;
        rafId += 1;
        return rafId;
      });
    jest.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const runFrame = (time: number): void => {
    if (rafCallback) {
      rafCallback(time);
    }
  };

  test('reset accumulator on start so stop-then-start does not burst ticks', () => {
    const clock = new FrameClock();
    let tickCount = 0;
    clock.start(() => {
      tickCount += 1;
    });

    runFrame(100);
    runFrame(200);

    const ticksAfterRun = tickCount;
    expect(ticksAfterRun).toBeGreaterThan(0);

    clock.stop();
    tickCount = 0;
    clock.start(() => {
      tickCount += 1;
    });

    runFrame(300);
    runFrame(300 + 20);

    expect(tickCount).toBeLessThanOrEqual(1);
  });

  test('caps accumulator to prevent runaway catch-up', () => {
    const clock = new FrameClock();
    let tickCount = 0;
    clock.start(() => {
      tickCount += 1;
    });

    runFrame(0);
    const maxTicksPerFrame = 4;
    runFrame(100000);

    expect(tickCount).toBeLessThanOrEqual(maxTicksPerFrame);
  });
});
