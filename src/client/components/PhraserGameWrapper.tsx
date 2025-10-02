import React, { useState, useEffect, useCallback } from 'react';
import { PhraserGame } from './PhraserGame';
import { usePostManager } from '../hooks/usePostManager';
import { audioManager } from '../utils/audioManager';
import type { PhraserGameStats } from '../../shared/types/phraser';
import type { PostGameData, PlayRecord } from '../../shared/types/game';

type PhraserGameWrapperProps = {
  postId: string;
  currentUserId: string;
  currentUsername?: string;
  onGameComplete?: (stats: PhraserGameStats) => void;
};

export const PhraserGameWrapper: React.FC<PhraserGameWrapperProps> = ({ 
  postId, 
  currentUserId, 
  currentUsername = 'Anonymous',
  onGameComplete 
}) => {
  const [gameData, setGameData] = useState<PostGameData | null>(null);
  const [playStatus, setPlayStatus] = useState<{
    canPlay: boolean;
    hasPlayed?: boolean;
    playRecord?: PlayRecord | undefined;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detect iOS for special handling
  const isIOS = useCallback(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }, []);

  const { 
    getPostData, 
    checkPlayStatus, 
    recordPlay, 
    getLeaderboard 
  } = usePostManager();

  useEffect(() => {
    const initializeGame = async () => {
              // Generate a unique user ID if none provided
        const userId = currentUserId || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          setLoading(true);
          setError(null);
          
          // Add timeout to prevent infinite loading
          const timeoutId = setTimeout(() => {
            setError('Loading timeout - please try again');
            setLoading(false);
          }, 5000); // 5 second timeout
          
          // Fetch post data and play status in parallel
        const [postData, statusData] = await Promise.all([
          getPostData(postId),
          checkPlayStatus(postId, userId)
        ]);
        
                  clearTimeout(timeoutId);
          
          if (!postData) {
            setError('Game post not found');
            setLoading(false);
            return;
          }
          
          const letters: string[] = postData?.letters || [];
          
          setGameData({ ...postData, letters });
          setPlayStatus({
            canPlay: statusData.canPlay,
            hasPlayed: !statusData.canPlay,
            playRecord: statusData.playRecord ?? undefined
          });
          
          // Don't record play immediately - wait until user actually starts the game
          
          setLoading(false);
      } catch (err) {
        setError('Error initializing Phraser game: ' + (err instanceof Error ? err.message : String(err)));
        setLoading(false);
      }
    };
    initializeGame();
  }, [postId, currentUserId, getPostData, checkPlayStatus, recordPlay]);

  const handleGameStart = async () => {
    // Record initial play when user actually starts the game
    if (gameData && currentUserId) {
      const initialPlayRecord: PlayRecord = {
        userId: currentUserId,
        postId: postId,
        playedAt: Date.now(),
        phraserScore: 0,
        wordsFormed: []
      };
      await recordPlay(initialPlayRecord);
    }
  };

  const handleGameComplete = async (stats: PhraserGameStats) => {
    try {
      // Update playRecord with final score and words
      const playRecord: PlayRecord = {
        userId: currentUserId,
        postId: postId,
        playedAt: Date.now(),
        phraserScore: stats.score,
        wordsFormed: stats.words
      };
      const result = await recordPlay(playRecord);
      
      // Update global phraser leaderboard
      try {
        const response = await fetch('/api/update-phraser-score', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: currentUserId,
            username: currentUsername,
            score: stats.score,
            words: stats.words
          }),
        });
        
        if (!response.ok) {
          console.error('Failed to update phraser leaderboard score');
        }
      } catch (error) {
        console.error('Error updating phraser leaderboard score:', error);
      }
      
      setPlayStatus({
        canPlay: false,
        hasPlayed: true,
        playRecord: (result && 'playRecord' in result) ? (result.playRecord as PlayRecord) : playRecord
      });
      if (onGameComplete) {
        onGameComplete(stats);
      }
    } catch (err) {
      setError('Failed to record your score. Please try again.');
    }
  };

  if (loading) {
    return null; // Let the main LoadingScreen component handle the loading display
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen main-bg text-white p-4">
        <div className="sub-bg-blue p-6 rounded-lg text-center">
          <h2 className="page-title text-black mb-4">Error</h2>
          <p className="body-text text-black mb-4">{error}</p>
          <button
            onClick={() => {
              audioManager.playButtonClick();
              window.location.reload();
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!gameData || !playStatus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen main-bg text-white p-4">
        <div className="sub-bg-blue p-6 rounded-lg text-center">
          <h2 className="page-title text-black mb-4">Game Not Found</h2>
          <p className="body-text text-black">This game post could not be found.</p>
        </div>
      </div>
    );
  }

  // Only show 'already played' if canPlay is false AND playRecord is present
  if (!playStatus.canPlay && playStatus.playRecord) {
    // Show results page after game end, not 'already played' message
    return (
      <div className="flex flex-col items-center justify-center min-h-screen main-bg text-white p-4">
        <div className="sub-bg-blue p-8 rounded-lg text-center max-w-xl mx-auto">
          <h1 className="page-title text-black mb-4">Game Over!</h1>
          <p className="body-text text-black mb-2">Your Results:</p>
          <div className="sub-bg-orange p-4 rounded-lg mb-6">
            <p className="body-text text-black flex items-center justify-center gap-2">
              <img src="/game-elements/trophy.png" alt="Trophy" className="trophy-icon" />
              Score: {playStatus.playRecord.phraserScore}
            </p>
            <p className="body-text text-black">Words Formed: {Array.isArray(playStatus.playRecord.wordsFormed) ? playStatus.playRecord.wordsFormed.length : 0}</p>
            <p className="body-text text-black break-all">{Array.isArray(playStatus.playRecord.wordsFormed) ? playStatus.playRecord.wordsFormed.join(", ") : "No words formed."}</p>
          </div>
        </div>
      </div>
    );
  }

  // If user can play, show the game
  if (playStatus.canPlay) {
    return (
      <PhraserGame
        letters={gameData.letters}
        onGameComplete={handleGameComplete}
        onGameStart={handleGameStart}
        currentUserId={currentUserId}
        currentUsername={currentUsername}
      />
    );
  }

  // If canPlay is false but no playRecord, show a message (shouldn't happen, but fallback)
  if (!playStatus.canPlay && !playStatus.playRecord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-yellow-900 to-red-900 text-white p-4">
        <div className="bg-black bg-opacity-50 p-6 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4">You cannot play this post</h2>
          <p className="text-lg">You have not played, but no play record was found. Please contact support or try another post.</p>
        </div>
      </div>
    );
  }

  // Fallback - shouldn't reach here
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-red-900 to-purple-900 text-white p-4">
      <div className="bg-black bg-opacity-50 p-6 rounded-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Unable to Play</h2>
        <p className="text-lg">Something went wrong. Please try again later.</p>
      </div>
    </div>
  );
}

