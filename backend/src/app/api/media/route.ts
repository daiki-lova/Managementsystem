import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
import {
  successResponse,
  paginatedResponse,
  ApiErrors,
  errorResponse,
  parsePaginationParams,
  calculatePagination,
} from "@/lib/api-response";
import { isAppError } from "@/lib/errors";
import { uploadImage } from "@/lib/supabase";
import { MediaSource, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import {
  validateUploadedFile,
  sanitizeFilename,
} from "@/lib/media-validation";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit-log";

// メディア一覧取得
export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async () => {
      const { searchParams } = new URL(request.url);
      const { page, limit } = parsePaginationParams(searchParams);

      const source = searchParams.get("source") as MediaSource | null;
      const search = searchParams.get("search");

      // ライブラリに表示するものだけ取得
      const where: Prisma.media_assetsWhereInput = {
        showInLibrary: true,
        isDeleted: false,
        ...(source && { source }),
        ...(search && {
          OR: [
            { fileName: { contains: search, mode: "insensitive" } },
            { altText: { contains: search, mode: "insensitive" } },
          ],
        }),
      };

      const total = await prisma.media_assets.count({ where });
      const { skip, take, totalPages } = calculatePagination(total, page, limit);

      const media = await prisma.media_assets.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          url: true,
          fileName: true,
          altText: true,
          source: true,
          width: true,
          height: true,
          fileSize: true,
          createdAt: true,
          media_asset_tags: {
            select: {
              tags: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return paginatedResponse({
        items: media.map((m) => ({
          ...m,
          tags: m.media_asset_tags.map((t) => t.tags),
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
    console.error("Get media error:", error);
    return ApiErrors.internalError();
  }
}

// メディアアップロード
export async function POST(request: NextRequest) {
  try {
    // レート制限チェック（アップロード: 30リクエスト/分）
    const rateLimitResult = checkRateLimit(
      request,
      RATE_LIMIT_CONFIGS.upload,
      "upload"
    );
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil(
        (rateLimitResult.resetAt - Date.now()) / 1000
      );
      return errorResponse(
        "RATE_LIMITED",
        `アップロード制限に達しました。${retryAfter}秒後に再試行してください`,
        429
      );
    }

    return await withAuth(request, async (user) => {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const altText = formData.get("altText") as string | null;

      if (!file) {
        return ApiErrors.badRequest("ファイルが指定されていません");
      }

      // ファイルをBufferに変換
      const buffer = Buffer.from(await file.arrayBuffer());

      // ファイル名をサニタイズ
      const sanitizedFilename = sanitizeFilename(file.name);

      // MIMEタイプ、マジックバイト、SVG安全性などを包括的に検証
      const validationResult = validateUploadedFile(
        buffer,
        sanitizedFilename,
        file.type
      );

      if (!validationResult.valid) {
        return ApiErrors.badRequest(validationResult.error || "ファイル検証に失敗しました");
      }

      // ファイルパスの生成
      const ext = sanitizedFilename.split(".").pop() || "jpg";
      const filePath = `${Date.now()}-${randomUUID()}.${ext}`;

      // Supabase Storageにアップロード
      const { url } = await uploadImage(
        "MEDIA",
        filePath,
        buffer,
        validationResult.mimeType || file.type
      );

      // DB に保存
      const media = await prisma.media_assets.create({
        data: {
          id: randomUUID(),
          url,
          fileName: sanitizedFilename,
          altText: altText || null,
          source: MediaSource.UPLOAD,
          showInLibrary: true,
          fileSize: validationResult.fileSize || buffer.length,
        },
        select: {
          id: true,
          url: true,
          fileName: true,
          altText: true,
          source: true,
          fileSize: true,
          createdAt: true,
        },
      });

      // 監査ログ
      await auditLog.masterDataChange(
        request,
        "MEDIA_UPLOAD",
        user.id,
        "media",
        media.id,
        { fileName: media.fileName, fileSize: media.fileSize }
      );

      return successResponse(media, undefined, 201);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Upload media error:", error);
    return ApiErrors.internalError();
  }
}
