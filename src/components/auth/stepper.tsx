// 목업의 .stepper — 지금 몇 단계인지 알려 주는 가로 막대.

import { cn } from "cn";

export function Stepper({
  steps,
  current,
}: {
  steps: readonly string[];
  /** 1부터 센다 */
  current: number;
}) {
  return (
    <ol className="m-0 grid list-none grid-cols-3 gap-2 p-0">
      {steps.map((step, index) => {
        const reached = index + 1 <= current;

        return (
          <li
            key={step}
            aria-current={index + 1 === current ? "step" : undefined}
            className={cn(
              "grid gap-2 text-sm font-medium",
              reached ? "text-primary-deep" : "text-muted-foreground",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "h-1 rounded-full",
                reached ? "bg-primary" : "bg-secondary",
              )}
            />
            {step}
          </li>
        );
      })}
    </ol>
  );
}
