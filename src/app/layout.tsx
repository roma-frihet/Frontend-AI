import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// 목업과 같은 본문 글꼴. 400/500/700/800을 쓴다.
const notoSansKr = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "다시봄",
  description: "수업이 끝나면 복습 문제를 풀고, 내 기록을 확인해요.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
