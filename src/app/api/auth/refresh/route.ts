import { NextRequest } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import prisma from "@/lib/prisma";
import { successResponse, ApiErrors, errorResponse } from "@/lib/api-response";
import { validateBody } from "@/lib/validation";
import { isAppError } from "@/lib/errors";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "リフレッシュトークンが必要です"),
});

// トークンリフレッシュ
export async function POST(request: NextRequest) {
  try {
    // レート制限チェック（認証系と同じ制限）
    const rateLimitResult = checkRateLimit(
      request,
      RATE_LIMIT_CONFIGS.auth,
      "auth-refresh"
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

    const { refreshToken } = await validateBody(request, refreshSchema);

    // Supabase でトークンをリフレッシュ
    const { data: authData, error: authError } =
      await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

    if (authError || !authData.session) {
      return errorResponse(
        "INVALID_REFRESH_TOKEN",
        "リフレッシュトークンが無効または期限切れです。再ログインしてください",
        401
      );
    }

    // DB からユーザー情報を取得（トークンに含まれるメールで検索）
    const user = await prisma.users.findUnique({
      where: { email: authData.user?.email! },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      },
    });

    if (!user) {
      return ApiErrors.unauthorized();
    }

    return successResponse({
      user,
      session: {
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expiresAt: authData.session.expires_at,
        // トークンの有効期間情報を追加（クライアントで自動リフレッシュに使用）
        expiresIn: authData.session.expires_in,
      },
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Refresh error:", error);
    return ApiErrors.internalError();
  }
}
