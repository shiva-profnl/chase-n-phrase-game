import { redis } from '@devvit/web/server';

// Custom Trie Node structure
interface TrieNode {
  [key: string]: TrieNode | boolean;
}

// Custom Trie class for Redis storage
export class CustomTrie {
  private readonly redisKey = 'custom-valid-words-trie';
  private readonly maxWords = 1000;

  // Add a word to the custom trie
  async addWord(word: string): Promise<{ success: boolean; message: string }> {
    try {
      const lowerWord = word.toLowerCase().trim();
      
      if (lowerWord.length < 2) {
        return { success: false, message: 'Word too short' };
      }

      // Check current word count
      const currentCount = await this.getWordCount();
      if (currentCount >= this.maxWords) {
        return { success: false, message: `Maximum word limit (${this.maxWords}) reached` };
      }

      // Get current trie from Redis
      const trieData = await redis.get(this.redisKey);
      let trie: TrieNode = trieData ? JSON.parse(trieData) : {};

      // Check if word already exists
      if (this.searchWordInTrie(trie, lowerWord)) {
        return { success: false, message: 'Word already exists in custom trie' };
      }

      // Add word to trie
      this.insertWordIntoTrie(trie, lowerWord);

      // Save updated trie to Redis
      await redis.set(this.redisKey, JSON.stringify(trie));
      
      // Update word count
      await this.updateWordCount(currentCount + 1);

      return { success: true, message: `Word "${lowerWord}" added to custom trie` };
    } catch (error) {
      console.error('Error adding word to custom trie:', error);
      return { success: false, message: 'Failed to add word to custom trie' };
    }
  }

  // Remove a word from the custom trie
  async removeWord(word: string): Promise<{ success: boolean; message: string }> {
    try {
      const lowerWord = word.toLowerCase().trim();
      
      // Get current trie from Redis
      const trieData = await redis.get(this.redisKey);
      if (!trieData) {
        return { success: false, message: 'Custom trie is empty' };
      }

      let trie: TrieNode = JSON.parse(trieData);

      // Check if word exists
      if (!this.searchWordInTrie(trie, lowerWord)) {
        return { success: false, message: 'Word not found in custom trie' };
      }

      // Remove word from trie
      this.deleteWordFromTrie(trie, lowerWord);

      // Save updated trie to Redis
      await redis.set(this.redisKey, JSON.stringify(trie));
      
      // Update word count
      const currentCount = await this.getWordCount();
      await this.updateWordCount(Math.max(0, currentCount - 1));

      return { success: true, message: `Word "${lowerWord}" removed from custom trie` };
    } catch (error) {
      console.error('Error removing word from custom trie:', error);
      return { success: false, message: 'Failed to remove word from custom trie' };
    }
  }

  // Clear all words from the custom trie
  async clearDictionary(): Promise<{ success: boolean; message: string }> {
    try {
      await redis.del(this.redisKey);
      await redis.del('custom-words-count');
      return { success: true, message: 'Custom dictionary cleared successfully' };
    } catch (error) {
      console.error('Error clearing custom dictionary:', error);
      return { success: false, message: 'Failed to clear custom dictionary' };
    }
  }

  // Search for a word in the custom trie
  async searchWord(word: string): Promise<boolean> {
    try {
      const lowerWord = word.toLowerCase().trim();
      
      // Get trie from Redis
      const trieData = await redis.get(this.redisKey);
      if (!trieData) {
        return false; // No custom trie exists
      }

      const trie: TrieNode = JSON.parse(trieData);
      return this.searchWordInTrie(trie, lowerWord);
    } catch (error) {
      console.error('Error searching word in custom trie:', error);
      return false;
    }
  }

  // Get current word count
  async getWordCount(): Promise<number> {
    try {
      const count = await redis.get('custom-words-count');
      return count ? parseInt(count) : 0;
    } catch (error) {
      console.error('Error getting word count:', error);
      return 0;
    }
  }

  // Update word count
  private async updateWordCount(count: number): Promise<void> {
    try {
      await redis.set('custom-words-count', count.toString());
    } catch (error) {
      console.error('Error updating word count:', error);
    }
  }

  // Insert word into trie
  private insertWordIntoTrie(trie: TrieNode, word: string): void {
    let current = trie;
    for (const char of word) {
      if (!current[char]) {
        current[char] = {};
      }
      current = current[char] as TrieNode;
    }
    current['*'] = true; // Mark end of word
  }

  // Search word in trie
  private searchWordInTrie(trie: TrieNode, word: string): boolean {
    let current = trie;
    for (const char of word) {
      if (!current[char]) {
        return false;
      }
      current = current[char] as TrieNode;
    }
    return current['*'] === true;
  }

  // Delete word from trie
  private deleteWordFromTrie(trie: TrieNode, word: string): boolean {
    const deleteHelper = (node: TrieNode, word: string, index: number): boolean => {
      if (index === word.length) {
        if (node['*'] === true) {
          delete node['*'];
          return Object.keys(node).length === 0;
        }
        return false;
      }

      const char = word[index];
      if (!node[char]) {
        return false;
      }

      const shouldDelete = deleteHelper(node[char] as TrieNode, word, index + 1);
      if (shouldDelete) {
        delete node[char];
        return Object.keys(node).length === 0;
      }
      return false;
    };

    return deleteHelper(trie, word, 0);
  }

  // Get all words from trie (for debugging/testing)
  async getAllWords(): Promise<string[]> {
    try {
      const trieData = await redis.get(this.redisKey);
      if (!trieData) {
        return [];
      }

      const trie: TrieNode = JSON.parse(trieData);
      const words: string[] = [];

      const collectWords = (node: TrieNode, currentWord: string): void => {
        if (node['*'] === true) {
          words.push(currentWord);
        }

        for (const [char, childNode] of Object.entries(node)) {
          if (char !== '*') {
            collectWords(childNode as TrieNode, currentWord + char);
          }
        }
      };

      collectWords(trie, '');
      return words;
    } catch (error) {
      console.error('Error getting all words from trie:', error);
      return [];
    }
  }
}

// Export singleton instance
export const customTrie = new CustomTrie();
