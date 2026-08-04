export type DictionaryWord = {
  surface: string;
  reading: string;
  proper?: boolean;
  source?: string;
};

export type DictionaryTuple = readonly [
  surface: string,
  reading: string,
  proper?: boolean,
];

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

const normalizeText = (value: string): string => value.normalize("NFKC").trim();

const normalizeReading = (value: string): string =>
  Array.from(normalizeText(value), character => {
    const code = character.codePointAt(0) ?? 0;
    return code >= 0x30a1 && code <= 0x30f6
      ? String.fromCodePoint(code - 0x60)
      : character;
  }).join("");

const wordKey = (word: Pick<DictionaryWord, "surface" | "reading">): string =>
  `${word.surface}\u0000${word.reading}`;

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
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
          if (previous.proper && !proper) unique.set(key, word);
          continue;
        }
        unique.set(key, word);
        accepted += 1;
      }
      sourceCounts[source.id] = accepted;
    }

    this.words = [...unique.values()].sort((a, b) =>
      a.reading.localeCompare(b.reading, "ja") || a.surface.localeCompare(b.surface, "ja"),
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
    const ordinary = shuffle(bucket.filter(word => !word.proper));
    const proper = shuffle(bucket.filter(word => word.proper));
    const result = [...ordinary, ...proper];
    return typeof limit === "number" ? result.slice(0, Math.max(0, limit)) : result;
  }

  count(kana: string, length: number): number {
    const normalizedKana = normalizeReading(kana);
    if (!normalizedKana) return 0;
    return this.buckets.get(length)?.get(Array.from(normalizedKana)[0])?.length ?? 0;
  }
}
