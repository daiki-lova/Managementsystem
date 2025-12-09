import { z, ZodSchema } from "zod";
import { ValidationError } from "./errors";

// リクエストボディのバリデーション
export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ValidationError({ message: "JSONの解析に失敗しました" });
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    throw new ValidationError(result.error.flatten());
  }

  return result.data;
}

// クエリパラメータのバリデーション
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): T {
  const params: Record<string, string | string[]> = {};

  searchParams.forEach((value, key) => {
    if (params[key]) {
      if (Array.isArray(params[key])) {
        (params[key] as string[]).push(value);
      } else {
        params[key] = [params[key] as string, value];
      }
    } else {
      params[key] = value;
    }
  });

  const result = schema.safeParse(params);

  if (!result.success) {
    throw new ValidationError(result.error.flatten());
  }

  return result.data;
}

// 共通バリデーションスキーマ
export const commonSchemas = {
  // ID（CUID形式または任意の文字列）
  id: z.string().min(1).max(255),

  // スラッグ（URLフレンドリーな文字列）
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "小文字英数字とハイフンのみ使用できます"),

  // メールアドレス
  email: z.string().email("有効なメールアドレスを入力してください"),

  // パスワード（8文字以上）
  password: z.string().min(8, "パスワードは8文字以上必要です"),

  // ページネーション
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  // 日時（ISO8601形式）
  datetime: z.string().datetime(),

  // 日付（YYYY-MM-DD形式）
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),

  // HEXカラーコード
  hexColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "有効なカラーコードを入力してください"),

  // URL
  url: z.string().url("有効なURLを入力してください"),
};

// ページネーションクエリスキーマ
export const paginationQuerySchema = z.object({
  page: commonSchemas.page,
  limit: commonSchemas.limit,
});

// ソートクエリスキーマ
export function createSortQuerySchema<T extends string>(
  allowedFields: T[]
) {
  return z.object({
    sortBy: z.enum(allowedFields as [T, ...T[]]).optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  });
}
