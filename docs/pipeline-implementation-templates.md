# パイプライン実装テンプレート

5ステージ・7ステージ版を実装する際のコードテンプレート集。

## 5ステージ版の追加コード

### 1. 型定義の追加

```typescript
// backend/src/inngest/functions/pipeline/common/types.ts に追加

/**
 * Stage 2: アウトライン生成の出力
 */
export interface OutlineSection {
  id: string;
  level: 'h2' | 'h3';
  title: string;
  summary: string;
  targetWordCount: number;
  includeImage: boolean;
  knowledgeItemIds?: string[];
}

export interface Stage2OutlineOutput {
  sections: OutlineSection[];
  faqQuestions: string[];
  summaryPoints: string[];
  totalTargetWordCount: number;
  estimatedReadingTime: number; // 分
}

export interface Stage2OutlineInput {
  keyword: string;
  title: string;
  categoryName: string;
  searchAnalysis?: Stage0Output;
  targetWordCount?: number; // デフォルト5000
  supervisor: {
    name: string;
    specialties?: string[];
  };
}

/**
 * Stage 4: リビジョンの入出力
 */
export interface Stage4RevisionInput {
  html: string;
  keyword: string;
  qualityCheck: QualityCheckResult;
  outline: Stage2OutlineOutput;
}

export interface Stage4RevisionOutput {
  revisedHtml: string;
  changesApplied: string[];
  beforeScore: number;
  afterScore: number;
  revisionsCount: number;
}

/**
 * 5ステージ版の全出力
 */
export interface AllStageOutputs5 {
  stage0?: Stage0Output;
  stage1?: Stage1Output;
  stage2Outline?: Stage2OutlineOutput;
  stage3?: Stage2Output; // 記事生成（番号ずれ注意）
  stage4Revision?: Stage4RevisionOutput;
  qualityCheck?: QualityCheckResult;
}
```

### 2. アウトライン生成プロンプト

```typescript
// backend/src/inngest/functions/pipeline/common/prompts.ts に追加

export function buildOutlinePrompt(input: Stage2OutlineInput): string {
  const { keyword, title, categoryName, searchAnalysis, targetWordCount = 5000, supervisor } = input;

  const paaQuestions = searchAnalysis?.peopleAlsoAsk
    ?.map((paa, i) => `${i + 1}. ${paa.question}`)
    .join('\n') || '（なし）';

  const competitorTitles = searchAnalysis?.topResults
    ?.slice(0, 5)
    .map((r, i) => `${i + 1}位: ${r.title}`)
    .join('\n') || '（なし）';

  return `あなたはSEO記事の構成を設計する編集者です。

## 記事情報
- タイトル: ${title}
- キーワード: ${keyword}
- カテゴリ: ${categoryName}
- 目標文字数: ${targetWordCount}字
- 監修者: ${supervisor.name}（専門: ${supervisor.specialties?.join('、') || '未設定'}）

## 競合記事タイトル
${competitorTitles}

## よく検索される質問（PAA）
${paaQuestions}

## 設計条件

1. **見出し構成**
   - H2見出し: 4-6個
   - 各H2の下にH3: 1-3個
   - 合計セクション数: 10-15個

2. **文字数配分**
   - 総文字数${targetWordCount}字を各セクションに配分
   - 導入: 200-300字
   - 各H2セクション: 500-1000字
   - FAQ: 各100-200字
   - まとめ: 200-300字

3. **差別化**
   - 競合タイトルと被らない独自の切り口を1つ以上
   - 監修者の専門性を活かせるセクションを含める

4. **FAQ**
   - PAA質問を必ず含める
   - 追加で独自の質問を2-3個

## 出力形式（JSON）

\`\`\`json
{
  "sections": [
    {
      "id": "intro",
      "level": "h2",
      "title": "導入セクションタイトル",
      "summary": "このセクションで伝える内容の概要（50字程度）",
      "targetWordCount": 250,
      "includeImage": true
    },
    {
      "id": "section-1",
      "level": "h2",
      "title": "H2見出し",
      "summary": "概要",
      "targetWordCount": 600,
      "includeImage": false
    },
    {
      "id": "section-1-1",
      "level": "h3",
      "title": "H3見出し",
      "summary": "概要",
      "targetWordCount": 300,
      "includeImage": false
    }
    // ... 続く
  ],
  "faqQuestions": [
    "質問1？",
    "質問2？"
  ],
  "summaryPoints": [
    "要約ポイント1",
    "要約ポイント2",
    "要約ポイント3"
  ],
  "totalTargetWordCount": ${targetWordCount},
  "estimatedReadingTime": ${Math.ceil(targetWordCount / 500)}
}
\`\`\`

JSONのみを出力してください。`;
}
```

### 3. リビジョンプロンプト

```typescript
// backend/src/inngest/functions/pipeline/common/prompts.ts に追加

