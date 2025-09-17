import express from 'express';
import { InitResponse, IncrementResponse, DecrementResponse } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { addWordToCustomTrie, removeWordFromCustomTrie, isValidWord } from '@shiva.710_/valid-words-lib';
import { isBadWord } from '@shiva.710_/bad-words-lib';
import { customTrie } from './utils/customTrie';
import { createPost } from './core/post';
import { validateWordHandler } from './api/validateWord';
import { 
  createGamePostHandler, 
  checkPlayStatusHandler, 
  recordPlayHandler, 
  getPostDataHandler
} from './api/gamePost';
import {
  getLeaderboardHandler,
  updateChaserScoreHandler,
  updatePhraserScoreHandler,
  updateSharerScoreHandler
} from './api/leaderboard';
import { LeaderboardService } from './service/LeaderboardService';
import {
  getAudioSettingsHandler,
  saveAudioSettingsHandler
} from './api/audioSettings';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

// Add logging middleware to catch all requests
router.use((req, res, next) => {
  next();
});

// Endpoint to get post data for frontend
router.get('/api/get-post-data', async (req, res): Promise<void> => {
  try {
    const response = await getPostDataHandler(req as unknown as Request);
    const data = await response.json();
    res.status(response.status).json(data);
        } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
});

// Endpoint to get current user ID and username
router.get('/api/currentUserId', async (_req, res) => {
  let userId: string | undefined;
  let username: string | undefined;
  
  if (typeof reddit.getCurrentUser === 'function') {
    const user = await reddit.getCurrentUser();
    userId = user?.id || user?.username;
    username = user?.username;
  }
  if (!userId) {
    userId = await reddit.getCurrentUsername();
    username = userId; // Use the username as both ID and username
  }
  if (!userId) {
    res.status(401).json({ userId: "", username: "" });
    return;
  }
  res.json({ userId, username });
});

router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    // Extract postId from context or request query
    const postId = (typeof context.postId === 'string' ? context.postId : undefined) ||
                   (typeof _req.query.postId === 'string' ? _req.query.postId : undefined);
    let type = (typeof _req.query.type === 'string' ? _req.query.type : undefined);

    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    // If postId is present, try to fetch post data from Redis to get gameType
    let gameType = type;
          try {
        const redisKey = `chase-phrase:post:${postId}:data`;
        const postDataRaw = await redis.get(redisKey);
        if (postDataRaw) {
          const postData = JSON.parse(postDataRaw);
          if (postData.gameType) {
            gameType = postData.gameType;
          }
        }
      } catch (err) {
        // Error fetching post data for gameType detection
      }

      if (!gameType || (gameType !== 'chaser' && gameType !== 'phraser')) {
        // fallback to type param or default to chaser
        gameType = type || "chaser";
      }

    try {
      res.json({
        type: "init",
        count: 0,
        username: "",
        postId: postId,
        gameType: gameType ?? "chaser"
      });
    } catch (error) {
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(500).json({
        status: 'error',
        message: errorMessage,
      });
    }
  }
);

router.post<{ postId: string }, IncrementResponse | { status: string; message: string }, unknown>(
  '/api/increment',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', 1),
      postId,
      type: 'increment',
    });
  }
);

router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
  '/api/decrement',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', -1),
      postId,
      type: 'decrement',
    });
  }
);

