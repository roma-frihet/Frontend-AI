// orval(react-query) 생성 코드가 사용하는 fetch mutator.
// Supabase 세션의 access_token을 붙이고, 응답을 { data, status, headers } 형태로 돌려준다.
//
// 기본값은 빈 문자열이라 /api/v1/... 을 같은 출처로 호출한다.
// next.config.ts의 rewrites가 이를 백엔드로 넘기므로 CORS가 필요 없다.
// 정적 호스팅처럼 프록시를 못 쓰는 환경에서는 NEXT_PUBLIC_API_BASE_URL로 백엔드를 직접 가리킨다.

import { getAccessToken } from "@/lib/supabase/client";

const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

/**
 * 서버가 내려주는 오류 한 가지 모양.
 * { status, title, detail, code, instance }
 * detail은 사용자에게 그대로 보여 줘도 되는 한국어 문장이고, code는 분기용이다.
 */
export type ApiProblem = {
  status: number;
  title: string;
  detail: string;
  code: string;
  instance?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly problem: ApiProblem | null;

  constructor(status: number, problem: ApiProblem | null) {
    super(problem?.detail ?? `요청에 실패했습니다. (HTTP ${status})`);
    this.name = "ApiError";
    this.status = status;
    this.code = problem?.code ?? "UNKNOWN";
    this.problem = problem;
  }
}

const isProblem = (value: unknown): value is ApiProblem =>
  typeof value === "object" &&
  value !== null &&
  "code" in value &&
  "detail" in value;

export const apiFetcher = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const token = await getAccessToken();
  const headers = new Headers(options?.headers);

  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${baseUrl}${url}`, { ...options, headers });

  // 파일 응답(성적 CSV 등)은 스펙에서 binary라 생성된 훅이 Blob을 기대한다.
  // 글자로 풀면 BOM이 떨어지고 타입과도 어긋나므로 성공한 비 JSON 응답은 Blob 그대로 넘긴다.
  // 오류 응답은 파일 요청이어도 JSON(ProblemDetail)이라 아래에서 읽는다.
  const contentType = response.headers.get("content-type") ?? "";
  if (response.ok && contentType && !contentType.includes("json")) {
    const data = await response.blob();
    return { data, status: response.status, headers: response.headers } as T;
  }

  const body = [204, 205, 304].includes(response.status)
    ? null
    : await response.text();

  let data: unknown = {};
  if (body) {
    try {
      data = JSON.parse(body);
    } catch {
      // 본문이 JSON이 아니면(프록시 오류 HTML 등) 그대로 둔다.
      data = body;
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, isProblem(data) ? data : null);
  }

  return { data, status: response.status, headers: response.headers } as T;
};