export function buildRevisionPrompt(input: Stage4RevisionInput): string {
  const { html, keyword, qualityCheck, outline } = input;

  const warningsText = qualityCheck.warnings.length > 0
    ? qualityCheck.warnings.map((w, i) => `${i + 1}. ${w}`).join('\n')
    : 'なし';

  return `あなたは経験豊富な編集者です。以下の記事をレビューし、問題があれば修正してください。

## 品質チェック結果
- 現在スコア: ${qualityCheck.overallScore}点/100点
- 文字数: ${qualityCheck.wordCount}字
- キーワード密度: ${qualityCheck.keywordDensity}%
- H2見出し数: ${qualityCheck.h2Count}個
- H3見出し数: ${qualityCheck.h3Count}個

## 警告項目
${warningsText}

## 修正指示

### 必須修正
1. 警告項目をすべて解決する
2. 要約ボックスがなければ追加
3. FAQセクションがなければ追加

### 文体修正
1. 「基本的に」「一般的に」「様々な」が多用されていたら削減
2. 「重要です」「大切です」が3回以上あれば言い換え
3. 同じ語尾が3回連続していたら変える
4. 全ての段落が同じ長さなら、長短をつける

### キーワード最適化
- キーワード「${keyword}」の密度が5%を超えていたら自然な言い換えを使用
- キーワードが3回未満なら自然に追加

### 構造チェック
- アウトラインの見出し構成と一致しているか確認
- 不足セクションがあれば追加

## アウトライン（参照用）
${outline.sections.map(s => `${s.level === 'h2' ? '##' : '###'} ${s.title}`).join('\n')}

## 出力

修正後の完全なHTMLのみを出力してください。
\`<article>\`タグで始まり\`</article>\`で終わること。
変更箇所の説明は不要です。`;
}
```

### 4. パイプラインへの統合

```typescript
// backend/src/inngest/functions/pipeline/index.ts
// 5ステージ版のステージ追加部分

// Stage 2: アウトライン生成（Stage 1の後に挿入）
const stage2OutlineResult = await step.run("execute-stage-2-outline", async () => {
  const input: Stage2OutlineInput = {
    keyword,
    title: stageOutputs.stage1!.title,
    categoryName: pipelineData.category.name,
    searchAnalysis: stageOutputs.stage0,
    targetWordCount: 5000,
    supervisor: {
      name: pipelineData.author.name,
      specialties: pipelineData.author.specialties as string[] | undefined,
    },
  };

  const prompt = buildOutlinePrompt(input);
  const systemPrompt = "あなたはSEO記事の構成を設計する編集者です。JSONのみを出力してください。";

  const response = await callOpenRouter<Stage2OutlineOutput>(
    systemPrompt,
    prompt,
    {
      apiKey: pipelineData.settings.openRouterApiKey!,
      model: "anthropic/claude-3.5-sonnet",
      maxTokens: 2000,
    }
  );

  // ステージ記録を保存
  await prisma.generation_stages.create({
    data: {
      id: randomUUID(),
      jobId,
      stage: 2,
      stageName: "outline_generation",
      status: response.success ? "COMPLETED" : "FAILED",
      input: input as unknown as Prisma.InputJsonValue,
      output: response.data as unknown as Prisma.InputJsonValue,
      promptUsed: prompt,
      tokensUsed: response.tokensUsed,
      completedAt: new Date(),
    },
  });

  return response;
});

if (!stage2OutlineResult.success || !stage2OutlineResult.data) {
  throw new Error(`Stage 2 (Outline) failed: ${stage2OutlineResult.error}`);
}
stageOutputs.stage2Outline = stage2OutlineResult.data;

// Stage 3: 記事生成（アウトラインを参照）
// ... 既存のStage 2のコードを修正してアウトラインを参照するように

