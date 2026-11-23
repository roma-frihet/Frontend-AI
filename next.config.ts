import type { NextConfig } from "next";

// 백엔드(Kotlin)는 CORS를 열어 두지 않았다. 브라우저가 직접 부르면 막힌다.
// /api/v1/* 을 같은 출처로 받아 백엔드로 넘겨 주면 CORS 자체가 생기지 않는다.
//
// 이 값은 빌드할 때 rewrites에 구워진다. Vercel에서 환경변수를 빼먹으면 localhost가
// 그대로 박혀 배포본이 조용히 죽으므로, 거기서는 없을 때 빌드를 멈춘다.
if (process.env.VERCEL && !process.env.API_ORIGIN) {
  throw new Error(
    "API_ORIGIN이 없습니다. Vercel 프로젝트 환경변수에 백엔드 주소를 넣어 주세요.",
  );
}

const apiOrigin = (process.env.API_ORIGIN ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // 교사 화면을 반 중심으로 다시 묶으면서 옮긴 경로. 즐겨찾기해 둔 주소가 죽지 않게 넘겨 준다.
  redirects: async () => [
    { source: "/teacher/questions", destination: "/teacher/prepare", permanent: false },
    { source: "/teacher/students", destination: "/teacher", permanent: false },
  ],
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
