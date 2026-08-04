import { extraAnswerWordTuples } from "./word-data-extra";
import { bulkAnswerWordTuples } from "./word-data-bulk";
import { popCultureWordTuples } from "./word-data-popculture";
import { jmdictWordTuples } from "./word-data-jmdict.generated";
import { generatedWords4 } from "./word-data-4";
import { generatedWords5 } from "./word-data-5";
import { generatedWords6 } from "./word-data-6";
import { generatedWords7 } from "./word-data-7";
import { generatedWords8 } from "./word-data-8";

export type AnswerWord = {
  surface: string;
  reading: string;
  proper?: boolean;
};

type Tuple = readonly [surface: string, reading: string, proper?: boolean];
const toWord = ([surface, reading, proper]: Tuple): AnswerWord => ({ surface, reading, proper });
const generated = [...generatedWords4, ...generatedWords5, ...generatedWords6, ...generatedWords7, ...generatedWords8];

export const answerWords: AnswerWord[] = Array.from(
  new Map(
    [...extraAnswerWordTuples, ...bulkAnswerWordTuples, ...popCultureWordTuples, ...jmdictWordTuples, ...generated]
      .map(toWord)
      .map(entry => [`${entry.surface}\u0000${entry.reading}`, entry]),
  ).values(),
);

const dictionary = new Map<number, Map<string, AnswerWord[]>>();
for (const entry of answerWords) {
  const length = Array.from(entry.reading).length;
  if (length < 3 || length > 20) continue;
  const head = Array.from(entry.reading)[0];
  const byKana = dictionary.get(length) ?? new Map<string, AnswerWord[]>();
  const bucket = byKana.get(head) ?? [];
  bucket.push(entry);
  byKana.set(head, bucket);
  dictionary.set(length, byKana);
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function findAnswerWords(kana: string, length: number): AnswerWord[] {
  if (length < 3 || length > 20) return [];
  const bucket = dictionary.get(length)?.get(kana) ?? [];
  const unique = Array.from(new Map(bucket.map(entry => [`${entry.surface}\u0000${entry.reading}`, entry])).values());
  const ordinary = shuffle(unique.filter(entry => !entry.proper));
  const proper = shuffle(unique.filter(entry => entry.proper));
  return [...ordinary, ...proper];
}
