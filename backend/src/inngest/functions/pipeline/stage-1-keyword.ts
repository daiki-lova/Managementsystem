// Stage 1: キーワード分析・企画

import prisma from "@/lib/prisma";
import { Prisma, StageStatus } from "@prisma/client";
import { getDecryptedSettings } from "@/lib/settings";
import { randomUUID } from "crypto";
import {
  type Stage1Input,
  type Stage1Output,
  type StageResult,
  STAGE_NAMES,
  callOpenRouter,
  STAGE_MODEL_CONFIG,
  buildStage1UserPrompt,
  COMMON_RULES,
  validateStage1Output,
  StageValidationError,
} from "./common";

/**
 * Stage 1: キーワード分析・企画を実行
 */
export async function executeStage1(
  jobId: string,
  input: Stage1Input
): Promise<StageResult<Stage1Output>> {
  const stageNumber = 1;
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

${settings.keywordPrompt || getDefaultKeywordPrompt()}`;

    // ユーザープロンプトを構築
    const userPrompt = buildStage1UserPrompt(input);

    // OpenRouter APIを呼び出し
    const modelConfig = STAGE_MODEL_CONFIG.keyword_analysis;
    const result = await callOpenRouter<Stage1Output>(
      systemPrompt,
      userPrompt,
      {
        apiKey: settings.openRouterApiKey,
        model: settings.aiModel || modelConfig.model,
        maxTokens: modelConfig.maxTokens,
        temperature: modelConfig.temperature,
      }
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || "Stage 1 generation failed");
    }

    // 出力をバリデーション
    const validatedOutput = validateStage1Output(result.data);

    // ステージを完了に更新
    await prisma.generation_stages.update({
      where: { id: stage.id },
      data: {
        status: StageStatus.COMPLETED,
        output: validatedOutput as unknown as Prisma.InputJsonValue,
        promptUsed: systemPrompt.slice(0, 5000), // 保存用に切り詰め
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
    // エラー時はステージをFAILEDに更新
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
 * デフォルトのキーワード分析プロンプト（settings.keywordPromptがない場合）
 */
function getDefaultKeywordPrompt(): string {
  return `【キーワード分析・企画プロンプト】
あなたは「ヨガメディアの編集長 兼 企画責任者」です。目的はコンバージョン最大化です。
以下の入力だけを根拠に、狙うべきテーマとタイトル案を決めてください。

タスク：
1) 候補KWを「既存記事でカバー済み」「薄い/ズレている」「未着手」に分類。
2) 各候補に優先度スコアを付ける。
3) 今日生成する「1テーマ」を決める（カテゴリも必ず割り当てる）。
4) テーマについて、タイトル案を5つ、記事の切り口を定義。
5) 既存記事から内部リンク候補を選ぶ。

出力（JSONのみ）：
{
  "date": "YYYY-MM-DD",
  "conversion_goal": "...",
  "selected_topics": [
    {
      "category": "...",
      "primary_keyword": "...",
      "secondary_keywords": ["..."],
      "search_intent": "知りたい/やりたい/比較したい/不安を解消したい など",
      "angle": "一次情報をどこで効かせるか",
      "title_candidates": ["...", "...", "...", "...", "..."],
      "why_now": "データ根拠を短文で",
      "priority_score": 0,
      "internal_link_candidates": ["slug1", "slug2"],
      "missing_info_questions": ["記事化に必要だが情報バンクに見当たらない確認事項"]
    }
  ]
}`;
}
