import React from 'react';
import { GameArea } from './GameArea';
import { HUD } from './HUD';

interface GameScreenProps {
  gameState: {
    lives: number;
    score: number;
    playerSymbol: string;
    collectedLetters: string[];
    playerLane: number;
    obstacles: any[];
  };
  gameAreaRef: React.RefObject<HTMLDivElement>;
  onLaneChange: (lane: number) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ gameState, gameAreaRef, onLaneChange }) => {
  return (
    <div className="main-bg w-full h-screen relative overflow-hidden">
      <HUD 
        lives={gameState.lives}
        score={gameState.score}
        symbol={gameState.playerSymbol}
        letters={gameState.collectedLetters}
      />
      <GameArea 
        obstacles={gameState.obstacles || []}
        playerLane={gameState.playerLane}
        playerSymbol={gameState.playerSymbol}
        gameAreaRef={gameAreaRef}
        onLaneClick={onLaneChange}
      />
    </div>
  );
};
