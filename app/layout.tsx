import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "宴会ゲームBOX｜みんなで遊べるゲーム集",
  description: "ちんちろ、どすこい、ワードウルフ、3ヒントクイズなど18種類を一台のスマホで遊べる宴会ゲーム集",
  other: { "codex-preview": "development" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
