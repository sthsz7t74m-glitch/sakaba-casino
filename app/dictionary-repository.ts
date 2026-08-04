import {
  MAX_WORD_LENGTH,
  MIN_WORD_LENGTH,
  READING_PATTERN,
  createWordKey,
  normalizeReading,
  normalizeText,
  sourcePriority,
  type DictionarySource,
  type DictionaryStats,
  type DictionaryWord,
} from "./dictionary-domain";

export interface DictionaryRepository {
  readonly words: readonly DictionaryWord[];
  readonly stats: DictionaryStats;
  findBucket(kana: string, length: number): readonly DictionaryWord[];
  count(kana: string, length: number): number;
}

export class InMemoryDictionaryRepository implements DictionaryRepository {
  readonly words: readonly DictionaryWord[];
  readonly stats: DictionaryStats;

  private readonly buckets = new Map<number, Map<string, readonly DictionaryWord[]>>();

  constructor(sources: readonly DictionarySource[]) {
    const unique = new Map<string, DictionaryWord>();
    const sourceCounts: Record<string, number> = {};
    let duplicatesRemoved = 0;
    let invalidRemoved = 0;

    for (const source of sources) {
      let accepted = 0;
      for (const tuple of source.words) {
        const surface = normalizeText(tuple[0]);
        const reading = normalizeReading(tuple[1]);
        const proper = tuple[2] === true;
        const characters = Array.from(reading);
        const length = characters.length;
        const headKana = characters[0] ?? "";

        if (!surface || !headKana || length < MIN_WORD_LENGTH || length > MAX_WORD_LENGTH || !READING_PATTERN.test(reading)) {
          invalidRemoved += 1;
          continue;
        }

        const word: DictionaryWord = { surface, reading, proper, source: source.id, length, headKana };
        const key = createWordKey(word);
        const previous = unique.get(key);
        if (previous) {
          duplicatesRemoved += 1;
          if (sourcePriority(word) < sourcePriority(previous) || (previous.proper && !proper)) unique.set(key, word);
          continue;
        }

        unique.set(key, word);
        accepted += 1;
      }
      sourceCounts[source.id] = accepted;
    }

    this.words = [...unique.values()].sort((a, b) =>
      sourcePriority(a) - sourcePriority(b)
      || a.reading.localeCompare(b.reading, "ja")
      || a.surface.localeCompare(b.surface, "ja"),
    );

    const lengthCounts: Record<number, number> = {};
    for (const word of this.words) {
      const byKana = this.buckets.get(word.length) ?? new Map<string, readonly DictionaryWord[]>();
      const current = byKana.get(word.headKana) ?? [];
      byKana.set(word.headKana, [...current, word]);
      this.buckets.set(word.length, byKana);
      lengthCounts[word.length] = (lengthCounts[word.length] ?? 0) + 1;
    }

    this.stats = Object.freeze({
      total: this.words.length,
      ordinary: this.words.filter(word => !word.proper).length,
      proper: this.words.filter(word => word.proper).length,
      duplicatesRemoved,
      invalidRemoved,
      sourceCounts: Object.freeze(sourceCounts),
      lengthCounts: Object.freeze(lengthCounts),
    });
  }

  findBucket(kana: string, length: number): readonly DictionaryWord[] {
    const head = Array.from(normalizeReading(kana))[0];
    if (!head || length < MIN_WORD_LENGTH || length > MAX_WORD_LENGTH) return [];
    return this.buckets.get(length)?.get(head) ?? [];
  }

  count(kana: string, length: number): number {
    return this.findBucket(kana, length).length;
  }
}

export class CachedDictionaryRepository implements DictionaryRepository {
  readonly words: readonly DictionaryWord[];
  readonly stats: DictionaryStats;
  private readonly cache = new Map<string, readonly DictionaryWord[]>();

  constructor(private readonly delegate: DictionaryRepository, private readonly maxEntries = 64) {
    this.words = delegate.words;
    this.stats = delegate.stats;
  }

  findBucket(kana: string, length: number): readonly DictionaryWord[] {
    const key = `${length}:${normalizeReading(kana)}`;
    const cached = this.cache.get(key);
    if (cached) {
      this.cache.delete(key);
      this.cache.set(key, cached);
      return cached;
    }

    const bucket = this.delegate.findBucket(kana, length);
    this.cache.set(key, bucket);
    if (this.cache.size > this.maxEntries) {
      const oldest = this.cache.keys().next().value as string | undefined;
      if (oldest) this.cache.delete(oldest);
    }
    return bucket;
  }

  count(kana: string, length: number): number {
    return this.findBucket(kana, length).length;
  }
}
