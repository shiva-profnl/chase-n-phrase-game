import type { Symbol, RPSResult, SymbolData, GameConfig } from '../types/game';

export const GAME_CONFIG: GameConfig = {
  maxLives: 3,
  maxObstacles: 30,
  baseSpeed: 0.6,
  speedIncrement: 0.04,
  baseSpawnInterval: 2000,
  spawnIntervalDecrement: 45,
  collisionZone: {
    start: 85,
    end: 93
  }
};

export const SYMBOL_DATA: Record<Symbol, SymbolData> = {
  rock: {
    emoji: "🪨",
    color: "#8B7355",
    colorHex: 0x8B7355
  },
  paper: {
    emoji: "📄",
    color: "#F5F5DC",
    colorHex: 0xF5F5DC
  },
  scissors: {
    emoji: "✂️",
    color: "#C0C0C0",
    colorHex: 0xC0C0C0
  }
};

export function resolveRPS(player: Symbol, obstacle: Symbol): RPSResult {
  if (player === obstacle) return "draw";
  if (
    (player === "rock" && obstacle === "scissors") ||
    (player === "scissors" && obstacle === "paper") ||
    (player === "paper" && obstacle === "rock")
  )
    return "win";
  return "lose";
}

export function generateWeightedLetter(): string {
  const vowels = "AEIOU";
  const consonants = "BCDFGHJKLMNPQRSTVWXYZ";
  if (Math.random() < 0.33) {
    return vowels[Math.floor(Math.random() * vowels.length)]!;
  }
  return consonants[Math.floor(Math.random() * consonants.length)]!;
}

export function getUniqueSymbols(): Symbol[] {
  const all: Symbol[] = ["rock", "paper", "scissors"];
  return all.sort(() => Math.random() - 0.5);
}

export function calculateGameSpeed(lettersCollected: number): number {
  // Slow speed until 5 letters, then ramp up gradually by 20 letters
  if (lettersCollected < 5) {
    return GAME_CONFIG.baseSpeed; // Keep base speed until 5 letters
  }
  
  // From 5 to 20 letters, gradually increase speed (reduced by more than 50%)
  const progress = Math.min((lettersCollected - 5) / 15, 1); // 0 to 1 progress from 5 to 20 letters
  const speedMultiplier = 1 + (progress * 1.0); // Scale from 1x to 2x speed (was 3.5x)
  
  return GAME_CONFIG.baseSpeed * speedMultiplier;
}

export function calculateSpawnInterval(score: number): number {
  return Math.max(900, GAME_CONFIG.baseSpawnInterval - score * GAME_CONFIG.spawnIntervalDecrement);
}

export function isCollision(playerLane: number, obstacleLane: number, obstaclePosition: number): boolean {
  return (
    obstacleLane === playerLane &&
    obstaclePosition > GAME_CONFIG.collisionZone.start &&
    obstaclePosition < GAME_CONFIG.collisionZone.end
  );
}

export function calculatePointsEarned(lives: number, maxLives: number): number {
  return lives === maxLives ? 2 : 1;
}
