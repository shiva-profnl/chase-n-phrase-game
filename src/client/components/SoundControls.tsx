import React, { useState, useEffect } from 'react';
import { audioManager } from '../utils/audioManager';

type SoundControlsProps = {
  currentUserId?: string;
};

export const SoundControls: React.FC<SoundControlsProps> = ({ currentUserId }) => {
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAudio = async () => {
      if (currentUserId) {
        await audioManager.loadUserSettings(currentUserId);
      }
      // Always sync with audio manager's current state after loading
      setSoundEffectsEnabled(audioManager.getSoundEffectsEnabled());
      setIsLoading(false);
    };

    initializeAudio();
  }, [currentUserId]);

  // Force sync state whenever component mounts (including when returning from other pages)
  useEffect(() => {
    if (!isLoading) {
      setSoundEffectsEnabled(audioManager.getSoundEffectsEnabled());
    }
  }, [isLoading]);

  const handleSoundToggle = () => {
    audioManager.toggleSoundEffects();
    // Update local state immediately
    setSoundEffectsEnabled(audioManager.getSoundEffectsEnabled());
    // Play button click sound
    audioManager.playButtonClick();
  };

  if (isLoading) {
    return null; // Don't show controls while loading
  }

  return (
    <div className="absolute bottom-4 right-4 flex gap-2 z-50">
      {/* Sound Effects Toggle */}
      <button
        onClick={handleSoundToggle}
        className={`btn-sound-control ${soundEffectsEnabled ? 'btn-sound-on' : 'btn-sound-off'}`}
        title={soundEffectsEnabled ? 'Sound Effects: ON' : 'Sound Effects: OFF'}
      />
    </div>
  );
};
