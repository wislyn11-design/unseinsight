function randomPosition(maxExclusive: number) {
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
    const values = new Uint32Array(1);
    const range = 0x1_0000_0000;
    const unbiasedLimit = range - (range % maxExclusive);
    do {
      globalThis.crypto.getRandomValues(values);
    } while (values[0]! >= unbiasedLimit);
    return values[0]! % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

export function shuffledOracleIndexes(previous: readonly number[]) {
  const indexes = Array.from({ length: previous.length }, (_, index) => index);

  for (let attempt = 0; attempt < 32; attempt += 1) {
    const shuffled = [...indexes];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const target = randomPosition(index + 1);
      [shuffled[index], shuffled[target]] = [shuffled[target]!, shuffled[index]!];
    }

    // 새 고민에서는 직전 배열과 같은 자리에 같은 카드가 남지 않게 합니다.
    if (shuffled.every((value, index) => value !== previous[index])) return shuffled;
  }

  // 매우 드물게 32번 안에 조건을 만족하지 못하면 무작위 간격으로 회전합니다.
  const shift = randomPosition(indexes.length - 1) + 1;
  return indexes.map((_, index) => previous[(index + shift) % previous.length]!);
}
