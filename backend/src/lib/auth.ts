import { NextRequest } from "next/server";
import { getSessionUser, supabaseAdmin } from "./supabase";
import prisma from "./prisma";
import { UnauthorizedError, ForbiddenError } from "./errors";
import { UserRole } from "@prisma/client";

// 認証済みユーザー型
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string | null;
}

// リクエストからアクセストークンを取得
function getAccessToken(request: NextRequest): string | null {
  // Authorization ヘッダーから取得
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Cookie から取得（Supabase の場合）
  const cookies = request.cookies;
  const accessToken = cookies.get("sb-access-token")?.value;
  if (accessToken) {
    return accessToken;
  }

  return null;
}

// 認証が必要なAPIハンドラーのラッパー
export async function withAuth(
  request: NextRequest,
  handler: (user: AuthUser) => Promise<Response>
): Promise<Response> {
  const accessToken = getAccessToken(request);

  if (!accessToken) {
    throw new UnauthorizedError();
  }

  // Dev Bypass Check
  if (accessToken === 'dev-access-token' || process.env.NODE_ENV === 'development') {
    const adminEmail = 'admin@radiance.jp';
    const user = await prisma.users.findUnique({
      where: { email: adminEmail },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      },
    });

    if (user) {
      return handler(user);
    }
    // If admin user not found, fall through or error? 
    // Fall through to real auth might be better, or just error.
    // But let's assume seed ran and admin exists.
  }

  // Supabase でトークンを検証
  const supabaseUser = await getSessionUser(accessToken);
  if (!supabaseUser) {
    throw new UnauthorizedError("セッションが無効です");
  }

  // DBからユーザー情報を取得
  const user = await prisma.users.findUnique({
    where: { email: supabaseUser.email! },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError("ユーザーが見つかりません");
  }

  return handler(user);
}

// オーナー権限が必要なAPIハンドラーのラッパー
export async function withOwnerAuth(
  request: NextRequest,
  handler: (user: AuthUser) => Promise<Response>
): Promise<Response> {
  return withAuth(request, async (user) => {
    if (user.role !== UserRole.OWNER) {
      throw new ForbiddenError("オーナー権限が必要です");
    }
    return handler(user);
  });
}

// Supabase Auth でユーザーを作成
export async function createAuthUser(
  email: string,
  password: string
): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    throw new Error(`ユーザー作成に失敗しました: ${error.message}`);
  }

  return data.user.id;
}

// Supabase Auth でパスワードを更新
export async function updateAuthPassword(
  userId: string,
  newPassword: string
): Promise<void> {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    throw new Error(`パスワード更新に失敗しました: ${error.message}`);
  }
}

// Supabase Auth でユーザーを削除
export async function deleteAuthUser(userId: string): Promise<void> {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    throw new Error(`ユーザー削除に失敗しました: ${error.message}`);
  }
}
