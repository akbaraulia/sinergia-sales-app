/**
 * Sound Manager for playing audio effects
 * Handles success, error, and other notification sounds
 */

class SoundManager {
  private static instance: SoundManager;
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private isEnabled: boolean = true;
  private volume: number = 0.5;

  private constructor() {
    // Initialize sound files
    this.preloadSounds();
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private preloadSounds() {
    const sounds = {
      success: '/sound/success.mp3',
      error: '/sound/error.mp3'
    };

    Object.entries(sounds).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.volume = this.volume;
      audio.preload = 'auto';
      this.audioCache.set(key, audio);
    });
  }

  public playSuccess() {
    this.playSound('success');
  }

  public playError() {
    this.playSound('error');
  }

  private playSound(soundKey: string) {
    if (!this.isEnabled) return;

    const audio = this.audioCache.get(soundKey);
    if (audio) {
      try {
        // Reset audio to beginning
        audio.currentTime = 0;
        audio.volume = this.volume;
        
        // Play with promise handling for better browser compatibility
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn(`Could not play ${soundKey} sound:`, error);
          });
        }
      } catch (error) {
        console.warn(`Error playing ${soundKey} sound:`, error);
      }
    }
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.audioCache.forEach(audio => {
      audio.volume = this.volume;
    });
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public isAudioEnabled(): boolean {
    return this.isEnabled;
  }
}

export default SoundManager;
