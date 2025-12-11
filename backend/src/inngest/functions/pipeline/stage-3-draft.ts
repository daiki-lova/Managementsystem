// Stage 3: 記事執筆

import prisma from "@/lib/prisma";
import { Prisma, StageStatus } from "@prisma/client";
import { getDecryptedSettings } from "@/lib/settings";
import { randomUUID } from "crypto";
import {
  type Stage3Input,
  type Stage3Output,
  type StageResult,
  STAGE_NAMES,
  callOpenRouter,
  STAGE_MODEL_CONFIG,
  buildStage3UserPrompt,
  COMMON_RULES,
  validateStage3Output,
} from "./common";

/**
 * Stage 3: 記事執筆を実行
 */
export async function executeStage3(
  jobId: string,
  input: Stage3Input
): Promise<StageResult<Stage3Output>> {
  const stageNumber = 3;
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
    // 設定からAPIキーを取得
    const settings = await getDecryptedSettings();
    if (!settings?.openRouterApiKey) {
      throw new Error("OpenRouter API key is not configured");
    }

    // システムプロンプトを構築（執筆用は内蔵）
    const systemPrompt = `${COMMON_RULES}

${getDraftPrompt(input)}`;

    // ユーザープロンプトを構築
    const userPrompt = buildStage3UserPrompt(input);

    // OpenRouter APIを呼び出し
    const modelConfig = STAGE_MODEL_CONFIG.draft;
    const result = await callOpenRouter<Stage3Output>(
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
      throw new Error(result.error || "Stage 3 generation failed");
    }

    // 出力をバリデーション
    const validatedOutput = validateStage3Output(result.data);

    // ブロックIDを自動生成（なければ）
    const outputWithIds = ensureBlockIds(validatedOutput);

    // ステージを完了に更新
    await prisma.generation_stages.update({
      where: { id: stage.id },
      data: {
        status: StageStatus.COMPLETED,
        output: outputWithIds as unknown as Prisma.InputJsonValue,
        promptUsed: systemPrompt.slice(0, 5000),
        tokensUsed: result.tokensUsed,
        completedAt: new Date(),
      },
    });

    return {
      success: true,
      output: outputWithIds,
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
 * ブロックにIDがない場合は自動生成
 */
function ensureBlockIds(output: Stage3Output): Stage3Output {
  return {
    ...output,
    blocks: output.blocks.map((block, index) => ({
      ...block,
      id: block.id || `block-${index}-${randomUUID().slice(0, 8)}`,
    })),
  };
}

/**
 * 記事執筆プロンプト
 */
function getDraftPrompt(input: Stage3Input): string {
  const { reviewerProfile, brandRules } = input;

  return `【記事執筆プロンプト】
あなたは「${reviewerProfile.name}」（${reviewerProfile.role}）として、ヨガ・ウェルネスに関する記事を執筆します。
ブランド: ${brandRules.name}

執筆ルール：
1. 構成案（outline）に忠実に、各H2/H3の目的を達成する文章を書く。
2. 情報バンク（info_bank_refs）に紐づく主張は事実として書く。参照IDがない主張は「一般論」として書く。
3. リスクレベルに応じて、断定表現を調整する（highなら断定禁止）。
4. 読者に語りかける「です・ます」調で、専門用語には補足を入れる。
5. 各段落は3〜5文、読み飛ばしを防ぐ具体的な見出しを維持。
6. 画像スロットの位置にはプレースホルダーを配置する。
7. 内部リンクは自然なアンカーテキストで配置する。

出力（JSONのみ）：
{
  "meta": {
    "title": "記事タイトル（32文字以内）",
    "metaTitle": "SEOタイトル（32文字以内）",
    "metaDescription": "メタディスクリプション（120文字以内）"
  },
  "blocks": [
    {"id": "unique-id", "type": "p", "content": "段落テキスト"},
    {"id": "unique-id", "type": "h2", "content": "見出し2"},
    {"id": "unique-id", "type": "h3", "content": "見出し3"},
    {"id": "unique-id", "type": "ul", "content": "項目1\\n項目2\\n項目3"},
    {"id": "unique-id", "type": "blockquote", "content": "引用文"},
    {"id": "unique-id", "type": "callout", "content": "重要なポイント"},
    {"id": "unique-id", "type": "image", "content": "", "metadata": {"slot": "cover", "alt": "画像の説明"}}
  ],
  "schema_jsonld": {
    "@context": "https://schema.org",
    "@type": "Article",
    ...
  },
  "internal_links": [
    {"slug": "related-article", "anchor": "リンクテキスト", "position": "本文内/末尾"}
  ],
  "image_jobs": [
    {"slot": "cover", "prompt": "画像生成プロンプト", "alt": "alt属性"}
  ]
}

記事の構成：
1. 導入部（共感＋結論）- 200〜300字
2. 本題（H2で3-5セクション、各セクションにH3を含む）- 2000〜3500字
3. 実践的なアドバイス - 300〜500字
4. まとめ（アクションプラン）- 200〜300字

合計: 3000〜5000字`;
}
