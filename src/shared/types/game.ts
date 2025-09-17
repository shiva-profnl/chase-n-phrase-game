export type Symbol = "rock" | "paper" | "scissors";
export type GamePhase = "menu" | "running" | "game-over";
export type RPSResult = "win" | "draw" | "lose";

export type Obstacle = {
  id: number;
  lane: number;
  position: number;
  symbol: Symbol;
  letter: string;
};

export type GameState = {
  gamePhase: GamePhase;
  playerLane: number;
  playerSymbol: Symbol;
  obstacles: Obstacle[];
  score: number;
  lives: number;
  collectedLetters: string[];
};

export type GameConfig = {
  maxLives: number;
  maxObstacles: number;
  baseSpeed: number;
  speedIncrement: number;
  baseSpawnInterval: number;
  spawnIntervalDecrement: number;
  collisionZone: {
    start: number;
    end: number;
  };
};

export type SymbolData = {
  emoji: string;
  color: string;
  colorHex: number;
};

export type GameStats = {
  finalScore: number;
  lettersCollected: number;
  letters: string[];
  gameDuration: number;
};

// Post creation types
export type PostGameData = {
  letters: string[];
  chaserScore: number;
  chaserDuration: number;
  createdBy: string;
  createdAt: number;
  postId?: string;
  gameType?: string;
};

export type CreatePostRequest = {
  gameData: PostGameData;
};

export type CreatePostResponse = {
  success: boolean;
  postId?: string;
  postUrl?: string;
  message?: string;
  postTitle?: string;
};

// Play tracking types
export type PlayRecord = {
  userId: string;
  postId: string;
  playedAt: number;
  phraserScore: number;
  wordsFormed: string[];
};

export type CheckPlayStatusRequest = {
  postId: string;
  userId: string;
  skip?: string;
};

export type CheckPlayStatusResponse = {
  canPlay: boolean;
  playRecord?: PlayRecord;
};
