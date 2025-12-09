import { NextRequest } from "next/server";
import { successResponse, errorResponse, ApiErrors } from "@/lib/api-response";
import { withAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { GenerationJobStatus } from "@prisma/client";
import { isAppError } from "@/lib/errors";
import { inngest } from "@/inngest/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/generation-jobs/:id - ジョブ詳細取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    return await withAuth(request, async (user) => {
      const job = await prisma.generationJob.findUnique({
        where: { id },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          author: { select: { id: true, name: true, role: true } },
          user: { select: { id: true, name: true, email: true } },
          conversions: {
            include: {
              conversion: { select: { id: true, name: true, type: true } },
            },
          },
          knowledgeItems: {
            include: {
              knowledgeItem: { select: { id: true, title: true, type: true } },
            },
          },
          articles: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      if (!job) {
        return ApiErrors.notFound("ジョブ");
      }

      // 自分のジョブのみ取得可能
      if (job.userId !== user.id && user.role !== "OWNER") {
        return ApiErrors.forbidden();
      }

      return successResponse(job);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Generation job get error:", error);
    return ApiErrors.internalError();
  }
}

// DELETE /api/generation-jobs/:id - ジョブキャンセル
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    return await withAuth(request, async (user) => {
      const job = await prisma.generationJob.findUnique({
        where: { id },
      });

      if (!job) {
        return ApiErrors.notFound("ジョブ");
      }

      // 自分のジョブのみキャンセル可能
      if (job.userId !== user.id && user.role !== "OWNER") {
        return ApiErrors.forbidden();
      }

      // 実行中または待機中のジョブのみキャンセル可能
      if (
        job.status !== GenerationJobStatus.PENDING &&
        job.status !== GenerationJobStatus.RUNNING
      ) {
        return errorResponse("BAD_REQUEST", "このジョブはキャンセルできません", 400);
      }

      // ステータスをキャンセルに更新
      const updated = await prisma.generationJob.update({
        where: { id },
        data: {
          status: GenerationJobStatus.CANCELLED,
        },
      });

      // Inngestのキャンセルイベントを発火
      // これにより実行中のInngest関数がキャンセルされる
      await inngest.send({
        name: "article/cancel-generation",
        data: { jobId: id },
      });

      return successResponse({
        ...updated,
        message: "ジョブをキャンセルしました",
      });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Generation job cancel error:", error);
    return ApiErrors.internalError();
  }
}
