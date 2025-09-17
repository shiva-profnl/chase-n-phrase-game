import { context, reddit } from '@devvit/web/server';

export const createPost = async () => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  const post = await reddit.submitCustomPost({
    splash: {
      appDisplayName: 'Chase n\' Phrase',
      backgroundUri: 'chaser-pic.jpg',
      appIconUri: 'chase-n-phrase-pic.jpg',
      heading: 'Chaser Game',
      description: 'Collect letters while avoiding obstacles!',
      buttonLabel: 'Start Chasing',
      entryUri: 'index.html'
    },
    subredditName: subredditName,
    title: 'Play Chaser Game',
  });

  // The setSubredditSticky method does not exist, and neither does reddit.sticky.
  // If you want to sticky a post, you may need to use the 'distinguish' method if available.
  // We'll attempt to distinguish the post as a moderator, which sometimes pins it, but otherwise skip pinning.

  try {
    if (typeof post.distinguish === 'function') {
      // The distinguish method does not take any arguments.
      await post.distinguish();
    }
    // If no distinguish method, skip pinning.
  } catch (error) {
    console.error('Failed to distinguish post:', error);
  }

  return post;
};
