import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { withAuth, withOwnerAuth } from "@/lib/auth";
import {
  successResponse,
  ApiErrors,
  errorResponse,
} from "@/lib/api-response";
import { validateBody, commonSchemas } from "@/lib/validation";
import { isAppError, handlePrismaError, NotFoundError } from "@/lib/errors";
import { ConversionType, ConversionStatus } from "@prisma/client";
import { auditLog } from "@/lib/audit-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// コンバージョン詳細取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async () => {
      const { id } = await params;

      const conversion = await prisma.conversion.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          url: true,
          thumbnailUrl: true,
          context: true,
          periodStart: true,
          periodEnd: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { articles: true },
          },
        },
      });

      if (!conversion) {
        return ApiErrors.notFound("コンバージョン");
      }

      return successResponse({
        ...conversion,
        articlesCount: conversion._count.articles,
        _count: undefined,
      });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Get conversion error:", error);
    return ApiErrors.internalError();
  }
}

// コンバージョン更新スキーマ
const updateConversionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.nativeEnum(ConversionType).optional(),
  status: z.nativeEnum(ConversionStatus).optional(),
  url: commonSchemas.url.optional(),
  thumbnailUrl: commonSchemas.url.optional().nullable(),
  context: z.string().min(1).optional(),
  periodStart: z.string().datetime().optional().nullable(),
  periodEnd: z.string().datetime().optional().nullable(),
});

// コンバージョン更新（オーナーのみ）
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    return await withOwnerAuth(request, async (user) => {
      const { id } = await params;
      const data = await validateBody(request, updateConversionSchema);

      // 存在確認
      const existing = await prisma.conversion.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError("コンバージョン");
      }

      const conversion = await prisma.conversion.update({
        where: { id },
        data: {
          name: data.name,
          type: data.type,
          status: data.status,
          url: data.url,
          thumbnailUrl: data.thumbnailUrl,
          context: data.context,
          periodStart: data.periodStart
            ? new Date(data.periodStart)
            : data.periodStart === null
            ? null
            : undefined,
          periodEnd: data.periodEnd
            ? new Date(data.periodEnd)
            : data.periodEnd === null
            ? null
            : undefined,
        },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          url: true,
          thumbnailUrl: true,
          context: true,
          periodStart: true,
          periodEnd: true,
          updatedAt: true,
        },
      });

      // 監査ログ
      await auditLog.masterDataChange(
        request,
        "CONVERSION_UPDATE",
        user.id,
        "conversion",
        conversion.id,
        { name: conversion.name, changes: data }
      );

      return successResponse(conversion);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}

// コンバージョン削除（オーナーのみ）
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    return await withOwnerAuth(request, async (user) => {
      const { id } = await params;

      // 存在確認
      const existing = await prisma.conversion.findUnique({
        where: { id },
      });

      if (!existing) {
        return ApiErrors.notFound("コンバージョン");
      }

      // 紐づいている記事からは自動で削除される（Cascade）
      await prisma.conversion.delete({
        where: { id },
      });

      // 監査ログ
      await auditLog.masterDataChange(
        request,
        "CONVERSION_DELETE",
        user.id,
        "conversion",
        id,
        { name: existing.name }
      );

      return successResponse({ message: "コンバージョンを削除しました" });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}
