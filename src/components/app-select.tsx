"use client";

// 목업의 .select — 44px 높이의 드롭다운.
//
// base-ui의 Select.Value는 기본적으로 "값"을 그대로 그린다.
// 값 대신 라벨(다원중학교, 3학년 …)을 보여 주려면 Root에 items를 넘겨야 한다.

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { appControlClassName } from "@/components/app-field";
import { cn } from "cn";

export type AppSelectItem = { value: string; label: string };

export function AppSelect({
  id,
  items,
  value,
  onValueChange,
  placeholder,
  disabled,
  className,
}: {
  id?: string;
  items: readonly AppSelectItem[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => onValueChange(next ?? "")}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={cn(appControlClassName, className)}>
        <SelectValue>
          {(selected: string | null) =>
            items.find((item) => item.value === selected)?.label ?? placeholder
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
