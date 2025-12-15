import { NextRequest } from "next/server";
import { successResponse, errorResponse, ApiErrors } from "@/lib/api-response";
import { withAuth } from "@/lib/auth";
import { validateBody } from "@/lib/validation";
import prisma from "@/lib/prisma";
import { getDecryptedSettings } from "@/lib/settings";
import {
  DataForSEOClient,
  isInRecommendedRange,
  scoreKeyword,
  DEFAULT_VOLUME_RANGE,
  type VolumeRange,
} from "@/lib/dataforseo";
import { callOpenRouter } from "@/inngest/functions/pipeline/common/openrouter";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";
import { z } from "zod";
import { isAppError } from "@/lib/errors";

// バリデーションスキーマ
const suggestSchema = z.object({
  categoryId: z.string().min(1),
  conversionId: z.string().min(1),
  authorId: z.string().min(1),
  seedKeywords: z.array(z.string()).optional().default([]),
  candidateCount: z.number().min(10).max(50).optional().default(25),
});

// AIキーワード候補の型
interface AIKeywordCandidate {
  keyword: string;
  reasoning: string;
}

// AIレスポンスの型
interface AIKeywordResponse {
  keywords: AIKeywordCandidate[];
}

// エンリッチ済みキーワードの型
interface EnrichedKeyword {
  keyword: string;
  reasoning: string;
  searchVolume: number;
  competition: number;
  cpc: number;
  trend: number[];
  score: number;
  isRecommended: boolean;
}

// システムプロンプトを構築
function buildSystemPrompt(basePrompt: string | null): string {
  const defaultPrompt = `【キーワード提案AI】
あなたはヨガ・ウェルネスメディアのSEOストラテジストです。
与えられた3つのコンテキスト（カテゴリ、コンバージョン目標、監修者の専門性）を総合的に分析し、
記事化に最適なキーワード候補を提案してください。

【分析の観点】
1. カテゴリ: そのカテゴリで読者が検索しそうなキーワード
2. コンバージョン: その商品/サービスに興味を持つユーザーの検索意図
3. 監修者: 監修者の専門性を活かせるテーマ

【キーワード選定基準】
- 検索ボリューム300〜2000程度のミドルテールを優先
- 具体的で記事化しやすいもの（「ヨガ」より「朝ヨガ 初心者 5分」）
- コンバージョンにつながりやすい検索意図
- 監修者の資格・経験と整合性があるもの

【重要】
- 必ずJSON形式のみで出力してください
- 各キーワードには「なぜこのキーワードを選んだか」の理由を含めてください`;

  return basePrompt ? `${defaultPrompt}\n\n【追加指示】\n${basePrompt}` : defaultPrompt;
}

// ユーザープロンプトを構築
function buildUserPrompt(params: {
  category: { name: string; description: string | null };
  conversion: { name: string; type: string; context: string };
  author: {
    name: string;
    role: string;
    qualifications: unknown;
    bio: string;
    systemPrompt: string;
  };
  knowledgeItems: Array<{ type: string; title: string; content: string }>;
  seedKeywords: string[];
  candidateCount: number;
}): string {
  const { category, conversion, author, knowledgeItems, seedKeywords, candidateCount } = params;

  // 情報バンクから関連コンテンツを抽出
  const knowledgeSummary = knowledgeItems
    .slice(0, 10)
    .map((k) => `- [${k.type}] ${k.title}: ${k.content.slice(0, 150)}...`)
    .join("\n");

  // 資格情報を文字列化
  let qualificationsStr = "（なし）";
  if (author.qualifications) {
    if (Array.isArray(author.qualifications)) {
      qualificationsStr = author.qualifications.join(", ");
    } else if (typeof author.qualifications === "object") {
      qualificationsStr = JSON.stringify(author.qualifications);
    }
  }

  return `以下のコンテキストを分析し、${candidateCount}個のキーワード候補を提案してください。

【カテゴリ情報】
名前: ${category.name}
説明: ${category.description || "（なし）"}

【コンバージョン目標】
名前: ${conversion.name}
タイプ: ${conversion.type}
コンテキスト: ${conversion.context}

【監修者プロフィール】
名前: ${author.name}
役職: ${author.role}
資格: ${qualificationsStr}
専門分野: ${author.bio}
${author.systemPrompt ? `システムプロンプト: ${author.systemPrompt.slice(0, 300)}...` : ""}

【監修者の情報バンク（専門知識）】
${knowledgeSummary || "（なし）"}

${seedKeywords.length > 0 ? `【参考キーワード（ヒント）】\n${seedKeywords.join(", ")}` : ""}

**重要**: 必ず以下のJSON形式のみで出力してください。説明文は不要です。
{
  "keywords": [
    {
      "keyword": "検索キーワード",
      "reasoning": "なぜこのキーワードを選んだか（カテゴリ・CV・監修者との関連を含む）"
    }
  ]
}`;
}

