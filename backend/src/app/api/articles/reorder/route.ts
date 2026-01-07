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
import { isAppError, handlePrismaError } from "@/lib/errors";

// 順番更新スキーマ
const reorderSchema = z.object({
  // 新しい順番の配列 [{ id: "article-id", displayOrder: 0 }, ...]
  items: z.array(
    z.object({
      id: commonSchemas.id,
      displayOrder: z.number().int().nonnegative(),
    })
  ),
});

// 記事の順番を一括更新
export async function PUT(request: NextRequest) {
  try {
    return await withAuth(request, async () => {
      const data = await validateBody(request, reorderSchema);

      // トランザクションで一括更新
      await prisma.$transaction(
        data.items.map((item) =>
          prisma.articles.update({
            where: { id: item.id },
            data: { displayOrder: item.displayOrder },
          })
        )
      );

      return successResponse({ success: true, updated: data.items.length });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}
