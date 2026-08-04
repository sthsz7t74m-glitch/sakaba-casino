export type GeneratedWordTuple = readonly [surface: string, reading: string, proper?: boolean];

const heads = ["あ","い","う","え","お","か","き","く","け","こ","さ","し","す","せ","そ","た","ち","つ","て","と","な","に","ぬ","ね","の","は","ひ","ふ","へ","ほ","ま","み","む","め","も","や","ゆ","よ","ら","り","る","れ","ろ","わ","が","ぎ","ぐ","げ","ご","ざ","じ","ず","ぜ","ぞ","だ","で","ど","ば","び","ぶ","べ","ぼ","ぱ","ぴ","ぷ","ぺ","ぽ"];
const syllables = ["あ","い","う","え","お","か","き","く","け","こ","さ","し","す","せ","そ","た","ち","つ","て","と","な","に","ぬ","ね","の","は","ひ","ふ","へ","ほ","ま","み","む","め","も","や","ゆ","よ","ら","り","る","れ","ろ","わ","ん"];

export function makeGeneratedWords(length: number, perHead = 28): GeneratedWordTuple[] {
  const result: GeneratedWordTuple[] = [];
  for (const head of heads) {
    const seen = new Set<string>();
    let cursor = 0;
    while (seen.size < perHead) {
      let reading = head;
      let value = cursor++;
      while (Array.from(reading).length < length) {
        const position = Array.from(reading).length;
        const index = (value + position * 7 + head.codePointAt(0)!) % syllables.length;
        reading += syllables[index];
        value = Math.floor(value / syllables.length) + index * 3 + 1;
      }
      if (reading.endsWith("ん") && length > 1) reading = reading.slice(0, -1) + "る";
      if (!seen.has(reading)) {
        seen.add(reading);
        result.push([reading, reading]);
      }
    }
  }
  return result;
}
