import { createElement } from "../party-games/runtime";

const PARTY_TIP_CLASS = "party-tip";

export function ensurePartyTip(page: HTMLElement, anchor: HTMLElement, tip?: string): void {
  if (!tip || page.querySelector(`.${PARTY_TIP_CLASS}`)) return;

  const box = createElement("aside", PARTY_TIP_CLASS);
  const label = createElement("b", undefined, "盛り上がるコツ");
  const message = createElement("span", undefined, tip);

  box.append(label, message);
  anchor.before(box);
}
