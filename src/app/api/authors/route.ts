import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { withAuth, withOwnerAuth } from "@/lib/auth";
import {
  successResponse,
  paginatedResponse,
  ApiErrors,
  errorResponse,
  parsePaginationParams,
  calculatePagination,
} from "@/lib/api-response";
import { validateBody } from "@/lib/validation";
import { isAppError, handlePrismaError } from "@/lib/errors";
import { auditLog } from "@/lib/audit-log";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";

// 監修者一覧取得
export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async () => {
      const { searchParams } = new URL(request.url);
      const { page, limit } = parsePaginationParams(searchParams);

      const total = await prisma.authors.count();
      const { skip, take, totalPages } = calculatePagination(total, page, limit);

      const authors = await prisma.authors.findMany({
        skip,
        take,
        select: {
          id: true,
          name: true,
          slug: true,
          role: true,
          bio: true,
          imageUrl: true,
          // キャリアデータフィールド
          careerStartYear: true,
          teachingStartYear: true,
          totalStudentsTaught: true,
          graduatesCount: true,
          weeklyLessons: true,
          certifications: true,
          episodes: true,
          signaturePhrases: true,
          specialties: true,
          // パーソナリティフィールド
          writingStyle: true,
          philosophy: true,
          avoidWords: true,
          targetAudience: true,
          teachingApproach: true,
          influences: true,
          locationContext: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { articles: true },
          },
        },
        orderBy: { name: "asc" },
      });

      return paginatedResponse({
        items: authors.map((a) => ({
          ...a,
          articlesCount: a._count.articles,
          _count: undefined,
        })),
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
    console.error("Get authors error:", error);
    return ApiErrors.internalError();
  }
}

// 空文字列をundefinedに変換するZodスキーマ
const optionalString = (maxLength?: number) => {
  let schema = z.string();
  if (maxLength) schema = schema.max(maxLength);
  return schema.optional().transform(v => v === '' ? undefined : v);
};

// 資格情報スキーマ
const certificationSchema = z.object({
  name: z.string(),
  year: z.number().optional(),
  location: z.string().optional(),
});

// エピソードスキーマ
const episodeSchema = z.object({
  type: z.enum(['transformation', 'student', 'teaching', 'other']),
  title: z.string(),
  content: z.string(),
});

// 監修者作成スキーマ
const createAuthorSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().max(100).regex(/^[a-z0-9-]+$/, "小文字英数字とハイフンのみ使用できます").optional()
    .or(z.literal('')).transform(v => v === '' ? undefined : v),
  role: optionalString(100),
  bio: optionalString(),
  avatarUrl: optionalString(),
  imageUrl: optionalString(),
  // キャリアデータフィールド
  careerStartYear: z.number().int().min(1950).max(new Date().getFullYear()).optional().nullable(),
  teachingStartYear: z.number().int().min(1950).max(new Date().getFullYear()).optional().nullable(),
  totalStudentsTaught: z.number().int().min(0).optional().nullable(),
  graduatesCount: z.number().int().min(0).optional().nullable(),
  weeklyLessons: z.number().int().min(0).optional().nullable(),
  certifications: z.array(certificationSchema).optional().nullable(),
  episodes: z.array(episodeSchema).optional().nullable(),
  signaturePhrases: z.array(z.string()).optional().nullable(),
  specialties: z.array(z.string()).optional().nullable(),
  // パーソナリティフィールド
  writingStyle: z.enum(['formal', 'casual', 'professional']).optional().nullable(),
  philosophy: optionalString(),
  avoidWords: z.array(z.string()).optional().nullable(),
  targetAudience: optionalString(200),
  teachingApproach: optionalString(200),
  influences: z.array(z.string()).optional().nullable(),
  locationContext: optionalString(100),
});

// 監修者作成（オーナーのみ）
export async function POST(request: NextRequest) {
  try {
    return await withOwnerAuth(request, async (user) => {
      const data = await validateBody(request, createAuthorSchema);

      // フィールド名のエイリアス解決
      const resolvedSlug = data.slug || randomUUID();
      // 空文字列の場合はnullに変換
      const rawImageUrl = data.imageUrl || data.avatarUrl;
      const resolvedImageUrl = rawImageUrl && rawImageUrl.trim() !== "" ? rawImageUrl : null;

      const author = await prisma.authors.create({
        data: {
          id: randomUUID(),
          name: data.name,
          slug: resolvedSlug,
          role: data.role || "ライター",
          qualifications: [],
          bio: data.bio || "",
          imageUrl: resolvedImageUrl,
          socialLinks: {},
          // キャリアデータフィールド
          careerStartYear: data.careerStartYear ?? null,
          teachingStartYear: data.teachingStartYear ?? null,
          totalStudentsTaught: data.totalStudentsTaught ?? null,
          graduatesCount: data.graduatesCount ?? null,
          weeklyLessons: data.weeklyLessons ?? null,
          certifications: data.certifications ? data.certifications : Prisma.JsonNull,
          episodes: data.episodes ? data.episodes : Prisma.JsonNull,
          signaturePhrases: data.signaturePhrases ? data.signaturePhrases : Prisma.JsonNull,
          specialties: data.specialties ? data.specialties : Prisma.JsonNull,
          // パーソナリティフィールド
          writingStyle: data.writingStyle ?? null,
          philosophy: data.philosophy ?? null,
          avoidWords: data.avoidWords ? data.avoidWords : Prisma.JsonNull,
          targetAudience: data.targetAudience ?? null,
          teachingApproach: data.teachingApproach ?? null,
          influences: data.influences ? data.influences : Prisma.JsonNull,
          locationContext: data.locationContext ?? null,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          role: true,
          bio: true,
          imageUrl: true,
          // キャリアデータ
          careerStartYear: true,
          teachingStartYear: true,
          totalStudentsTaught: true,
          graduatesCount: true,
          weeklyLessons: true,
          certifications: true,
          episodes: true,
          signaturePhrases: true,
          specialties: true,
          // パーソナリティ
          writingStyle: true,
          philosophy: true,
          avoidWords: true,
          targetAudience: true,
          teachingApproach: true,
          influences: true,
          locationContext: true,
          createdAt: true,
        },
      });

      // 監査ログ
      await auditLog.masterDataChange(
        request,
        "AUTHOR_CREATE",
        user.id,
        "author",
        author.id,
        { name: author.name }
      );

      return successResponse(author, undefined, 201);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode, error.details);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}
