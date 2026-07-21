import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "酒場カジノ｜宴会ゲーム集",
  description: "ちんちろ、どすこいなどを一台のスマホで遊べる宴会ゲーム集",
  other: { "codex-preview": "development" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
