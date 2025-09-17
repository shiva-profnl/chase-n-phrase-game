// Leaderboard types for Chase-n-Phrase
export type LeaderboardEntry = {
  userId: string;
  username: string;
  score: number;
  rank: number;
};

export type LeaderboardType = 'chaser' | 'phraser' | 'sharer';
