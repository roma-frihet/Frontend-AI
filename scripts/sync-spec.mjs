// 백엔드가 떠 있는 주소에서 openapi.json을 받아 api/openapi.json에 저장한다.
//
// 백엔드는 별도 스펙 저장소를 두지 않고 springdoc이 /v3/api-docs로 바로 내보낸다.
// (server/docs/frontend/README.md 참고) 그래서 버전 파일 없이 떠 있는 백엔드에서 바로 받는다.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = resolve(root, "api/openapi.json");

const fail = (message) => {
  console.error(`[api:sync] ${message}`);
  process.exit(1);
};

const url = process.env.API_SPEC_URL || "http://localhost:8080/v3/api-docs";

let response;
try {
  response = await fetch(url, { headers: { Accept: "application/json" } });
} catch (error) {
  fail(
    `백엔드에 접속하지 못했습니다 (${url}): ${error.cause?.message ?? error.message}\n` +
      "  로컬 백엔드를 띄웠는지, API_SPEC_URL이 맞는지 확인하세요.",
  );
}

if (!response.ok) {
  fail(`스펙을 받지 못했습니다: HTTP ${response.status} ${response.statusText} (${url})`);
}

const text = await response.text();

let spec;
try {
  spec = JSON.parse(text);
} catch {
  fail(`받은 내용이 올바른 JSON이 아닙니다 (${url}). 첫 100자: ${text.slice(0, 100)}`);
}

const operations = Object.values(spec.paths ?? {}).flatMap((path) =>
  Object.values(path),
);
const missingOperationId = operations.filter((op) => !op.operationId).length;

// operationId가 곧 생성되는 훅 이름이다. 비어 있으면 useCreate1 같은 이름이 나오고,
// 엔드포인트가 늘어날 때마다 번호가 밀려 같은 이름이 다른 API를 가리키게 된다.
if (missingOperationId > 0) {
  fail(
    `operationId가 없는 엔드포인트가 ${missingOperationId}개 있습니다. 백엔드에서 @Operation(operationId = "...")를 붙여야 합니다.`,
  );
}

let previousCount = 0;
try {
  const previous = JSON.parse(await readFile(outFile, "utf8"));
  previousCount = Object.values(previous.paths ?? {}).flatMap((path) =>
    Object.values(path),
  ).length;
} catch {
  // 처음 받는 경우
}

await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, `${JSON.stringify(spec, null, 2)}\n`);

console.log(
  `[api:sync] ${url} → api/openapi.json (엔드포인트 ${previousCount} → ${operations.length})`,
);
