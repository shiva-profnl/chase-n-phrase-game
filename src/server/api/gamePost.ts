import { reddit } from '@devvit/web/server';
import { PostManager } from '../utils/postManager';
import type { 
  CreatePostRequest, 
  CreatePostResponse, 
  CheckPlayStatusRequest, 
  CheckPlayStatusResponse,
  PlayRecord 
} from '../../shared/types/game';

export async function createGamePostHandler(request: any): Promise<Response> {
  try {
  const { gameData }: CreatePostRequest = request.body;
  if (!gameData) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Invalid game data' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

    // Get current user ID if available, fallback to username
    let currentUserId: string | undefined;
    if (typeof reddit.getCurrentUser === 'function') {
      const user = await reddit.getCurrentUser();
      currentUserId = user?.id || user?.username;
    }
    if (!currentUserId) {
      currentUserId = await reddit.getCurrentUsername();
    }
    if (!currentUserId) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'User not authenticated' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Add user info to game data
    const completeGameData = {
      ...gameData,
      createdBy: currentUserId,
      createdAt: Date.now()
    };

    // Create the Reddit post
    const { postId, postUrl, postTitle } = await PostManager.createGamePost(completeGameData);

    const response: CreatePostResponse = {
      success: true,
      postId,
      postUrl,
      message: 'Game post created successfully!',
      postTitle
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Failed to create game post' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function checkPlayStatusHandler(request: any): Promise<Response> {
  try {    
    const { postId, userId, skip }: CheckPlayStatusRequest = request.body;
        
    if (!userId) {
      return new Response(JSON.stringify({ 
        canPlay: false, 
        hasPlayed: false, 
        message: 'Invalid parameters' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // If skip is requested, find next unplayed post for user
    if (skip === "true") {
      // Scan for next unplayed post for user
      // For demo: assume PostManager.getAllPostIds() returns all postIds
      const allPostIds = await PostManager.getAllPostIds();
      let nextPostId: string | null = null;
      for (const pid of allPostIds) {
        const played = await PostManager.hasUserPlayed(pid, userId);
        if (!played) {
          nextPostId = pid;
          break;
        }
      }
      if (nextPostId) {
        return new Response(JSON.stringify({ nextPostId }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({ error: "No unplayed posts available" }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    if (!postId) {
      return new Response(JSON.stringify({ error: "Missing postId" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const postData = await PostManager.getPostData(postId);
    
    if (!postData) {
      return new Response(JSON.stringify({ 
        canPlay: false, 
        hasPlayed: false, 
        message: 'Post not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has already played
    const playRecord = await PostManager.getUserPlayRecord(postId, userId);
    const hasPlayed = !!playRecord;
    
    let response: CheckPlayStatusResponse;
    if (playRecord) {
      response = {
        canPlay: !hasPlayed,
        playRecord
      };
    } else {
      response = {
        canPlay: !hasPlayed
      };
    }
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('🎮 SERVER: Error in checkPlayStatusHandler:', error);
    return new Response(JSON.stringify({ 
      canPlay: false, 
      hasPlayed: false, 
      message: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function recordPlayHandler(request: any): Promise<Response> {
  try {    
    const playRecord: PlayRecord = request.body;
        
    if (!playRecord.postId || !playRecord.userId) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Invalid play record' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await PostManager.recordUserPlay(playRecord.postId, playRecord.userId, playRecord);
    
    const updatedRecord = await PostManager.getUserPlayRecord(playRecord.postId, playRecord.userId);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Play recorded successfully',
      playRecord: updatedRecord
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('🎮 SERVER: Error in recordPlayHandler:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Failed to record play' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function getPostDataHandler(request: any): Promise<Response> {
  try {    
    const postId = request.query.postId;
    
    if (!postId) {
      return new Response(JSON.stringify({ 
        error: 'Post ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const postData = await PostManager.getPostData(postId);
    
    if (!postData) {
      return new Response(JSON.stringify({ 
        error: 'Post not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify(postData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('🔍 Server: Error in getPostDataHandler:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