// Stage 4: リビジョン（品質チェック後に挿入）
if (qualityCheckResult.overallScore < 70 || qualityCheckResult.needsRevision) {
  const stage4RevisionResult = await step.run("execute-stage-4-revision", async () => {
    const input: Stage4RevisionInput = {
      html: stageOutputs.stage3!.html,
      keyword,
      qualityCheck: qualityCheckResult,
      outline: stageOutputs.stage2Outline!,
    };

    const prompt = buildRevisionPrompt(input);
    const systemPrompt = "あなたは経験豊富な編集者です。修正後のHTMLのみを出力してください。";

    const response = await callOpenRouterText(
      systemPrompt,
      prompt,
      {
        apiKey: pipelineData.settings.openRouterApiKey!,
        model: "anthropic/claude-3.5-sonnet",
        maxTokens: 8000,
      }
    );

    if (!response.success || !response.data) {
      // リビジョン失敗時は元のHTMLを使用
      return {
        success: true,
        data: {
          revisedHtml: stageOutputs.stage3!.html,
          changesApplied: [],
          beforeScore: qualityCheckResult.overallScore,
          afterScore: qualityCheckResult.overallScore,
          revisionsCount: 0,
        } as Stage4RevisionOutput,
      };
    }

    const revisedHtml = cleanGeneratedHtml(response.data);
    const newQualityCheck = performQualityCheck(revisedHtml, keyword);

    return {
      success: true,
      data: {
        revisedHtml,
        changesApplied: ["自動修正適用"],
        beforeScore: qualityCheckResult.overallScore,
        afterScore: newQualityCheck.overallScore,
        revisionsCount: 1,
      } as Stage4RevisionOutput,
    };
  });

  stageOutputs.stage4Revision = stage4RevisionResult.data;

  // 修正後のHTMLで上書き
  if (stage4RevisionResult.data) {
    stageOutputs.stage3 = {
      ...stageOutputs.stage3!,
      html: stage4RevisionResult.data.revisedHtml,
    };
  }
}
```

---

## 7ステージ版の追加コード

### セクション別生成

```typescript
// backend/src/inngest/functions/pipeline/section-generator.ts

import { callOpenRouterText } from "./common/openrouter";
import type { OutlineSection } from "./common/types";

interface SectionContext {
  keyword: string;
  title: string;
  supervisor: {
    name: string;
    profile: string;
    episodes?: { type: string; title: string; content: string }[];
  };
  previousSections: string[]; // 前のセクションの内容（重複回避用）
  knowledgeItems: { id: string; content: string }[];
}

export async function generateSectionContent(
  section: OutlineSection,
  context: SectionContext,
  apiKey: string
): Promise<{ html: string; wordCount: number }> {

  const relevantKnowledge = context.knowledgeItems
    .filter(k => section.knowledgeItemIds?.includes(k.id))
    .map(k => k.content)
    .join('\n');

  const prompt = `あなたは${context.supervisor.name}として記事を執筆しています。

## セクション情報
- 見出し: ${section.title}
- 目標文字数: ${section.targetWordCount}字
- 概要: ${section.summary}

## 使用する情報
${relevantKnowledge || 'なし'}

## 前のセクションの内容（重複回避のため）
${context.previousSections.slice(-2).join('\n---\n') || 'なし'}

## 指示
1. 目標文字数を守る
2. 前のセクションと内容が重複しないようにする
3. 具体例やデータを含める
4. 監修者の視点で書く

## 出力
HTMLのみ（見出しタグから開始）。`;

  const response = await callOpenRouterText(
    "あなたは経験豊富なライターです。",
    prompt,
    {
      apiKey,
      model: "anthropic/claude-3.5-sonnet",
      maxTokens: 2000,
    }
  );

  const html = response.data || '';
  const textContent = html.replace(/<[^>]+>/g, '');

  return {
    html,
    wordCount: textContent.length,
  };
}

// 並列実行版
export async function generateAllSections(
  sections: OutlineSection[],
  context: SectionContext,
  apiKey: string,
  maxParallel: number = 3
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const previousSections: string[] = [];

  // バッチ処理（maxParallel個ずつ並列実行）
  for (let i = 0; i < sections.length; i += maxParallel) {
    const batch = sections.slice(i, i + maxParallel);

    const batchResults = await Promise.all(
      batch.map(section =>
        generateSectionContent(
          section,
          { ...context, previousSections: [...previousSections] },
          apiKey
        )
      )
    );

    batch.forEach((section, index) => {
      results.set(section.id, batchResults[index].html);
      previousSections.push(batchResults[index].html);
    });
  }

  return results;
}
```

### E-E-A-T強化

```typescript
// backend/src/inngest/functions/pipeline/eeat-enhancer.ts

import { callOpenRouterText } from "./common/openrouter";

interface EEATInput {
  html: string;
  supervisor: {
    name: string;
    role: string;
    profile: string;
    certifications?: { name: string; year?: number }[];
    careerStartYear?: number;
    totalStudentsTaught?: number;
  };
  brand: {
    name: string;
    domain: string;
  };
  keyword: string;
  publishDate: Date;
}

interface EEATOutput {
  enhancedHtml: string;
  jsonLd: string;
  addedSignals: {
    experience: string[];
    expertise: string[];
    authority: string[];
    trust: string[];
  };
}

