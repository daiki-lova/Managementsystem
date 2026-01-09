import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
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
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

// 情報バンク一覧取得
export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async () => {
      const { searchParams } = new URL(request.url);
      const { page, limit } = parsePaginationParams(searchParams);

      const type = searchParams.get("type");
      const brandId = searchParams.get("brandId");
      const authorId = searchParams.get("authorId");
      const course = searchParams.get("course");
      const search = searchParams.get("search");

      const where: Prisma.knowledge_itemsWhereInput = {
        ...(type && { type }),
        ...(brandId && { brandId }),
        ...(authorId && { authorId }),
        ...(course && { course }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
          ],
        }),
      };

      const total = await prisma.knowledge_items.count({ where });
      const { skip, take, totalPages } = calculatePagination(total, page, limit);

      const items = await prisma.knowledge_items.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          course: true,
          sourceUrl: true,
          sourceScrapedAt: true,
          usageCount: true,
          createdAt: true,
          updatedAt: true,
          brands: {
            select: { id: true, name: true, slug: true },
          },
          authors: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return paginatedResponse({
        items,
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
    console.error("Get knowledge items error:", error);
    return ApiErrors.internalError();
  }
}

// 情報バンク作成スキーマ
const createKnowledgeItemSchema = z.object({
  title: z.string().max(200).optional(),
  type: z.string().max(50).optional(), // お客様の声、体験談、事例、講座情報など
  kind: z.string().max(50).optional(), // typeのエイリアス（フロントエンド互換）
  brandId: commonSchemas.id.optional(),
  course: z.string().max(100).optional(),
  authorId: commonSchemas.id.optional(),
  content: z.string().min(1),
  sourceUrl: commonSchemas.url.optional(),
  url: commonSchemas.url.optional(), // sourceUrlのエイリアス（フロントエンド互換）
  sourceType: z.string().max(50).optional(),
});

// 情報バンク作成
export async function POST(request: NextRequest) {
  try {
    return await withAuth(request, async () => {
      const data = await validateBody(request, createKnowledgeItemSchema);

      // フィールド名のエイリアス解決
      const resolvedType = data.type || data.kind || "その他";
      const resolvedSourceUrl = data.sourceUrl || data.url;

      // brandIdが存在するか確認（存在しない場合はnull）
      let resolvedBrandId: string | null = null;
      if (data.brandId) {
        if (!data.brandId.match(/^[0-9a-f-]{36}$/i)) {
          // UUIDでない場合、スラグとして検索
          const brand = await prisma.brands.findFirst({
            where: { slug: data.brandId.toLowerCase() },
            select: { id: true },
          });
          resolvedBrandId = brand?.id || null;
        } else {
          const brand = await prisma.brands.findUnique({ where: { id: data.brandId } });
          if (brand) {
            resolvedBrandId = data.brandId;
          }
        }
      }

      // authorIdが存在するか確認（存在しない場合はnull）
      let resolvedAuthorId: string | null = null;
      if (data.authorId) {
        const author = await prisma.authors.findUnique({ where: { id: data.authorId } });
        if (author) {
          resolvedAuthorId = data.authorId;
        }
      }

      const item = await prisma.knowledge_items.create({
        data: {
          id: randomUUID(),
          title: data.title || "無題",
          type: resolvedType,
          brandId: resolvedBrandId,
          course: data.course,
          authorId: resolvedAuthorId,
          content: data.content,
          sourceUrl: resolvedSourceUrl,
          sourceScrapedAt: resolvedSourceUrl ? new Date() : null,
        },
        select: {
          id: true,
          title: true,
          type: true,
          course: true,
          content: true,
          sourceUrl: true,
          createdAt: true,
        },
      });

      return successResponse(item, undefined, 201);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}
