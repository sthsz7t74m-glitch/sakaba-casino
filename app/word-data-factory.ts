export type GeneratedWordTuple = readonly [surface: string, reading: string, proper?: boolean];

/**
 * 実在しない文字列を回答候補として生成しないための安全弁。
 *
 * フェーズ1で導入した機械的なかな文字列は、語数だけは満たす一方で
 * 日本語の単語ではない候補を表示してしまうため停止する。
 * 各文字数の辞書ファイル構造は維持し、今後はJMdictなどから検証済みの
 * 実在語を書き出す生成処理へ置き換える。
 */
export function makeGeneratedWords(_length: number, _perHead = 0): GeneratedWordTuple[] {
  return [];
}