export async function enhanceEEAT(
  input: EEATInput,
  apiKey: string
): Promise<EEATOutput> {
  const { html, supervisor, brand, keyword, publishDate } = input;

  // JSON-LD生成
  const jsonLd = generateArticleJsonLd(input);

  // E-E-A-T強化プロンプト
  const prompt = `あなたは編集者です。以下の記事にE-E-A-T（経験・専門性・権威性・信頼性）シグナルを追加してください。

## 監修者情報
- 名前: ${supervisor.name}
- 肩書: ${supervisor.role}
- 経歴: ${supervisor.profile}
- 資格: ${supervisor.certifications?.map(c => c.name).join('、') || 'なし'}
- キャリア開始: ${supervisor.careerStartYear || '不明'}年
- 指導人数: ${supervisor.totalStudentsTaught?.toLocaleString() || '不明'}名

## 強化指示

### Experience（経験）
- 監修者の具体的な体験談を1-2箇所追加
- 「私が指導した生徒の中で...」のような具体例

### Expertise（専門性）
- 専門用語に簡潔な説明を追加
- 資格・経歴への言及を自然に織り込む

### Authoritativeness（権威性）
- 参考文献セクションがなければ追加
- 信頼できる外部ソースへの言及

### Trustworthiness（信頼性）
- 最終更新日を追加
- 免責事項を確認

## 出力
修正後のHTMLのみ。`;

  const response = await callOpenRouterText(
    "あなたは経験豊富な編集者です。",
    prompt,
    {
      apiKey,
      model: "anthropic/claude-3.5-sonnet",
      maxTokens: 8000,
    }
  );

  return {
    enhancedHtml: response.data || html,
    jsonLd,
    addedSignals: {
      experience: ["監修者の体験談追加"],
      expertise: ["専門用語説明追加"],
      authority: ["参考文献セクション確認"],
      trust: ["免責事項確認"],
    },
  };
}

function generateArticleJsonLd(input: EEATInput): string {
  const { supervisor, brand, keyword, publishDate } = input;
  const currentYear = new Date().getFullYear();
  const careerYears = supervisor.careerStartYear
    ? currentYear - supervisor.careerStartYear
    : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://${brand.domain}/articles/`
    },
    "headline": keyword,
    "datePublished": publishDate.toISOString(),
    "dateModified": new Date().toISOString(),
    "author": {
      "@type": "Person",
      "name": supervisor.name,
      "jobTitle": supervisor.role,
      "description": supervisor.profile,
      ...(careerYears && { "yearsOfExperience": careerYears }),
    },
    "publisher": {
      "@type": "Organization",
      "name": brand.name,
      "url": `https://${brand.domain}`,
    },
    "isAccessibleForFree": true,
  };

  return JSON.stringify(jsonLd, null, 2);
}
```

---

## フラグによるステージ切り替え

```typescript
// backend/src/inngest/functions/pipeline/index.ts

// 環境変数でモード切り替え
const PIPELINE_MODE = process.env.PIPELINE_MODE || '3.5';

export const generateArticlePipeline = inngest.createFunction(
  // ... 設定
  async ({ event, step }) => {
    // ... 共通処理

    switch (PIPELINE_MODE) {
      case '3.5':
        return await run3_5StagePipeline(step, context);
      case '5':
        return await run5StagePipeline(step, context);
      case '7':
        return await run7StagePipeline(step, context);
      default:
        return await run3_5StagePipeline(step, context);
    }
  }
);

// 各モードの関数を分離
async function run3_5StagePipeline(step: StepTools, context: PipelineContext) {
  // 現在の実装
}

async function run5StagePipeline(step: StepTools, context: PipelineContext) {
  // Stage 0-1: 共通
  // Stage 2: アウトライン追加
  // Stage 3: 記事生成（アウトライン参照）
  // Stage 4: リビジョン追加
  // Stage 5: 保存
}

async function run7StagePipeline(step: StepTools, context: PipelineContext) {
  // Stage 0-2: 共通
  // Stage 3: 詳細アウトライン
  // Stage 4: セクション別生成（並列）
  // Stage 5: 統合
  // Stage 6: E-E-A-T強化
  // Stage 7: 保存
}
```

---

## テスト用スクリプト

```typescript
// backend/test-pipeline-5stage.ts

import { inngest } from "./src/inngest/client";

async function testPipeline() {
  // 5ステージモードで実行
  process.env.PIPELINE_MODE = '5';

  const result = await inngest.send({
    name: "article/generate-pipeline",
    data: {
      jobId: "test-job-id",
      keyword: "ヨガインストラクター 資格",
      categoryId: "category-id",
      authorId: "author-id",
      brandId: "brand-id",
      conversionIds: [],
      userId: "user-id",
    },
  });

  console.log("Pipeline triggered:", result);
}

testPipeline().catch(console.error);
```

---

*このテンプレートを参考に、段階的に5ステージ・7ステージ版を実装してください。*
