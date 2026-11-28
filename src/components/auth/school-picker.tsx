"use client";

// 목업의 학교 검색 단계 — 이름으로 찾아 하나를 고른다.
// 로그인 전에도 부를 수 있는 공개 엔드포인트다(GET /api/v1/schools).

import { useState } from "react";
import { Search } from "lucide-react";

import { AppInput } from "@/components/app-field";
import { LoadingState } from "@/components/states";
import { useFindSchools } from "@/api/generated";
import { cn } from "cn";

export function SchoolPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (schoolId: string, schoolName: string) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const schools = useFindSchools({ keyword });
  const results = schools.data?.data ?? [];

  return (
    <div className="grid gap-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <AppInput
          type="search"
          className="pl-10"
          placeholder="학교 이름으로 찾기"
          aria-label="학교 검색"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </div>

      {schools.isPending ? (
        <LoadingState className="text-sm text-muted-foreground" />
      ) : results.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          찾는 학교가 없어요. 이름을 다시 확인해 주세요.
        </p>
      ) : (
        <ul className="m-0 grid max-h-62 list-none gap-1.5 overflow-y-auto p-0">
          {results.map((school) => {
            const id = String(school.id);
            const selected = id === value;

            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onChange(id, school.name ?? "")}
                  aria-pressed={selected}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-md border px-3.5 py-3 text-left transition-colors",
                    selected
                      ? "border-primary bg-primary-soft font-bold text-primary-deep"
                      : "border-border hover:border-muted-foreground",
                  )}
                >
                  {school.name}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
