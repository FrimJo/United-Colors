import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { DeviceMotion } from 'expo-sensors';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, BackHandler, Platform, useWindowDimensions } from 'react-native';
import { GameSessionOrchestrator } from '@/application/orchestrators/GameSessionOrchestrator';
import type { InputSource } from '@/application/ports/InputSource';
import { useAppFlowStore } from '@/application/stores/appFlowStore';
import { useSettingsStore } from '@/application/stores/settingsStore';
import type { RenderFrame } from '@/domain/types/GameTypes';
import { CompositeInputSource } from '@/infrastructure/input/CompositeInputSource';
import { GyroInputSource } from '@/infrastructure/input/GyroInputSource';
import { NoopInputSource } from '@/infrastructure/input/NoopInputSource';
import { TouchInputSource } from '@/infrastructure/input/TouchInputSource';
import { LocalStorageRepository } from '@/infrastructure/storage/LocalStorageRepository';

const storage = new LocalStorageRepository();
const KEEP_AWAKE_TAG = 'united-colors-game-session';

function createInputSource(motionAvailable: boolean): {
  input: InputSource;
  touch: TouchInputSource | null;
} {
  const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

  if (isDev) {
    const touch = new TouchInputSource();
    const fallback = motionAvailable ? new GyroInputSource() : new NoopInputSource();
    return { input: new CompositeInputSource(touch, fallback), touch };
  }

  return { input: new GyroInputSource(), touch: null };
}

export function useGameViewModel() {
  const { width, height, scale } = useWindowDimensions();
  const { phase, setPhase, score, setScore, highScore, setHighScore } = useAppFlowStore();
  const settings = useSettingsStore();
  const [frame, setFrame] = useState<RenderFrame>({ phase: 'KIOSK', score: 0, dots: [] });
  const [motionAvailable, setMotionAvailable] = useState(true);
  const [sensorReady, setSensorReady] = useState(true);

  const orchestrator = useRef<GameSessionOrchestrator | null>(null);
  const touchSource = useRef<TouchInputSource | null>(null);
  const phaseRef = useRef(phase);
  const frameRef = useRef(frame);
  const onFrameRef = useRef<(frame: RenderFrame) => void>(() => {});
  const dimensionsRef = useRef({ width, height, scale });

  frameRef.current = frame;
  dimensionsRef.current = { width, height, scale };
  onFrameRef.current = (nextFrame) => {
    setFrame(nextFrame);
    setPhase(nextFrame.phase);
    setScore(nextFrame.score);
  };

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      const [savedSettings, savedHigh] = await Promise.all([
        storage.loadSettings(),
        storage.loadHighScore(),
      ]);
      if (!mounted) {
        return;
      }
      settings.hydrate(savedSettings);
      setHighScore(savedHigh);
    };

    hydrate();

    return () => {
      mounted = false;
    };
  }, [setHighScore, settings]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const available = await DeviceMotion.isAvailableAsync();
      if (mounted) {
        setMotionAvailable(available);
      }

      const bounds = dimensionsRef.current;
      const { input, touch } = createInputSource(available);
      touchSource.current = touch;

      orchestrator.current = new GameSessionOrchestrator(
        { width: bounds.width, height: bounds.height, density: bounds.scale },
        (nextFrame) => {
          onFrameRef.current(nextFrame);
        },
        {
          isSoundEnabled: () => useSettingsStore.getState().soundEnabled,
          onSensorReadyChange: (ready) => {
            setSensorReady(ready);
          },
          input,
        },
      );

      await orchestrator.current.startKiosk();
    };

    init();

    return () => {
      mounted = false;
      orchestrator.current?.stop();
      orchestrator.current = null;
      touchSource.current = null;
    };
  }, []);

  useEffect(() => {
    if (orchestrator.current) {
      orchestrator.current.setBounds({ width, height, density: scale });
    }
  }, [width, height, scale]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const isBackground = nextState === 'inactive' || nextState === 'background';
      if (isBackground && phaseRef.current === 'RUNNING') {
        orchestrator.current?.pause();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      const current = phaseRef.current;
      if (current === 'RUNNING' || current === 'PAUSED' || current === 'GAME_OVER') {
        void orchestrator.current?.backToKiosk();
        return true;
      }
      return false;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const keepAwake = phase === 'RUNNING' || phase === 'KIOSK';
    if (keepAwake) {
      void activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    } else {
      void deactivateKeepAwake(KEEP_AWAKE_TAG);
    }

    return () => {
      if (keepAwake) {
        void deactivateKeepAwake(KEEP_AWAKE_TAG);
      }
    };
  }, [phase]);

  useEffect(() => {
    storage
      .saveSettings({
        soundEnabled: settings.soundEnabled,
        gyroSensitivity: settings.gyroSensitivity,
      })
      .catch(console.error);
  }, [settings.gyroSensitivity, settings.soundEnabled]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      storage.saveHighScore(score).catch(console.error);
    }
  }, [highScore, score, setHighScore]);

  const actions = useMemo(
    () => ({
      start: async () => {
        await orchestrator.current?.startGame(settings.gyroSensitivity);
      },
      retry: async () => {
        await orchestrator.current?.startGame(settings.gyroSensitivity);
      },
      pause: () => {
        orchestrator.current?.pause();
      },
      resume: async () => {
        await orchestrator.current?.resume(settings.gyroSensitivity);
      },
      back: async () => {
        await orchestrator.current?.backToKiosk();
      },
    }),
    [settings.gyroSensitivity],
  );

  const onToggleSound = useCallback(() => {
    settings.setSoundEnabled(!settings.soundEnabled);
  }, [settings]);

  // --- Touch handlers for dev mode ---

  const handleTouchInput = useCallback((locationX: number, locationY: number) => {
    const ts = touchSource.current;
    if (!ts) return;
    const f = frameRef.current;
    const player = f.dots.find((d) => d.kind === 'player');
    if (!player) return;
    ts.setPosition(locationX, locationY, player.x, player.y);
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchSource.current?.clearPosition();
  }, []);

  type TouchEvent = {
    nativeEvent: { touches: ReadonlyArray<{ locationX: number; locationY: number }> };
  };

  const devModeTouchHandlers = touchSource.current
    ? {
        onTouchStart: (e: TouchEvent) => {
          const t = e.nativeEvent.touches[0];
          if (t) handleTouchInput(t.locationX, t.locationY);
        },
        onTouchMove: (e: TouchEvent) => {
          const t = e.nativeEvent.touches[0];
          if (t) handleTouchInput(t.locationX, t.locationY);
        },
        onTouchEnd: handleTouchEnd,
        onTouchCancel: handleTouchEnd,
      }
    : undefined;

  return {
    width,
    height,
    phase,
    score,
    highScore,
    frame,
    motionAvailable,
    sensorReady,
    soundEnabled: settings.soundEnabled,
    onToggleSound,
    actions,
    devModeTouchHandlers,
  };
}
