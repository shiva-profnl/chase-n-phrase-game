import type { FormKey, MenuItem } from '@devvit/public-api';

export const addWordsToCustomTrie = (form: FormKey): MenuItem => ({
  label: '[Chase-n-Phrase] Add words to custom trie',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    context.ui.showForm(form, {});
  },
});

export const removeWordsFromCustomTrie = (form: FormKey): MenuItem => ({
  label: '[Chase-n-Phrase] Remove words from custom trie',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    context.ui.showForm(form, {});
  },
});

export const addWordsFromFile = (form: FormKey): MenuItem => ({
  label: '[Chase-n-Phrase] Add words from file',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    context.ui.showForm(form, {});
  },
});
