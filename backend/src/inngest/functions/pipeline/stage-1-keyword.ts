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
        model: settings.analysisModel || modelConfig.model,
        maxTokens: modelConfig.maxTokens,
        temperature: modelConfig.temperature,
      }
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || "Stage 1 generation failed");
    }

    // 出力をバリデーション（入力キーワードとの一致チェック含む）
    const validatedOutput = validateStage1Output(result.data, input.keyword);

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
 *
 * 【重要】このプロンプトは「人が選んだキーワードを固定で分析する」用途専用です。
 * キーワード候補生成には使用しないでください（候補生成は keywordSuggestPrompt を使用）。
 */
function getDefaultKeywordPrompt(): string {
  return `【キーワード分析プロンプト】
あなたは「ヨガメディアの編集長 兼 企画責任者」です。目的はコンバージョン最大化です。

【絶対ルール】
- 入力された「対象キーワード」は人が選定済みです。絶対に変更しないでください。
- primary_keyword は入力された対象キーワードをそのまま使用してください。
- 別のキーワードを提案したり、キーワードを言い換えたりしないでください。

【タスク】
1) 入力された対象キーワードの検索意図を分析する
2) ターゲット読者像を推測する
3) 記事の切り口（angle）を決める - 一次情報をどこで効かせるか
4) タイトル案を5つ作成する - 対象キーワードを必ず含める
5) 既存記事から内部リンク候補を選ぶ
6) 記事化に必要だが情報バンクに見当たらない確認事項をリストアップ

【出力仕様】
- 必ずJSON形式のみで出力してください
- primary_keyword は入力された対象キーワードと完全一致させてください
- secondary_keywords は関連キーワードを補助的に追加してください

出力（JSONのみ）：
{
  "date": "YYYY-MM-DD",
  "conversion_goal": "...",
  "selected_topics": [
    {
      "category": "入力されたカテゴリ名",
      "primary_keyword": "入力された対象キーワード（絶対に変更しない）",
      "secondary_keywords": ["関連キーワード1", "関連キーワード2"],
      "search_intent": "知りたい/やりたい/比較したい/不安を解消したい など",
      "angle": "一次情報をどこで効かせるか",
      "title_candidates": ["タイトル案1", "タイトル案2", "タイトル案3", "タイトル案4", "タイトル案5"],
      "why_now": "このキーワードで記事を書く理由",
      "priority_score": 100,
      "internal_link_candidates": ["slug1", "slug2"],
      "missing_info_questions": ["記事化に必要だが情報バンクに見当たらない確認事項"]
    }
  ]
}`;
}
