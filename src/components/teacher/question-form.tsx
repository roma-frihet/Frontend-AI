"use client";

// 문제 추가 폼.
//
// 객관식은 보기를 2~5개 두고 하나를 정답으로 고른다. 보기가 2개면 O/X로 한 번에 채운다.
// 주관식은 인정할 답을 쉼표로 여러 개 적는다. 서버는 둘 다 options로 받고,
// 주관식의 options는 "인정하는 답"이다.
//
// 제한 시간은 문제 하나에 주는 시간이다(1~300초).

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { AppField, AppInput } from "@/components/app-field";
import { AppSelect } from "@/components/app-select";
import type { QuestionRequestSave } from "@/api/generated/model";
import { cn } from "cn";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 5;
const MIN_TIME_LIMIT_SEC = 1;
const MAX_TIME_LIMIT_SEC = 300;
const DEFAULT_TIME_LIMIT_SEC = 30;

const TYPE_ITEMS = [
  { value: "MULTIPLE_CHOICE", label: "객관식" },
  { value: "SHORT_ANSWER", label: "주관식" },
];

const emptyOptions = () => ["", ""];

export function QuestionForm({
  busy,
  disabled,
  disabledReason,
  onSubmit,
}: {
  busy: boolean;
  disabled: boolean;
  disabledReason?: string;
  onSubmit: (question: QuestionRequestSave) => void;
}) {
  const [type, setType] = useState("MULTIPLE_CHOICE");
  const [content, setContent] = useState("");
  const [options, setOptions] = useState<string[]>(emptyOptions);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [shortAnswers, setShortAnswers] = useState("");
  const [timeLimitSec, setTimeLimitSec] = useState(String(DEFAULT_TIME_LIMIT_SEC));
  const [explanation, setExplanation] = useState("");

  const isChoice = type === "MULTIPLE_CHOICE";
  const filledOptions = options.filter((option) => option.trim());
  const answers = shortAnswers
    .split(",")
    .map((answer) => answer.trim())
    .filter(Boolean);

  const ready =
    content.trim() &&
    (isChoice
      ? filledOptions.length === options.length && options.length >= MIN_OPTIONS
      : answers.length > 0);

  const reset = () => {
    setContent("");
    setOptions(emptyOptions());
    setCorrectIndex(0);
    setShortAnswers("");
    setExplanation("");
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    onSubmit({
      type: type as QuestionRequestSave["type"],
      content: content.trim(),
      timeLimitSec: Number(timeLimitSec),
      explanation: explanation.trim() || null,
      options: isChoice
        ? options.map((option, index) => ({
            content: option.trim(),
            isCorrect: index === correctIndex,
          }))
        : answers.map((answer) => ({ content: answer, isCorrect: true })),
    });

    reset();
  };

  if (disabled) {
    return (
      <p className="text-muted-foreground">
        {disabledReason ?? "지금은 문제를 추가할 수 없습니다."}
      </p>
    );
  }

  return (
    <form className="grid gap-5" onSubmit={submit} noValidate>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
        <AppField label="문제 유형" htmlFor="type">
          <AppSelect
            id="type"
            items={TYPE_ITEMS}
            value={type}
            onValueChange={setType}
            placeholder="유형"
          />
        </AppField>
        <AppField label="제한 시간(초)" htmlFor="time-limit">
          <AppInput
            id="time-limit"
            type="number"
            className="w-32"
            min={MIN_TIME_LIMIT_SEC}
            max={MAX_TIME_LIMIT_SEC}
            value={timeLimitSec}
            onChange={(event) => setTimeLimitSec(event.target.value)}
          />
        </AppField>
      </div>

      <AppField label="문제" htmlFor="content">
        <textarea
          id="content"
          rows={3}
          placeholder="문제를 입력하세요"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="w-full rounded-md border border-input bg-card px-3.5 py-2.5 text-base outline-none hover:border-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </AppField>

      {isChoice ? (
        <fieldset className="grid gap-2.5 border-0 p-0">
          <legend className="mb-2 text-sm font-bold">보기와 정답</legend>

          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2.5">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={correctIndex === index}
                  onChange={() => setCorrectIndex(index)}
                  aria-label={`${index + 1}번을 정답으로`}
                  className="size-4.5 accent-primary"
                />
              </label>
              <AppInput
                placeholder={`보기 ${index + 1}`}
                aria-label={`보기 ${index + 1}`}
                value={option}
                onChange={(event) =>
                  setOptions(
                    options.map((item, i) =>
                      i === index ? event.target.value : item,
                    ),
                  )
                }
              />
              {options.length > MIN_OPTIONS ? (
                <button
                  type="button"
                  aria-label={`보기 ${index + 1} 삭제`}
                  onClick={() => {
                    setOptions(options.filter((_, i) => i !== index));
                    if (correctIndex >= index && correctIndex > 0) {
                      setCorrectIndex(correctIndex - 1);
                    }
                  }}
                  className="inline-grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                >
                  <X className="size-4" aria-hidden />
                </button>
              ) : (
                <span className="size-9 shrink-0" />
              )}
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            {options.length < MAX_OPTIONS ? (
              <AppButton
                type="button"
                variant="outline"
                className="h-9 px-3"
                onClick={() => setOptions([...options, ""])}
              >
                <Plus className="size-4" aria-hidden />
                보기 추가
              </AppButton>
            ) : null}
            {options.length === MIN_OPTIONS ? (
              <AppButton
                type="button"
                variant="outline"
                className="h-9 px-3"
                onClick={() => {
                  setOptions(["O", "X"]);
                  setCorrectIndex(0);
                }}
              >
                O / X로 채우기
              </AppButton>
            ) : null}
          </div>
        </fieldset>
      ) : (
        <AppField label="정답" htmlFor="answers">
          <AppInput
            id="answers"
            placeholder="인정할 답을 쉼표로 구분해 적으세요"
            value={shortAnswers}
            onChange={(event) => setShortAnswers(event.target.value)}
          />
          {answers.length > 1 ? (
            <p className="text-sm text-muted-foreground">
              {answers.length}개 답을 모두 정답으로 인정합니다.
            </p>
          ) : null}
        </AppField>
      )}

      <AppField label="해설 (선택)" htmlFor="explanation">
        <AppInput
          id="explanation"
          placeholder="마감한 뒤에만 학생에게 보입니다"
          value={explanation}
          onChange={(event) => setExplanation(event.target.value)}
        />
      </AppField>

      <div className={cn("flex justify-end")}>
        <AppButton type="submit" disabled={!ready || busy}>
          {busy ? "추가하는 중…" : "문제 추가"}
        </AppButton>
      </div>
    </form>
  );
}