// Word validation endpoint for Phraser game
router.post('/api/validate-word', async (req, res): Promise<void> => {
  try {
    const response = await validateWordHandler(req as unknown as Request);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Game post management endpoints
router.post('/api/create-game-post', async (req, res): Promise<void> => {
  try {
    const response = await createGamePostHandler(req as unknown as Request);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/check-play-status', async (req, res): Promise<void> => {
  try {
    const response = await checkPlayStatusHandler(req as unknown as Request);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/record-play', async (req, res): Promise<void> => {
  try {
    const response = await recordPlayHandler(req as unknown as Request);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/api/post-data', async (req, res): Promise<void> => {
  try {
    const response = await getPostDataHandler(req as unknown as Request);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/api/leaderboard', async (req, res): Promise<void> => {
  try {
    const response = await getLeaderboardHandler(req as unknown as Request);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Specific leaderboard endpoints for different game types
router.get('/api/leaderboard/chaser', async (req, res): Promise<void> => {
  try {
    req.query.type = 'chaser';
    const response = await getLeaderboardHandler(req as unknown as Request);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/api/leaderboard/phraser', async (req, res): Promise<void> => {
  try {
    req.query.type = 'phraser';
    const response = await getLeaderboardHandler(req as unknown as Request);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/api/leaderboard/sharer', async (req, res): Promise<void> => {
  try {
    req.query.type = 'sharer';
    const response = await getLeaderboardHandler(req as unknown as Request);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Leaderboard score update endpoints
router.post('/api/update-chaser-score', async (req, res): Promise<void> => {
  try {
    const response = await updateChaserScoreHandler(req as unknown as Request);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/update-phraser-score', async (req, res): Promise<void> => {
  try {
    const response = await updatePhraserScoreHandler(req as unknown as Request);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/update-sharer-score', async (req, res): Promise<void> => {
  try {
    const response = await updateSharerScoreHandler(req as unknown as Request);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Audio settings endpoints
router.post('/api/get-audio-settings', async (req, res): Promise<void> => {
  try {
    const response = await getAudioSettingsHandler(req as unknown as Request);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/clear-leaderboard', async (req, res): Promise<void> => {
  try {
    const { type } = req.body;
    
    if (!type || !['chaser', 'phraser', 'sharer', 'all'].includes(type)) {
      res.status(400).json({
        success: false,
        message: 'Invalid type. Must be chaser, phraser, sharer, or all'
      });
      return;
    }

    const leaderboardService = new LeaderboardService();
    
    if (actualType === 'all') {
      // Clear all leaderboards
      await Promise.all([
        redis.del(leaderboardService.keys.chaserScores),
        redis.del(leaderboardService.keys.phraserScores),
        redis.del(leaderboardService.keys.sharerScores)
      ]);
      
      // Also clear all user stats - skip this for now as redis.keys is not available
      // TODO: Implement user stats clearing when Redis keys method is available
    } else {
      // Clear specific leaderboard
      const key = leaderboardService.keys[`${actualType}Scores` as keyof typeof leaderboardService.keys];
      await redis.del(key);
      
      // Clear user stats for this type - skip this for now as redis.keys is not available
      // TODO: Implement user stats clearing when Redis keys method is available
    }

    res.json({
      success: true,
      message: `Leaderboard cleared successfully for ${type}`
    });
  } catch (error) {
    console.error('Error clearing leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear leaderboard'
    });
  }
});

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Mod tools endpoints - Menu Response Forms approach
router.post('/internal/menu/show-add-words-form', async (_req, res): Promise<void> => {
  try {
    res.json({
      showForm: {
        name: 'addWordsToCustomTrieForm',
        form: {
          title: 'Add words to custom dictionary',
          description: 'Add one or more words to the custom dictionary (max 20 words, comma-separated)',
          fields: [
            {
              type: 'paragraph',
              name: 'words',
              label: 'Words to add',
              required: true,
              helpText: 'Separate multiple words by commas (max 20 words)',
            },
          ],
          acceptLabel: 'Add Words',
          cancelLabel: 'Cancel',
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Failed to show add words form',
    });
  }
});

router.post('/internal/menu/show-remove-words-form', async (_req, res): Promise<void> => {
  try {
    res.json({
      showForm: {
        name: 'removeWordsFromCustomTrieForm',
        form: {
          title: 'Remove words from custom dictionary',
          description: 'Remove one or more words from the custom dictionary (max 20 words, comma-separated)',
          fields: [
            {
              type: 'paragraph',
              name: 'words',
              label: 'Words to remove',
              required: true,
              helpText: 'Separate multiple words by commas (max 20 words)',
            },
          ],
          acceptLabel: 'Remove Words',
          cancelLabel: 'Cancel',
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Failed to show remove words form',
    });
  }
});

router.post('/internal/menu/clear-custom-dictionary', async (_req, res): Promise<void> => {
  try {
    const result = await customTrie.clearDictionary();
    
    if (result.success) {
      const response = {
        showToast: {
          text: 'Custom dictionary cleared successfully!',
          appearance: 'success'
        }
      };
      res.json(response);
    } else {
      const response = {
        showToast: {
          text: `Failed to clear dictionary: ${result.message}`,
          appearance: 'neutral'
        }
      };
      res.json(response);
    }
  } catch (error) {
    console.error('Error in clear custom dictionary:', error);
    res.status(400).json({
      status: 'error',
      message: 'Failed to clear custom dictionary',
    });
  }
});

router.post('/internal/menu/show-list-dictionary-form', async (_req, res): Promise<void> => {
  try {    
    // Get all words from custom dictionary
    const words = await customTrie.getAllWords();
    
    const wordCount = words ? words.length : 0;
    const wordsList = words && words.length > 0 ? words.join(', ') : 'No words in dictionary';
    
    const response = {
      showForm: {
        name: 'listCustomDictionaryForm',
        form: {
          title: 'Custom Dictionary Words',
          description: `Total words: ${wordCount}`,
          fields: [
            {
              type: 'paragraph',
              name: 'wordsList',
              label: 'Words in Custom Dictionary',
              required: false,
              helpText: 'All words currently in the custom dictionary',
              defaultValue: wordsList,
            },
          ],
          acceptLabel: 'Close',
          cancelLabel: 'Cancel',
        }
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error showing list dictionary form:', error);
    res.status(400).json({
      status: 'error',
      message: 'Failed to show list dictionary form',
    });
  }
});

// Form submit endpoints
router.post('/internal/forms/add-words-to-trie', async (req, res): Promise<void> => {
  try {
    const { words } = req.body;
    
    if (!words) {
      res.json({
        showToast: {
          text: 'No words provided',
          appearance: 'neutral'
        }
      });
      return;
    }

    const wordList = words.split(',').map((word: string) => word.trim().toLowerCase());
    
    // Limit to 20 words
    const limitedWords = wordList.slice(0, 20);
    const skippedWords = wordList.slice(20);
    
    const validWords = [];
    const badWords = [];
    const englishWords = [];
    const alreadyExists = [];
    const errors = [];

    for (const word of limitedWords) {
      if (word.length < 2) continue;
      
      // Check if it's a bad word
      if (isBadWord(word)) {
        badWords.push(word);
        continue;
      }

      // Check if it's already a valid English word
      if (isValidWord(word)) {
        englishWords.push(word);
        continue;
      }

      try {
        // Add to custom trie (duplicate check is handled inside addWord)
        const result = await customTrie.addWord(word);
        if (result.success) {
          validWords.push(word);
        } else {
          if (result.message.includes('already exists')) {
            alreadyExists.push(word);
          } else if (result.message.includes('limit')) {
            errors.push(`${word}: ${result.message}`);
          } else {
            errors.push(`${word}: ${result.message}`);
          }
        }
      } catch (error) {
        console.error(`Error adding word ${word}:`, error);
        errors.push(`${word}: Failed to add`);
      }
    }

    // Create toast message
    let toastMessage = '';
    if (validWords.length > 0) {
      toastMessage += `✅ Added ${validWords.length} words`;
    }
    if (badWords.length > 0) {
      toastMessage += `\n❌ Filtered ${badWords.length} bad words`;
    }
    if (englishWords.length > 0) {
      toastMessage += `\n📚 Skipped ${englishWords.length} English words`;
    }
    if (alreadyExists.length > 0) {
      toastMessage += `\n🔄 ${alreadyExists.length} already exist`;
    }
    if (skippedWords.length > 0) {
      toastMessage += `\n⏭️ Skipped ${skippedWords.length} words (limit)`;
    }
    if (errors.length > 0) {
      toastMessage += `\n⚠️ ${errors.length} errors`;
    }

    res.json({
      showToast: {
        text: toastMessage || 'No words processed',
        appearance: validWords.length > 0 ? 'success' : 'neutral'
      }
    });
  } catch (error) {
    console.error('Error in add words form:', error);
    res.json({
      showToast: {
        text: 'Failed to add words',
        appearance: 'neutral'
      }
    });
  }
});

router.post('/internal/forms/remove-words-from-trie', async (req, res): Promise<void> => {
  try {
    const { words } = req.body;
    
    if (!words) {
      res.json({
        showToast: {
          text: 'No words provided',
          appearance: 'neutral'
        }
      });
      return;
    }

    const wordList = words.split(',').map((word: string) => word.trim().toLowerCase());
    
    // Limit to 20 words
    const limitedWords = wordList.slice(0, 20);
    const skippedWords = wordList.slice(20);
    
    const removedWords = [];
    const notFound = [];
    const errors = [];

    for (const word of limitedWords) {
      try {
        const result = await customTrie.removeWord(word);
        if (result.success) {
          removedWords.push(word);
        } else {
          if (result.message.includes('not found')) {
            notFound.push(word);
          } else {
            errors.push(`${word}: ${result.message}`);
          }
        }
      } catch (error) {
        console.error(`Error removing word ${word}:`, error);
        errors.push(`${word}: Failed to remove`);
      }
    }

    // Create toast message
    let toastMessage = '';
    if (removedWords.length > 0) {
      toastMessage += `✅ Removed ${removedWords.length} words`;
    }
    if (notFound.length > 0) {
      toastMessage += `\n❌ ${notFound.length} not found`;
    }
    if (skippedWords.length > 0) {
      toastMessage += `\n⏭️ Skipped ${skippedWords.length} words (limit)`;
    }
    if (errors.length > 0) {
      toastMessage += `\n⚠️ ${errors.length} errors`;
    }

    res.json({
      showToast: {
        text: toastMessage || 'No words processed',
        appearance: removedWords.length > 0 ? 'success' : 'neutral'
      }
    });
  } catch (error) {
    console.error('Error in remove words form:', error);
    res.json({
      showToast: {
        text: 'Failed to remove words',
        appearance: 'neutral'
      }
    });
  }
});

router.post('/internal/forms/list-custom-dictionary', async (req, res): Promise<void> => {
  try {
    // This form is just for display, so we just close it
    res.json({
      showToast: {
        text: 'Dictionary list closed',
        appearance: 'neutral'
      }
    });
  } catch (error) {
    console.error('Error in list dictionary form:', error);
    res.json({
      showToast: {
        text: 'Failed to close dictionary list',
        appearance: 'neutral'
      }
    });
  }
});

router.post('/internal/forms/clear-leaderboard', async (req, res): Promise<void> => {
  try {
    console.log('=== CLEAR LEADERBOARD FORM SUBMITTED ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', req.headers);
    
    const { type } = req.body;
    console.log('Extracted type:', type);
    
    // Handle case where type might be an array
    const actualType = Array.isArray(type) ? type[0] : type;
    console.log('Actual type after array handling:', actualType);
    console.log('Type validation:', ['chaser', 'phraser', 'sharer', 'all'].includes(actualType));
    
    if (!actualType || !['chaser', 'phraser', 'sharer', 'all'].includes(actualType)) {
      console.log('Invalid type received:', type);
      console.log('Available body keys:', Object.keys(req.body || {}));
      res.json({
        showToast: {
          text: `Invalid leaderboard type selected. Received: ${type || 'undefined'}`,
          appearance: 'neutral'
        }
      });
      return;
    }

    const leaderboardService = new LeaderboardService();
    
    if (actualType === 'all') {
      // Check if all leaderboards are empty
      const chaserEntries = await leaderboardService.getLeaderboard('chaser');
      const phraserEntries = await leaderboardService.getLeaderboard('phraser');
      const sharerEntries = await leaderboardService.getLeaderboard('sharer');
      
      if (chaserEntries.length === 0 && phraserEntries.length === 0 && sharerEntries.length === 0) {
        res.json({
          showToast: {
            text: 'All leaderboards are already empty',
            appearance: 'neutral'
          }
        });
        return;
      }
      
      // Clear all leaderboards
      await Promise.all([
        redis.del(leaderboardService.keys.chaserScores),
        redis.del(leaderboardService.keys.phraserScores),
        redis.del(leaderboardService.keys.sharerScores)
      ]);
      
      // Also clear all user stats - skip this for now as redis.keys is not available
      // TODO: Implement user stats clearing when Redis keys method is available
      
      res.json({
        showToast: {
          text: 'All leaderboards cleared successfully',
          appearance: 'neutral'
        }
      });
    } else {
      // Check if specific leaderboard is empty
      const entries = await leaderboardService.getLeaderboard(type);
      
      if (entries.length === 0) {
        res.json({
          showToast: {
            text: `${actualType.charAt(0).toUpperCase() + actualType.slice(1)} leaderboard is already empty`,
            appearance: 'neutral'
          }
        });
        return;
      }
      
      // Clear specific leaderboard
      const key = leaderboardService.keys[`${actualType}Scores` as keyof typeof leaderboardService.keys];
      await redis.del(key);
      
      // Clear user stats for this type - skip this for now as redis.keys is not available
      // TODO: Implement user stats clearing when Redis keys method is available
      
      res.json({
        showToast: {
          text: `${actualType.charAt(0).toUpperCase() + actualType.slice(1)} leaderboard cleared successfully`,
          appearance: 'neutral'
        }
      });
    }
  } catch (error) {
    console.error('Error clearing leaderboard:', error);
    res.json({
      showToast: {
        text: 'Failed to clear leaderboard',
        appearance: 'neutral'
      }
    });
  }
});

// Clear leaderboard menu action
router.post('/internal/menu/clear-leaderboard', async (_req, res): Promise<void> => {
  try {
    console.log('Clear leaderboard menu action called');
    res.json({
      showForm: {
        name: 'clearLeaderboardForm',
        form: {
          title: 'Clear Leaderboard',
          description: 'Choose which leaderboard to clear. This action cannot be undone!',
          fields: [
            {
              type: 'select',
              name: 'type',
              label: 'Leaderboard to clear',
              required: true,
              options: [
                { label: 'All Leaderboards', value: 'all' },
                { label: 'Chaser Leaderboard', value: 'chaser' },
                { label: 'Phraser Leaderboard', value: 'phraser' },
                { label: 'Sharer Leaderboard', value: 'sharer' }
              ],
              helpText: 'Select which leaderboard data to clear'
            }
          ],
          acceptLabel: 'Clear Leaderboard',
          cancelLabel: 'Cancel',
        }
      }
    });
  } catch (error) {
    console.error('Error showing clear leaderboard form:', error);
    res.status(400).json({
      status: 'error',
      message: 'Failed to show clear leaderboard form',
    });
  }
});

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.listen(port);
