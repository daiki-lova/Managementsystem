import { NextRequest } from "next/server";
import {
  successResponse,
  paginatedResponse,
  errorResponse,
  ApiErrors,
  getPagination,
  calculatePagination,
} from "@/lib/api-response";
import { withAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isAppError } from "@/lib/errors";

// GET /api/notifications - 通知一覧取得
export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async (user) => {
      const { searchParams } = new URL(request.url);
      const { skip, take, page } = getPagination(searchParams);
      const unreadOnly = searchParams.get("unreadOnly") === "true";

      const where = {
        userId: user.id,
        ...(unreadOnly && { read: false }),
      };

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take,
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({
          where: { userId: user.id, read: false },
        }),
      ]);

      const { totalPages } = calculatePagination(total, page, take);

      return paginatedResponse({
        items: notifications.map((n) => ({
          ...n,
          unreadCount,
        })),
        total,
        page,
        limit: take,
        totalPages,
      });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Notifications list error:", error);
    return ApiErrors.internalError();
  }
}

// PATCH /api/notifications - 全て既読にする
export async function PATCH(request: NextRequest) {
  try {
    return await withAuth(request, async (user) => {
      await prisma.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      });

      return successResponse({ message: "全ての通知を既読にしました" });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Notifications mark all read error:", error);
    return ApiErrors.internalError();
  }
}
