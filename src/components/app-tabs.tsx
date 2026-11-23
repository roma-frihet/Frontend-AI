"use client";

// 목업의 .tabs — 밑줄로 현재 위치를 보여 주는 가로 탭.
// shadcn의 line 변형을 쓰되 치수와 색을 목업에 맞춘다.

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "cn";

export { Tabs as AppTabs, TabsContent as AppTabsContent } from "@/components/ui/tabs";

export function AppTabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsList>) {
  return (
    <TabsList
      variant="line"
      className={cn(
        // shadcn이 가로 탭 목록 높이를 group-data-horizontal/tabs:h-8(32px)로 박아 두어 그냥 h-auto로는
        // 덮이지 않는다. 같은 조건을 붙여 덮지 않으면 탭(52px)이 목록 밖으로 넘치고, 가로 스크롤 때문에
        // 세로도 auto가 되어 윈도우 크롬이 세로 스크롤바(위아래 화살표)를 그린다.
        "h-auto w-full max-w-full min-w-0 justify-start gap-2 overflow-x-auto overflow-y-hidden rounded-none border-b border-border bg-transparent p-0 group-data-horizontal/tabs:h-auto",
        className,
      )}
      {...props}
    />
  );
}

export function AppTabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger
      className={cn(
        "h-13 flex-none gap-2 rounded-none px-5 text-base font-medium text-muted-foreground",
        // 밑줄도 shadcn의 group-data-horizontal/tabs:after:bottom-[-5px]가 이기므로 같은 조건으로 덮는다.
        "after:h-[3px] after:bg-primary group-data-horizontal/tabs:after:bottom-0",
        "data-active:font-bold data-active:text-primary-deep",
        className,
      )}
      {...props}
    />
  );
}
