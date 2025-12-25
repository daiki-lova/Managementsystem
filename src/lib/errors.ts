// カスタムエラークラス

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "認証が必要です") {
    super("UNAUTHORIZED", message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "アクセス権限がありません") {
    super("FORBIDDEN", message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "リソース") {
    super("NOT_FOUND", `${resource}が見つかりません`, 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown) {
    super("VALIDATION_ERROR", "バリデーションエラー", 400, details);
    this.name = "ValidationError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "リソースが既に存在します") {
    super("CONFLICT", message, 409);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "リクエスト制限に達しました") {
    super("RATE_LIMITED", message, 429);
    this.name = "RateLimitError";
  }
}

// エラーハンドリングユーティリティ
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

// Prismaエラーのハンドリング
export function handlePrismaError(error: unknown): AppError {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prismaError = error as any;

  if (prismaError?.code === "P2002") {
    // ユニーク制約違反
    const field = prismaError.meta?.target?.[0] || "フィールド";
    return new ConflictError(`${field}は既に使用されています`);
  }

  if (prismaError?.code === "P2025") {
    // レコードが見つからない
    return new NotFoundError();
  }

  if (prismaError?.code === "P2003") {
    // 外部キー制約違反
    return new AppError(
      "FOREIGN_KEY_VIOLATION",
      "関連するレコードが存在しません",
      400
    );
  }

  // その他のPrismaエラー
  console.error("Prisma error:", error);
  return new AppError("DATABASE_ERROR", "データベースエラーが発生しました", 500);
}
