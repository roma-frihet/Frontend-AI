// shadcn Button을 목업 치수에 맞춰 감싼다.
// shadcn 기본 버튼은 h-8(32px)인데 목업은 44px에 radius 12px이다.
// components/ui는 직접 고치지 않고 여기서 감싸 쓴다.

import { Button } from "@/components/ui/button";
import { cn } from "cn";

type AppButtonProps = React.ComponentProps<typeof Button> & {
  /** 가로 전체를 채운다 (목업의 .btn.block) */
  block?: boolean;
};

export function AppButton({
  className,
  block = false,
  variant = "default",
  ...props
}: AppButtonProps) {
  return (
    <Button
      variant={variant}
      className={cn(
        "h-11 rounded-md px-5 text-base",
        variant === "default" && "font-bold hover:bg-primary-deep",
        variant === "outline" && "font-medium hover:bg-secondary",
        block && "w-full",
        className,
      )}
      {...props}
    />
  );
}
