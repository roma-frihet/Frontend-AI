import type { Metadata } from "next";
import Link from "next/link";
import { Noto_Sans_KR } from "next/font/google";

import "./mockup.css";

const notoKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  preload: false,
});

export const metadata: Metadata = {
  title: "디자인 목업",
  description: "교사-학생 복습 문제 서비스 디자인 목업 (예시 데이터)",
};

export default function MockupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`wk ${notoKr.variable}`}>
      <header className="wk-nav">
        <div className="wk-container">
          <Link href="/mockup" className="wk-wordmark">
            서비스명
          </Link>
          <nav aria-label="주요 메뉴">
            <ul>
              <li><Link href="/mockup/teacher">교사</Link></li>
              <li><Link href="/mockup/student">학생</Link></li>
            </ul>
          </nav>
        </div>
      </header>
      {children}
      <footer className="wk-footer">
        <div className="wk-container">
          <span className="wk-wordmark">서비스명</span>
          <p className="label">디자인 목업입니다. 화면의 이름과 숫자는 모두 예시입니다.</p>
        </div>
      </footer>
    </div>
  );
}
