import { NextRequest } from "next/server";
import { successResponse, errorResponse, ApiErrors } from "@/lib/api-response";
import { withAuth } from "@/lib/auth";
import { validateBody } from "@/lib/validation";
import prisma from "@/lib/prisma";
import {
  KeywordsEverywhereClient,
  isInRecommendedRange,
  scoreKeyword,
  RECOMMENDED_VOLUME_RANGE,
} from "@/lib/keywords-everywhere";
import { z } from "zod";
import { isAppError } from "@/lib/errors";

// バリデーションスキーマ
const searchSchema = z.object({
  keywords: z.array(z.string().min(1)).min(1).max(20),
  type: z.enum(["volume", "related", "longtail"]).optional().default("volume"),
});

// POST /api/keywords - キーワード検索
export async function POST(request: NextRequest) {
  try {
    return await withAuth(request, async () => {
      const validated = await validateBody(request, searchSchema);

      // 設定からAPIキーを取得
      const settings = await prisma.systemSettings.findUnique({
        where: { id: "default" },
      });

      if (!settings?.searchVolumeApiKey) {
        return errorResponse("BAD_REQUEST", "Keywords Everywhere APIキーが設定されていません", 400);
      }

      const client = new KeywordsEverywhereClient(
        settings.searchVolumeApiKey
      );

      let data;

      if (validated.type === "volume") {
        // 複数キーワードのボリュームデータ取得
        data = await client.getKeywordData({ keywords: validated.keywords });
      } else if (validated.type === "related" && validated.keywords.length === 1) {
        // 関連キーワード取得（単一キーワードのみ）
        data = await client.getRelatedKeywords(validated.keywords[0]);
      } else if (validated.type === "longtail" && validated.keywords.length === 1) {
        // ロングテールキーワード取得（単一キーワードのみ）
        data = await client.getLongTailKeywords(validated.keywords[0]);
      } else {
        return errorResponse(
          "BAD_REQUEST",
          "related/longtailタイプは単一キーワードのみ対応しています",
          400
        );
      }

      // スコアリングと推奨フラグを追加
      const enrichedData = data.map((keyword) => ({
        ...keyword,
        score: scoreKeyword(keyword),
        isRecommended: isInRecommendedRange(keyword.volume),
      }));

      // スコア順でソート
      enrichedData.sort((a, b) => b.score - a.score);

      return successResponse({
        keywords: enrichedData,
        recommendedRange: RECOMMENDED_VOLUME_RANGE,
      });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Keywords search error:", error);
    return ApiErrors.internalError();
  }
}

// GET /api/keywords/suggestions - キーワードサジェスト（シンプル版）
export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async () => {
      const { searchParams } = new URL(request.url);
      const keyword = searchParams.get("keyword");

      if (!keyword) {
        return errorResponse("BAD_REQUEST", "keywordパラメータが必要です", 400);
      }

      // 設定からAPIキーを取得
      const settings = await prisma.systemSettings.findUnique({
        where: { id: "default" },
      });

      if (!settings?.searchVolumeApiKey) {
        // APIキーがない場合は空の結果を返す
        return successResponse({
          keywords: [],
          message: "Keywords Everywhere APIキーが設定されていません",
        });
      }

      const client = new KeywordsEverywhereClient(
        settings.searchVolumeApiKey
      );

      // 関連キーワードを取得
      const relatedKeywords = await client.getRelatedKeywords(keyword);

      // 推奨範囲内のキーワードを優先
      const enrichedData = relatedKeywords.map((kw) => ({
        ...kw,
        score: scoreKeyword(kw),
        isRecommended: isInRecommendedRange(kw.volume),
      }));

      // スコア順でソート、上位20件
      enrichedData.sort((a, b) => b.score - a.score);
      const topKeywords = enrichedData.slice(0, 20);

      return successResponse({
        keywords: topKeywords,
        recommendedRange: RECOMMENDED_VOLUME_RANGE,
      });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Keywords suggestions error:", error);
    return ApiErrors.internalError();
  }
}
