const SECONDARY_ACTION_SELECTOR = "button.secondary";

export function ensureSecondaryActions(root: ParentNode): void {
  root.querySelectorAll<HTMLButtonElement>(SECONDARY_ACTION_SELECTOR).forEach(button => {
    button.classList.add("party-secondary-action");

    if (!button.type) button.type = "button";
    if (!button.getAttribute("aria-label")) {
      const label = button.textContent?.replace(/\s+/g, " ").trim();
      if (label) button.setAttribute("aria-label", label);
    }
  });
}
