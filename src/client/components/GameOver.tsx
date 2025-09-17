import React from 'react';
import type { GameStats } from '../../shared/types/game';

type GameOverProps = {
  gameStats: GameStats;
  onPlayAgain: () => void;
  onSharePost?: () => void;
};

export const GameOver: React.FC<GameOverProps> = ({ gameStats, onPlayAgain, onSharePost }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-red-900 to-purple-900 text-white p-4">
      <h2 className="text-5xl font-bold mb-4">Game Over!</h2>
      <div className="bg-black bg-opacity-50 p-6 rounded-lg mb-6">
        <p className="text-3xl mb-2">Final Score: {gameStats.finalScore}</p>
        <p className="text-xl mb-4">Letters Collected: {gameStats.lettersCollected}</p>
        <p className="text-lg">Game Duration: {Math.round(gameStats.gameDuration / 1000)}s</p>
      </div>
      <div className="bg-gray-800 p-4 rounded-lg mb-6 max-w-md w-full">
        <p className="text-lg font-semibold mb-2">Your Letters:</p>
        <p className="text-2xl tracking-wider break-all">{gameStats.letters.join(" ")}</p>
      </div>
      <div className="space-y-4">
        <button
          onClick={onPlayAgain}
          className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-lg text-xl transition-all transform hover:scale-105 shadow-lg"
        >
          Play Again
        </button>
  {/* Removed extra Game Over page with close button as requested */}
        {onSharePost && (
          <button
            onClick={onSharePost}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-xl transition-all transform hover:scale-105 shadow-lg"
          >
            📝 Share Letters for Others to Play
          </button>
        )}
      </div>
    </div>
  );
};
