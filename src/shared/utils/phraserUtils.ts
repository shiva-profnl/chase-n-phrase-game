import type { PhraserGameConfig, WordValidationResponse } from '../types/phraser';

export const PHRASER_CONFIG: PhraserGameConfig = {
  timeMultiplier: 3, // 3 seconds per letter
  gridColumns: 4, // Default for mobile, will be overridden by responsive CSS
  minWordLength: 2
};

export function calculateTimeLimit(letters: string[]): number {
  return letters.length * PHRASER_CONFIG.timeMultiplier * 1000; // Convert to milliseconds
}

export function arrangeLettersInGrid(letters: string[], columns?: number): string[][] {
  const rows: string[][] = [];
  const cols = columns || PHRASER_CONFIG.gridColumns;
  
  for (let i = 0; i < letters.length; i += cols) {
    rows.push(letters.slice(i, i + cols));
  }
  
  return rows;
}

export function calculateScore(word: string): number {
  return word.length;
}

export async function validateWord(word: string): Promise<WordValidationResponse> {
  try {
    const response = await fetch('/api/validate-word', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ word: word.toLowerCase() })
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    // Server returns: { success: true, result: { result: 'valid'|'invalid'|'not-valid', message }, word }
    const data = await response.json();
    if (data && typeof data === 'object') {
      if ('result' in data && data.result && typeof data.result === 'object' && 'result' in data.result) {
        return {
          result: data.result.result,
          message: data.result.message
        } as WordValidationResponse;
      }
      // In case server directly returns the response shape already
      if ('result' in data && (data.result === 'valid' || data.result === 'invalid' || data.result === 'not-valid')) {
        return data as WordValidationResponse;
      }
    }

    // Fallback: treat unknown response as not-valid
    return { result: 'not-valid', message: 'Unexpected validation response' };
  } catch (error) {
    // Fallback validation for development
    return {
      result: word.length >= PHRASER_CONFIG.minWordLength ? 'valid' : 'not-valid',
      message: 'Offline validation'
    };
  }
}

export function canFormWord(availableLetters: string[], word: string): boolean {
  const letterCount = new Map<string, number>();
  
  // Count available letters
  for (const letter of availableLetters) {
    letterCount.set(letter, (letterCount.get(letter) || 0) + 1);
  }
  
  // Check if we can form the word
  for (const letter of word.toUpperCase()) {
    const count = letterCount.get(letter) || 0;
    if (count === 0) return false;
    letterCount.set(letter, count - 1);
  }
  
  return true;
}

export function removeUsedLetters(availableLetters: string[], word: string): string[] {
  const letterCount = new Map<string, number>();
  const result = [...availableLetters];
  
  // Count letters in the word
  for (const letter of word.toUpperCase()) {
    letterCount.set(letter, (letterCount.get(letter) || 0) + 1);
  }
  
  // Remove used letters
  for (const [letter, count] of letterCount) {
    for (let i = 0; i < count; i++) {
      const index = result.indexOf(letter);
      if (index !== -1) {
        result.splice(index, 1);
      }
    }
  }
  
  return result;
}
