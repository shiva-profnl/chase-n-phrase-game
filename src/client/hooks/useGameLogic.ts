import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameState, GamePhase, Symbol, Obstacle } from '../../shared/types/game';
import { 
  GAME_CONFIG, 
  resolveRPS, 
  generateWeightedLetter, 
  getUniqueSymbols,
  calculateGameSpeed,
  calculateSpawnInterval,
  isCollision,
  calculatePointsEarned
} from '../../shared/utils/gameUtils';
import { audioManager } from '../utils/audioManager';

export function useGameLogic() {
  const [gameState, setGameState] = useState<GameState>({
    gamePhase: "menu",
    playerLane: 1,
    playerSymbol: "rock",
    obstacles: [],
    score: 0,
    lives: GAME_CONFIG.maxLives,
    collectedLetters: []
  });

  const animationRef = useRef<number | null>(null);
  const lastSpawnRef = useRef<number>(0);
  const gameStartTimeRef = useRef<number>(0);
  const hasGameBeenInterruptedRef = useRef<boolean>(false);

  const handleCollision = useCallback((obstacle: Obstacle) => {
    const result = resolveRPS(gameState.playerSymbol, obstacle.symbol);
    
    if (result === "win") {
      const pointsEarned = calculatePointsEarned(gameState.lives, GAME_CONFIG.maxLives);
      // Play point gained sound
      audioManager.playPoint();
      setGameState(prev => ({
        ...prev,
        score: prev.score + pointsEarned,
        collectedLetters: [...prev.collectedLetters, obstacle.letter],
        lives: Math.min(GAME_CONFIG.maxLives, prev.lives + 1),
        playerSymbol: getUniqueSymbols()[0]!,
        obstacles: prev.obstacles.filter(o => o.id !== obstacle.id)
      }));
    } else if (result === "draw") {
      // Play no point sound for draw
      audioManager.playNoPoint();
      setGameState(prev => ({
        ...prev,
        lives: prev.lives - 1,
        collectedLetters: [...prev.collectedLetters, obstacle.letter],
        obstacles: prev.obstacles.filter(o => o.id !== obstacle.id)
      }));
    } else {
      // Play no point sound for loss
      audioManager.playNoPoint();
      setGameState(prev => ({ ...prev, lives: 0 }));
    }
  }, [gameState.playerSymbol, gameState.lives]);

  const startGame = useCallback((symbol: Symbol) => {
    setGameState({
      gamePhase: "running",
      playerLane: 1,
      playerSymbol: symbol,
      obstacles: [],
      score: 0,
      lives: GAME_CONFIG.maxLives,
      collectedLetters: []
    });
    lastSpawnRef.current = -Infinity;
    gameStartTimeRef.current = Date.now();
    hasGameBeenInterruptedRef.current = false;
  }, []);

  const resetGame = useCallback(() => {
    setGameState(prev => ({ ...prev, gamePhase: "menu" }));
  }, []);

  const movePlayer = useCallback((direction: 'left' | 'right') => {
    // Play track switching sound
    audioManager.playSwapTrack();
    
    setGameState(prev => ({
      ...prev,
      playerLane: direction === 'left' 
        ? Math.max(0, prev.playerLane - 1)
        : Math.min(2, prev.playerLane + 1)
    }));
  }, []);

  const movePlayerToLane = useCallback((targetLane: number) => {
    // Play track switching sound
    audioManager.playSwapTrack();
    
    setGameState(prev => ({
      ...prev,
      playerLane: targetLane
    }));
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState.gamePhase !== "running") return;

    const gameLoop = (timestamp: number) => {
      const newSpeed = calculateGameSpeed(gameState.collectedLetters.length);
      const spawnInterval = calculateSpawnInterval(gameState.score);

      // Spawn obstacles
      if (timestamp - lastSpawnRef.current > spawnInterval) {
        lastSpawnRef.current = timestamp;
        const chosenSymbols = getUniqueSymbols();
        const newObstacles: Obstacle[] = [0, 1, 2].map((lane, idx) => ({
          id: Date.now() + lane + Math.random(),
          lane,
          position: -100,
          symbol: chosenSymbols[idx]!,
          letter: generateWeightedLetter(),
        }));
        
        setGameState(prev => ({
          ...prev,
          obstacles: [...prev.obstacles, ...newObstacles].slice(-GAME_CONFIG.maxObstacles)
        }));
      }

      // Move obstacles and check collisions
      setGameState(prev => {
        const moved = prev.obstacles.map(obs => ({
          ...obs,
          position: obs.position + newSpeed,
        }));

        moved.forEach(obs => {
          if (isCollision(prev.playerLane, obs.lane, obs.position)) {
            handleCollision(obs);
          }
        });

        return {
          ...prev,
          obstacles: moved.filter(obs => obs.position < 120)
        };
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState.gamePhase, gameState.playerLane, gameState.score, handleCollision]);

  // Check game over
  useEffect(() => {
    if (gameState.lives <= 0 && gameState.gamePhase === "running") {
      setGameState(prev => ({ ...prev, gamePhase: "game-over" }));
    }
  }, [gameState.lives, gameState.gamePhase]);

  // Handle page unload - save score if game was interrupted
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (gameState.gamePhase === "running" && gameState.score > 0) {
        hasGameBeenInterruptedRef.current = true;
        // Save the current score to localStorage
        const gameData = {
          score: gameState.score,
          lettersCollected: gameState.collectedLetters.length,
          letters: gameState.collectedLetters,
          gameDuration: Date.now() - gameStartTimeRef.current,
          interrupted: true,
          timestamp: Date.now()
        };
        localStorage.setItem('chaser-game-interrupted', JSON.stringify(gameData));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [gameState.gamePhase, gameState.score, gameState.collectedLetters]);

  // Check for interrupted game on component mount
  useEffect(() => {
    const checkInterruptedGame = () => {
      const interruptedData = localStorage.getItem('chaser-game-interrupted');
      if (interruptedData) {
        try {
          const data = JSON.parse(interruptedData);
          // If the interruption was recent (within last 5 minutes), show the score
          if (data.interrupted && Date.now() - data.timestamp < 5 * 60 * 1000) {
            // Clear the interrupted game data
            localStorage.removeItem('chaser-game-interrupted');
            // Set game to menu phase (user will see main menu)
            setGameState(prev => ({ ...prev, gamePhase: "menu" }));
          }
        } catch (e) {
          // Invalid data, remove it
          localStorage.removeItem('chaser-game-interrupted');
        }
      }
    };

    checkInterruptedGame();
  }, []);

  // Input handling
  useEffect(() => {
    if (gameState.gamePhase !== "running") return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") movePlayer('left');
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") movePlayer('right');
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameState.gamePhase, movePlayer]);

  const getGameStats = useCallback(() => {
    if (gameState.gamePhase !== "game-over") return null;
    
    return {
      finalScore: gameState.score,
      lettersCollected: gameState.collectedLetters.length,
      letters: gameState.collectedLetters,
      gameDuration: Date.now() - gameStartTimeRef.current
    };
  }, [gameState]);

  return {
    gameState,
    startGame,
    resetGame,
    movePlayer,
    movePlayerToLane,
    getGameStats
  };
}
