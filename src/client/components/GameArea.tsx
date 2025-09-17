import React from 'react';
import type { Obstacle, Symbol } from '../../shared/types/game';
import { PlayerSprite, ObstacleSprite } from './Sprite';

type GameAreaProps = {
  obstacles: Obstacle[];
  playerLane: number;
  playerSymbol: Symbol;
  gameAreaRef: React.RefObject<HTMLDivElement>;
  onLaneClick?: (lane: number) => void;
};

export const GameArea: React.FC<GameAreaProps> = ({ 
  obstacles, 
  playerLane, 
  playerSymbol, 
  gameAreaRef,
  onLaneClick
}) => {
  const handleLaneClick = (lane: number) => {
    if (onLaneClick) {
      // Implement smart lane movement logic
      if (lane === playerLane) {
        // If clicking current lane, do nothing
        return;
      }
      
      // If player is in lane 2 (middle), can move to lane 1 or 3
      if (playerLane === 1) {
        if (lane === 0 || lane === 2) {
          onLaneClick(lane);
        }
      }
      // If player is in lane 1 or 3, can move to lane 2
      else if (playerLane === 0 || playerLane === 2) {
        if (lane === 1) {
          onLaneClick(lane);
        }
      }
      
      // Direct movement from lane 1 to 3 or lane 3 to 1
      if ((playerLane === 0 && lane === 2) || (playerLane === 2 && lane === 0)) {
        onLaneClick(lane);
      }
    }
  };

  return (
    <div
      ref={gameAreaRef}
      className="relative h-full w-full max-w-4xl mx-auto"
      style={{ perspective: "1000px" }}
    >
      {/* Lanes */}
      <div className="absolute inset-0 flex">
        {[0, 1, 2].map((lane) => (
          <div
            key={lane}
            className="flex-1 relative border-x border-white border-opacity-20 cursor-pointer game-track"
            onClick={() => handleLaneClick(lane)}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-opacity-10 text-6xl font-bold">
              {lane + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Obstacles */}
      {obstacles?.map((obstacle) => (
        <div
          key={obstacle.id}
          className="absolute transition-transform"
          style={{
            left: `${obstacle.lane * 33.33 + 16.66}%`,
            top: `${obstacle.position}%`,
            transform: "translateX(-50%)",
            zIndex: 10,
          }}
        >
          <ObstacleSprite symbol={obstacle.symbol} letter={obstacle.letter} />
        </div>
      ))}

      {/* Player */}
      <div
        className="absolute transition-all duration-200"
        style={{
          left: `${playerLane * 33.33 + 16.66}%`,
          bottom: "10%",
          transform: "translateX(-50%)",
          zIndex: 25,
        }}
      >
        <div className="relative">
          {/* Player Container - Using PNG sprites */}
          <div className="w-20 h-20 flex items-center justify-center">
            <PlayerSprite symbol={playerSymbol} />
          </div>
        </div>
      </div>
    </div>
  );
};
