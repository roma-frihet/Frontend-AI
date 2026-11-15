// 목업의 .brand — 아이콘 + 서비스명, 필요하면 역할 배지.
//
// 누르면 그 사람의 홈으로 간다. 학생은 `/`, 교사는 `/teacher`다.

import Image from "next/image";
import Link from "next/link";

import { cn } from "cn";

export const SERVICE_NAME = "다시봄";

export function Brand({
  badge,
  href,
  className,
}: {
  /** "학생" / "교사"처럼 지금 보고 있는 쪽을 알려 준다 */
  badge?: string;
  /** 누르면 갈 곳. 없으면 누를 수 없는 표시로만 쓴다(로그인 화면 등) */
  href?: string;
  className?: string;
}) {
  const content = (
    <>
      <Image
        src="/brand.png"
        alt=""
        width={28}
        height={28}
        className="rounded-sm"
        priority
      />
      {SERVICE_NAME}
      {badge ? (
        <span className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-0.5 text-sm font-bold whitespace-nowrap text-primary-deep">
          {badge}
        </span>
      ) : null}
    </>
  );

  const classes = cn(
    "inline-flex items-center gap-2.5 text-lg font-extrabold text-foreground",
    className,
  );

  if (!href) return <span className={classes}>{content}</span>;

  return (
    <Link href={href} className={cn(classes, "hover:opacity-80")}>
      {content}
    </Link>
  );
}
