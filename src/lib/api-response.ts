import { NextResponse } from "next/server";

// API レスポンス型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// ページネーションパラメータ
export interface PaginationParams {
  page: number;
  limit: number;
}

// ページネーション結果
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 成功レスポンス
export function successResponse<T>(
  data: T,
  meta?: ApiResponse["meta"],
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta,
    },
    { status }
  );
}

// ページネーション付き成功レスポンス
export function paginatedResponse<T>(
  result: PaginatedResult<T>
): NextResponse<ApiResponse<T[]>> {
  return NextResponse.json({
    success: true,
    data: result.items,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
}

// エラーレスポンス
export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: unknown
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

// 共通エラーレスポンス
export const ApiErrors = {
  unauthorized: () =>
    errorResponse("UNAUTHORIZED", "認証が必要です", 401),

  forbidden: () =>
    errorResponse("FORBIDDEN", "アクセス権限がありません", 403),

  notFound: (resource = "リソース") =>
    errorResponse("NOT_FOUND", `${resource}が見つかりません`, 404),

  badRequest: (message = "リクエストが不正です") =>
    errorResponse("BAD_REQUEST", message, 400),

  validationError: (details: unknown) =>
    errorResponse("VALIDATION_ERROR", "バリデーションエラー", 400, details),

  conflict: (message = "リソースが既に存在します") =>
    errorResponse("CONFLICT", message, 409),

  internalError: (message = "サーバーエラーが発生しました") =>
    errorResponse("INTERNAL_ERROR", message, 500),

  rateLimited: () =>
    errorResponse("RATE_LIMITED", "リクエスト制限に達しました", 429),
} as const;

// ページネーションパラメータのパース
export function parsePaginationParams(
  searchParams: URLSearchParams
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    200,
    Math.max(1, parseInt(searchParams.get("limit") || "100", 10))
  );
  return { page, limit };
}

// ページネーション計算
export function calculatePagination(
  total: number,
  page: number,
  limit: number
): { skip: number; take: number; totalPages: number } {
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;
  return { skip, take: limit, totalPages };
}

// ページネーションパラメータ取得（skip, take, page を返す）
export function getPagination(searchParams: URLSearchParams): {
  skip: number;
  take: number;
  page: number;
} {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    200,
    Math.max(1, parseInt(searchParams.get("limit") || "100", 10))
  );
  const skip = (page - 1) * limit;
  return { skip, take: limit, page };
}
