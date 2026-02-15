import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalStorageRepository } from '@/infrastructure/storage/LocalStorageRepository';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('LocalStorageRepository', () => {
  const repo = new LocalStorageRepository();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('settings roundtrip', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ version: 2, soundEnabled: false, gyroSensitivity: 1.2 }),
    );

    const settings = await repo.loadSettings();
    expect(settings).toEqual({ soundEnabled: false, gyroSensitivity: 1.2 });

    await repo.saveSettings(settings);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'uc:settings:v1',
      JSON.stringify({ version: 2, soundEnabled: false, gyroSensitivity: 1.2 }),
    );
  });

  test('settings fallback for corrupted payload', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('not-json');

    const settings = await repo.loadSettings();
    expect(settings).toEqual({ soundEnabled: true, gyroSensitivity: 1 });
  });

  test('settings fallback for missing fields in legacy payload', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ soundEnabled: false }),
    );

    const settings = await repo.loadSettings();
    expect(settings).toEqual({ soundEnabled: false, gyroSensitivity: 1 });
  });

  test('high score roundtrip', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ version: 2, score: 42 }),
    );
    const score = await repo.loadHighScore();
    expect(score).toBe(42);

    await repo.saveHighScore(43);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'uc:high-score:v1',
      JSON.stringify({ version: 2, score: 43 }),
    );
  });

  test('high score supports legacy primitive payload', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('42');
    const score = await repo.loadHighScore();
    expect(score).toBe(42);
  });

  test('high score fallback for invalid payload', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('{"broken":true}');
    const score = await repo.loadHighScore();
    expect(score).toBe(0);
  });
});
