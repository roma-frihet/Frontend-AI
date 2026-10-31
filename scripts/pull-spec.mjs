// api-spec.version에 적힌 버전의 openapi.json을 스펙 저장소에서 받아 api/openapi.json에 저장한다.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const versionFile = resolve(root, "api-spec.version");
const outFile = resolve(root, "api/openapi.json");

const fail = (message) => {
  console.error(`[api:pull] ${message}`);
  process.exit(1);
};

let version;
try {
  version = (await readFile(versionFile, "utf8")).trim();
} catch (error) {
  fail(`api-spec.version 파일을 읽을 수 없습니다: ${error.message}`);
}

if (!version) fail("api-spec.version이 비어 있습니다.");

if (version === "none") {
  console.log("[api:pull] 아직 연결된 스펙 버전 없음 (api-spec.version = none)");
  process.exit(0);
}

const baseUrl = process.env.API_SPEC_BASE_URL?.replace(/\/+$/, "");
const service = process.env.API_SPEC_SERVICE || "backend";
if (!baseUrl) {
  fail("환경변수 API_SPEC_BASE_URL이 설정되지 않았습니다. .env.example을 참고하세요.");
}

const url = `${baseUrl}/${service}/${version}/openapi.json`;
const headers = { Accept: "application/json" };
if (process.env.API_SPEC_TOKEN) {
  headers.Authorization = `Bearer ${process.env.API_SPEC_TOKEN}`;
}

let response;
try {
  response = await fetch(url, { headers });
} catch (error) {
  fail(`스펙 저장소에 접속하지 못했습니다 (${url}): ${error.cause?.message ?? error.message}`);
}

if (!response.ok) {
  const hint =
    response.status === 401 || response.status === 403
      ? " — 인증 실패: API_SPEC_TOKEN을 확인하세요."
      : response.status === 404
        ? " — 해당 버전/서비스의 스펙이 없습니다. api-spec.version, API_SPEC_SERVICE를 확인하세요."
        : "";
  fail(`스펙 다운로드 실패: HTTP ${response.status} ${response.statusText} (${url})${hint}`);
}

const text = await response.text();
try {
  JSON.parse(text);
} catch {
  fail(`받은 내용이 올바른 JSON이 아닙니다 (${url}). 첫 100자: ${text.slice(0, 100)}`);
}

await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, text);
console.log(`[api:pull] ${url} → api/openapi.json (version ${version})`);
