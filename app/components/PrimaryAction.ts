const PRIMARY_ACTION_SELECTOR = "button.primary";

export function ensurePrimaryActions(root: ParentNode): void {
  root.querySelectorAll<HTMLButtonElement>(PRIMARY_ACTION_SELECTOR).forEach(button => {
    button.classList.add("party-primary-action");

    if (!button.type) button.type = "button";
    if (!button.getAttribute("aria-label")) {
      const label = button.textContent?.replace(/\s+/g, " ").trim();
      if (label) button.setAttribute("aria-label", label);
    }
  });
}
