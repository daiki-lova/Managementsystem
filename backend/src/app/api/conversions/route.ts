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

      const total = await prisma.conversion.count({ where });
      const { skip, take, totalPages } = calculatePagination(total, page, limit);

      const conversions = await prisma.conversion.findMany({
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
            select: { articles: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return paginatedResponse({
        items: conversions.map((c) => ({
          ...c,
          articlesCount: c._count.articles,
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
  type: z.nativeEnum(ConversionType),
  status: z.nativeEnum(ConversionStatus).default(ConversionStatus.ACTIVE),
  url: commonSchemas.url,
  thumbnailUrl: commonSchemas.url.optional(),
  context: z.string().min(1), // AI生成用コンテキスト
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
});

// コンバージョン作成（オーナーのみ）
export async function POST(request: NextRequest) {
  try {
    return await withOwnerAuth(request, async (user) => {
      const data = await validateBody(request, createConversionSchema);

      const conversion = await prisma.conversion.create({
        data: {
          name: data.name,
          type: data.type,
          status: data.status,
          url: data.url,
          thumbnailUrl: data.thumbnailUrl,
          context: data.context,
          periodStart: data.periodStart ? new Date(data.periodStart) : null,
          periodEnd: data.periodEnd ? new Date(data.periodEnd) : null,
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
