import React, { useState, useEffect } from "react";
import { useGameLogic } from '../hooks/useGameLogic';
import { useTouchInput } from '../hooks/useTouchInput';
import { GameMenu } from '../components/GameMenu';
import { Instructions } from '../components/Instructions';
import { Leaderboard } from '../components/Leaderboard';
import { GameScreen } from '../components/GameScreen';
import { PhraserGameWrapper } from '../components/PhraserGameWrapper';
import { PostCreation } from '../components/PostCreation';
import { PhraserGame } from '../components/PhraserGame';
import { audioManager } from '../utils/audioManager';
import type { GameStats } from '../../shared/types/game';
import type { PhraserGameStats } from '../../shared/types/phraser';

type GameMode = "chaser" | "phraser" | "post-creation" | "shared-phraser" | "instructions" | "leaderboard";

interface ChaserGameProps {
  currentUserId: string;
  currentUsername: string;
}

const ChaserGame: React.FC<ChaserGameProps> = ({ currentUserId, currentUsername }) => {
  const [gameMode, setGameMode] = useState<GameMode>("chaser");
  const [chaserGameStats, setChaserGameStats] = useState<GameStats | null>(null);
  // @ts-ignore
  const [phraserGameStats, setPhraserGameStats] = useState<PhraserGameStats | null>(null);
  const [sharedPostId, setSharedPostId] = useState<string | null>(null);
  const [uiMessage, setUiMessage] = useState<string>("");

  // Load audio settings for the current user
  useEffect(() => {
    const loadAudioSettings = async () => {
      try {
        await audioManager.loadUserSettings(currentUserId);
      } catch (error) {
        console.error('Error loading audio settings:', error);
      }
    };
    
    loadAudioSettings();
  }, [currentUserId]);

  const {
    gameState,
    startGame,
    resetGame,
    movePlayer,
    movePlayerToLane,
    getGameStats
  } = useGameLogic();

  const gameAreaRef = useTouchInput(movePlayer, gameState.gamePhase === "running") as React.RefObject<HTMLDivElement>;

  // Check if we're loading a shared post (from URL parameters)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('postId');
    const mode = urlParams.get('mode');
    
    // Check if this is a Phraser game (either by mode parameter or by checking the post data)
    if (postId) {
      if (mode === 'phraser') {
        setSharedPostId(postId);
        setGameMode("shared-phraser");
      } else {
        // If no mode parameter, check if this is a Phraser post by calling the server
        const checkGameType = async () => {
          try {
            const response = await fetch(`/api/post-data?postId=${postId}`);
            const data = await response.json();
            
            if (data.gameType === 'phraser') {
              setSharedPostId(postId);
              setGameMode("shared-phraser");
            }
          } catch (err) {
            console.error('Error checking game type:', err);
          }
        };
        checkGameType();
      }
    }
  }, []);


  const handlePostCreated = (postUrl: string) => {
    // Clipboard/copy logic removed. Only display the share link as selectable text after sharing.
    // No clipboard API or setUiMessage for clipboard.
  };

  // Removed unused handleSkipPostCreation

  const handlePhraserGameComplete = (stats: PhraserGameStats) => {
    setPhraserGameStats(stats);
    
    // Show completion message and return to menu
    setTimeout(() => {
      alert(`Great job! You scored ${stats.score} points with ${stats.wordsFormed} words!`);
      handlePlayAgain();
    }, 1000);
  };

  const handleSharedPhraserComplete = (stats: PhraserGameStats) => {
    
    // Show completion and option to play chaser
    setTimeout(() => {
      const playChaser = confirm(`Great job! You scored ${stats.score} points!\n\nWould you like to play the Chaser game to create your own post?`);
      if (playChaser) {
        setSharedPostId(null);
        setGameMode("chaser");
        resetGame();
      }
    }, 1000);
  };

  const handlePlayAgain = () => {
    audioManager.playButtonClick();
    setGameMode("chaser");
    setChaserGameStats(null);
    setPhraserGameStats(null);
    setSharedPostId(null);
    resetGame();
  };

  const handleShowInstructions = () => {
    audioManager.playButtonClick();
    setGameMode("instructions");
  };

  const handleBackFromInstructions = () => {
    audioManager.playButtonClick();
    setGameMode("chaser");
  };

  const handleShowLeaderboard = () => {
    audioManager.playButtonClick();
    setGameMode("leaderboard");
  };

  const handleBackFromLeaderboard = () => {
    audioManager.playButtonClick();
    setGameMode("chaser");
  };

  // Show post creation screen after Chaser game completion
  if (gameMode === "post-creation" && chaserGameStats) {
    return (
      <div className="relative main-bg min-h-screen">
        <PostCreation
          gameStats={chaserGameStats}
          onPostCreated={handlePostCreated}
          onSkip={handlePlayAgain}
          currentUserId={currentUserId}
          currentUsername={currentUsername}
        />
        {uiMessage && (
          <div className="fixed bottom-6 right-6 bg-black bg-opacity-70 text-white px-4 py-2 rounded shadow">
            {uiMessage}
          </div>
        )}
      </div>
    );
  }

  // Show Phraser game when Chaser game is complete (own letters)
  if (gameMode === "phraser" && chaserGameStats) {
    return (
      <PhraserGame
        letters={chaserGameStats.letters}
        onGameComplete={handlePhraserGameComplete}
        currentUserId={currentUserId}
        currentUsername={currentUsername}
      />
    );
  }

  // Show shared Phraser game (from post link)
  if (gameMode === "shared-phraser" && sharedPostId) {
  return (
      <PhraserGameWrapper
        postId={sharedPostId}
        currentUserId={currentUserId}
        currentUsername={currentUsername}
        onGameComplete={handleSharedPhraserComplete}
      />
    );
  }

  // Show instructions (check this first)
  if (gameMode === "instructions") {
    return <Instructions onBack={handleBackFromInstructions} />;
  }

  // Show leaderboard
  if (gameMode === "leaderboard") {
    return <Leaderboard onBack={handleBackFromLeaderboard} currentUserId={currentUserId} />;
  }

  // Show Chaser game screens
  if (gameState.gamePhase === "menu") {
    return <GameMenu onStartGame={startGame} onShowInstructions={handleShowInstructions} onShowLeaderboard={handleShowLeaderboard} currentUserId={currentUserId} />;
  }

  if (gameState.gamePhase === "game-over") {
    const stats = getGameStats();
    if (stats) {
      setChaserGameStats(stats);
      
      // Update leaderboard score
      const updateScore = async () => {
        try {
          const response = await fetch('/api/update-chaser-score', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: currentUserId,
              username: currentUsername,
              score: stats.finalScore
            }),
          });
          
          const responseData = await response.json();
          
          if (!response.ok) {
            console.error('Failed to update chaser score:', responseData);
          }
        } catch (error) {
          console.error('Error updating chaser score:', error);
        }
      };
      
      updateScore();
      setGameMode("post-creation");
    }
  }

  return (
    <GameScreen
      gameState={gameState}
      gameAreaRef={gameAreaRef}
      onLaneChange={movePlayerToLane}
    />
  );
};

export default ChaserGame;