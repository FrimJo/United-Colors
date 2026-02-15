import { DeviceMotion } from 'expo-sensors';
import { DeviceMotionAdapter } from '@/infrastructure/sensors/DeviceMotionAdapter';

jest.mock('expo-sensors', () => ({
  DeviceMotion: {
    setUpdateInterval: jest.fn(),
    addListener: jest.fn(),
  },
}));

type MotionEvent = {
  rotation?: {
    beta?: number;
    gamma?: number;
  };
};

describe('DeviceMotionAdapter', () => {
  let motionListener: ((event: MotionEvent) => void) | null = null;
  const remove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    motionListener = null;
    (DeviceMotion.addListener as jest.Mock).mockImplementation((listener) => {
      motionListener = listener;
      return { remove };
    });
  });

  const emit = (beta: number, gamma: number) => {
    if (!motionListener) {
      throw new Error('listener missing');
    }
    motionListener({ rotation: { beta, gamma } });
  };

  const calibrate = (beta = 0, gamma = 0) => {
    for (let i = 0; i < 30; i += 1) {
      emit(beta, gamma);
    }
  };

  test('does not emit movement during calibration and signals readiness', async () => {
    const adapter = new DeviceMotionAdapter();
    const onSample = jest.fn();
    const onReady = jest.fn();

    await adapter.start(onSample, 1, onReady);
    calibrate(0.2, 0.2);

    expect(onSample).not.toHaveBeenCalled();
    expect(onReady).toHaveBeenCalledWith(true);
  });

  test('applies dead-zone, smoothing, and clamp', async () => {
    const adapter = new DeviceMotionAdapter();
    const onSample = jest.fn();

    await adapter.start(onSample, 1);
    calibrate(0, 0);

    emit(0.01, 0.01);
    expect(onSample).toHaveBeenLastCalledWith(expect.objectContaining({ x: 0, y: 0 }));

    emit(0.4, 0);
    const firstX = (onSample.mock.calls.at(-1)?.[0] as { x: number }).x;
    emit(0.4, 0);
    const secondX = (onSample.mock.calls.at(-1)?.[0] as { x: number }).x;
    expect(firstX).toBeGreaterThan(0);
    expect(secondX).toBeGreaterThan(firstX);
    expect(secondX).toBeLessThan(0.4);

    emit(100, 0);
    const clampedX = (onSample.mock.calls.at(-1)?.[0] as { x: number }).x;
    expect(clampedX).toBe(1);
  });

  test('stop removes subscription and resets readiness', async () => {
    const adapter = new DeviceMotionAdapter();
    const onSample = jest.fn();
    const onReady = jest.fn();

    await adapter.start(onSample, 1, onReady);
    calibrate(0, 0);
    adapter.stop();

    expect(remove).toHaveBeenCalledTimes(1);
    expect(onReady).toHaveBeenLastCalledWith(false);
  });
});
