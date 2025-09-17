import React from 'react';
import type { Symbol } from '../../shared/types/game';
import { SYMBOL_DATA } from '../../shared/utils/gameUtils';

type SpriteProps = {
  symbol: Symbol;
  isPlayer?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
};

export const Sprite: React.FC<SpriteProps> = ({ 
  symbol, 
  isPlayer = false, 
  size = 'medium',
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-16 h-16',
    large: 'w-20 h-20'
  };

  const containerClasses = `
    ${sizeClasses[size]} 
    rounded-lg 
    flex 
    flex-col 
    items-center 
    justify-center 
    transition-all 
    duration-200
    ${className}
  `;

  return (
    <div
      className={containerClasses}
      style={{
        backgroundColor: 'transparent',
        animation: isPlayer ? 'none' : 'spin 2s linear infinite'
      }}
    >
      {/* Using actual PNG sprites */}
      <div className="relative w-full h-full flex items-center justify-center">
        <img 
          src={`/buttons/rps-buttons/${symbol}.png`}
          alt={`${symbol} sprite`}
          className={`game-sprite ${size === 'large' ? 'player-sprite' : 'obstacle-sprite'}`}
        />
      </div>
    </div>
  );
};

// Specialized sprite components for different game elements
export const PlayerSprite: React.FC<{ symbol: Symbol }> = ({ symbol }) => (
  <div className="relative">
    <Sprite symbol={symbol} isPlayer size="large" />
  </div>
);

export const ObstacleSprite: React.FC<{ symbol: Symbol; letter: string }> = ({ symbol, letter }) => (
  <div className="relative">
    <Sprite symbol={symbol} size="medium" />
    <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-lg font-bold text-white bg-transparent px-1">
      {letter}
    </span>
  </div>
);
