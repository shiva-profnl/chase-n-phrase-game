import React, { useState, useEffect, useCallback } from 'react';
import type { PhraserGameState, PhraserGameStats } from '../../shared/types/phraser';
import { 
  PHRASER_CONFIG, 
  calculateTimeLimit, 
  arrangeLettersInGrid, 
  calculateScore,
  validateWord
} from '../../shared/utils/phraserUtils';
import { PhraserInstructions } from './PhraserInstructions';
import { SoundControls } from './SoundControls';
import { audioManager } from '../utils/audioManager';

type PhraserGameProps = {
  letters: string[];
  onGameComplete: (stats: PhraserGameStats) => void;
  onGameStart?: () => void;
  currentUserId?: string;
  currentUsername?: string;
};

export const PhraserGame: React.FC<PhraserGameProps> = ({ letters, onGameComplete, onGameStart, currentUserId = 'anonymous', currentUsername = 'Anonymous' }) => {
  const [gameState, setGameState] = useState<PhraserGameState>("waiting");
  const [availableLetters, setAvailableLetters] = useState<string[]>(letters);
  const [currentWord, setCurrentWord] = useState<string>("");
  const [formedWords, setFormedWords] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [validationMessage, setValidationMessage] = useState<string>("");
  const [isValidating, setIsValidating] = useState(false);
  const [pickedLetterIndices, setPickedLetterIndices] = useState<number[]>([]);
  const [previewTimeLeft, setPreviewTimeLeft] = useState<number>(10); // 10 seconds preview
  const [showInstructions, setShowInstructions] = useState(false);

  const timeLimit = calculateTimeLimit(letters);
  
  // Responsive grid columns based on screen size
  const [gridColumns, setGridColumns] = useState(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width >= 1440) return 6; // Fullscreen: 6 letters
      if (width >= 1024) return 5; // Desktop: 5 letters
      return 4; // Mobile/Tablet: 4 letters
    }
    return 4; // Default fallback
  });

  // Update grid columns on window resize
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        if (width >= 1440) setGridColumns(6);
        else if (width >= 1024) setGridColumns(5);
        else setGridColumns(4);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const letterGrid = arrangeLettersInGrid(availableLetters, gridColumns);

  const startGame = useCallback(() => {
    setGameState("preview");
    setPreviewTimeLeft(10);
    // Call onGameStart callback to record the initial play when user clicks "Show Letters"
    if (onGameStart) {
      onGameStart();
    }
    // Play button click sound
    audioManager.playButtonClick();
  }, [onGameStart]);

  const endGame = useCallback(() => {
    const endTime = Date.now();
    const timeUsed = endTime - startTime;
    
    const stats: PhraserGameStats = {
      score,
      wordsFormed: formedWords.length,
      totalLetters: letters.length,
      timeUsed,
      words: formedWords
    };
    
            // Update leaderboard score
        const updateScore = async () => {
          try {
            const response = await fetch('/api/update-phraser-score', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: currentUserId,
                username: currentUsername,
                score: score,
                words: formedWords
              }),
            });
            
            const responseData = await response.json();
            
            if (!response.ok) {
              console.error('Failed to update phraser score:', responseData);
            }
          } catch (error) {
            console.error('Error updating phraser score:', error);
          }
        };
    
    updateScore();
    setGameState("game-over");
    onGameComplete(stats);
  }, [score, formedWords, letters.length, startTime, onGameComplete]);

  const startActualGame = useCallback(() => {
    setGameState("playing");
    setStartTime(Date.now());
    setTimeLeft(timeLimit);
    // Reset score to zero only when game actually starts
    setScore(0);
  }, [timeLimit]);

  // Preview timer effect
  useEffect(() => {
    if (gameState !== "preview") return;

    const timer = setInterval(() => {
      setPreviewTimeLeft(prev => {
        if (prev <= 1) {
          startActualGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, startActualGame]);

  // Timer effect
  useEffect(() => {
    if (gameState !== "playing" || isValidating) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          endGame();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, endGame, isValidating]);

  const handleLetterClick = useCallback((letter: string, index: number) => {
    if (gameState !== "playing") return;
    
    setCurrentWord(prev => prev + letter);
    setAvailableLetters(prev => {
      const newLetters = [...prev];
      newLetters.splice(index, 1);
      return newLetters;
    });
    setPickedLetterIndices(prev => [...prev, index]);
    // Play letter type sound
    audioManager.playLetterType();
  }, [gameState]);

  const handleSubmitWord = useCallback(async () => {
    if (gameState !== "playing" || currentWord.length < PHRASER_CONFIG.minWordLength) return;
    setIsValidating(true);
    const validation = await validateWord(currentWord);
    setIsValidating(false);
    
    if (validation.result === "valid") {
      const wordScore = calculateScore(currentWord);
      setScore(prev => prev + wordScore);
      setFormedWords(prev => [...prev, currentWord]);
      setCurrentWord("");
      setPickedLetterIndices([]);
      setValidationMessage(`Valid word! +${wordScore} points`);
      setTimeout(() => setValidationMessage(""), 2000);
      // Play point sound for valid word
      audioManager.playPoint();
    } else {
      setValidationMessage(
        validation.result === 'invalid' ? 'INVALID WORD!' : `Not valid${validation.message ? `: ${validation.message}` : ''}`
      );
      // Restore letters by adding them back to the end of availableLetters
      setAvailableLetters(prev => [...prev, ...currentWord.split('')]);
      setCurrentWord("");
      setPickedLetterIndices([]);
      setTimeout(() => setValidationMessage(""), 2000);
      // Play no point sound for invalid word
      audioManager.playNoPoint();
    }
  }, [gameState, currentWord]);

  const handleClearWord = useCallback(() => {
    if (gameState !== "playing") return;
    
    // Return letters by adding them back to the end of availableLetters
    setAvailableLetters(prev => [...prev, ...currentWord.split('')]);
    setCurrentWord("");
    setPickedLetterIndices([]);
    // Play button click sound
    audioManager.playButtonClick();
  }, [gameState, currentWord]);

  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showInstructions) {
    return <PhraserInstructions onBack={() => setShowInstructions(false)} />;
  }

  if (gameState === "waiting") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen main-bg text-white p-4">
        <button
          onClick={() => {
            audioManager.playButtonClick();
            setShowInstructions(true);
          }}
          className="btn-how-to-play absolute top-4 right-4"
        />
        
        {/* Sound Controls */}
        <SoundControls currentUserId={currentUserId} />
        
        <img src="/ui/game-logo.gif" alt="Chase n' Phrase Game Logo" className="game-logo mb-4" />
        <div className="sub-bg-blue p-6 rounded-lg mb-6 max-w-md">
          <p className="body-text mb-2 text-black">Letters to form words:</p>
          <p className="letters-text tracking-wider break-all text-black">{letters.length} letters</p>
        </div>
        <button
          onClick={startGame}
          className="btn-show-letters"
        />
        {showInstructions && (
          <PhraserInstructions onBack={() => setShowInstructions(false)} />
        )}
      </div>
    );
  }

  if (gameState === "preview") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen main-bg text-white p-4">
        <h1 className="page-title mb-6">Study Your Letters</h1>
        <div className="sub-bg-orange p-6 rounded-lg mb-6 max-w-md">
          <p className="body-text mb-2">Letters to form words:</p>
          <p className="section-title tracking-wider break-all non-copiable">{letters.join(" ")}</p>
          <p className="small-text mt-4">Time remaining: {previewTimeLeft} seconds</p>
        </div>
        <div className="text-center">
          <p className="body-text mb-4">Think of words you can form!</p>
          <button
            onClick={() => {
              audioManager.playButtonClick();
              startActualGame();
            }}
            className="btn-start-game"
          />
        </div>
      </div>
    );
  }

  // Main game UI for 'playing' state
  return (
    <div className="h-screen w-screen main-bg flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Top Bar - Score/Time and End Game Button */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start flex-wrap gap-2">
        <p className="score-text font-bold flex items-center gap-2 text-black">
          <div className="trophy-icon"></div>
          Score: {score} | Time: {formatTime(timeLeft)}
        </p>
        <button
          onClick={() => {
            endGame();
            audioManager.playButtonClick();
          }}
          className="btn-end-game-large"
        />
      </div>
      
      {/* Formed Words - Dynamic and responsive */}
      <div className="absolute top-20 left-4 z-10 sub-bg-pink p-2 rounded-lg w-responsive max-w-md min-h-12 max-h-16">
        <div className="overflow-hidden">
          <p className="text-responsive-content text-white leading-tight">
            <span className="text-gray-300">Words Formed: </span>
            <span className="break-words">{formedWords.length > 0 ? formedWords.join(", ") : ""}</span>
          </p>
        </div>
      </div>
      
      {/* Current Word - Positioned to never collide with Words Formed */}
      <div className="sub-bg-blue p-2 rounded-lg mb-3 mt-responsive">
        <p className="text-responsive-title mb-1 text-black">Current Word:</p>
        <div className="flex items-center gap-3">
          <p className="letter-display text-black min-w-8">{currentWord}</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                audioManager.playButtonClick();
                handleSubmitWord();
              }}
              disabled={currentWord.length < PHRASER_CONFIG.minWordLength}
              className={`${currentWord.length < PHRASER_CONFIG.minWordLength ? 'btn-submit-disabled' : 'btn-submit-enabled'}`}
            />
            <button
              onClick={handleClearWord}
              disabled={currentWord.length === 0}
              className={`${currentWord.length === 0 ? 'btn-clear-disabled' : 'btn-clear-enabled'}`}
            />
          </div>
        </div>
        {/* Validation message with fixed height to prevent layout shift */}
        <div className="mt-1 h-5">
          {validationMessage && (
            <p className={`text-base ${validationMessage.includes("INVALID") ? "text-red-400" : "text-green-400"}`}>
              {validationMessage}
            </p>
          )}
        </div>
      </div>
      
      {/* Letter Grid */}
      <div className="sub-bg-orange p-3 rounded-lg mb-4">
        <p className="text-responsive-title mb-2">Available Letters:</p>
        <div className="max-h-48 overflow-y-auto">
          <div className={`grid gap-2 grid-cols-4 sm:grid-cols-5 lg:grid-cols-6`}>
            {letterGrid.map((row, rowIndex) => (
              row.slice(0, 12).map((letter, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleLetterClick(letter, rowIndex * gridColumns + colIndex)}
                  className="btn-letterbox font-bold transition-colors shadow-lg text-responsive"
                >
                  {letter}
                </button>
              ))
            ))}
            {letterGrid.some(row => row.length > 12) && (
              <div className="col-span-full text-xs text-gray-500 text-center">
                +{letterGrid.reduce((total, row) => total + Math.max(0, row.length - 12), 0)} more letters
              </div>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
};
