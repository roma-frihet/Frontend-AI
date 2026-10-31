// orval(react-query) 생성 코드가 사용하는 fetch mutator.
// NEXT_PUBLIC_API_BASE_URL을 런타임에 붙이고, 응답을 { data, status, headers } 형태로 돌려준다.
const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

export const apiFetcher = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const response = await fetch(`${baseUrl}${url}`, options);
  const body = [204, 205, 304].includes(response.status)
    ? null
    : await response.text();
  const data = body ? JSON.parse(body) : {};

  return { data, status: response.status, headers: response.headers } as T;
};
