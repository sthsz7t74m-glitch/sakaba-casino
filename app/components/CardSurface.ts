const CARD_SURFACE_SELECTOR = ".play-card, .examples";

export function ensureCardSurfaces(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>(CARD_SURFACE_SELECTOR).forEach(surface => {
    surface.classList.add("party-card-surface");

    if (surface.classList.contains("play-card")) {
      surface.classList.add("party-card-surface-main");
    }

    if (surface.classList.contains("examples")) {
      surface.classList.add("party-card-surface-compact");
    }
  });
}