// 配列を指定サイズのチャンクに分割
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// POST /api/keywords/suggest - AIキーワード提案
export async function POST(request: NextRequest) {
  try {
    // レート制限チェック（AI生成と同じ制限）
    const rateLimitResult = checkRateLimit(
      request,
      RATE_LIMIT_CONFIGS.generation,
      "keyword-suggest"
    );
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      return errorResponse(
        "RATE_LIMITED",
        `リクエスト制限に達しました。${Math.ceil(retryAfter / 60)}分後に再試行してください`,
        429
      );
    }

    return await withAuth(request, async () => {
      // バリデーション
      const validated = await validateBody(request, suggestSchema);

      // コンテキスト情報を並行取得
      const [category, conversion, author, settings] = await Promise.all([
        prisma.categories.findUnique({
          where: { id: validated.categoryId },
        }),
        prisma.conversions.findUnique({
          where: { id: validated.conversionId },
        }),
        prisma.authors.findUnique({
          where: { id: validated.authorId },
          include: {
            knowledge_items: {
              take: 20,
              orderBy: { usageCount: "desc" },
            },
          },
        }),
        getDecryptedSettings(),
      ]);

      // 存在確認
      if (!category) {
        return errorResponse("NOT_FOUND", "カテゴリが見つかりません", 404);
      }
      if (!conversion) {
        return errorResponse("NOT_FOUND", "コンバージョンが見つかりません", 404);
      }
      if (!author) {
        return errorResponse("NOT_FOUND", "監修者が見つかりません", 404);
      }
      if (!settings?.openRouterApiKey) {
        return errorResponse(
          "BAD_REQUEST",
          "OpenRouter APIキーが設定されていません。システム設定から設定してください。",
          400
        );
      }

      // 検索ボリューム範囲
      const volumeRange: VolumeRange = {
        min: settings.minSearchVolume ?? DEFAULT_VOLUME_RANGE.min,
        max: settings.maxSearchVolume ?? DEFAULT_VOLUME_RANGE.max,
      };

      // AIでキーワード候補を生成
      console.log("Generating keyword candidates with AI...");
      const systemPrompt = buildSystemPrompt(settings.keywordPrompt);
      const userPrompt = buildUserPrompt({
        category: {
          name: category.name,
          description: category.description,
        },
        conversion: {
          name: conversion.name,
          type: conversion.type,
          context: conversion.context,
        },
        author: {
          name: author.name,
          role: author.role,
          qualifications: author.qualifications,
          bio: author.bio,
          systemPrompt: author.systemPrompt,
        },
        knowledgeItems: author.knowledge_items.map((k) => ({
          type: k.type,
          title: k.title,
          content: k.content,
        })),
        seedKeywords: validated.seedKeywords ?? [],
        candidateCount: validated.candidateCount ?? 25,
      });

      const aiResult = await callOpenRouter<AIKeywordResponse>(
        systemPrompt,
        userPrompt,
        {
          apiKey: settings.openRouterApiKey,
          model: settings.analysisModel || "openai/gpt-4o",
          maxTokens: 3000,
          temperature: 0.6,
        }
      );

      if (!aiResult.success || !aiResult.data) {
        console.error("AI keyword generation failed:", aiResult.error);
        return errorResponse(
          "INTERNAL_ERROR",
          `キーワード生成に失敗しました: ${aiResult.error || "不明なエラー"}`,
          500
        );
      }

      const aiKeywords = aiResult.data.keywords || [];
      console.log(`AI generated ${aiKeywords.length} keyword candidates`);

      // Keywords Everywhere APIでボリューム取得
      let enrichedKeywords: EnrichedKeyword[] = aiKeywords.map((kw) => ({
        keyword: kw.keyword,
        reasoning: kw.reasoning,
        searchVolume: 0,
        competition: 0,
        cpc: 0,
        trend: [],
        score: 0,
        isRecommended: false,
      }));

      if (settings.dataforSeoApiKey) {
        console.log("Fetching search volume data from DataForSEO...");
        const client = new DataForSEOClient(settings.dataforSeoApiKey);
        const keywordStrings = aiKeywords.map((k) => k.keyword);
        const batches = chunk(keywordStrings, 20);

        const allVolumeData: Array<{
          keyword: string;
          volume: number;
          cpc: number;
          competition: number;
          trend: number[];
        }> = [];

        for (const batch of batches) {
          try {
            const data = await client.getKeywordData({ keywords: batch });
            allVolumeData.push(...data);
          } catch (error) {
            console.error("DataForSEO batch error:", error);
            // 失敗したバッチはスキップして続行
          }
        }

        // AIキーワードとボリュームデータをマージ
        enrichedKeywords = aiKeywords.map((aiKw) => {
          const volumeData = allVolumeData.find(
            (v) => v.keyword.toLowerCase() === aiKw.keyword.toLowerCase()
          );
          return {
            keyword: aiKw.keyword,
            reasoning: aiKw.reasoning,
            searchVolume: volumeData?.volume ?? 0,
            competition: volumeData?.competition ?? 0,
            cpc: volumeData?.cpc ?? 0,
            trend: volumeData?.trend ?? [],
            score: 0,
            isRecommended: false,
          };
        });
      } else {
        console.log("DataForSEO API key not configured, skipping volume data");
      }

      // スコアリング
      enrichedKeywords = enrichedKeywords.map((kw) => ({
        ...kw,
        score: scoreKeyword(
          {
            keyword: kw.keyword,
            volume: kw.searchVolume,
            cpc: kw.cpc,
            competition: kw.competition,
            trend: kw.trend,
          },
          volumeRange
        ),
        isRecommended: isInRecommendedRange(kw.searchVolume, volumeRange),
      }));

      // スコア順でソート
      enrichedKeywords.sort((a, b) => b.score - a.score);

      // レスポンス
      return successResponse({
        keywords: enrichedKeywords,
        context: {
          category: {
            id: category.id,
            name: category.name,
            description: category.description,
          },
          conversion: {
            id: conversion.id,
            name: conversion.name,
            context: conversion.context,
          },
          author: {
            id: author.id,
            name: author.name,
            role: author.role,
          },
        },
        volumeRange,
        generatedCount: aiKeywords.length,
        tokensUsed: aiResult.tokensUsed,
      });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Keyword suggest error:", error);
    return ApiErrors.internalError();
  }
}
