import { NextRequest } from "next/server";
import { successResponse, errorResponse, ApiErrors } from "@/lib/api-response";
import { withAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isAppError } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/notifications/:id - 通知を既読にする
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    return await withAuth(request, async (user) => {
      const notification = await prisma.notifications.findUnique({
        where: { id },
      });

      if (!notification) {
        return ApiErrors.notFound("通知");
      }

      if (notification.userId !== user.id) {
        return ApiErrors.forbidden();
      }

      const updated = await prisma.notifications.update({
        where: { id },
        data: { read: true },
      });

      return successResponse(updated);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Notification mark read error:", error);
    return ApiErrors.internalError();
  }
}

// DELETE /api/notifications/:id - 通知を削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    return await withAuth(request, async (user) => {
      const notification = await prisma.notifications.findUnique({
        where: { id },
      });

      if (!notification) {
        return ApiErrors.notFound("通知");
      }

      if (notification.userId !== user.id) {
        return ApiErrors.forbidden();
      }

      await prisma.notifications.delete({
        where: { id },
      });

      return successResponse({ message: "通知を削除しました" });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Notification delete error:", error);
    return ApiErrors.internalError();
  }
}
