import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { withAuth, withOwnerAuth, AuthUser } from "@/lib/auth";
import {
  successResponse,
  ApiErrors,
  errorResponse,
} from "@/lib/api-response";
import { validateBody, commonSchemas } from "@/lib/validation";
import { isAppError, handlePrismaError, NotFoundError } from "@/lib/errors";
import { UserRole } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ユーザー詳細取得（認証必須）
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async (currentUser: AuthUser) => {
      const { id } = await params;

      // 自分以外の情報はオーナーのみ閲覧可能
      if (id !== currentUser.id && currentUser.role !== UserRole.OWNER) {
        return ApiErrors.forbidden();
      }

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return ApiErrors.notFound("ユーザー");
      }

      return successResponse(user);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Get user error:", error);
    return ApiErrors.internalError();
  }
}

// ユーザー更新スキーマ
const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.nativeEnum(UserRole).optional(),
});

// ユーザー更新（オーナーのみ、または自分のプロフィール）
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async (currentUser: AuthUser) => {
      const { id } = await params;
      const data = await validateBody(request, updateUserSchema);

      // 自分以外の更新はオーナーのみ可能
      if (id !== currentUser.id && currentUser.role !== UserRole.OWNER) {
        return ApiErrors.forbidden();
      }

      // 自分のロール変更は不可
      if (id === currentUser.id && data.role) {
        return ApiErrors.badRequest("自分のロールは変更できません");
      }

      // ユーザー存在確認
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new NotFoundError("ユーザー");
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          name: data.name,
          role: data.role,
        },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          updatedAt: true,
        },
      });

      return successResponse(user);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}

// ユーザー削除（オーナーのみ、自分は削除不可）
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    return await withOwnerAuth(request, async (currentUser: AuthUser) => {
      const { id } = await params;

      // 自分自身は削除不可
      if (id === currentUser.id) {
        return ApiErrors.badRequest("自分自身は削除できません");
      }

      // ユーザー存在確認
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return ApiErrors.notFound("ユーザー");
      }

      await prisma.user.delete({
        where: { id },
      });

      return successResponse({ message: "ユーザーを削除しました" });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}
