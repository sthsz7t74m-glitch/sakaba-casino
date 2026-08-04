import { APP_VERSION } from "../version";

const VERSION_CLASS = "party-version";

export function ensureGameHeaderVersion(page: HTMLElement): HTMLSpanElement | null {
  const header = page.querySelector<HTMLElement>(".game-header");
  if (!header) return null;

  page.querySelectorAll<HTMLElement>(".dosukoi-version-badge").forEach(element => {
    element.classList.remove("dosukoi-version-badge");
    element.removeAttribute("data-version-badge");
    element.removeAttribute("aria-label");
    element.setAttribute("aria-hidden", "true");
    element.textContent = "";
  });

  const existing = header.querySelector<HTMLSpanElement>(`.${VERSION_CLASS}`);
  if (existing) {
    existing.textContent = APP_VERSION;
    existing.setAttribute("aria-label", `アプリバージョン ${APP_VERSION}`);
    return existing;
  }

  const badge = document.createElement("span");
  badge.className = VERSION_CLASS;
  badge.textContent = APP_VERSION;
  badge.setAttribute("aria-label", `アプリバージョン ${APP_VERSION}`);
  header.appendChild(badge);
  return badge;
}