// ...existing code...

// Component to show when user has already played
const AlreadyPlayedScreen: React.FC<{
  gameData: PostGameData;
  playRecord: PlayRecord;
  postId: string;
  currentUserId: string;
  onSkip?: (nextPostId: string) => void;
}> = ({ gameData, playRecord, postId, currentUserId, onSkip }) => {
  const [leaderboard, setLeaderboard] = useState<PlayRecord[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const { getLeaderboard, skipToNextUnplayedPost } = usePostManager();
  const [skipping, setSkipping] = useState(false);
  const [skipError, setSkipError] = useState<string | null>(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await getLeaderboard(postId);
        setLeaderboard(data);
      } catch (err) {
        
      } finally {
        setLoadingLeaderboard(false);
      }
    };
    loadLeaderboard();
  }, [postId, getLeaderboard]);

  const userRank = leaderboard.findIndex(record => record.userId === playRecord.userId) + 1;

  const handleSkip = async () => {
    setSkipping(true);
    setSkipError(null);
    try {
      const result = await skipToNextUnplayedPost(currentUserId);
      if (result && result.nextPostId && onSkip) {
        onSkip(result.nextPostId);
      } else {
        setSkipError('No more unplayed posts available.');
      }
    } catch (err) {
      setSkipError('Failed to skip to next post.');
    } finally {
      setSkipping(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-blue-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-black bg-opacity-30 p-6 rounded-lg mb-6 text-center">
          <h1 className="text-3xl font-bold mb-4">You Already Played!</h1>
          <p className="text-lg mb-2">You can only play each post once.</p>
          <p className="text-sm text-gray-300">Here are your results:</p>
          <button
            className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            onClick={() => {
              audioManager.playButtonClick();
              handleSkip();
            }}
            disabled={skipping}
          >
            {skipping ? 'Skipping...' : 'Skip to Next Unplayed Post'}
          </button>
          {skipError && <p className="text-red-400 mt-2">{skipError}</p>}
        </div>
        {/* User's Results */}
        <div className="bg-black bg-opacity-30 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-bold mb-4">Your Results</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">{playRecord.phraserScore}</p>
              <p className="text-sm text-gray-300">Final Score</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-400">#{userRank || '--'}</p>
              <p className="text-sm text-gray-300">Your Rank</p>
            </div>
          </div>
          {playRecord.wordsFormed.length > 0 && (
            <div>
              <p className="text-lg font-semibold mb-2">Words You Formed:</p>
              <p className="text-lg break-all">{playRecord.wordsFormed.join(', ')}</p>
            </div>
          )}
        </div>
        {/* Original Game Info */}
        <div className="bg-black bg-opacity-30 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-bold mb-4">Original Letters</h2>
          <p className="text-lg mb-2">Created by: {gameData.createdBy}</p>
          <p className="text-lg mb-2">Chaser Score: {gameData.chaserScore}</p>
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-2xl tracking-wider break-all">
              {gameData.letters.join(' ')}
            </p>
          </div>
        </div>
        {/* Leaderboard */}
        <div className="bg-black bg-opacity-30 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
          {loadingLeaderboard ? (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-2">Loading leaderboard...</p>
            </div>
          ) : leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard
                .sort((a, b) => b.phraserScore - a.phraserScore)
                .slice(0, 10)
                .map((record, index) => (
                <div 
                  key={record.userId} 
                  className={`flex justify-between items-center p-3 rounded ${
                    record.userId === playRecord.userId 
                      ? 'bg-yellow-600 bg-opacity-30 border border-yellow-500' 
                      : 'bg-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold">#{index + 1}</span>
                    <span className={record.userId === playRecord.userId ? 'font-bold' : ''}>
                      {record.userId === playRecord.userId ? 'You' : `Player ${record.userId.slice(0, 8)}`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold">{record.phraserScore}</span>
                    <p className="text-xs text-gray-400">{record.wordsFormed.length} words</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400">No other players yet!</p>
          )}
        </div>
      </div>
    </div>
  );
}

