const MODAL_SELECTOR = ".modal-backdrop";

export function ensureModalDialogs(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>(MODAL_SELECTOR).forEach((backdrop, index) => {
    backdrop.classList.add("party-modal-backdrop");

    const dialog = backdrop.querySelector<HTMLElement>(".help-modal, [role='dialog']");
    if (!dialog) return;

    dialog.classList.add("party-modal-dialog");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.tabIndex = -1;

    const heading = dialog.querySelector<HTMLElement>("h1, h2, h3");
    if (heading) {
      if (!heading.id) heading.id = `party-modal-title-${index + 1}`;
      dialog.setAttribute("aria-labelledby", heading.id);
    }

    const closeButton = dialog.querySelector<HTMLButtonElement>("button.primary, button.secondary, button:last-of-type");
    if (closeButton && !closeButton.getAttribute("aria-label")) {
      const label = closeButton.textContent?.replace(/\s+/g, " ").trim();
      closeButton.setAttribute("aria-label", label || "閉じる");
    }
  });
}
