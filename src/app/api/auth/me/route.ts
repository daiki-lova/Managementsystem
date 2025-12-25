import { NextRequest } from "next/server";
import { withAuth, AuthUser } from "@/lib/auth";
import { successResponse, ApiErrors, errorResponse } from "@/lib/api-response";
import { isAppError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async (user: AuthUser) => {
      return successResponse({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Get me error:", error);
    return ApiErrors.internalError();
  }
}
