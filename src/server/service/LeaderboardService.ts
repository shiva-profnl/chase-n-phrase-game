import { redis } from '@devvit/web/server';
import type { LeaderboardEntry, LeaderboardType, LongestWordEntry, UserBestWord } from '../../shared/types/leaderboard';

export class LeaderboardService {
  readonly keys = {
    chaserScores: 'leaderboard:chaser:scores',
    phraserScores: 'leaderboard:phraser:scores',
    sharerScores: 'leaderboard:sharer:scores',
    userStats: (userId: string) => `user:${userId}:stats`,
  };

  // Update chaser score for a user
  async updateChaserScore(userId: string, username: string, score: number): Promise<void> {
    try {
      const userKey = this.keys.userStats(userId);
      const currentData = await redis.get(userKey);
      
      let userStats = currentData ? JSON.parse(currentData) : { userId, username, chaserScore: 0, chaserGames: 0 };
      
      userStats.chaserScore += score;
      userStats.chaserGames += 1;
      userStats.username = username; // Update username in case it changed
      
      // Save to Redis
      await Promise.all([
        redis.set(userKey, JSON.stringify(userStats)),
        redis.zAdd(this.keys.chaserScores, { score: userStats.chaserScore, member: userId }),
      ]);
    } catch (error) {
      console.error('Error updating chaser score:', error);
      throw error;
    }
  }

  // Update phraser score for a user
  async updatePhraserScore(userId: string, username: string, score: number, words: string[], gameDate: number): Promise<void> {
    try {
      const userKey = this.keys.userStats(userId);
      const currentData = await redis.get(userKey);
      
      let userStats = currentData ? JSON.parse(currentData) : { userId, username, phraserScore: 0, phraserGames: 0 };
      
      userStats.phraserScore += score;
      userStats.phraserGames += 1;
      userStats.username = username;
      
      // Save to Redis
      await Promise.all([
        redis.set(userKey, JSON.stringify(userStats)),
        redis.zAdd(this.keys.phraserScores, { score: userStats.phraserScore, member: userId }),
      ]);
    } catch (error) {
      console.error('Error updating phraser score:', error);
      throw error;
    }
  }

  // Update sharer score (when user shares a phraser game)
  async updateSharerScore(userId: string, username: string): Promise<void> {
    try {
      const userKey = this.keys.userStats(userId);
      const currentData = await redis.get(userKey);
      
      let userStats = currentData ? JSON.parse(currentData) : { userId, username, postsShared: 0 };
      
      userStats.postsShared += 1;
      userStats.username = username;
      
      // Save to Redis
      await Promise.all([
        redis.set(userKey, JSON.stringify(userStats)),
        redis.zAdd(this.keys.sharerScores, { score: userStats.postsShared, member: userId }),
      ]);
    } catch (error) {
      console.error('Error updating sharer score:', error);
      throw error;
    }
  }

  // Get top 10 leaderboard entries
  async getLeaderboard(type: LeaderboardType, currentUserId?: string): Promise<{
    entries: LeaderboardEntry[];
    userRank?: number;
  }> {
    try {
      
      let entries: LeaderboardEntry[] = [];

      switch (type) {
        case 'chaser':
          // Get top 10 scores in descending order (highest first)
          const chaserScores = await redis.zRange(this.keys.chaserScores, 0, 9, { REV: true });
          
          // Also check without REV to see the difference
          const chaserScoresAsc = await redis.zRange(this.keys.chaserScores, 0, 9, { REV: false });
          break;
          
        case 'phraser':
          // Get top 10 scores in descending order (highest first)
          const phraserScores = await redis.zRange(this.keys.phraserScores, 0, 9, { REV: true });
          
          // Also check without REV to see the difference
          const phraserScoresAsc = await redis.zRange(this.keys.phraserScores, 0, 9, { REV: false });
          
          entries = await this.processLeaderboardEntries(phraserScores, 'phraser');
          break;
          
        case 'sharer':
          // Get top 10 scores in descending order (highest first)
          const sharerScores = await redis.zRange(this.keys.sharerScores, 0, 9, { REV: true });
          entries = await this.processLeaderboardEntries(sharerScores, 'sharer');
          break;
      }

      // Sort entries by score descending to ensure proper ordering
      entries.sort((a, b) => b.score - a.score);

      return { entries };
    } catch (error) {
      console.error('Error in getLeaderboard:', error);
      throw error;
    }
  }

  private async processLeaderboardEntries(scores: any[], type: string): Promise<LeaderboardEntry[]> {
    const entries: LeaderboardEntry[] = [];
    
    for (let i = 0; i < scores.length; i++) {
      const scoreData = scores[i];
      // Redis zRange returns an array of [member, score] pairs
      const userId = Array.isArray(scoreData) ? scoreData[0] : scoreData.member;
      const score = Array.isArray(scoreData) ? scoreData[1] : scoreData.score;
            
      const userKey = this.keys.userStats(userId);
      const userData = await redis.get(userKey);
      
      if (userData) {
        const userStats = JSON.parse(userData);
        const entry: LeaderboardEntry = {
          userId,
          username: userStats.username,
          score: parseFloat(score),
          rank: i + 1 // Rank based on position in sorted list (highest score = rank 1)
        };
        
        entries.push(entry);
      }
    }
    
    return entries;
  }
}
