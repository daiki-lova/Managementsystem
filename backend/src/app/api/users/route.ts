import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { withOwnerAuth, AuthUser } from "@/lib/auth";
import {
  successResponse,
  paginatedResponse,
  ApiErrors,
  errorResponse,
  parsePaginationParams,
  calculatePagination,
} from "@/lib/api-response";
import { validateBody, commonSchemas } from "@/lib/validation";
import { isAppError, handlePrismaError } from "@/lib/errors";
import { createAuthUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { randomUUID } from "crypto";

// ユーザー一覧取得（オーナーのみ）
export async function GET(request: NextRequest) {
  try {
    return await withOwnerAuth(request, async () => {
      const { searchParams } = new URL(request.url);
      const { page, limit } = parsePaginationParams(searchParams);

      const total = await prisma.users.count();
      const { skip, take, totalPages } = calculatePagination(total, page, limit);

      const users = await prisma.users.findMany({
        skip,
        take,
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return paginatedResponse({
        items: users,
        total,
        page,
        limit,
        totalPages,
      });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Get users error:", error);
    return ApiErrors.internalError();
  }
}

// ユーザー作成スキーマ
const createUserSchema = z.object({
  email: commonSchemas.email,
  password: commonSchemas.password,
  name: z.string().min(1).max(100).optional(),
  role: z.nativeEnum(UserRole).default(UserRole.WRITER),
});

// ユーザー作成（オーナーのみ）
export async function POST(request: NextRequest) {
  try {
    return await withOwnerAuth(request, async () => {
      const data = await validateBody(request, createUserSchema);

      // Supabase Auth でユーザー作成
      const authUserId = await createAuthUser(data.email, data.password);

      // DB にユーザー作成
      const user = await prisma.users.create({
        data: {
          id: randomUUID(),
          email: data.email,
          password: authUserId, // Supabase のユーザーIDを保存（パスワードはSupabaseで管理）
          name: data.name,
          role: data.role,
        },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          createdAt: true,
        },
      });

      return successResponse(user, undefined, 201);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}
