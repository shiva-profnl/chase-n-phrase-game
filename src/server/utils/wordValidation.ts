

import type { WordValidationResponse } from '../../shared/types/phraser';
import { isValidWord } from '@shiva.710_/valid-words-lib';
import { isBadWord } from '@shiva.710_/bad-words-lib';
import { customTrie } from './customTrie';

export async function validateWord(word: string): Promise<WordValidationResponse> {
  const lowerWord = word.toLowerCase().trim();

  if (lowerWord.length < 1) {
    return await { result: "not-valid", message: "Word too short" };
  }

  // Always check for bad words first
  if (isBadWord(lowerWord)) {
    return await { result: "invalid", message: "Word is a bad word" };
  }

  // Check if word is in custom trie
  const isInCustomTrie = await customTrie.searchWord(lowerWord);
  if (isInCustomTrie) {
    return await { result: "valid", message: "Valid word (custom trie)" };
  }

  // Check if word is a valid English word using the library
  if (isValidWord(lowerWord)) {
    return await { result: "valid", message: "Valid word (English dictionary)" };
  }

  // Word is not valid
  return await { result: "not-valid", message: "Not a valid word" };
}
