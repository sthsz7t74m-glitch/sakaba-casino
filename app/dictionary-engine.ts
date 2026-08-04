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

const prefix = (word: DictionaryWord, length: number): string =>
  Array.from(word.reading).slice(0, length).join("");

type PrefixUsage = {
  two: Map<string, number>;
  three: Map<string, number>;
  four: Map<string, number>;
};

const increment = (map: Map<string, number>, key: string): void => {
  map.set(key, (map.get(key) ?? 0) + 1);
};

function takeMostDiverse(lane: DictionaryWord[], usage: PrefixUsage): DictionaryWord | undefined {
  if (lane.length === 0) return undefined;

  let bestIndex = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let index = 0; index < lane.length; index += 1) {
    const word = lane[index];
    if (!word) continue;

    const score =
      (usage.two.get(prefix(word, 2)) ?? 0) * 10_000 +
      (usage.three.get(prefix(word, 3)) ?? 0) * 500 +
      (usage.four.get(prefix(word, 4)) ?? 0) * 25 +
      Math.random();

    if (score < bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  const selected = lane.splice(bestIndex, 1)[0];
  if (!selected) return undefined;

  increment(usage.two, prefix(selected, 2));
  increment(usage.three, prefix(selected, 3));
  increment(usage.four, prefix(selected, 4));
  return selected;
}

function balancedFamiliarOrder(bucket: readonly DictionaryWord[]): DictionaryWord[] {
  const lanes: DictionaryWord[][] = [
    shuffle(bucket.filter(word => !word.proper && sourcePriority(word) <= 3)),
    shuffle(bucket.filter(word => word.proper && sourcePriority(word) <= 2)),
    shuffle(bucket.filter(word => !word.proper && sourcePriority(word) > 3)),
    shuffle(bucket.filter(word => word.proper && sourcePriority(word) > 2)),
  ];

  const pattern = [0, 1, 0, 2, 0, 1, 0, 2, 0, 3];
  const usage: PrefixUsage = { two: new Map(), three: new Map(), four: new Map() };
  const result: DictionaryWord[] = [];

  while (lanes.some(lane => lane.length > 0)) {
    let progressed = false;

    for (const laneIndex of pattern) {
      const preferredLane = lanes[laneIndex];
      let next = preferredLane ? takeMostDiverse(preferredLane, usage) : undefined;

      if (!next) {
        const fallbackLane = lanes
          .filter(lane => lane.length > 0)
          .sort((a, b) => a.length - b.length)[0];
        if (fallbackLane) next = takeMostDiverse(fallbackLane, usage);
      }

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
      if (!head) continue;

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

    const head = Array.from(normalizedKana)[0];
    if (!head) return [];

    const bucket = this.buckets.get(length)?.get(head) ?? [];
    const result = balancedFamiliarOrder(bucket);
    return typeof limit === "number" ? result.slice(0, Math.max(0, limit)) : result;
  }

  count(kana: string, length: number): number {
    const normalizedKana = normalizeReading(kana);
    const head = Array.from(normalizedKana)[0];
    if (!head) return 0;
    return this.buckets.get(length)?.get(head)?.length ?? 0;
  }
}
