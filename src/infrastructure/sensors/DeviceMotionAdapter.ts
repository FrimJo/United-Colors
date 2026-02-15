import { DeviceMotion } from 'expo-sensors';
import type { SensorSample } from '@/domain/types/GameTypes';

type Listener = (sample: SensorSample) => void;
type ReadyListener = (ready: boolean) => void;

const CALIBRATION_SAMPLES = 30;
const DEAD_ZONE = 0.02;
const EMA_ALPHA = 0.25;

export class DeviceMotionAdapter {
  private subscription: { remove: () => void } | null = null;
  private calibrationCount = 0;
  private calibrationSumX = 0;
  private calibrationSumY = 0;
  private offsetX = 0;
  private offsetY = 0;
  private smoothedX = 0;
  private smoothedY = 0;
  private readyListener: ReadyListener | null = null;
  private ready = false;

  private setReady(ready: boolean): void {
    if (this.ready === ready) {
      return;
    }
    this.ready = ready;
    this.readyListener?.(ready);
  }

  private resetPipeline(): void {
    this.calibrationCount = 0;
    this.calibrationSumX = 0;
    this.calibrationSumY = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.smoothedX = 0;
    this.smoothedY = 0;
  }

  private withDeadZone(value: number): number {
    return Math.abs(value) < DEAD_ZONE ? 0 : value;
  }

  private clamp(value: number): number {
    return Math.max(-1, Math.min(1, value));
  }

  async start(listener: Listener, sensitivity: number, onReady?: ReadyListener): Promise<void> {
    this.stop();
    this.readyListener = onReady ?? null;
    this.resetPipeline();
    this.setReady(false);

    DeviceMotion.setUpdateInterval(1000 / 30);
    this.subscription = DeviceMotion.addListener((motion) => {
      const rawX = (motion.rotation?.beta ?? 0) * sensitivity;
      const rawY = (motion.rotation?.gamma ?? 0) * sensitivity;

      if (this.calibrationCount < CALIBRATION_SAMPLES) {
        this.calibrationSumX += rawX;
        this.calibrationSumY += rawY;
        this.calibrationCount += 1;

        if (this.calibrationCount === CALIBRATION_SAMPLES) {
          this.offsetX = this.calibrationSumX / CALIBRATION_SAMPLES;
          this.offsetY = this.calibrationSumY / CALIBRATION_SAMPLES;
          this.setReady(true);
        }
        return;
      }

      const calibratedX = this.withDeadZone(rawX - this.offsetX);
      const calibratedY = this.withDeadZone(rawY - this.offsetY);

      this.smoothedX += (calibratedX - this.smoothedX) * EMA_ALPHA;
      this.smoothedY += (calibratedY - this.smoothedY) * EMA_ALPHA;

      listener({
        x: this.clamp(this.smoothedX),
        y: this.clamp(this.smoothedY),
        timestampMs: Date.now(),
      });
    });
  }

  stop(): void {
    this.subscription?.remove();
    this.subscription = null;
    this.setReady(false);
  }
}
