import type { NextConfig } from "next";

// 백엔드(Kotlin)는 CORS를 열어 두지 않았다. 브라우저가 직접 부르면 막힌다.
// /api/v1/* 을 같은 출처로 받아 백엔드로 넘겨 주면 CORS 자체가 생기지 않는다.
const apiOrigin = (process.env.API_ORIGIN ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  rewrites: async () => [
    { source: "/api/v1/:path*", destination: `${apiOrigin}/api/v1/:path*` },
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
