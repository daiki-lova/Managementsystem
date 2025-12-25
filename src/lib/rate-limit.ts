import { NextRequest } from "next/server";
import { errorResponse } from "./api-response";

// インメモリストア（本番ではRedis推奨）
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  windowMs: number; // ウィンドウ期間（ミリ秒）
  maxRequests: number; // 最大リクエスト数
}

// デフォルト設定
export const RATE_LIMIT_CONFIGS = {
  // 一般API: 100リクエスト/分
  default: { windowMs: 60 * 1000, maxRequests: 100 },
  // 認証API: 10リクエスト/分（ブルートフォース対策）
  auth: { windowMs: 60 * 1000, maxRequests: 10 },
  // ログイン失敗: 5回/15分（ロックアウト）
  loginFailure: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  // AI生成: 10リクエスト/時
  generation: { windowMs: 60 * 60 * 1000, maxRequests: 10 },
  // ファイルアップロード: 30リクエスト/分
  upload: { windowMs: 60 * 1000, maxRequests: 30 },
  // 公開API: 60リクエスト/分
  public: { windowMs: 60 * 1000, maxRequests: 60 },
} as const;

// クライアントIDを取得（IP + User-Agent）
function getClientId(request: NextRequest): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  return `${ip}:${userAgent.slice(0, 50)}`;
}

// レート制限チェック
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.default,
  keyPrefix: string = "default"
): { allowed: boolean; remaining: number; resetAt: number } {
  const clientId = getClientId(request);
  const key = `${keyPrefix}:${clientId}`;
  const now = Date.now();

  const record = rateLimitStore.get(key);

  // 古いエントリーをクリーンアップ
  if (record && record.resetAt < now) {
    rateLimitStore.delete(key);
  }

  const currentRecord = rateLimitStore.get(key);

  if (!currentRecord) {
    // 新規エントリー
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  if (currentRecord.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: currentRecord.resetAt,
    };
  }

  currentRecord.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - currentRecord.count,
    resetAt: currentRecord.resetAt,
  };
}

// レート制限ミドルウェア
export function withRateLimit(
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.default,
  keyPrefix: string = "default"
) {
  return (request: NextRequest) => {
    const result = checkRateLimit(request, config, keyPrefix);

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      return errorResponse(
        "RATE_LIMITED",
        `リクエスト制限に達しました。${retryAfter}秒後に再試行してください`,
        429
      );
    }

    return null; // 許可
  };
}

// ログイン失敗カウンター
const loginFailureStore = new Map<string, { count: number; lockedUntil: number | null }>();

export function recordLoginFailure(email: string): { locked: boolean; remainingAttempts: number } {
  const key = `login:${email}`;
  const now = Date.now();
  const config = RATE_LIMIT_CONFIGS.loginFailure;

  const record = loginFailureStore.get(key);

  // ロック中かチェック
  if (record?.lockedUntil && record.lockedUntil > now) {
    return { locked: true, remainingAttempts: 0 };
  }

  // ロック解除またはリセット
  if (record?.lockedUntil && record.lockedUntil <= now) {
    loginFailureStore.delete(key);
  }

  const currentRecord = loginFailureStore.get(key) || { count: 0, lockedUntil: null };
  currentRecord.count++;

  if (currentRecord.count >= config.maxRequests) {
    // アカウントロック
    currentRecord.lockedUntil = now + config.windowMs;
    loginFailureStore.set(key, currentRecord);
    return { locked: true, remainingAttempts: 0 };
  }

  loginFailureStore.set(key, currentRecord);
  return { locked: false, remainingAttempts: config.maxRequests - currentRecord.count };
}

export function clearLoginFailure(email: string): void {
  loginFailureStore.delete(`login:${email}`);
}

export function isAccountLocked(email: string): boolean {
  const record = loginFailureStore.get(`login:${email}`);
  if (!record?.lockedUntil) return false;
  return record.lockedUntil > Date.now();
}

// 定期的なクリーンアップ（古いエントリー削除）
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
  for (const [key, record] of loginFailureStore.entries()) {
    if (record.lockedUntil && record.lockedUntil < now - 60 * 60 * 1000) {
      loginFailureStore.delete(key);
    }
  }
}, 60 * 1000); // 1分ごと
