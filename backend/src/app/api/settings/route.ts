import { NextRequest } from "next/server";
import { successResponse, errorResponse, ApiErrors } from "@/lib/api-response";
import { withOwnerAuth } from "@/lib/auth";
import { validateBody } from "@/lib/validation";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { isAppError } from "@/lib/errors";
import { auditLog } from "@/lib/audit-log";
import { secrets } from "@/lib/encryption";

// 暗号化対象のAPIキーフィールド
const API_KEY_FIELDS = [
  "gaApiKey",
  "searchConsoleApiKey",
  "searchVolumeApiKey",
  "openRouterApiKey",
] as const;

// 設定更新スキーマ
const updateSettingsSchema = z.object({
  // Google Analytics
  gaApiKey: z.string().optional().nullable(),
  gaPropertyId: z.string().optional().nullable(),

  // Search Console
  searchConsoleApiKey: z.string().optional().nullable(),
  searchConsoleSiteUrl: z.string().optional().nullable(),

  // Keywords Everywhere
  searchVolumeApiKey: z.string().optional().nullable(),

  // OpenRouter (AI)
  openRouterApiKey: z.string().optional().nullable(),
  aiModel: z.string().optional().nullable(),

  // 検索ボリューム設定
  minSearchVolume: z.number().int().min(0).optional(),
  maxSearchVolume: z.number().int().min(0).optional(),
  volumeZones: z.array(z.object({
    name: z.string(),
    min: z.number(),
    max: z.number(),
    color: z.string(),
  })).optional().nullable(),
});

// GET /api/settings - 設定取得（オーナーのみ）
export async function GET(request: NextRequest) {
  try {
    return await withOwnerAuth(request, async () => {
      let settings = await prisma.systemSettings.findUnique({
        where: { id: "default" },
      });

      // 設定がない場合は作成
      if (!settings) {
        settings = await prisma.systemSettings.create({
          data: { id: "default" },
        });
      }

      // APIキーをマスク
      const maskedSettings = {
        ...settings,
        gaApiKey: settings.gaApiKey ? "********" : null,
        searchConsoleApiKey: settings.searchConsoleApiKey ? "********" : null,
        searchVolumeApiKey: settings.searchVolumeApiKey ? "********" : null,
        openRouterApiKey: settings.openRouterApiKey ? "********" : null,
        // 設定されているかどうかのフラグ
        hasGaApiKey: !!settings.gaApiKey,
        hasSearchConsoleApiKey: !!settings.searchConsoleApiKey,
        hasSearchVolumeApiKey: !!settings.searchVolumeApiKey,
        hasOpenRouterApiKey: !!settings.openRouterApiKey,
      };

      return successResponse(maskedSettings);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Settings get error:", error);
    return ApiErrors.internalError();
  }
}

// PATCH /api/settings - 設定更新（オーナーのみ）
export async function PATCH(request: NextRequest) {
  try {
    return await withOwnerAuth(request, async (user) => {
      const validated = await validateBody(request, updateSettingsSchema);

      // 空文字列をnullに変換、APIキーは暗号化
      const cleanedData: Record<string, unknown> = {};
      const changedFields: string[] = [];
      for (const [key, value] of Object.entries(validated)) {
        if (value === "" || value === undefined) {
          continue; // 空文字列とundefinedはスキップ（更新しない）
        }
        // APIキーフィールドは暗号化して保存
        if (API_KEY_FIELDS.includes(key as typeof API_KEY_FIELDS[number]) && typeof value === "string") {
          cleanedData[key] = secrets.encrypt(value);
        } else {
          cleanedData[key] = value;
        }
        // APIキーの場合はキー名だけ記録（値は記録しない）
        changedFields.push(key);
      }

      // 設定を更新（なければ作成）
      const settings = await prisma.systemSettings.upsert({
        where: { id: "default" },
        update: cleanedData,
        create: {
          id: "default",
          ...cleanedData,
        },
      });

      // 監査ログ（変更されたフィールドのみ記録、APIキーの値は記録しない）
      await auditLog.settingsUpdate(request, user.id, changedFields);

      // APIキーをマスク
      const maskedSettings = {
        ...settings,
        gaApiKey: settings.gaApiKey ? "********" : null,
        searchConsoleApiKey: settings.searchConsoleApiKey ? "********" : null,
        searchVolumeApiKey: settings.searchVolumeApiKey ? "********" : null,
        openRouterApiKey: settings.openRouterApiKey ? "********" : null,
        hasGaApiKey: !!settings.gaApiKey,
        hasSearchConsoleApiKey: !!settings.searchConsoleApiKey,
        hasSearchVolumeApiKey: !!settings.searchVolumeApiKey,
        hasOpenRouterApiKey: !!settings.openRouterApiKey,
      };

      return successResponse(maskedSettings);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Settings update error:", error);
    return ApiErrors.internalError();
  }
}
