export type PhraserGameState = "waiting" | "playing" | "game-over";

export type PhraserGameConfig = {
  timeMultiplier: number; // seconds per letter
  gridColumns: number;
  minWordLength: number;
};

export type PhraserGameData = {
  letters: string[];
  timeLimit: number;
  startTime: number;
  endTime?: number;
};

export type PhraserGameStats = {
  score: number;
  wordsFormed: number;
  totalLetters: number;
  timeUsed: number;
  words: string[];
};

export type WordValidationResult = "valid" | "invalid" | "not-valid";

export type WordValidationResponse = {
  result: WordValidationResult;
  message?: string;
};