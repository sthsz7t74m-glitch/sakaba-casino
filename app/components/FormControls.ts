const TEXT_CONTROL_SELECTOR = 'input:not([type="checkbox"]):not([type="radio"]), select, textarea';
const TOGGLE_SELECTOR = 'input[type="checkbox"], input[type="radio"]';

export function ensureFormControls(root: ParentNode): void {
  root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(TEXT_CONTROL_SELECTOR).forEach(control => {
    control.classList.add("party-form-control");

    if (!control.getAttribute("aria-label")) {
      const label = control.closest("label")?.textContent?.replace(/\s+/g, " ").trim();
      if (label) control.setAttribute("aria-label", label);
    }
  });

  root.querySelectorAll<HTMLInputElement>(TOGGLE_SELECTOR).forEach(control => {
    control.classList.add("party-toggle-control");
    control.closest("label")?.classList.add("party-toggle-label");
  });
}
