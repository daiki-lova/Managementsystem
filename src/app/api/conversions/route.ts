import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { withAuth, withOwnerAuth } from "@/lib/auth";
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
import { ConversionType, ConversionStatus } from "@prisma/client";
import { auditLog } from "@/lib/audit-log";
import { randomUUID } from "crypto";

// コンバージョン一覧取得
export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async () => {
      const { searchParams } = new URL(request.url);
      const { page, limit } = parsePaginationParams(searchParams);
      const status = searchParams.get("status") as ConversionStatus | null;
      const type = searchParams.get("type") as ConversionType | null;

      const where = {
        ...(status && { status }),
        ...(type && { type }),
      };

      const total = await prisma.conversions.count({ where });
      const { skip, take, totalPages } = calculatePagination(total, page, limit);

      const conversions = await prisma.conversions.findMany({
        where,
        skip,
        take,
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
        orderBy: { createdAt: "desc" },
      });

      return paginatedResponse({
        items: conversions.map((c) => ({
          ...c,
          articlesCount: c._count.article_conversions,
          _count: undefined,
        })),
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
    console.error("Get conversions error:", error);
    return ApiErrors.internalError();
  }
}

// コンバージョン作成スキーマ
const createConversionSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.string().min(1).max(50), // フロントエンド互換（文字列）
  status: z.string().max(20).optional(), // フロントエンド互換（文字列）
  url: z.string(),
  thumbnailUrl: z.union([z.string(), z.null()]).optional(),
  context: z.string().optional(), // AI生成用コンテキスト（オプショナル化）
  description: z.string().optional(), // contextのエイリアス（フロントエンド互換）
  period: z.string().optional(), // フロントエンド互換（未使用だが受け入れる）
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  startDate: z.string().optional(), // periodStartのエイリアス（フロントエンド互換）
  endDate: z.string().optional(), // periodEndのエイリアス（フロントエンド互換）
});

// コンバージョン作成（オーナーのみ）
export async function POST(request: NextRequest) {
  try {
    return await withOwnerAuth(request, async (user) => {
      const data = await validateBody(request, createConversionSchema);

      // フィールド名のエイリアス解決
      const resolvedContext = data.context || data.description || "";
      const resolvedPeriodStart = data.periodStart || data.startDate;
      const resolvedPeriodEnd = data.periodEnd || data.endDate;

      // typeの変換（文字列からEnum）- 有効な値のみ許可
      const typeUpper = data.type?.toUpperCase() || "TEXT";
      const validTypes = ["BANNER", "TEXT", "INLINE"] as const;
      const typeValue: ConversionType = validTypes.includes(typeUpper as typeof validTypes[number])
        ? (typeUpper as ConversionType)
        : ConversionType.TEXT;

      // statusの変換（文字列からEnum）- 有効な値のみ許可
      const statusUpper = data.status?.toUpperCase() || "ACTIVE";
      const validStatuses = ["ACTIVE", "INACTIVE", "PAUSED"] as const;
      const statusValue: ConversionStatus = validStatuses.includes(statusUpper as typeof validStatuses[number])
        ? (statusUpper as ConversionStatus)
        : ConversionStatus.ACTIVE;

      const conversion = await prisma.conversions.create({
        data: {
          id: randomUUID(),
          name: data.name,
          type: typeValue,
          status: statusValue,
          url: data.url,
          thumbnailUrl: data.thumbnailUrl,
          context: resolvedContext,
          periodStart: resolvedPeriodStart ? new Date(resolvedPeriodStart) : null,
          periodEnd: resolvedPeriodEnd ? new Date(resolvedPeriodEnd) : null,
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
          createdAt: true,
        },
      });

      // 監査ログ
      await auditLog.masterDataChange(
        request,
        "CONVERSION_CREATE",
        user.id,
        "conversion",
        conversion.id,
        { name: conversion.name }
      );

      return successResponse(conversion, undefined, 201);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}
