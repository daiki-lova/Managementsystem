import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { withAuth, AuthUser } from "@/lib/auth";
import {
  successResponse,
  ApiErrors,
  errorResponse,
} from "@/lib/api-response";
import { validateBody, commonSchemas } from "@/lib/validation";
import { isAppError, handlePrismaError, NotFoundError } from "@/lib/errors";
import { Prisma } from "@prisma/client";
import { auditLog } from "@/lib/audit-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 監修者詳細取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async (user: AuthUser) => {
      const { id } = await params;

      const author = await prisma.authors.findUnique({
        where: { id },
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
      });

      if (!author) {
        return ApiErrors.notFound("監修者");
      }

      return successResponse({
        ...author,
        articlesCount: author._count.articles,
        _count: undefined,
      });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Get author error:", error);
    return ApiErrors.internalError();
  }
}

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

// 監修者更新スキーマ
const updateAuthorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: commonSchemas.slug.optional(),
  role: z.string().max(100).optional(),
  bio: z.string().optional(),
  imageUrl: commonSchemas.url.optional().nullable(),
  avatarUrl: commonSchemas.url.optional().nullable(), // imageUrlのエイリアス
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
  philosophy: z.string().optional().nullable(),
  avoidWords: z.array(z.string()).optional().nullable(),
  targetAudience: z.string().max(200).optional().nullable(),
  teachingApproach: z.string().max(200).optional().nullable(),
  influences: z.array(z.string()).optional().nullable(),
  locationContext: z.string().max(100).optional().nullable(),
});

// 監修者更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async (user: AuthUser) => {
      const { id } = await params;

      const data = await validateBody(request, updateAuthorSchema);

      // 存在確認
      const existing = await prisma.authors.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError("監修者");
      }

      // フィールド名のエイリアス解決
      const resolvedImageUrl = data.imageUrl !== undefined ? data.imageUrl : data.avatarUrl;

      const author = await prisma.authors.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          role: data.role,
          bio: data.bio,
          imageUrl: resolvedImageUrl,
          // キャリアデータフィールド
          ...(data.careerStartYear !== undefined && { careerStartYear: data.careerStartYear }),
          ...(data.teachingStartYear !== undefined && { teachingStartYear: data.teachingStartYear }),
          ...(data.totalStudentsTaught !== undefined && { totalStudentsTaught: data.totalStudentsTaught }),
          ...(data.graduatesCount !== undefined && { graduatesCount: data.graduatesCount }),
          ...(data.weeklyLessons !== undefined && { weeklyLessons: data.weeklyLessons }),
          ...(data.certifications !== undefined && {
            certifications: data.certifications === null ? Prisma.JsonNull : data.certifications
          }),
          ...(data.episodes !== undefined && {
            episodes: data.episodes === null ? Prisma.JsonNull : data.episodes
          }),
          ...(data.signaturePhrases !== undefined && {
            signaturePhrases: data.signaturePhrases === null ? Prisma.JsonNull : data.signaturePhrases
          }),
          ...(data.specialties !== undefined && {
            specialties: data.specialties === null ? Prisma.JsonNull : data.specialties
          }),
          // パーソナリティフィールド
          ...(data.writingStyle !== undefined && { writingStyle: data.writingStyle }),
          ...(data.philosophy !== undefined && { philosophy: data.philosophy }),
          ...(data.avoidWords !== undefined && {
            avoidWords: data.avoidWords === null ? Prisma.JsonNull : data.avoidWords
          }),
          ...(data.targetAudience !== undefined && { targetAudience: data.targetAudience }),
          ...(data.teachingApproach !== undefined && { teachingApproach: data.teachingApproach }),
          ...(data.influences !== undefined && {
            influences: data.influences === null ? Prisma.JsonNull : data.influences
          }),
          ...(data.locationContext !== undefined && { locationContext: data.locationContext }),
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
          updatedAt: true,
        },
      });

      // 監査ログ
      await auditLog.masterDataChange(
        request,
        "AUTHOR_UPDATE",
        user.id,
        "author",
        author.id,
        { name: author.name }
      );

      return successResponse(author);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}

// 監修者削除（オーナーのみ）
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async (user) => {
      const { id } = await params;

      // 存在確認
      const existing = await prisma.authors.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              articles: true,
              generation_jobs: true,
              knowledge_items: true
            }
          }
        },
      });

      if (!existing) {
        return ApiErrors.notFound("監修者");
      }

      // 紐づくデータがある場合は別の監修者に移動
      if (existing._count.articles > 0 || existing._count.generation_jobs > 0 || existing._count.knowledge_items > 0) {
        const fallback = await prisma.authors.findFirst({
          where: { id: { not: id } },
          orderBy: { createdAt: 'asc' },
          select: { id: true }
        });

        if (fallback) {
          await prisma.$transaction([
            prisma.articles.updateMany({
              where: { authorId: id },
              data: { authorId: fallback.id }
            }),
            prisma.generation_jobs.updateMany({
              where: { authorId: id },
              data: { authorId: fallback.id }
            }),
            prisma.knowledge_items.updateMany({
              where: { authorId: id },
              data: { authorId: fallback.id }
            })
          ]);
        } else {
          return ApiErrors.badRequest(
            `この監修者には関連データが紐づいており、移行先の監修者も存在しません。先に別の監修者を作成してください。\n(記事: ${existing._count.articles}, ジョブ: ${existing._count.generation_jobs}, ナレッジ: ${existing._count.knowledge_items})`
          );
        }
      }

      await prisma.authors.delete({
        where: { id },
      });

      // 監査ログ
      await auditLog.masterDataChange(
        request,
        "AUTHOR_DELETE",
        user.id,
        "author",
        id,
        { name: existing.name }
      );

      return successResponse({ message: "監修者を削除しました" });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}
