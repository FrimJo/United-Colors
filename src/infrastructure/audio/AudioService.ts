import type { AudioPlayer } from 'expo-audio';

type AudioModule = typeof import('expo-audio');

let cachedAudioModule: AudioModule | null | undefined;
let hasWarnedMissingAudio = false;

const loadAudioModule = (): AudioModule | null => {
  if (cachedAudioModule !== undefined) {
    return cachedAudioModule;
  }

  try {
    cachedAudioModule = require('expo-audio') as AudioModule;
  } catch (error) {
    cachedAudioModule = null;
    if (!hasWarnedMissingAudio) {
      hasWarnedMissingAudio = true;
      console.warn('[AudioService] expo-audio unavailable. Sound effects disabled.', error);
    }
  }

  return cachedAudioModule;
};

export class AudioService {
  private blopPlayer: AudioPlayer | null = null;
  private jumpPlayer: AudioPlayer | null = null;
  private loaded = false;

  async preload(): Promise<void> {
    if (this.loaded) {
      return;
    }

    const audioModule = loadAudioModule();
    if (!audioModule) {
      this.loaded = true;
      return;
    }

    await audioModule.setAudioModeAsync({
      shouldPlayInBackground: false,
      playsInSilentMode: true,
    });

    this.blopPlayer = audioModule.createAudioPlayer(require('../../assets/audio/blop.ogg'));
    this.jumpPlayer = audioModule.createAudioPlayer(require('../../assets/audio/jump.ogg'));
    this.loaded = true;
  }

  private async play(player: AudioPlayer | null): Promise<void> {
    if (!player) {
      return;
    }
    try {
      await player.seekTo(0);
    } catch {
      // Some platforms can reject seek before the asset is fully ready.
    }
    player.play();
  }

  async playBlop(): Promise<void> {
    await this.preload();
    await this.play(this.blopPlayer);
  }

  async playJump(): Promise<void> {
    await this.preload();
    await this.play(this.jumpPlayer);
  }

  dispose(): void {
    this.blopPlayer?.remove();
    this.jumpPlayer?.remove();
    this.blopPlayer = null;
    this.jumpPlayer = null;
    this.loaded = false;
  }
}
