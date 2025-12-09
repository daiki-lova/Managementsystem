import { NextRequest } from "next/server";
import {
  paginatedResponse,
  ApiErrors,
  errorResponse,
  parsePaginationParams,
  calculatePagination,
} from "@/lib/api-response";
import { withOwnerAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isAppError } from "@/lib/errors";
import { Prisma } from "@prisma/client";

/**
 * 監査ログ閲覧API（オーナーのみ）
 *
 * 監査ログの保持期間:
 * - デフォルト: 90日間
 * - 古いログは定期的に削除（Cron ジョブで実装推奨）
 *
 * 記録対象の操作:
 * - 認証: ログイン成功/失敗、ログアウト、パスワード変更
 * - ユーザー: 作成、更新、削除
 * - 記事: 公開、ゴミ箱移動、完全削除
 * - マスタデータ: カテゴリ/監修者/コンバージョン/ブランドの変更
 * - メディア: アップロード、削除
 * - 設定: システム設定の変更（APIキー更新含む）
 * - 生成ジョブ: 作成、キャンセル
 */

// GET /api/audit-logs - 監査ログ一覧（オーナーのみ）
export async function GET(request: NextRequest) {
  try {
    return await withOwnerAuth(request, async () => {
      const { searchParams } = new URL(request.url);
      const { page, limit } = parsePaginationParams(searchParams);

      // フィルター
      const action = searchParams.get("action");
      const userId = searchParams.get("userId");
      const resourceType = searchParams.get("resourceType");
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");

      const where: Prisma.AuditLogWhereInput = {
        ...(action && { action }),
        ...(userId && { userId }),
        ...(resourceType && { resourceType }),
        ...(startDate && { createdAt: { gte: new Date(startDate) } }),
        ...(endDate && {
          createdAt: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            lte: new Date(endDate),
          },
        }),
      };

      const total = await prisma.auditLog.count({ where });
      const { skip, take, totalPages } = calculatePagination(total, page, limit);

      const logs = await prisma.auditLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          userId: true,
          userEmail: true,
          resourceType: true,
          resourceId: true,
          details: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      });

      return paginatedResponse({
        items: logs,
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
    console.error("Audit logs list error:", error);
    return ApiErrors.internalError();
  }
}
