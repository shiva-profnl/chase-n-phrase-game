import type { Request } from 'express';
import { LeaderboardService } from '../service/LeaderboardService';
import { PostManager } from '../utils/postManager';
import { redis } from '@devvit/web/server';

// Get leaderboard data
export async function getLeaderboardHandler(request: any): Promise<Response> {
  try {
    const postId = request.query.postId;
    const type = request.query.type;
    const currentUserId = request.query.currentUserId;
    
    // Log Redis database contents when leaderboard is accessed
    
    try {
      // Get all Redis keys
      const allKeys = await redis.keys('*');
      
      // Log all keys grouped by type
      const keyGroups: { [key: string]: string[] } = {};
      allKeys.forEach(key => {
        const prefix = key.split(':')[0] || 'other';
        if (!keyGroups[prefix]) keyGroups[prefix] = [];
        keyGroups[prefix].push(key);
      });
      
      // Get sorted set data (leaderboards) with detailed info
      const sortedSets = ['chaser_scores', 'phraser_scores', 'sharer_scores'];
      for (const setKey of sortedSets) {
        try {
          // Get all scores in descending order
          await redis.zRange(setKey, 0, -1, { REV: true, WITHSCORES: true });
          
          // Get top 10 scores
          await redis.zRange(setKey, 0, 9, { REV: true, WITHSCORES: true });
          
          // Get bottom 10 scores
          await redis.zRange(setKey, -10, -1, { REV: true, WITHSCORES: true });
          
        } catch (err) {
          console.error(`${setKey}: [Error reading sorted set]`);
        }
      }
      
    } catch (redisError) {
      console.error('Error reading Redis database:', redisError);
    }
    
    // If type is provided, get real leaderboard data
    if (type) {
      const leaderboardService = new LeaderboardService();
      const leaderboardData = await leaderboardService.getLeaderboard(type as any, currentUserId);
      
      return new Response(JSON.stringify({
        success: true,
        data: leaderboardData
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // If postId is provided, get post-specific leaderboard
    if (postId) {
      const leaderboard = await PostManager.getPostLeaderboard(postId);
      
      return new Response(JSON.stringify(leaderboard), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // No type or postId provided, return error
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Either type or postId is required' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in getLeaderboardHandler:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Failed to fetch leaderboard',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Update chaser score
export async function updateChaserScoreHandler(request: any): Promise<Response> {
  try {
    const { userId, username, score } = request.body;
    
    if (!userId || !username || score === undefined) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Missing required fields: userId, username, score' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const leaderboardService = new LeaderboardService();
    await leaderboardService.updateChaserScore(userId, username, score);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in updateChaserScoreHandler:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Failed to update chaser score' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Update phraser score
export async function updatePhraserScoreHandler(request: any): Promise<Response> {
  try {
    const { userId, username, score, words } = request.body;
    
    if (!userId || !username || score === undefined || !words) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Missing required fields: userId, username, score, words' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const leaderboardService = new LeaderboardService();
    await leaderboardService.updatePhraserScore(userId, username, score, words, Date.now());
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in updatePhraserScoreHandler:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Failed to update phraser score' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Update sharer score
export async function updateSharerScoreHandler(request: any): Promise<Response> {
  try {
    const { userId, username } = request.body;
    
    if (!userId || !username) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Missing required fields: userId, username' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const leaderboardService = new LeaderboardService();
    await leaderboardService.updateSharerScore(userId, username);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in updateSharerScoreHandler:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Failed to update sharer score' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

