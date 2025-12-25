import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { successResponse, ApiErrors } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    // Authorization ヘッダーからトークンを取得
    const authHeader = request.headers.get("authorization");
    const accessToken = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (accessToken) {
      // Supabase でセッションを無効化
      await supabaseAdmin.auth.admin.signOut(accessToken);
    }

    return successResponse({ message: "ログアウトしました" });
  } catch (error) {
    console.error("Logout error:", error);
    return ApiErrors.internalError();
  }
}
