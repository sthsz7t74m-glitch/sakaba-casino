export type DictionaryWord = {
  surface: string;
  reading: string;
  proper?: boolean;
  source?: string;
};

export type DictionaryTuple = readonly [surface: string, reading: string, proper?: boolean];

export type DictionarySource = {
  id: string;
  words: readonly DictionaryTuple[];
};

export type DictionaryStats = {
  total: number;
  ordinary: number;
  proper: number;
  duplicatesRemoved: number;
  invalidRemoved: number;
  sourceCounts: Readonly<Record<string, number>>;
  lengthCounts: Readonly<Record<number, number>>;
};

const MIN_LENGTH = 3;
const MAX_LENGTH = 20;
const READING_PATTERN = /^[ぁ-ゖー]+$/u;

// Smaller is better. Hand-curated/familiar sources are intentionally ahead of
// mechanically generated dictionary entries.
const SOURCE_PRIORITY: Readonly<Record<string, number>> = Object.freeze({
  familiar: 0,
  extra: 1,
  "pop-culture": 2,
  bulk: 3,
  "generated-4": 4,
  "generated-5": 4,
  "generated-6": 4,
  "generated-7": 4,
  "generated-8": 4,
  jmdict: 6,
});

const normalizeText = (value: string): string => value.normalize("NFKC").trim();

const normalizeReading = (value: string): string =>
  Array.from(normalizeText(value), character => {
    const code = character.codePointAt(0) ?? 0;
    return code >= 0x30a1 && code <= 0x30f6 ? String.fromCodePoint(code - 0x60) : character;
  }).join("");

const wordKey = (word: Pick<DictionaryWord, "surface" | "reading">): string =>
  `${word.surface}\u0000${word.reading}`;

const sourcePriority = (word: DictionaryWord): number => SOURCE_PRIORITY[word.source ?? ""] ?? 5;

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

/**
 * Prevents results such as けい〜 / けい〜 / けい〜 from filling the first page.
 * Words are grouped by the first two reading characters and then selected in a
 * round-robin. The first character is already fixed by the game prompt.
 */
function spreadReadingPrefixes(words: readonly DictionaryWord[]): DictionaryWord[] {
  const groups = new Map<string, DictionaryWord[]>();
  for (const word of words) {
    const chars = Array.from(word.reading);
    const key = chars.slice(0, Math.min(2, chars.length)).join("");
    const group = groups.get(key) ?? [];
    group.push(word);
    groups.set(key, group);
  }

  const queues = shuffle(
    [...groups.entries()].map(([key, values]) => ({
      key,
      values: shuffle(values).sort((a, b) => sourcePriority(a) - sourcePriority(b)),
    })),
  ).sort((a, b) => {
    const aPriority = Math.min(...a.values.map(sourcePriority));
    const bPriority = Math.min(...b.values.map(sourcePriority));
    return aPriority - bPriority;
  });

  const result: DictionaryWord[] = [];
  let remaining = queues.reduce((sum, queue) => sum + queue.values.length, 0);
  while (remaining > 0) {
    for (const queue of queues) {
      const next = queue.values.shift();
      if (!next) continue;
      result.push(next);
      remaining -= 1;
    }
  }
  return result;
}

function balancedFamiliarOrder(bucket: readonly DictionaryWord[]): DictionaryWord[] {
  const curatedOrdinary = bucket.filter(word => !word.proper && sourcePriority(word) <= 3);
  const curatedProper = bucket.filter(word => word.proper && sourcePriority(word) <= 2);
  const generatedOrdinary = bucket.filter(word => !word.proper && sourcePriority(word) > 3);
  const remainingProper = bucket.filter(word => word.proper && sourcePriority(word) > 2);

  const lanes = [
    spreadReadingPrefixes(curatedOrdinary),
    spreadReadingPrefixes(curatedProper),
    spreadReadingPrefixes(generatedOrdinary),
    spreadReadingPrefixes(remainingProper),
  ];

  // The first 30 results are roughly 18 familiar common words, 6 famous proper
  // nouns/characters and 6 long-tail dictionary words when enough data exists.
  const pattern = [0, 0, 1, 0, 2, 0, 1, 2, 0, 3];
  const result: DictionaryWord[] = [];
  while (lanes.some(lane => lane.length > 0)) {
    let progressed = false;
    for (const laneIndex of pattern) {
      const next = lanes[laneIndex].shift();
      if (!next) continue;
      result.push(next);
      progressed = true;
    }
    if (!progressed) break;
  }
  return result;
}

export class DictionaryEngine {
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
        const length = Array.from(reading).length;

        if (!surface || length < MIN_LENGTH || length > MAX_LENGTH || !READING_PATTERN.test(reading)) {
          invalidRemoved += 1;
          continue;
        }

        const word: DictionaryWord = { surface, reading, proper, source: source.id };
        const key = wordKey(word);
        const previous = unique.get(key);
        if (previous) {
          duplicatesRemoved += 1;
          if (sourcePriority(word) < sourcePriority(previous) || (previous.proper && !proper)) {
            unique.set(key, word);
          }
          continue;
        }
        unique.set(key, word);
        accepted += 1;
      }
      sourceCounts[source.id] = accepted;
    }

    this.words = [...unique.values()].sort((a, b) =>
      sourcePriority(a) - sourcePriority(b) ||
      a.reading.localeCompare(b.reading, "ja") ||
      a.surface.localeCompare(b.surface, "ja"),
    );

    const lengthCounts: Record<number, number> = {};
    for (const word of this.words) {
      const characters = Array.from(word.reading);
      const length = characters.length;
      const head = characters[0];
      const byKana = this.buckets.get(length) ?? new Map<string, readonly DictionaryWord[]>();
      const current = byKana.get(head) ?? [];
      byKana.set(head, [...current, word]);
      this.buckets.set(length, byKana);
      lengthCounts[length] = (lengthCounts[length] ?? 0) + 1;
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

  find(kana: string, length: number, limit?: number): DictionaryWord[] {
    const normalizedKana = normalizeReading(kana);
    if (length < MIN_LENGTH || length > MAX_LENGTH || !normalizedKana) return [];

    const bucket = this.buckets.get(length)?.get(Array.from(normalizedKana)[0]) ?? [];
    const result = balancedFamiliarOrder(bucket);
    return typeof limit === "number" ? result.slice(0, Math.max(0, limit)) : result;
  }

  count(kana: string, length: number): number {
    const normalizedKana = normalizeReading(kana);
    if (!normalizedKana) return 0;
    return this.buckets.get(length)?.get(Array.from(normalizedKana)[0])?.length ?? 0;
  }
}
