export function pickDifferent<T>(items: readonly T[], previous?: T): T | undefined {
  if (items.length === 0) return undefined;
  if (items.length === 1) return items[0];

  const candidates = previous === undefined ? items : items.filter(item => item !== previous);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function removeLegacyVersionBadges(): void {
  document.querySelectorAll<HTMLElement>("footer b, .app-version").forEach(element => {
    if (/^v1\./.test(element.textContent?.trim() ?? "")) element.remove();
  });
}

export function vibrate(duration = 25): void {
  try {
    navigator.vibrate?.(duration);
  } catch {
    // Vibration is optional and unsupported on some browsers.
  }
}
