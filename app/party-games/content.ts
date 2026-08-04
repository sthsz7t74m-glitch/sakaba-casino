import {
  PARTY_GAME_CONTENT,
  type PartyGameContent,
  type PartyGameTitle,
} from "../data/party-game-content";

export { PARTY_GAME_CONTENT };
export type { PartyGameContent, PartyGameTitle };

export function getPartyGameContent(title: string): PartyGameContent | undefined {
  return PARTY_GAME_CONTENT[title as PartyGameTitle];
}
