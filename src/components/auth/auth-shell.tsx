// 목업의 .auth / .auth-card — 로그인·가입 화면의 공통 껍데기.
// 가운데 정렬한 카드 하나로 끝낸다 (최대 560px).

import { Brand } from "@/components/brand";
import { Panel } from "@/components/surface";

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
    <main className="flex flex-1 justify-center px-4 pt-12 pb-16">
      <Panel size="lg" className="h-fit w-full max-w-xl gap-6">
        <Brand badge={badge} className="justify-self-start" />
        <div className="grid gap-1">
          <h1 className="text-2xl font-extrabold text-foreground">{title}</h1>
          {description ? (
            <p className="text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {children}
      </Panel>
    </main>
  );
}
