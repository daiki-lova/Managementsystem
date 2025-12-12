// Stage 4: SEO/LLMO最適化

import prisma from "@/lib/prisma";
import { Prisma, StageStatus } from "@prisma/client";
import { getDecryptedSettings } from "@/lib/settings";
import { randomUUID } from "crypto";
import {
  type Stage3Output,
  type Stage4Input,
  type Stage4Output,
  type StageResult,
  STAGE_NAMES,
  callOpenRouter,
  STAGE_MODEL_CONFIG,
  buildStage4UserPrompt,
  COMMON_RULES,
  validateStage4Output,
} from "./common";

/**
 * Stage 4: SEO/LLMO最適化を実行
 * @param jobId - ジョブID
 * @param input - Stage 4入力
 * @param stage3ImageJobs - Stage 3のimage_jobs（フォールバック用）
 */
export async function executeStage4(
  jobId: string,
  input: Stage4Input,
  stage3ImageJobs?: Stage3Output["image_jobs"]
): Promise<StageResult<Stage4Output>> {
  const stageNumber = 4;
  const stageName = STAGE_NAMES[stageNumber];

  // ステージレコードを作成
  const stage = await prisma.generation_stages.create({
    data: {
      id: randomUUID(),
      jobId,
      stage: stageNumber,
      stageName,
      status: StageStatus.RUNNING,
      input: input as unknown as Prisma.InputJsonValue,
      startedAt: new Date(),
    },
  });

  try {
    // 設定からAPIキーとプロンプトを取得
    const settings = await getDecryptedSettings();
    if (!settings?.openRouterApiKey) {
      throw new Error("OpenRouter API key is not configured");
    }

    // システムプロンプトを構築
    const systemPrompt = `${COMMON_RULES}

${settings.seoPrompt || getDefaultSeoPrompt()}`;

    // ユーザープロンプトを構築
    const userPrompt = buildStage4UserPrompt(input);

    // OpenRouter APIを呼び出し
    const modelConfig = STAGE_MODEL_CONFIG.seo;
    const result = await callOpenRouter<Stage4Output>(
      systemPrompt,
      userPrompt,
      {
        apiKey: settings.openRouterApiKey,
        model: settings.articleModel || modelConfig.model,
        maxTokens: modelConfig.maxTokens,
        temperature: modelConfig.temperature,
      }
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || "Stage 4 generation failed");
    }

    // 出力をバリデーション（Stage 3のimage_jobsをフォールバックとして渡す）
    const validatedOutput = validateStage4Output(result.data, stage3ImageJobs);

    // ステージを完了に更新
    await prisma.generation_stages.update({
      where: { id: stage.id },
      data: {
        status: StageStatus.COMPLETED,
        output: validatedOutput as unknown as Prisma.InputJsonValue,
        promptUsed: systemPrompt.slice(0, 5000),
        tokensUsed: result.tokensUsed,
        completedAt: new Date(),
      },
    });

    return {
      success: true,
      output: validatedOutput,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await prisma.generation_stages.update({
      where: { id: stage.id },
      data: {
        status: StageStatus.FAILED,
        errorMessage,
        completedAt: new Date(),
      },
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * デフォルトのSEO最適化プロンプト
 */
function getDefaultSeoPrompt(): string {
  return `【SEO・LLMO最適化プロンプト】
あなたは「SEO編集者 兼 LLMO編集者」です。入力記事を、検索意図に最短で答える構造へ整えます。
事実の追加は禁止です（info_bankと引用に無い断定を増やさない）。

タスク：
1) 冒頭に「1〜3文の結論（要点）」を追加（断定しすぎない）。
2) 見出しを検索意図に合わせて調整（重複見出しの整理、順序の最適化）。
3) 文章の読みやすさを改善（無駄な繰り返し削除、定義を明確化）。
4) LLMが引用しやすい短い要約を用意。
5) 内部リンクのアンカーと配置を最適化（過剰は削る）。
6) 入力にある画像生成ジョブ(image_jobs)をそのまま出力に含める（必須）。

出力（JSONのみ）：
{
  "meta": {
    "title": "最適化後タイトル",
    "metaTitle": "最適化後SEOタイトル",
    "metaDescription": "最適化後メタディスクリプション"
  },
  "optimized_blocks": [
    {"id": "...", "type": "p|h2|h3|...", "content": "最適化後コンテンツ"}
  ],
  "schema_jsonld": {...},
  "llmo_snippets": {
    "short_summary": "200〜400字の要約",
    "key_takeaways": ["重要ポイント1", "重要ポイント2", "重要ポイント3"]
  },
  "internal_links_used": [
    {"slug": "article-slug", "anchor": "リンクテキスト"}
  ],
  "image_jobs": [
    {"slot": "cover", "prompt": "画像生成プロンプト", "alt": "alt属性"}
  ],
  "issues": ["リスク表現/根拠不足/曖昧さ など指摘"]
}

**重要**: image_jobsは入力データから引き継ぎ、必ず出力に含めてください。空配列でも必須です。`;
}
