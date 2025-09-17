import { useState, useCallback } from 'react';
import type { 
  PostGameData, 
  CreatePostResponse, 
  CheckPlayStatusResponse, 
  PlayRecord 
} from '../../shared/types/game';

export function usePostManager() {
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isCheckingPlayStatus, setIsCheckingPlayStatus] = useState(false);
  const [isRecordingPlay, setIsRecordingPlay] = useState(false);

  const createGamePost = useCallback(async (gameData: PostGameData): Promise<CreatePostResponse> => {
    setIsCreatingPost(true);
    try {
      const requestBody = { gameData };
      
      const response = await fetch('/api/create-game-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to create game post');
      }

      return await response.json();
    } catch (error) {
      throw error;
    } finally {
      setIsCreatingPost(false);
    }
  }, []);

  const checkPlayStatus = useCallback(async (postId: string, userId: string): Promise<CheckPlayStatusResponse> => {
    setIsCheckingPlayStatus(true);
    try {
      const response = await fetch('/api/check-play-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId, userId })
      });

      if (!response.ok) {
        throw new Error('Failed to check play status');
      }

      return await response.json();
    } catch (error) {
      throw error;
    } finally {
      setIsCheckingPlayStatus(false);
    }
  }, []);

  // Add skip logic
  const skipToNextUnplayedPost = useCallback(async (userId: string): Promise<{ nextPostId?: string; error?: string }> => {
    setIsCheckingPlayStatus(true);
    try {
      const response = await fetch('/api/check-play-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, skip: "true" })
      });
      if (!response.ok) {
        throw new Error('Failed to skip to next unplayed post');
      }
      return await response.json();
    } catch (error) {
      throw error;
    } finally {
      setIsCheckingPlayStatus(false);
    }
  }, []);

  const recordPlay = useCallback(async (playRecord: PlayRecord): Promise<{ success: boolean; message: string }> => {
    setIsRecordingPlay(true);
    try {
      const response = await fetch('/api/record-play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playRecord)
      });

      if (!response.ok) {
        throw new Error('Failed to record play');
      }

      return await response.json();
    } catch (error) {
      throw error;
    } finally {
      setIsRecordingPlay(false);
    }
  }, []);

  const getPostData = useCallback(async (postId: string): Promise<PostGameData> => {
    try {
      const response = await fetch(`/api/get-post-data?postId=${encodeURIComponent(postId)}`);

      if (!response.ok) {
        throw new Error('Failed to get post data');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }, []);

  const getLeaderboard = useCallback(async (postId: string): Promise<PlayRecord[]> => {
    try {
      const response = await fetch(`/api/leaderboard?postId=${encodeURIComponent(postId)}`);

      if (!response.ok) {
        throw new Error('Failed to get leaderboard');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }, []);

  return {
    createGamePost,
    checkPlayStatus,
    recordPlay,
    getPostData,
    getLeaderboard,
    skipToNextUnplayedPost,
    isCreatingPost,
    isCheckingPlayStatus,
    isRecordingPlay,
  };
}
