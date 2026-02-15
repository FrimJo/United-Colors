import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { DeviceMotion } from 'expo-sensors';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, BackHandler, Platform, useWindowDimensions } from 'react-native';
import { GameSessionOrchestrator } from '@/application/orchestrators/GameSessionOrchestrator';
import { useAppFlowStore } from '@/application/stores/appFlowStore';
import { useSettingsStore } from '@/application/stores/settingsStore';
import type { RenderFrame } from '@/domain/types/GameTypes';
import { LocalStorageRepository } from '@/infrastructure/storage/LocalStorageRepository';

const storage = new LocalStorageRepository();
const KEEP_AWAKE_TAG = 'united-colors-game-session';

export function useGameViewModel() {
  const { width, height, scale } = useWindowDimensions();
  const { phase, setPhase, score, setScore, highScore, setHighScore } = useAppFlowStore();
  const settings = useSettingsStore();
  const [frame, setFrame] = useState<RenderFrame>({ phase: 'KIOSK', score: 0, dots: [] });
  const [motionAvailable, setMotionAvailable] = useState(true);
  const [sensorReady, setSensorReady] = useState(true);

  const orchestrator = useRef<GameSessionOrchestrator | null>(null);
  const phaseRef = useRef(phase);

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
    const init = async () => {
      const available = await DeviceMotion.isAvailableAsync();
      setMotionAvailable(available);

      orchestrator.current = new GameSessionOrchestrator(
        { width, height, density: scale },
        (nextFrame) => {
          setFrame(nextFrame);
          setPhase(nextFrame.phase);
          setScore(nextFrame.score);
        },
        {
          isSoundEnabled: () => useSettingsStore.getState().soundEnabled,
          onSensorReadyChange: (ready) => {
            setSensorReady(ready);
          },
        },
      );

      await orchestrator.current.startKiosk();
    };

    init();

    return () => {
      orchestrator.current?.stop();
    };
  }, [height, scale, setPhase, setScore, width]);

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
    storage.saveSettings({
      soundEnabled: settings.soundEnabled,
      gyroSensitivity: settings.gyroSensitivity,
    });
  }, [settings.gyroSensitivity, settings.soundEnabled]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      storage.saveHighScore(score);
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
  };
}
