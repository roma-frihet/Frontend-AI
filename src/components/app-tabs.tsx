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
        "h-auto w-full justify-start gap-2 overflow-x-auto rounded-none border-b border-border bg-transparent p-0",
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
        "after:bottom-[-1px] after:h-[3px] after:bg-primary",
        "data-active:font-bold data-active:text-primary-deep",
        className,
      )}
      {...props}
    />
  );
}
