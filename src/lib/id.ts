// 서버가 주는 ID(반·수업·학생 등)를 다룰 때 쓰는 도우미.
//
// 운영 DB에는 courseId -48 같은 음수 ID가 실제로 있고, 외래 키 때문에 그대로 둔다.
// 그래서 "양수면 유효"로 판단하면 안 된다. 0도 ID로 올 수 있다고 본다.
// `id > 0`, `Boolean(id)`, `Number(x) || null` 같은 가드를 쓰지 말고 여기 있는 함수를 쓴다.

/** URL 쿼리 등 글자로 받은 ID를 숫자로. 정수가 아니거나 비어 있으면 null이다. 음수·0도 그대로 둔다. */
export const toId = (value: string | null | undefined): number | null => {
  if (value == null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
};

/** 값이 ID로 쓸 수 있는 정수인지. 음수·0도 참이다. */
export const isId = (value: number | null | undefined): value is number =>
  value != null && Number.isInteger(value);
