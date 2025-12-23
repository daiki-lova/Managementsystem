import { NextRequest } from "next/server";
import { successResponse, errorResponse, ApiErrors } from "@/lib/api-response";
import { withOwnerAuth } from "@/lib/auth";
import { validateBody } from "@/lib/validation";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { isAppError } from "@/lib/errors";
import { auditLog } from "@/lib/audit-log";
import { secrets } from "@/lib/encryption";
import {
  DEFAULT_ARTICLE_PROMPT,
  DEFAULT_IMAGE_PROMPT,
  DEFAULT_KEYWORD_SUGGEST_PROMPT,
  DEFAULT_TITLE_PROMPT,
  DEFAULT_KEYWORD_ANALYSIS_PROMPT,
  DEFAULT_WHITE_DATA_PROMPT,
  DEFAULT_LLMO_PROMPT,
} from "@/inngest/functions/pipeline/common/prompts";
import { STAGE_MODEL_CONFIG } from "@/inngest/functions/pipeline/common/openrouter";

// 暗号化対象のAPIキーフィールド
const API_KEY_FIELDS = [
  "gaApiKey",
  "searchConsoleApiKey",
  "searchVolumeApiKey",
  "dataforSeoApiKey",
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

  // Keywords Everywhere (deprecated)
  searchVolumeApiKey: z.string().optional().nullable(),

  // DataForSEO (検索ボリューム)
  dataforSeoApiKey: z.string().optional().nullable(),

  // OpenRouter (AI)
  openRouterApiKey: z.string().optional().nullable(),
  aiModel: z.string().optional().nullable(),
  imageModel: z.string().optional().nullable(),
  articleModel: z.string().optional().nullable(),
  analysisModel: z.string().optional().nullable(),

  // System Prompts
  titlePrompt: z.string().optional().nullable(),         // タイトル生成
  keywordPrompt: z.string().optional().nullable(),       // キーワード分析（未使用）
  keywordSuggestPrompt: z.string().optional().nullable(), // キーワード提案
  imagePrompt: z.string().optional().nullable(),         // 画像生成
  systemPrompt: z.string().optional().nullable(),        // 記事生成
  // V4パイプライン専用プロンプト
  whiteDataPrompt: z.string().optional().nullable(),     // ホワイトデータ検索
  llmoPrompt: z.string().optional().nullable(),          // LLMo最適化

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
      let settings = await prisma.system_settings.findUnique({
        where: { id: "default" },
      });

      // 設定がない場合は作成
      if (!settings) {
        settings = await prisma.system_settings.create({
          data: { id: "default" },
        });
      }

      // APIキーをマスク
      const maskedSettings = {
        ...settings,
        gaApiKey: settings.gaApiKey ? "********" : null,
        searchConsoleApiKey: settings.searchConsoleApiKey ? "********" : null,
        searchVolumeApiKey: settings.searchVolumeApiKey ? "********" : null,
        dataforSeoApiKey: settings.dataforSeoApiKey ? "********" : null,
        openRouterApiKey: settings.openRouterApiKey ? "********" : null,
        // 設定されているかどうかのフラグ
        hasGaApiKey: !!settings.gaApiKey,
        hasSearchConsoleApiKey: !!settings.searchConsoleApiKey,
        hasSearchVolumeApiKey: !!settings.searchVolumeApiKey,
        hasDataforSeoApiKey: !!settings.dataforSeoApiKey,
        hasOpenRouterApiKey: !!settings.openRouterApiKey,
        // 実際にシステムで使用されている設定
        activeConfig: {
          models: {
            titleGeneration: STAGE_MODEL_CONFIG.title_generation.model,
            articleGeneration: STAGE_MODEL_CONFIG.article_generation.model,
            imageGeneration: STAGE_MODEL_CONFIG.image_generation.model,
            analysisModel: settings.analysisModel || "openai/gpt-4o",
          },
          prompts: {
            // タイトル生成（DB設定 or デフォルト）
            title: settings.titlePrompt || DEFAULT_TITLE_PROMPT,
            // 記事生成（DB設定 or デフォルト）
            article: settings.systemPrompt || DEFAULT_ARTICLE_PROMPT,
            // 画像生成（DB設定 or デフォルト）
            image: settings.imagePrompt || DEFAULT_IMAGE_PROMPT,
            // キーワード提案（DB設定 or デフォルト）
            keywordSuggest: settings.keywordSuggestPrompt || DEFAULT_KEYWORD_SUGGEST_PROMPT,
            // キーワード分析（DB設定 or デフォルト）※現在未使用
            keywordAnalysis: settings.keywordPrompt || DEFAULT_KEYWORD_ANALYSIS_PROMPT,
            // V4パイプライン専用
            whiteData: (settings as { whiteDataPrompt?: string }).whiteDataPrompt || DEFAULT_WHITE_DATA_PROMPT,
            llmo: (settings as { llmoPrompt?: string }).llmoPrompt || DEFAULT_LLMO_PROMPT,
          },
          // デフォルト値（リセット用）
          defaults: {
            titlePrompt: DEFAULT_TITLE_PROMPT,
            systemPrompt: DEFAULT_ARTICLE_PROMPT,
            imagePrompt: DEFAULT_IMAGE_PROMPT,
            keywordSuggestPrompt: DEFAULT_KEYWORD_SUGGEST_PROMPT,
            keywordPrompt: DEFAULT_KEYWORD_ANALYSIS_PROMPT,
            // V4パイプライン専用
            whiteDataPrompt: DEFAULT_WHITE_DATA_PROMPT,
            llmoPrompt: DEFAULT_LLMO_PROMPT,
          },
        },
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
          // マスク値（********）が送信された場合はスキップ（既存値を保持）
          if (value === "********" || value.match(/^\*+$/)) {
            continue;
          }
          cleanedData[key] = secrets.encrypt(value);
        } else {
          cleanedData[key] = value;
        }
        // APIキーの場合はキー名だけ記録（値は記録しない）
        changedFields.push(key);
      }

      // 設定を更新（なければ作成）
      const settings = await prisma.system_settings.upsert({
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
        dataforSeoApiKey: settings.dataforSeoApiKey ? "********" : null,
        openRouterApiKey: settings.openRouterApiKey ? "********" : null,
        hasGaApiKey: !!settings.gaApiKey,
        hasSearchConsoleApiKey: !!settings.searchConsoleApiKey,
        hasSearchVolumeApiKey: !!settings.searchVolumeApiKey,
        hasDataforSeoApiKey: !!settings.dataforSeoApiKey,
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
