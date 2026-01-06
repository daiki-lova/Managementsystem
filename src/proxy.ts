import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// CSRF保護が必要なメソッド
const CSRF_PROTECTED_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

// CSRF検証をスキップするパス（公開API等）
const CSRF_SKIP_PATHS = [
  "/api/public/",
  "/api/inngest", // Inngestからのコールバック
  "/api/auth/login", // ログインは認証前なのでCSRFスキップ
  "/api/auth/refresh", // リフレッシュトークンは認証前なのでCSRFスキップ
];

// 許可するオリジン（環境変数から設定）
// 環境変数の末尾の改行・空白を除去
const cleanEnv = (value: string | undefined): string | undefined =>
  value?.trim().replace(/[\r\n]+/g, '');

const ALLOWED_ORIGINS: string[] = [
  cleanEnv(process.env.NEXTAUTH_URL) || "http://localhost:3000",
  cleanEnv(process.env.FRONTEND_URL) || "http://localhost:5173",
  cleanEnv(process.env.NEXT_PUBLIC_APP_URL), // Vercel本番URL
  cleanEnv(process.env.VERCEL_URL) ? `https://${cleanEnv(process.env.VERCEL_URL)}` : undefined, // Vercel自動設定URL
  // Vercel本番環境のURL（明示的に追加）
  "https://managementsystem-daikis-projects-917fe1d6.vercel.app",
  "http://localhost:3000", // バックエンド自身（プロキシ経由のリクエスト用）
  "http://localhost:4000", // 開発サーバー（代替ポート）
  "http://localhost:5174", // Vite開発サーバー（代替ポート）
  "http://localhost:5175", // Vite開発サーバー（代替ポート）
  "http://localhost:5176", // Vite開発サーバー（代替ポート）
].filter((origin): origin is string => Boolean(origin));

// 許可されたホスト一覧（オリジンからホスト部分を抽出）
const ALLOWED_HOSTS: string[] = ALLOWED_ORIGINS.map((origin) => {
  try {
    return new URL(origin).host;
  } catch {
    return "";
  }
}).filter(Boolean);

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // CORSヘッダーを設定
  const origin = request.headers.get("origin");
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-CSRF-Token"
    );
  }

  // Preflightリクエストに対応
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 200, headers: response.headers });
  }

  // セキュリティヘッダーを追加
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // CSRF保護（状態変更メソッドのみ）
  if (CSRF_PROTECTED_METHODS.includes(request.method)) {
    const pathname = request.nextUrl.pathname;

    // スキップパスをチェック
    const shouldSkip = CSRF_SKIP_PATHS.some((path) =>
      pathname.startsWith(path)
    );

    if (!shouldSkip) {
      // Origin または Referer ヘッダーをチェック
      const requestOrigin = request.headers.get("origin");
      const referer = request.headers.get("referer");
      const host = request.headers.get("host");

      // 同一オリジンリクエストの検出
      // ブラウザの同一オリジンリクエストはOriginヘッダーを送信しないことがある
      // その場合、HostヘッダーとRefererで判断する
      const isSameOrigin = host && ALLOWED_HOSTS.includes(host);

      // Origin ヘッダーの検証
      const isValidOrigin =
        requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin);

      // Referer ヘッダーの検証
      const isValidReferer =
        referer &&
        ALLOWED_ORIGINS.some((allowed) => referer.startsWith(allowed));

      // 同一オリジンでOrigin/Refererがない場合は許可
      // （ブラウザの同一オリジンfetchリクエスト）
      const isLikelySameOriginFetch =
        isSameOrigin && !requestOrigin && !referer;

      if (!isValidOrigin && !isValidReferer && !isLikelySameOriginFetch) {
        console.warn(
          `CSRF validation failed: origin=${requestOrigin}, referer=${referer}, host=${host}, path=${pathname}`
        );
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: { code: "CSRF_ERROR", message: "不正なリクエスト元です" },
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  return response;
}

// ミドルウェアを適用するパス
export const config = {
  matcher: ["/api/:path*"],
};
