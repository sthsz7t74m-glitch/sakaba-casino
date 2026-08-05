import type { Metadata } from "next";
import "./globals.css";
import "./dosukoi-enhancements.css";
import "./party-game-enhancements.css";
import "./five-seconds-v2.css";
import DosukoiExamplesEnhancer from "./DosukoiExamplesEnhancer";
import FiveSecondsGame from "./FiveSecondsGame";
import HashGuard from "./HashGuard";
import HomeVersionBadge from "./HomeVersionBadge";
import PartyGameEnhancer from "./PartyGameEnhancer";

export const metadata: Metadata = {
  title: "宴会ゲームBOX｜みんなで遊べるゲーム集",
  description: "ちんちろ、どすこい、ワードウルフ、3ヒントクイズなど18種類を一台のスマホで遊べる宴会ゲーム集",
  other: { "codex-preview": "development" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}<HashGuard /><HomeVersionBadge /><DosukoiExamplesEnhancer /><PartyGameEnhancer /><FiveSecondsGame /></body></html>;
}
