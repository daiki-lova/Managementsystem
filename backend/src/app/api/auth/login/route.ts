import { NextRequest } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import prisma from "@/lib/prisma";
import { successResponse, ApiErrors, errorResponse } from "@/lib/api-response";
import { validateBody } from "@/lib/validation";
import { isAppError } from "@/lib/errors";
import {
  checkRateLimit,
  RATE_LIMIT_CONFIGS,
  recordLoginFailure,
  clearLoginFailure,
  isAccountLocked,
} from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit-log";

const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export async function POST(request: NextRequest) {
  try {
    // レート制限チェック
    const rateLimitResult = checkRateLimit(
      request,
      RATE_LIMIT_CONFIGS.auth,
      "auth"
    );
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil(
        (rateLimitResult.resetAt - Date.now()) / 1000
      );
      return errorResponse(
        "RATE_LIMITED",
        `リクエスト制限に達しました。${retryAfter}秒後に再試行してください`,
        429
      );
    }

    const { email, password } = await validateBody(request, loginSchema);

    // アカウントロックチェック
    if (isAccountLocked(email)) {
      await auditLog.loginFailed(request, email, "アカウントロック中");
      return errorResponse(
        "ACCOUNT_LOCKED",
        "アカウントがロックされています。しばらく時間をおいて再試行してください",
        423
      );
    }

    // Supabase で認証
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData.session) {
      // ログイン失敗を記録
      const failureResult = recordLoginFailure(email);
      await auditLog.loginFailed(request, email, authError?.message || "認証失敗");

      if (failureResult.locked) {
        return errorResponse(
          "ACCOUNT_LOCKED",
          "ログイン試行回数が上限に達しました。アカウントがロックされました",
          423
        );
      }

      return errorResponse(
        "UNAUTHORIZED",
        `認証に失敗しました。残り試行回数: ${failureResult.remainingAttempts}`,
        401
      );
    }

    // DB からユーザー情報を取得
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      },
    });

    if (!user) {
      await auditLog.loginFailed(request, email, "DBにユーザーが存在しない");
      return ApiErrors.unauthorized();
    }

    // ログイン成功: 失敗カウンターをリセット
    clearLoginFailure(email);

    // 監査ログ
    await auditLog.login(request, user.id, email);

    return successResponse({
      user,
      session: {
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expiresAt: authData.session.expires_at,
      },
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Login error:", error);
    return ApiErrors.internalError();
  }
}
