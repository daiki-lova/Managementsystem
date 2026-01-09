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

      const conversion = await prisma.conversions.findUnique({
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
            select: { article_conversions: true },
          },
        },
      });

      if (!conversion) {
        return ApiErrors.notFound("コンバージョン");
      }

      return successResponse({
        ...conversion,
        articlesCount: conversion._count.article_conversions,
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
  type: z.string().max(50).optional(), // フロントエンド互換（文字列）
  status: z.string().max(20).optional(), // フロントエンド互換（文字列）
  url: z.string().optional(),
  thumbnailUrl: z.union([z.string(), z.null()]).optional(),
  context: z.string().optional(),
  description: z.string().optional(), // contextのエイリアス（フロントエンド互換）
  periodStart: z.string().optional().nullable(),
  periodEnd: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(), // periodStartのエイリアス
  endDate: z.string().optional().nullable(), // periodEndのエイリアス
});

// コンバージョン更新（オーナーのみ）
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    return await withOwnerAuth(request, async (user) => {
      const { id } = await params;
      const data = await validateBody(request, updateConversionSchema);
      console.log("PATCH Conversion Data:", JSON.stringify(data, null, 2));
      console.log("Thumbnail URL:", data.thumbnailUrl);

      // 存在確認
      const existing = await prisma.conversions.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError("コンバージョン");
      }

      // フィールド名のエイリアス解決
      const resolvedContext = data.context !== undefined ? data.context : data.description;
      const resolvedPeriodStart = data.periodStart !== undefined ? data.periodStart : data.startDate;
      const resolvedPeriodEnd = data.periodEnd !== undefined ? data.periodEnd : data.endDate;

      // typeの変換（文字列からEnum）- 有効な値のみ許可
      let resolvedType: ConversionType | undefined = undefined;
      if (data.type) {
        const typeUpper = data.type.toUpperCase();
        const validTypes = ["BANNER", "TEXT", "INLINE"] as const;
        if (validTypes.includes(typeUpper as typeof validTypes[number])) {
          resolvedType = typeUpper as ConversionType;
        }
      }

      // statusの変換
      let resolvedStatus: ConversionStatus | undefined = undefined;
      if (data.status) {
        const statusUpper = data.status.toUpperCase();
        const validStatuses = ["ACTIVE", "INACTIVE", "PAUSED"] as const;
        if (validStatuses.includes(statusUpper as typeof validStatuses[number])) {
          resolvedStatus = statusUpper as ConversionStatus;
        }
      }

      const conversion = await prisma.conversions.update({
        where: { id },
        data: {
          name: data.name,
          type: resolvedType,
          status: resolvedStatus,
          url: data.url,
          thumbnailUrl: data.thumbnailUrl,
          context: resolvedContext,
          periodStart: resolvedPeriodStart
            ? new Date(resolvedPeriodStart)
            : resolvedPeriodStart === null
              ? null
              : undefined,
          periodEnd: resolvedPeriodEnd
            ? new Date(resolvedPeriodEnd)
            : resolvedPeriodEnd === null
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
      const existing = await prisma.conversions.findUnique({
        where: { id },
      });

      if (!existing) {
        return ApiErrors.notFound("コンバージョン");
      }

      // 紐づいている記事からは自動で削除される（Cascade）
      await prisma.conversions.delete({
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
