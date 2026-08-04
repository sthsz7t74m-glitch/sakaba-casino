import { DictionaryEngine, type DictionarySource, type DictionaryWord } from "./dictionary-engine";
import { extraAnswerWordTuples } from "./word-data-extra";
import { bulkAnswerWordTuples } from "./word-data-bulk";
import { popCultureWordTuples } from "./word-data-popculture";
import { jmdictWordTuples } from "./word-data-jmdict.generated";
import { generatedWords4 } from "./word-data-4";
import { generatedWords5 } from "./word-data-5";
import { generatedWords6 } from "./word-data-6";
import { generatedWords7 } from "./word-data-7";
import { generatedWords8 } from "./word-data-8";

export type AnswerWord = DictionaryWord;

const dictionarySources: readonly DictionarySource[] = [
  { id: "extra", words: extraAnswerWordTuples },
  { id: "bulk", words: bulkAnswerWordTuples },
  { id: "pop-culture", words: popCultureWordTuples },
  { id: "jmdict", words: jmdictWordTuples },
  { id: "generated-4", words: generatedWords4 },
  { id: "generated-5", words: generatedWords5 },
  { id: "generated-6", words: generatedWords6 },
  { id: "generated-7", words: generatedWords7 },
  { id: "generated-8", words: generatedWords8 },
];

const engine = new DictionaryEngine(dictionarySources);

export const answerWords: readonly AnswerWord[] = engine.words;
export const dictionaryStats = engine.stats;

export function findAnswerWords(kana: string, length: number): AnswerWord[] {
  return engine.find(kana, length);
}

export function countAnswerWords(kana: string, length: number): number {
  return engine.count(kana, length);
}
