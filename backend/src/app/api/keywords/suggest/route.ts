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

// カニバリマッチの型
interface CannibalMatch {
  articleId: string;
  title: string;
  slug: string;
  similarity: number; // 0-100
  matchType: "title" | "slug" | "keyword";
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
  // カニバリ判定
  cannibalScore: number; // 0-100 (高いほど被りリスク大)
  cannibalMatches: CannibalMatch[];
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

【キーワード選定基準 - 重要】
- キーワードは必ず2〜3語で構成する（例: 「ヨガ 初心者」「朝ヨガ 効果」）
- 4語以上のキーワードは生成しないでください
- 実際に検索されそうな一般的なキーワードを優先
- 検索ボリュームが期待できるキーワードを選ぶ
- コンバージョンにつながりやすい検索意図
- 監修者の資格・経験と整合性があるもの

【良い例】
- 「ヨガ 初心者」「ヨガ 効果」「朝ヨガ おすすめ」「ヨガ 資格」
【悪い例（長すぎる）】
- 「初心者ヨガ 無料体験 東京 おすすめ」「ヨガ 体験 不安解消 方法」

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

【監修者の情報バンク（専門知識）】
${knowledgeSummary || "（なし）"}

${seedKeywords.length > 0 ? `【参考キーワード（ヒント）】\n${seedKeywords.join(", ")}` : ""}

**重要**:
- キーワードは必ず2〜3語のみ（「ヨガ 初心者」「朝ヨガ 効果」のような形式）
- 4語以上は絶対に生成しない
- 以下のJSON形式のみで出力してください。説明文は不要です。
{
  "keywords": [
    {
      "keyword": "ヨガ 初心者",
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

// ===== カニバリ判定ロジック =====

// テキストを正規化（小文字化、記号除去、空白正規化）
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[・、。！？!?（）()「」【】\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// テキストをトークンに分割
function tokenize(text: string): Set<string> {
  const normalized = normalizeText(text);
  // スペース区切り + 2-gram的な分割
  const words = normalized.split(" ").filter((w) => w.length > 0);
  const tokens = new Set<string>();

  // 単語そのまま
  for (const word of words) {
    tokens.add(word);
    // 2文字以上の単語は2-gramも追加（日本語対応）
    if (word.length >= 2) {
      for (let i = 0; i < word.length - 1; i++) {
        tokens.add(word.slice(i, i + 2));
      }
    }
  }
  return tokens;
}

// Jaccard類似度を計算（0-100）
function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 && set2.size === 0) return 0;

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  if (union.size === 0) return 0;
  return Math.round((intersection.size / union.size) * 100);
}

// キーワードが文字列に含まれるかチェック
function containsKeyword(text: string, keyword: string): boolean {
  const normalizedText = normalizeText(text);
  const normalizedKeyword = normalizeText(keyword);
  return normalizedText.includes(normalizedKeyword);
}

// 既存記事との類似度を計算
interface ExistingArticle {
  id: string;
  title: string;
  slug: string;
}

function calculateCannibalMatches(
  keyword: string,
  existingArticles: ExistingArticle[]
): CannibalMatch[] {
  const matches: CannibalMatch[] = [];
  const keywordTokens = tokenize(keyword);

  for (const article of existingArticles) {
    let maxSimilarity = 0;
    let matchType: CannibalMatch["matchType"] = "keyword";

    // 1. タイトルとのJaccard類似度
    const titleTokens = tokenize(article.title);
    const titleSimilarity = jaccardSimilarity(keywordTokens, titleTokens);
    if (titleSimilarity > maxSimilarity) {
      maxSimilarity = titleSimilarity;
      matchType = "title";
    }

    // 2. slugとの類似度（slugはハイフン区切りを考慮）
    const slugNormalized = article.slug.replace(/-/g, " ");
    const slugTokens = tokenize(slugNormalized);
    const slugSimilarity = jaccardSimilarity(keywordTokens, slugTokens);
    if (slugSimilarity > maxSimilarity) {
      maxSimilarity = slugSimilarity;
      matchType = "slug";
    }

    // 3. キーワードがタイトルに含まれるかチェック（完全一致に近いボーナス）
    if (containsKeyword(article.title, keyword)) {
      maxSimilarity = Math.max(maxSimilarity, 85);
      matchType = "keyword";
    }

    // 類似度が30%以上の場合のみ記録
    if (maxSimilarity >= 30) {
      matches.push({
        articleId: article.id,
        title: article.title,
        slug: article.slug,
        similarity: maxSimilarity,
        matchType,
      });
    }
  }

  // 類似度が高い順にソート
  matches.sort((a, b) => b.similarity - a.similarity);

  // 上位3件まで返す
  return matches.slice(0, 3);
}

// カニバリスコアを計算（0-100）
function calculateCannibalScore(matches: CannibalMatch[]): number {
  if (matches.length === 0) return 0;

  // 最も高い類似度をベースにスコア化
  const maxSimilarity = matches[0].similarity;

  // マッチ数に応じてボーナス/ペナルティ
  const matchCountBonus = Math.min(matches.length * 5, 15);

  return Math.min(100, maxSimilarity + matchCountBonus);
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
      const [category, conversion, author, settings, existingArticlesRaw] = await Promise.all([
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
        // カニバリ判定用: 同カテゴリの公開済み記事を取得
        prisma.articles.findMany({
          where: {
            categoryId: validated.categoryId,
            status: "PUBLISHED",
            deletedAt: null,
          },
          select: {
            id: true,
            title: true,
            slug: true,
          },
          orderBy: { publishedAt: "desc" },
          take: 100, // 最新100件まで
        }),
      ]);

      // 既存記事の型変換
      const existingArticles: ExistingArticle[] = existingArticlesRaw;

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
      // 【重要】keywordSuggestPrompt を優先、なければ keywordPrompt にフォールバック
      // Stage1のkeywordPromptとは分離して、候補生成の精度を保つ
      console.log("Generating keyword candidates with AI...");
      const basePrompt = settings.keywordSuggestPrompt || settings.keywordPrompt || null;
      const systemPrompt = buildSystemPrompt(basePrompt);
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
          maxTokens: 6000, // 25個のキーワード+理由を生成するのに十分なトークン数
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
      let enrichedKeywords: EnrichedKeyword[] = aiKeywords.map((kw) => {
        // カニバリ判定
        const cannibalMatches = calculateCannibalMatches(kw.keyword, existingArticles);
        const cannibalScore = calculateCannibalScore(cannibalMatches);

        return {
          keyword: kw.keyword,
          reasoning: kw.reasoning,
          searchVolume: 0,
          competition: 0,
          cpc: 0,
          trend: [],
          score: 0,
          isRecommended: false,
          cannibalScore,
          cannibalMatches,
        };
      });

      // DataForSEOエラー時の警告メッセージ
      let volumeDataWarning: string | undefined;

      if (settings.dataforSeoApiKey) {
        // デバッグ: APIキーの形式を確認（最初と最後の4文字のみ表示）
        const keyPreview = settings.dataforSeoApiKey.length > 8
          ? `${settings.dataforSeoApiKey.slice(0, 4)}...${settings.dataforSeoApiKey.slice(-4)}`
          : '(短すぎる)';
        console.log(`Fetching search volume data from DataForSEO... (key: ${keyPreview}, length: ${settings.dataforSeoApiKey.length})`);
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

        let hasAuthError = false;
        let hasPaymentError = false;
        for (const batch of batches) {
          try {
            const data = await client.getKeywordData({ keywords: batch });
            allVolumeData.push(...data);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("DataForSEO batch error:", errorMessage);

            // 認証エラーの場合は警告フラグを立てる
            if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
              hasAuthError = true;
              console.error("DataForSEO認証エラー: APIキーの形式を確認してください。'login:password'形式またはBase64エンコード済みの形式が必要です。");
            }
            // 残高不足エラーの場合
            if (errorMessage.includes('402') || errorMessage.includes('Payment Required')) {
              hasPaymentError = true;
              console.error("DataForSEO残高不足: アカウントにクレジットを追加してください。");
            }
            // 失敗したバッチはスキップして続行
          }
        }

        // エラー時の警告メッセージを設定
        if (hasPaymentError && allVolumeData.length === 0) {
          volumeDataWarning = "DataForSEOアカウントの残高が不足しています。検索ボリュームを取得できません。設定画面でアカウントのクレジットを確認してください。";
          console.warn(volumeDataWarning);
        } else if (hasAuthError && allVolumeData.length === 0) {
          volumeDataWarning = "DataForSEO APIの認証に失敗しました。APIキーを確認してください。";
          console.warn(volumeDataWarning);
        }

        // AIキーワードとボリュームデータをマージ（カニバリ情報を保持）
        enrichedKeywords = enrichedKeywords.map((existingKw) => {
          const volumeData = allVolumeData.find(
            (v) => v.keyword.toLowerCase() === existingKw.keyword.toLowerCase()
          );
          return {
            ...existingKw,
            searchVolume: volumeData?.volume ?? 0,
            competition: volumeData?.competition ?? 0,
            cpc: volumeData?.cpc ?? 0,
            trend: volumeData?.trend ?? [],
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

      // ソート: スコアが良くてもカニバリ高いものは下げる
      // 調整済みスコア = 基本スコア - (カニバリスコア * 0.5)
      enrichedKeywords.sort((a, b) => {
        const adjustedScoreA = a.score - a.cannibalScore * 0.5;
        const adjustedScoreB = b.score - b.cannibalScore * 0.5;
        return adjustedScoreB - adjustedScoreA;
      });

      console.log(
        `Cannibalization check: ${existingArticles.length} existing articles, ` +
          `${enrichedKeywords.filter((k) => k.cannibalScore > 50).length} high-risk keywords`
      );

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
        warning: volumeDataWarning,
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
