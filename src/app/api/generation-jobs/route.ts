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
import { GenerationJobStatus, PublishStrategy, ImageStyle } from "@prisma/client";
import { z } from "zod";
import { isAppError } from "@/lib/errors";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";
import { randomUUID } from "crypto";

// バリデーションスキーマ
const createJobSchema = z.object({
  categoryId: z.string().min(1),
  authorId: z.string().min(1),
  brandId: z.string().min(1),
  conversionIds: z.array(z.string()).optional().default([]),
  // 受講生の声ベース生成に使用
  knowledgeItemIds: z.array(z.string()).optional().default([]),
  publishStrategy: z
    .enum(["DRAFT", "PUBLISH_NOW", "SCHEDULED"])
    .optional()
    .default("DRAFT"),
  scheduledAt: z.string().datetime().optional(),
  // パイプラインバージョン: V6（固定）
  pipelineVersion: z.literal("v6").optional().default("v6"),
  // 画像スタイル（本文画像用）: REALISTIC（リアル）、SCENIC（風景系）、HANDDRAWN（手書き）、WATERCOLOR（レガシー）
  // カバー画像は常にリアル写真風
  imageStyle: z.enum(["REALISTIC", "SCENIC", "HANDDRAWN", "WATERCOLOR"]).optional().default("REALISTIC"),
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
          generation_stages: {
            select: {
              stage: true,
              stageName: true,
              status: true,
              tokensUsed: true,
              startedAt: true,
              completedAt: true,
            },
            orderBy: { stage: "asc" },
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
      const conversionIds = validated.conversionIds ?? [];
      if (conversionIds.length > 0) {
        const conversions = await prisma.conversions.findMany({
          where: { id: { in: conversionIds } },
        });
        if (conversions.length !== conversionIds.length) {
          return errorResponse("NOT_FOUND", "一部のコンバージョンが見つかりません", 404);
        }
      }

      // 情報バンクの存在確認
      const knowledgeItemIds = validated.knowledgeItemIds ?? [];
      if (knowledgeItemIds.length > 0) {
        const knowledgeItems = await prisma.knowledge_items.findMany({
          where: { id: { in: knowledgeItemIds } },
        });
        if (knowledgeItems.length !== knowledgeItemIds.length) {
          return errorResponse("NOT_FOUND", "一部の情報バンクが見つかりません", 404);
        }
      }

      // 受講生の声が必要
      if (knowledgeItemIds.length === 0) {
        return errorResponse(
          "VALIDATION_ERROR",
          "受講生の声を選択してください",
          400
        );
      }

      // 直近の完了済みジョブのimageStyleを取得してラウンドロビン
      const lastJob = await prisma.generation_jobs.findFirst({
        where: { status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        select: { imageStyle: true }
      });

      const styleRotation: Record<ImageStyle, ImageStyle> = {
        [ImageStyle.REALISTIC]: ImageStyle.SCENIC,
        [ImageStyle.SCENIC]: ImageStyle.HANDDRAWN,
        [ImageStyle.HANDDRAWN]: ImageStyle.REALISTIC,
        [ImageStyle.WATERCOLOR]: ImageStyle.REALISTIC, // レガシー対応
      };

      const nextImageStyle = lastJob?.imageStyle
        ? styleRotation[lastJob.imageStyle]
        : ImageStyle.REALISTIC;

      console.log(`[Generation Jobs] imageStyle選択: 直近=${lastJob?.imageStyle || 'なし'} → 次回=${nextImageStyle}`);

      const jobs = [];

      // 各knowledgeItemIdに対して1つのジョブを作成（V6パイプライン固定）
      for (const knowledgeItemId of knowledgeItemIds) {
        const job = await prisma.generation_jobs.create({
          data: {
            id: randomUUID(),
            keyword: "V6パイプライン（自動生成）",
            categoryId: validated.categoryId,
            authorId: validated.authorId,
            brandId: validated.brandId,
            userId: user.id,
            publishStrategy: validated.publishStrategy as PublishStrategy,
            imageStyle: nextImageStyle,
            scheduledAt: validated.scheduledAt
              ? new Date(validated.scheduledAt)
              : null,
            generation_job_conversions: {
              create: conversionIds.map((conversionId: string) => ({
                conversionId,
              })),
            },
            generation_job_knowledge_items: {
              create: [{ knowledgeItemId }],
            },
          },
        });

        // V6パイプラインでイベントを発火
        await inngest.send({
          name: "article/generate-pipeline-v6",
          data: {
            jobId: job.id,
            knowledgeItemId,
            categoryId: validated.categoryId,
            authorId: validated.authorId,
            brandId: validated.brandId,
            conversionIds,
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
