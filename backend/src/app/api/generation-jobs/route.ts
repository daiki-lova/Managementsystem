import { NextRequest } from "next/server";
import {
  successResponse,
  paginatedResponse,
  errorResponse,
  ApiErrors,
  parsePaginationParams,
  calculatePagination,
} from "@/lib/api-response";
import { withAuth } from "@/lib/auth";
import { validateBody } from "@/lib/validation";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { GenerationJobStatus, PublishStrategy } from "@prisma/client";
import { z } from "zod";
import { isAppError } from "@/lib/errors";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";
import { randomUUID } from "crypto";

// バリデーションスキーマ
const createJobSchema = z.object({
  keywords: z
    .array(
      z.object({
        keyword: z.string().min(1),
        searchVolume: z.number().optional(),
      })
    )
    .min(1)
    .max(5), // 最大5キーワード同時生成
  categoryId: z.string().min(1),
  authorId: z.string().min(1),
  brandId: z.string().min(1),
  conversionIds: z.array(z.string()).optional().default([]),
  knowledgeItemIds: z.array(z.string()).optional().default([]),
  publishStrategy: z
    .enum(["DRAFT", "PUBLISH_NOW", "SCHEDULED"])
    .optional()
    .default("DRAFT"),
  scheduledAt: z.string().datetime().optional(),
});

// GET /api/generation-jobs - ジョブ一覧取得
export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async (user) => {
      const { searchParams } = new URL(request.url);
      const { page, limit } = parsePaginationParams(searchParams);
      const status = searchParams.get("status") as GenerationJobStatus | null;

      const where = {
        userId: user.id,
        ...(status && { status }),
      };

      const total = await prisma.generation_jobs.count({ where });
      const { skip, take, totalPages } = calculatePagination(total, page, limit);

      const jobs = await prisma.generation_jobs.findMany({
        where,
        include: {
          categories: { select: { id: true, name: true } },
          authors: { select: { id: true, name: true } },
          articles: {
            select: { id: true, title: true, slug: true, status: true },
          },
          _count: {
            select: { articles: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      });

      return paginatedResponse({
        items: jobs,
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
    console.error("Generation jobs list error:", error);
    return ApiErrors.internalError();
  }
}

// POST /api/generation-jobs - 新規ジョブ作成
export async function POST(request: NextRequest) {
  try {
    // AI生成のレート制限: 10リクエスト/時
    const rateLimitResult = checkRateLimit(
      request,
      RATE_LIMIT_CONFIGS.generation,
      "generation"
    );
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil(
        (rateLimitResult.resetAt - Date.now()) / 1000
      );
      return errorResponse(
        "RATE_LIMITED",
        `AI生成の制限に達しました。${Math.ceil(retryAfter / 60)}分後に再試行してください`,
        429
      );
    }

    return await withAuth(request, async (user) => {
      const validated = await validateBody(request, createJobSchema);

      // カテゴリ、監修者、ブランドの存在確認
      const [category, author, brand] = await Promise.all([
        prisma.categories.findUnique({ where: { id: validated.categoryId } }),
        prisma.authors.findUnique({ where: { id: validated.authorId } }),
        prisma.brands.findUnique({ where: { id: validated.brandId } }),
      ]);

      if (!category) {
        return errorResponse("NOT_FOUND", "カテゴリが見つかりません", 404);
      }
      if (!author) {
        return errorResponse("NOT_FOUND", "監修者が見つかりません", 404);
      }
      if (!brand) {
        return errorResponse("NOT_FOUND", "ブランドが見つかりません", 404);
      }

      // コンバージョンの存在確認
      if (validated.conversionIds.length > 0) {
        const conversions = await prisma.conversions.findMany({
          where: { id: { in: validated.conversionIds } },
        });
        if (conversions.length !== validated.conversionIds.length) {
          return errorResponse("NOT_FOUND", "一部のコンバージョンが見つかりません", 404);
        }
      }

      // 情報バンクの存在確認
      if (validated.knowledgeItemIds.length > 0) {
        const knowledgeItems = await prisma.knowledge_items.findMany({
          where: { id: { in: validated.knowledgeItemIds } },
        });
        if (knowledgeItems.length !== validated.knowledgeItemIds.length) {
          return errorResponse("NOT_FOUND", "一部の情報バンクが見つかりません", 404);
        }
      }

      // 各キーワードに対してジョブを作成
      const jobs = [];

      for (const keywordData of validated.keywords) {
        // ジョブを作成
        const job = await prisma.generation_jobs.create({
          data: {
            id: randomUUID(),
            keyword: keywordData.keyword,
            searchVolume: keywordData.searchVolume,
            categoryId: validated.categoryId,
            authorId: validated.authorId,
            userId: user.id,
            publishStrategy: validated.publishStrategy as PublishStrategy,
            scheduledAt: validated.scheduledAt
              ? new Date(validated.scheduledAt)
              : null,
            generation_job_conversions: {
              create: validated.conversionIds.map((conversionId: string) => ({
                conversionId,
              })),
            },
            generation_job_knowledge_items: {
              create: validated.knowledgeItemIds.map((knowledgeItemId: string) => ({
                knowledgeItemId,
              })),
            },
          },
        });

        // Inngestイベントを発火
        await inngest.send({
          name: "article/generate",
          data: {
            jobId: job.id,
            keyword: keywordData.keyword,
            categoryId: validated.categoryId,
            authorId: validated.authorId,
            brandId: validated.brandId,
            conversionIds: validated.conversionIds,
            knowledgeItemIds: validated.knowledgeItemIds,
            userId: user.id,
          },
        });

        jobs.push(job);
      }

      return successResponse(
        {
          jobs,
          message: `${jobs.length}件の記事生成を開始しました`,
        },
        undefined,
        201
      );
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Generation job create error:", error);
    return ApiErrors.internalError();
  }
}
