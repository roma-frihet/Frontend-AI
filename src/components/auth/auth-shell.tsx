// 목업의 .auth / .auth-card — 로그인·가입 화면의 공통 껍데기.
// 가운데 정렬한 카드 하나로 끝낸다 (최대 560px).

import { Brand } from "@/components/brand";
import { Card } from "@/components/ui/card";

export function AuthShell({
  badge,
  title,
  description,
  children,
}: {
  badge?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid flex-1 place-items-start justify-center px-4 pt-12 pb-16">
      <Card className="grid w-[min(560px,100%)] gap-6 rounded-lg border border-border p-8 shadow-card ring-0">
        <Brand badge={badge} className="justify-self-start" />
        <div className="grid gap-1">
          <h1 className="text-2xl font-extrabold text-foreground">{title}</h1>
          {description ? (
            <p className="text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {children}
      </Card>
    </main>
  );
}
