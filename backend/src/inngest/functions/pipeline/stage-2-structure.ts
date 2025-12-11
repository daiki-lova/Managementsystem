// Stage 2: 構成・安全設計

import prisma from "@/lib/prisma";
import { Prisma, StageStatus } from "@prisma/client";
import { getDecryptedSettings } from "@/lib/settings";
import { randomUUID } from "crypto";
import {
  type Stage2Input,
  type Stage2Output,
  type StageResult,
  STAGE_NAMES,
  callOpenRouter,
  STAGE_MODEL_CONFIG,
  buildStage2UserPrompt,
  COMMON_RULES,
  validateStage2Output,
} from "./common";

/**
 * Stage 2: 構成・安全設計を実行
 */
export async function executeStage2(
  jobId: string,
  input: Stage2Input
): Promise<StageResult<Stage2Output>> {
  const stageNumber = 2;
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

${settings.structurePrompt || getDefaultStructurePrompt()}`;

    // ユーザープロンプトを構築
    const userPrompt = buildStage2UserPrompt(input);

    // OpenRouter APIを呼び出し
    const modelConfig = STAGE_MODEL_CONFIG.structure;
    const result = await callOpenRouter<Stage2Output>(
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
      throw new Error(result.error || "Stage 2 generation failed");
    }

    // 出力をバリデーション
    const validatedOutput = validateStage2Output(result.data);

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
 * デフォルトの構成設計プロンプト
 */
function getDefaultStructurePrompt(): string {
  return `【構成・安全性プロンプト】
あなたは「編集部の安全設計担当」です。目的は、記事が安全かつ一次情報に忠実であることです。

タスク：
1) 検索意図を「一次意図/二次意図」に分解し、記事で必ず答える問いを5〜10個にする。
2) 安全性分類をする：
   - 高リスク（医療/妊娠/持病/怪我/痛みの原因断定 等）→断定禁止、受診推奨、免責強化
   - 中リスク（セルフケアの一般論）→注意喚起
   - 低リスク（習慣/スタジオ選び）→通常
3) H2/H3のアウトラインを作る（各見出しに「目的」と「一次情報の根拠」を紐づける）。
4) 事実が必要な箇所を「要出典」として列挙。
5) 内部リンクの挿入方針を決める。
6) 画像スロット案を決める。

出力（JSONのみ）：
{
  "risk_level": "low|medium|high",
  "must_answer_questions": ["..."],
  "outline": [
    {"h2": "...", "purpose": "...", "info_bank_refs": ["id1"], "h3": [{"title":"...", "purpose":"..."}]}
  ],
  "citation_needs": [
    {"claim": "この主張は根拠が必要", "preferred_source_type": "公的/論文/協会"}
  ],
  "internal_link_plan": {
    "in_body_slots": 2,
    "end_related_posts": 6,
    "candidates": ["slug1", "slug2"]
  },
  "image_plan": [
    {"slot": "cover", "intent": "世界観/安心感", "avoid": "医療断定/誇大", "alt_hint": "..."}
  ],
  "open_questions": ["不足している一次情報/確認事項"]
}`;
}
