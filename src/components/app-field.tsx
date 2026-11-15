// 목업의 .field — 라벨 위, 컨트롤 아래로 쌓는 한 묶음.
// 입력 컨트롤(.input/.select)은 44px 높이에 radius 12px이다.

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "cn";

export const appControlClassName =
  "h-11 w-full rounded-md border-input px-3.5 text-base hover:border-muted-foreground";

export function AppField({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-bold text-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function AppInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return <Input className={cn(appControlClassName, className)} {...props} />;
}
