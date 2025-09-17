import React, { useEffect } from 'react';
import type { Symbol } from '../../shared/types/game';
import { SYMBOL_DATA } from '../../shared/utils/gameUtils';
import { SoundControls } from './SoundControls';
import { audioManager } from '../utils/audioManager';

type GameMenuProps = {
  onStartGame: (symbol: Symbol) => void;
  onShowInstructions: () => void;
  onShowLeaderboard: () => void;
  currentUserId?: string;
};

export const GameMenu: React.FC<GameMenuProps> = ({ onStartGame, onShowInstructions, onShowLeaderboard, currentUserId }) => {
  const handleButtonClick = () => {
    audioManager.playButtonClick();
    // Don't restart music on every button click - only on first interaction
  };

  // Initialize sound effects on component mount
  useEffect(() => {    
    // Load user settings if needed
    if (currentUserId) {
      audioManager.loadUserSettings(currentUserId);
    }
  }, [currentUserId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-screen main-bg text-black p-4">
      <button
        onClick={() => {
          handleButtonClick();
          onShowInstructions();
        }}
        className="btn-how-to-play absolute top-4 right-4"
      />
      <button
        onClick={() => {
          handleButtonClick();
          onShowLeaderboard();
        }}
        className="btn-leaderboard absolute top-4 left-4"
      />
      
      {/* Sound Controls */}
      <SoundControls currentUserId={currentUserId} />
      
      <div>
        <img 
          src="/ui/game-logo.gif" 
          alt="Chase n' Phrase Game Logo"
          className="game-logo mb-4"
        />
        
        <p className="body-text mb-4 text-center">Choose your starting symbol:</p>
        
        {/* Symbol Selection Section - No Background */}
        <div className="p-6 mb-8">
          <div className="flex gap-4 flex-wrap justify-center">
            {(["rock", "paper", "scissors"] as Symbol[]).map((symbol) => (
              <button
                key={symbol}
                onClick={() => {
                  handleButtonClick();
                  onStartGame(symbol);
                }}
                className={`btn-${symbol} transition-all transform hover:scale-105`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
