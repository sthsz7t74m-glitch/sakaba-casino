export type DictionaryTuple = readonly [surface: string, reading: string, proper?: boolean];

export type DictionarySource = {
  id: string;
  words: readonly DictionaryTuple[];
};

export type DictionaryWord = {
  surface: string;
  reading: string;
  proper?: boolean;
  source?: string;
  length: number;
  headKana: string;
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

export const MIN_WORD_LENGTH = 3;
export const MAX_WORD_LENGTH = 20;
export const READING_PATTERN = /^[ぁ-ゖー]+$/u;

export const SOURCE_PRIORITY: Readonly<Record<string, number>> = Object.freeze({
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

export const normalizeText = (value: string): string => value.normalize("NFKC").trim();

export const normalizeReading = (value: string): string =>
  Array.from(normalizeText(value), character => {
    const code = character.codePointAt(0) ?? 0;
    return code >= 0x30a1 && code <= 0x30f6 ? String.fromCodePoint(code - 0x60) : character;
  }).join("");

export const sourcePriority = (word: Pick<DictionaryWord, "source">): number =>
  SOURCE_PRIORITY[word.source ?? ""] ?? 5;

export const createWordKey = (word: Pick<DictionaryWord, "surface" | "reading">): string =>
  `${word.surface}\u0000${word.reading}`;
