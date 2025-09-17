import { redis, reddit } from '@devvit/web/server';
import type { PostGameData, PlayRecord } from '../../shared/types/game';

export class PostManager {
  // Get all post IDs (scans Redis for keys)
  static async getAllPostIds(): Promise<string[]> {
    // Use scan to get all keys matching pattern
    let cursor: string | number = 0;
    let postIds: string[] = [];
    do {
      const zScanResponse = await redis.zScan('chase-phrase:posts', cursor, 'COUNT', 100);
      // Use documented properties: cursor and members/items
      cursor = typeof zScanResponse.cursor === 'number' ? zScanResponse.cursor : parseInt(zScanResponse.cursor, 10);
      const results = zScanResponse.members || [];
      for (const entry of results) {
        // entry is [key, score]
        const key = Array.isArray(entry) ? entry[0] : entry;
        if (typeof key === 'string') {
          const match = key.match(/chase-phrase:post:(.*):data/);
          if (match && match[1]) {
            postIds.push(match[1]);
          }
        }
      }
    } while (cursor !== 0);
    return postIds;
  }
  // Redis key patterns
  private static getPostDataKey(postId: string): string {
    return `chase-phrase:post:${postId}:data`;
  }

  private static getPlayRecordKey(postId: string, userId: string): string {
    return `chase-phrase:post:${postId}:play:${userId}`;
  }

  private static getPostPlayersKey(postId: string): string {
    return `chase-phrase:post:${postId}:players`;
  }

  // Store post game data
  static async storePostData(postId: string, gameData: PostGameData): Promise<void> {
  const key = this.getPostDataKey(postId);
  await redis.set(key, JSON.stringify(gameData));
  await redis.expire(key, 86400 * 30); // 30 days TTL
  }

    // Get post game data
  static async getPostData(postId: string): Promise<PostGameData | null> {
    const key = this.getPostDataKey(postId);
    const data = await redis.get(key);
    const result = data ? JSON.parse(data) : null;
    return result;
  }

    // Check if user has played this post
  static async hasUserPlayed(postId: string, userId: string): Promise<boolean> {
    const key = `chase-phrase:post:${postId}:played:${userId}`;
    const played = await redis.get(key);
    return played !== null;
  }

  // Record a user's play
  static async recordUserPlay(postId: string, userId: string, playRecord: PlayRecord): Promise<void> {
    const recordKey = this.getPlayRecordKey(postId, userId);
    const playersKey = this.getPostPlayersKey(postId);
    
    // Store play record
    await redis.set(recordKey, JSON.stringify(playRecord));
    await redis.expire(recordKey, 86400 * 30); // 30 days TTL
    
    // Mark user as having played this post
    const playedKey = `chase-phrase:post:${postId}:played:${userId}`;
    await redis.set(playedKey, "1");
    await redis.expire(playedKey, 86400 * 30);
    
    // Alternative approach: Store players as JSON array
    try {
      const existingPlayersData = await redis.get(playersKey);
      let players: string[] = existingPlayersData ? JSON.parse(existingPlayersData) : [];
      // Add user to players list if not already present
      if (!players.includes(userId)) {
        players.push(userId);
        await redis.set(playersKey, JSON.stringify(players));
        await redis.expire(playersKey, 86400 * 30); // 30 days TTL
      }
    } catch (error) {
      console.error('🗄️ PostManager: Error updating players list:', error);
      // Fallback: just store this user
      await redis.set(playersKey, JSON.stringify([userId]));
      await redis.expire(playersKey, 86400 * 30);
    }
  }

    // Get user's play record
  static async getUserPlayRecord(postId: string, userId: string): Promise<PlayRecord | null> {
    const key = this.getPlayRecordKey(postId, userId);
    const record = await redis.get(key);
    const result = record ? JSON.parse(record) : null;
    return result;
  }

  // Get all players for a post
  static async getPostPlayers(postId: string): Promise<string[]> {
  const key = this.getPostPlayersKey(postId);
  const data = await redis.get(key);
  return data ? JSON.parse(data) : [];
  }

  // Get leaderboard for a post
  static async getPostLeaderboard(postId: string): Promise<PlayRecord[]> {
    const players = await this.getPostPlayers(postId);
    const records: PlayRecord[] = [];
    
    for (const userId of players) {
      const record = await this.getUserPlayRecord(postId, userId);
      if (record) {
        records.push(record);
      }
    }
    
    // Sort by score descending
    return records.sort((a, b) => b.phraserScore - a.phraserScore);
  }

  // Create a new Devvit game post
  static async createGamePost(gameData: PostGameData): Promise<{ postId: string; postUrl: string; postTitle: string }> {
    try {      
      // Validate required fields
      if (!gameData.letters || !Array.isArray(gameData.letters)) {
        throw new Error('Invalid letters data');
      }
      
      if (typeof gameData.chaserScore !== 'number') {
        throw new Error('Invalid chaser score');
      }
      
      if (typeof gameData.chaserDuration !== 'number') {
        throw new Error('Invalid chaser duration');
      }

      // Get username from Reddit API
      let username = 'Someone';
      try {
        const user = await reddit.getCurrentUser();
        if (user?.username) username = user.username;
      } catch (err) {
      }
      const postTitle = `Phraser Game: ${username}'s challenge!`;

      // Get current subreddit name
      const currentSubreddit = await reddit.getCurrentSubreddit();
      const subredditName = currentSubreddit?.name || 'chase_n_phrase_dev';

      // Create a Devvit custom post for Phraser Game
      const post = await reddit.submitCustomPost({
        splash: {
          appDisplayName: 'Chase n\' Phrase',
          backgroundUri: 'phraser-pic.jpg',
          appIconUri: 'chase-n-phrase-pic.jpg',
          heading: 'Phraser Game',
          description: 'Form words from the given letters!',
          buttonLabel: 'Start Phrasing',
          entryUri: 'index.html'
        },
        subredditName: subredditName,
        title: postTitle,
      });

      if (!post || !post.id) {
        throw new Error('Failed to create Devvit post - no post ID returned');
      }

      const postId = post.id;
      
      // Store the game data with the actual Reddit post ID
      await this.storePostData(postId, { ...gameData, postId, gameType: 'phraser' });

      // Use the actual Reddit post URL with mode parameter for Phraser game
      const postUrl = post.url || `https://www.reddit.com/r/${subredditName}/comments/${postId}/`;
      const phraserUrl = postUrl.includes('?') ? `${postUrl}&mode=phraser` : `${postUrl}?mode=phraser`;

      return { postId, postUrl: phraserUrl, postTitle };
    } catch (error) {
      console.error('🔍 PostManager: Error creating game post:', error);
      // Fallback: Store game data for manual post creation
      const fallbackPostId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await this.storePostData(fallbackPostId, { ...gameData, postId: fallbackPostId });
      
      throw new Error(`Failed to create Devvit post. Game data saved with ID: ${fallbackPostId}`);
    }
  }
}