// Stage 5: 監修・校正

import prisma from "@/lib/prisma";
import { Prisma, StageStatus } from "@prisma/client";
import { getDecryptedSettings } from "@/lib/settings";
import { randomUUID } from "crypto";
import {
  type Stage5Input,
  type Stage5Output,
  type StageResult,
  STAGE_NAMES,
  callOpenRouter,
  STAGE_MODEL_CONFIG,
  buildStage5UserPrompt,
  COMMON_RULES,
  validateStage5Output,
} from "./common";

/**
 * Stage 5: 監修・校正を実行
 */
export async function executeStage5(
  jobId: string,
  input: Stage5Input
): Promise<StageResult<Stage5Output>> {
  const stageNumber = 5;
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

${settings.proofreadingPrompt || getDefaultProofreadingPrompt()}`;

    // ユーザープロンプトを構築
    const userPrompt = buildStage5UserPrompt(input);

    // OpenRouter APIを呼び出し
    const modelConfig = STAGE_MODEL_CONFIG.proofreading;
    const result = await callOpenRouter<Stage5Output>(
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
      throw new Error(result.error || "Stage 5 generation failed");
    }

    // 出力をバリデーション
    const validatedOutput = validateStage5Output(result.data);

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
 * デフォルトの監修・校正プロンプト
 */
function getDefaultProofreadingPrompt(): string {
  return `【監修・校正プロンプト】
あなたは「編集部の監修者 兼 校正者」です。最終チェックとして、記事の品質・正確性・安全性を担保します。

タスク：
1) 医療的な断定表現をチェック（「〜を治療できる」「〜が治る」などは禁止）。
2) エビデンスのない主張を特定し、トーンを調整する。
3) 読者への誤解を招く表現を修正。
4) 免責事項の適切な配置を確認。
5) ブランドガイドラインとの整合性をチェック。
6) 誤字脱字、文法ミスを修正。
7) 読みやすさの最終調整（長すぎる文の分割、接続詞の調整）。

チェック観点：
- 医療・健康情報の安全性
- 一次情報への忠実さ
- 読者の期待との整合性
- SEO要素の維持
- ブランドトーンの一貫性

**重要**: 品質スコアのoverallが70未満、または重大な安全性問題がある場合は status を "needs_changes" にしてください。

出力（JSONのみ）：
{
  "status": "approved" または "needs_changes",
  "final_blocks": [
    {"id": "...", "type": "p|h2|h3|...", "content": "校正後コンテンツ"}
  ],
  "final_meta": {
    "title": "最終タイトル",
    "metaTitle": "最終SEOタイトル",
    "metaDescription": "最終メタディスクリプション"
  },
  "changes_made": [
    {"original": "元の表現", "revised": "修正後", "reason": "修正理由"}
  ],
  "safety_notes": ["安全性に関する注記"],
  "disclaimer_added": true,
  "quality_score": {
    "accuracy": 0-100,
    "readability": 0-100,
    "seo_optimization": 0-100,
    "brand_alignment": 0-100,
    "overall": 0-100
  },
  "final_review_comments": ["最終レビューコメント"],
  "required_changes": [
    {"location": "問題箇所", "problem": "問題内容", "suggested_fix": "修正案"}
  ]
}

statusの判断基準：
- "approved": overall >= 70 かつ重大な安全性問題なし
- "needs_changes": overall < 70 または重大な安全性問題あり（医療断定、虚偽情報等）`;
}
