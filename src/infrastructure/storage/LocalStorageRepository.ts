import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameSettings } from '@/domain/types/GameTypes';

const KEY_SETTINGS = 'uc:settings:v1';
const KEY_HIGH_SCORE = 'uc:high-score:v1';
const SETTINGS_SCHEMA_VERSION = 2;
const HIGH_SCORE_SCHEMA_VERSION = 2;

export interface StorageRepository {
  loadSettings(): Promise<GameSettings>;
  saveSettings(settings: GameSettings): Promise<void>;
  loadHighScore(): Promise<number>;
  saveHighScore(score: number): Promise<void>;
}

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  gyroSensitivity: 1,
};

type SettingsPayload = {
  version: number;
  soundEnabled: boolean;
  gyroSensitivity: number;
};

type HighScorePayload = {
  version: number;
  score: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

const parseSensitivity = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;

const parseScore = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;

export class LocalStorageRepository implements StorageRepository {
  async loadSettings(): Promise<GameSettings> {
    const raw = await AsyncStorage.getItem(KEY_SETTINGS);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isRecord(parsed)) {
        return DEFAULT_SETTINGS;
      }

      if (parsed.version === SETTINGS_SCHEMA_VERSION) {
        return {
          soundEnabled: parseBoolean(parsed.soundEnabled, DEFAULT_SETTINGS.soundEnabled),
          gyroSensitivity: parseSensitivity(
            parsed.gyroSensitivity,
            DEFAULT_SETTINGS.gyroSensitivity,
          ),
        };
      }

      return {
        soundEnabled: parseBoolean(parsed.soundEnabled, DEFAULT_SETTINGS.soundEnabled),
        gyroSensitivity: parseSensitivity(parsed.gyroSensitivity, DEFAULT_SETTINGS.gyroSensitivity),
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: GameSettings): Promise<void> {
    const payload: SettingsPayload = {
      version: SETTINGS_SCHEMA_VERSION,
      soundEnabled: settings.soundEnabled,
      gyroSensitivity: settings.gyroSensitivity,
    };
    await AsyncStorage.setItem(KEY_SETTINGS, JSON.stringify(payload));
  }

  async loadHighScore(): Promise<number> {
    const raw = await AsyncStorage.getItem(KEY_HIGH_SCORE);
    if (!raw) {
      return 0;
    }

    const parsedAsNumber = Number.parseInt(raw, 10);
    if (!Number.isNaN(parsedAsNumber)) {
      return parseScore(parsedAsNumber);
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === 'number') {
        return parseScore(parsed);
      }
      if (!isRecord(parsed)) {
        return 0;
      }

      if (parsed.version === HIGH_SCORE_SCHEMA_VERSION) {
        return parseScore(parsed.score);
      }

      return parseScore(parsed.score);
    } catch {
      return 0;
    }
  }

  async saveHighScore(score: number): Promise<void> {
    const payload: HighScorePayload = {
      version: HIGH_SCORE_SCHEMA_VERSION,
      score: parseScore(score),
    };
    await AsyncStorage.setItem(KEY_HIGH_SCORE, JSON.stringify(payload));
  }
}
