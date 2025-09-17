import { isValidWord } from '@shiva.710_/valid-words-lib';
import { isBadWord } from '@shiva.710_/bad-words-lib';

const testWords = ['pal', 'bea', 'del', 'hello', 'world', 'queer'];

function testWord(word: string) {
  const lowerWord = word.toLowerCase().trim();
  const bad = isBadWord(lowerWord);
  const valid = isValidWord(lowerWord);
}

testWords.forEach(testWord);
// You can also test individual words like this:
// testWord('pal');
// testWord('bea');
// testWord('del');
