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
  title: z.string().min(1).max(200),
  type: z.string().min(1).max(50), // お客様の声、体験談、事例、講座情報など
  brandId: commonSchemas.id.optional(),
  course: z.string().max(100).optional(),
  authorId: commonSchemas.id.optional(),
  content: z.string().min(1),
  sourceUrl: commonSchemas.url.optional(),
});

// 情報バンク作成
export async function POST(request: NextRequest) {
  try {
    return await withAuth(request, async () => {
      const data = await validateBody(request, createKnowledgeItemSchema);

      const item = await prisma.knowledge_items.create({
        data: {
          id: randomUUID(),
          title: data.title,
          type: data.type,
          brandId: data.brandId,
          course: data.course,
          authorId: data.authorId,
          content: data.content,
          sourceUrl: data.sourceUrl,
          sourceScrapedAt: data.sourceUrl ? new Date() : null,
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
