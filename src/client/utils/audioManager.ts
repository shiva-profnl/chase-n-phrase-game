// Audio Manager for Chase n' Phrase Game
// Handles sound effects, background music, and user preferences

export type AudioSettings = {
  soundEffectsEnabled: boolean;
};

class AudioManager {
  private static instance: AudioManager;
  private audioSettings: AudioSettings = {
    soundEffectsEnabled: true
  };
  private backgroundMusic: HTMLAudioElement | null = null;
  private currentUserId: string | null = null;

  // Sound effect audio elements
  private sounds: { [key: string]: HTMLAudioElement } = {};

  private constructor() {
    this.initializeSounds();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private initializeSounds(): void {
    // Initialize all sound effects
    const soundFiles = {
      'chaser-swap-track': '/sounds/chaser-swap-track.m4a',
      'phraser-letter-type': '/sounds/phraser-letter-type.m4a',
      'game-button-click': '/sounds/game-button-click.m4a',
      'point': '/sounds/point.mp3',
      'no-point': '/sounds/no-point.mp3'
    };

    Object.entries(soundFiles).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.volume = 0.7; // Default volume
      
      this.sounds[key] = audio;
    });
  }

  public async loadUserSettings(userId: string): Promise<void> {
    this.currentUserId = userId;
    
    try {
      const response = await fetch('/api/get-audio-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        const settings = await response.json();
        this.audioSettings = {
          soundEffectsEnabled: settings.soundEffectsEnabled ?? true
        };
      } else {
        this.audioSettings = {
          soundEffectsEnabled: true
        };
      }
    } catch (error) {
      console.error('🎵 Failed to load audio settings:', error);
      // Use default settings
      this.audioSettings = {
        soundEffectsEnabled: true
      };
    }

    this.applySettings();
  }

  private attemptMusicStart(attempt: number = 1): void {
    if (!this.backgroundMusic || !this.audioSettings.musicEnabled) return;
    
    const delay = attempt * 200; // 200ms, 400ms, 600ms, etc.
    
    setTimeout(() => {
      this.backgroundMusic!.currentTime = 0;
      this.backgroundMusic!.play().then(() => {
        this.musicStarted = true;
      }).catch((error) => {
        console.error(`🎵 Music start attempt ${attempt} failed:`, error);
        if (attempt < 5) { // Try up to 5 times
          this.attemptMusicStart(attempt + 1);
        }
      });
    }, delay);
  }

  public async saveUserSettings(): Promise<void> {
    if (!this.currentUserId) return;

    try {
      const response = await fetch('/api/save-audio-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.currentUserId,
          ...this.audioSettings
        })
      });
      
      if (!response.ok) {
        console.error('🎵 Failed to save audio settings:', await response.text());
      }
    } catch (error) {
      console.error('🎵 Failed to save audio settings:', error);
    }
  }

  private applySettings(): void {
    // Apply music setting
    if (this.backgroundMusic) {
      if (this.audioSettings.musicEnabled) {
        // Only start music if it hasn't started yet
        if (!this.musicStarted) {
          this.backgroundMusic.currentTime = 0;
          this.backgroundMusic.play().then(() => {
            this.musicStarted = true;
          }).catch(() => {
            // Ignore autoplay restrictions
          });
        }
      } else {
        this.backgroundMusic.pause();
        this.musicStarted = false; // Reset flag when music is disabled
      }
    }
  }

  public playSound(soundName: string): void {
    if (!this.audioSettings.soundEffectsEnabled) return;
    
    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0; // Reset to beginning
      sound.play().catch(() => {
        // Ignore play errors
      });
    }
  }

  public toggleSoundEffects(): void {
    this.audioSettings.soundEffectsEnabled = !this.audioSettings.soundEffectsEnabled;
    this.saveUserSettings();
  }

  public getSoundEffectsEnabled(): boolean {
    return this.audioSettings.soundEffectsEnabled;
  }

  public playButtonClick(): void {
    this.playSound('game-button-click');
  }

  public playLetterType(): void {
    this.playSound('phraser-letter-type');
  }

  public playSwapTrack(): void {
    this.playSound('chaser-swap-track');
  }

  public playPoint(): void {
    this.playSound('point');
  }

  public playNoPoint(): void {
    this.playSound('no-point');
  }
}

export const audioManager = AudioManager.getInstance();
