const ABBREVIATION_REGEX = /(?:\b(?:dr|mr|mrs|ms|prof|sr|jr|vs|etc|e\.g|i\.e))\.$/i;

/**
 * Splits input text into discrete sentences using platform Intl.Segmenter,
 * preserving common abbreviations and enforcing an upper bound on chunk length.
 */
export function tokenizeSentences(text: string, maxChunkLength = 500): string[] {
  if (!text || !text.trim()) {
    return [];
  }

  const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
  const segments = Array.from(segmenter.segment(text));
  const rawSentences: string[] = [];

  let accumulator = '';

  for (let i = 0; i < segments.length; i++) {
    const raw = segments[i].segment;
    accumulator += raw;

    const trimmed = accumulator.trim();
    if (!trimmed) {
      accumulator = '';
      continue;
    }

    // If segment ends with a known abbreviation and there's a next segment, don't split yet
    if (ABBREVIATION_REGEX.test(trimmed) && i + 1 < segments.length) {
      continue;
    }

    rawSentences.push(trimmed);
    accumulator = '';
  }

  if (accumulator.trim()) {
    rawSentences.push(accumulator.trim());
  }

  // Enforce maxChunkLength
  const result: string[] = [];
  for (const sentence of rawSentences) {
    if (sentence.length <= maxChunkLength) {
      result.push(sentence);
      continue;
    }

    let remaining = sentence;
    while (remaining.length > maxChunkLength) {
      let splitIdx = remaining.lastIndexOf(' ', maxChunkLength);
      if (splitIdx === -1 || splitIdx < maxChunkLength / 2) {
        splitIdx = maxChunkLength;
      }
      const part = remaining.slice(0, splitIdx).trim();
      if (part) {
        result.push(part);
      }
      remaining = remaining.slice(splitIdx).trim();
    }
    if (remaining) {
      result.push(remaining);
    }
  }

  return result;
}
