import React, { useState } from 'react';
import { audioManager } from '../utils/audioManager';
import type { GameStats, PostGameData } from '../../shared/types/game';
import { usePostManager } from '../hooks/usePostManager';
// import { SharePopup } from './SharePopup'; // Remove this

type PostCreationProps = {
  gameStats: GameStats;
  onPostCreated: (postUrl: string) => void;
  onSkip: () => void;
  onPlayPhraser?: () => void;
  currentUserId?: string;
  currentUsername?: string;
};

export const PostCreation: React.FC<PostCreationProps> = ({ 
  gameStats, 
  onPostCreated, 
  onSkip,
  onPlayPhraser,
  currentUserId = 'anonymous',
  currentUsername = 'Anonymous'
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const { createGamePost } = usePostManager();

  const handleCreatePost = async () => {
    audioManager.playButtonClick();
    setIsCreating(true);
    setError(null);
    try {
      const gameData: PostGameData = {
        letters: gameStats.letters,
        chaserScore: gameStats.finalScore,
        chaserDuration: gameStats.gameDuration,
        createdBy: currentUserId,
        createdAt: Date.now()
      };
      const result = await createGamePost(gameData);
      if (result.success && result.postUrl) {
        setShareUrl(result.postUrl);
        
        // Update sharer score
        try {
          const response = await fetch('/api/update-sharer-score', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: currentUserId,
              username: currentUsername
            }),
          });
          
          const responseData = await response.json();
          
          if (!response.ok) {
            console.error('Failed to update sharer score:', responseData);
          }
        } catch (error) {
          console.error('Error updating sharer score:', error);
        }
        
        onPostCreated(result.postUrl);
      } else {
        setError(result.message || 'Failed to create post');
      }
    } catch (err) {
      setError('Failed to create post. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSkip = () => {
    audioManager.playButtonClick();
    onSkip();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen main-bg text-white p-4">
      <div className="sub-bg-blue p-8 rounded-lg max-w-md w-full text-center">
        <h2 className="text-3xl font-bold mb-2">Share Your Letters!</h2>
        <div className="mb-2">
          <p className="text-lg mb-2">You collected {gameStats.letters.length} letters:</p>
          <div className="sub-bg-orange p-3 rounded-lg mb-3">
            <p className="text-lg tracking-wider break-all">
              {gameStats.letters.join(' ')}
            </p>
          </div>
          <p className="text-sm text-gray-300">
            Share these letters as a new post for others to form words!
          </p>
        </div>
        <div className="flex gap-4 justify-center p-1">
          <button
            onClick={handleCreatePost}
            disabled={gameStats.letters.length < 10 || isCreating || !!shareUrl}
            className={`${
              shareUrl 
                ? 'btn-share-only-once' 
                : gameStats.letters.length < 10 
                  ? 'btn-share-disabled' 
                  : 'btn-share-enabled'
            }`}
          />
          <button
            onClick={handleSkip}
            disabled={isCreating}
            className="btn-play-again"
          />
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-600 bg-opacity-20 border border-red-500 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}
        {shareUrl && (
          <div className="mt-2 sub-bg-pink p-2 rounded-lg">
            <label className="block text-sm mb-1 text-black">Share this link:</label>
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="w-full p-2 rounded bg-white text-black border border-gray-600 select-all"
              onFocus={e => e.target.select()}
            />
            <p className="text-xs text-black mt-1">Select and copy the link above to share.</p>
          </div>
        )}
      </div>
    </div>
  );
};
