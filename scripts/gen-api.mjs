// api/openapi.json이 있으면 orval을 실행하고, 없으면 건너뛴다.
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

if (!existsSync(resolve(root, "api/openapi.json"))) {
  console.log("[api:gen] api/openapi.json이 없어 건너뜁니다.");
  process.exit(0);
}

const result = spawnSync("npx", ["orval", "--config", "orval.config.ts"], {
  cwd: root,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
