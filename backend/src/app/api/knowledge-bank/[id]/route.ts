import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
import {
  successResponse,
  ApiErrors,
  errorResponse,
} from "@/lib/api-response";
import { validateBody, commonSchemas } from "@/lib/validation";
import { isAppError, handlePrismaError, NotFoundError } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 情報バンク詳細取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async () => {
      const { id } = await params;

      const item = await prisma.knowledgeItem.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          type: true,
          course: true,
          content: true,
          sourceUrl: true,
          sourceScrapedAt: true,
          usageCount: true,
          createdAt: true,
          updatedAt: true,
          brand: {
            select: { id: true, name: true, slug: true },
          },
          author: {
            select: { id: true, name: true, role: true },
          },
          articles: {
            select: {
              article: {
                select: { id: true, title: true, slug: true, status: true },
              },
            },
            take: 10,
          },
        },
      });

      if (!item) {
        return ApiErrors.notFound("情報バンク項目");
      }

      return successResponse({
        ...item,
        articles: item.articles.map((a) => a.article),
      });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Get knowledge item error:", error);
    return ApiErrors.internalError();
  }
}

// 情報バンク更新スキーマ
const updateKnowledgeItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: z.string().min(1).max(50).optional(),
  brandId: commonSchemas.id.optional().nullable(),
  course: z.string().max(100).optional().nullable(),
  authorId: commonSchemas.id.optional().nullable(),
  content: z.string().min(1).optional(),
  sourceUrl: commonSchemas.url.optional().nullable(),
});

// 情報バンク更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async () => {
      const { id } = await params;
      const data = await validateBody(request, updateKnowledgeItemSchema);

      // 存在確認
      const existing = await prisma.knowledgeItem.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError("情報バンク項目");
      }

      const item = await prisma.knowledgeItem.update({
        where: { id },
        data: {
          title: data.title,
          type: data.type,
          brandId: data.brandId,
          course: data.course,
          authorId: data.authorId,
          content: data.content,
          sourceUrl: data.sourceUrl,
        },
        select: {
          id: true,
          title: true,
          type: true,
          course: true,
          content: true,
          sourceUrl: true,
          updatedAt: true,
        },
      });

      return successResponse(item);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}

// 情報バンク削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async () => {
      const { id } = await params;

      // 存在確認
      const existing = await prisma.knowledgeItem.findUnique({
        where: { id },
      });

      if (!existing) {
        return ApiErrors.notFound("情報バンク項目");
      }

      // 紐づいている記事からは自動で削除される（Cascade）
      await prisma.knowledgeItem.delete({
        where: { id },
      });

      return successResponse({ message: "情報バンク項目を削除しました" });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}
