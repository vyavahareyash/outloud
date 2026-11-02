import { describe, expect, it } from 'vitest';
import { tokenizeSentences } from '../src/offscreen/sentence-tokenizer.js';

describe('tokenizeSentences', () => {
  it('splits simple multi-sentence text', () => {
    const input = 'This is the first sentence. This is the second sentence! Here is a third?';
    const result = tokenizeSentences(input);
    expect(result).toEqual([
      'This is the first sentence.',
      'This is the second sentence!',
      'Here is a third?'
    ]);
  });

  it('handles abbreviations without splitting', () => {
    const input = 'Dr. Smith bought e.g. apples and oranges. He left quickly.';
    const result = tokenizeSentences(input);
    expect(result).toEqual([
      'Dr. Smith bought e.g. apples and oranges.',
      'He left quickly.'
    ]);
  });

  it('handles quotes, ellipses, and decimals', () => {
    const input = 'She said, "Wait here..." The price was $3.50 per unit.';
    const result = tokenizeSentences(input);
    expect(result).toEqual([
      'She said, "Wait here..."',
      'The price was $3.50 per unit.'
    ]);
  });

  it('trims extra whitespace between sentences and ignores empty chunks', () => {
    const input = '   First sentence.    \n\n   Second sentence.   ';
    const result = tokenizeSentences(input);
    expect(result).toEqual([
      'First sentence.',
      'Second sentence.'
    ]);
  });

  it('enforces a maximum character cap by splitting oversized sentences', () => {
    const longSentence = 'A'.repeat(600) + '.';
    const result = tokenizeSentences(longSentence, 500);
    expect(result.length).toBeGreaterThan(1);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(500);
    }
  });

  it('returns empty array on empty or whitespace-only input', () => {
    expect(tokenizeSentences('')).toEqual([]);
    expect(tokenizeSentences('   \n\t  ')).toEqual([]);
  });
});
