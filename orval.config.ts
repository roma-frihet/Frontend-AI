import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: "./api/openapi.json",
    output: {
      target: "./src/api/generated/api.ts",
      schemas: "./src/api/generated/model",
      mode: "tags-split",
      client: "react-query",
      clean: true,
      override: {
        mutator: {
          path: "./src/lib/api-fetcher.ts",
          name: "apiFetcher",
        },
      },
    },
  },
});
