export type RandomSource = () => number;

const defaultRandom: RandomSource = Math.random;

export function randomInt(maxExclusive: number, random: RandomSource = defaultRandom): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError("maxExclusive must be a positive integer");
  }
  return Math.floor(random() * maxExclusive);
}

export function pickRandom<T>(items: readonly T[], random: RandomSource = defaultRandom): T {
  if (items.length === 0) throw new RangeError("items must not be empty");
  return items[randomInt(items.length, random)];
}

export function pickRandomExcept<T>(
  items: readonly T[],
  previous: T | undefined,
  random: RandomSource = defaultRandom,
): T {
  if (items.length === 0) throw new RangeError("items must not be empty");
  if (items.length === 1 || previous === undefined) return pickRandom(items, random);

  const candidates = items.filter(item => item !== previous);
  return pickRandom(candidates.length > 0 ? candidates : items, random);
}

export function shuffle<T>(items: readonly T[], random: RandomSource = defaultRandom): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1, random);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function sample<T>(
  items: readonly T[],
  count: number,
  random: RandomSource = defaultRandom,
): T[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError("count must be a non-negative integer");
  }
  return shuffle(items, random).slice(0, Math.min(count, items.length));
}
