import React from 'react';
import type { Symbol } from '../../shared/types/game';
import { SYMBOL_DATA } from '../../shared/utils/gameUtils';

type HUDProps = {
  lives: number;
  score: number;
  symbol: string;
  letters: string[];
};

export const HUD: React.FC<HUDProps> = ({ 
  lives, 
  score, 
  symbol, 
  letters 
}) => {
  return (
    <>
      {/* Main HUD */}
      <div className="absolute top-4 left-4 hud-section text-black z-20">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            {Array(Math.max(0, lives)).fill(0).map((_, i) => (
              <div key={i} className="life-gain"></div>
            ))}
            {Array(Math.max(0, 3 - lives)).fill(0).map((_, i) => (
              <div key={i} className="life-lost"></div>
            ))}
          </span>
          <span className="flex items-center gap-1 score-text">
            <div className="trophy-icon"></div>
            {score}
          </span>
        </div>
      </div>
      
      {/* Letters display - Narrower width, increased height, shows recent letters with front ellipsis */}
      <div className="absolute top-4 right-4 letters-section text-black z-20 w-32 h-20">
        <div className="flex flex-col justify-center h-full">
          <span className="letters-text text-center mb-1">Letters: {letters?.length || 0}</span>
          <div className="letter-display text-center leading-tight">
            {letters && letters.length > 6 ? (
              <span>
                <span className="text-gray-500">...</span>
                {letters.slice(-6).join(" ")}
              </span>
            ) : (
              <span>{letters?.join(" ") || ""}</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
