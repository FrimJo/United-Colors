import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

export class AudioService {
  private blopPlayer: AudioPlayer | null = null;
  private jumpPlayer: AudioPlayer | null = null;
  private loaded = false;

  async preload(): Promise<void> {
    if (this.loaded) {
      return;
    }

    await setAudioModeAsync({
      shouldPlayInBackground: false,
      playsInSilentMode: true,
    });

    this.blopPlayer = createAudioPlayer(require('../../assets/audio/blop.ogg'));
    this.jumpPlayer = createAudioPlayer(require('../../assets/audio/jump.ogg'));
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
