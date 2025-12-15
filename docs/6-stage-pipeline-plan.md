# 6ステージ記事生成パイプライン 実装計画

> **Note**: このドキュメントは旧版です。最新の仕様は **[article-generation-orchestration-v1.md](./article-generation-orchestration-v1.md)** を参照してください。v1では6ステージから8ステップへ刷新されています。

## 現状分析

### 現在のアーキテクチャ
```
POST /api/generation-jobs
       │
       ▼
  Inngest Event: "article/generate"
       │
       ▼
  generateArticle (1ステップ生成)
       │
       ├── fetch-data (DB取得)
       ├── generate-content (1回のAPI呼び出しで全生成)
       ├── save-article
       └── trigger-image-generation
```

### 問題点
1. `system_settings`に保存した4つのプロンプト（keywordPrompt, structurePrompt, seoPrompt, proofreadingPrompt）が**未使用**
2. 1回のAPI呼び出しで全て生成するため、各ステージの品質管理ができない
3. 中間成果物（構成案、下書き等）が保存されず、再生成時に全て最初からやり直し
4. 監修者の校正プロセスが組み込まれていない

---

## 目標アーキテクチャ

### 6ステージパイプライン
```
┌─────────────────────────────────────────────────────────────────┐
│  Stage 0: 共通ルール（全ステージで参照）                          │
│  - 安全性ルール、E-E-A-T、ブランドガイドライン                    │
└─────────────────────────────────────────────────────────────────┘
                              │
     ┌────────────────────────┼────────────────────────┐
     ▼                        ▼                        ▼
┌─────────┐            ┌─────────┐             ┌─────────┐
│ Stage 1 │            │ Stage 2 │             │ Stage 3 │
│ 企画    │───────────▶│ 構成    │────────────▶│ 執筆    │
│         │            │         │             │         │
│ keyword │            │structure│             │ draft   │
│ Prompt  │            │ Prompt  │             │ Prompt  │
└─────────┘            └─────────┘             └─────────┘
                                                    │
     ┌────────────────────────┬────────────────────┘
     ▼                        ▼
┌─────────┐            ┌─────────┐
│ Stage 4 │            │ Stage 5 │
│ SEO     │───────────▶│ 校正    │───────────▶ 完成
│         │            │         │
│ seo     │            │proofread│
│ Prompt  │            │ Prompt  │
└─────────┘            └─────────┘
```

### 各ステージの責務

| Stage | 名前 | プロンプト | 入力 | 出力 |
|-------|------|-----------|------|------|
| 0 | 共通ルール | (埋め込み) | - | 全ステージで参照 |
| 1 | キーワード分析・企画 | keywordPrompt | keyword, GSC/GA4データ, 既存記事 | topic_brief JSON |
| 2 | 構成・安全設計 | structurePrompt | topic_brief, info_bank, reviewer_profile | outline_package JSON |
| 3 | 記事執筆 | (システム内蔵) | outline_package, info_bank | draft JSON (meta/html/schema) |
| 4 | SEO/LLMO最適化 | seoPrompt | draft, topic_brief, outline_package | optimized_package JSON |
| 5 | 監修・校正 | proofreadingPrompt | optimized_package, reviewer_profile | final_package JSON |

---

## DBスキーマ変更

### 新規テーブル: `generation_stages`
```prisma
model generation_stages {
  id              String   @id @default(uuid())
  jobId           String
  stage           Int      // 1-5
  stageName       String   // "keyword_analysis", "structure", "draft", "seo", "proofreading"
  status          StageStatus @default(PENDING)
  input           Json?    // 入力データ
  output          Json?    // 出力データ
  promptUsed      String?  @db.Text // 使用したプロンプト（デバッグ用）
  tokensUsed      Int?     // トークン消費量
  errorMessage    String?
  startedAt       DateTime?
  completedAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  job             generation_jobs @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@index([jobId])
  @@index([stage])
}

enum StageStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  SKIPPED
}
```

### `generation_jobs` テーブル拡張
```prisma
model generation_jobs {
  // 既存フィールド...

  currentStage    Int      @default(0)  // 現在のステージ
  stageOutputs    Json?    // 各ステージの出力を保持（再開用）

  stages          generation_stages[]
}
```

---

## ファイル構成

```
backend/src/inngest/functions/
├── generate-article.ts          # 既存（リファクタリング）
├── pipeline/
│   ├── index.ts                 # パイプライン統合
│   ├── stage-1-keyword.ts       # Stage 1: キーワード分析
│   ├── stage-2-structure.ts     # Stage 2: 構成設計
│   ├── stage-3-draft.ts         # Stage 3: 記事執筆
│   ├── stage-4-seo.ts           # Stage 4: SEO最適化
│   ├── stage-5-proofread.ts     # Stage 5: 監修・校正
│   └── common/
│       ├── prompts.ts           # プロンプト構築ユーティリティ
│       ├── openrouter.ts        # OpenRouter API呼び出し
│       └── types.ts             # 型定義
└── generate-images.ts           # 既存
```

---

## 実装詳細

### Stage 1: キーワード分析・企画

**入力:**
```typescript
interface Stage1Input {
  keyword: string;
  categoryId: string;
  existingArticles: { slug: string; title: string; summary: string }[];
  gscData?: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
  ga4Data?: { pagePath: string; pageViews: number; avgSessionDuration: number }[];
}
```

**出力:**
```typescript
interface Stage1Output {
  date: string;
  conversion_goal: string;
  selected_topics: [{
    category: string;
    primary_keyword: string;
    secondary_keywords: string[];
    search_intent: string;
    angle: string;
    title_candidates: string[];
    why_now: string;
    priority_score: number;
    internal_link_candidates: string[];
    missing_info_questions: string[];
  }];
}
```

### Stage 2: 構成・安全設計

**入力:**
```typescript
interface Stage2Input {
  topicBrief: Stage1Output['selected_topics'][0];
  infoBank: KnowledgeItem[];
  reviewerProfile: AuthorProfile;
  contentIndex: { slug: string; title: string }[];
  brandRules: BrandRules;
}
```

**出力:**
```typescript
interface Stage2Output {
  risk_level: 'low' | 'medium' | 'high';
  must_answer_questions: string[];
  outline: {
    h2: string;
    purpose: string;
    info_bank_refs: string[];
    h3: { title: string; purpose: string }[];
  }[];
  citation_needs: { claim: string; preferred_source_type: string }[];
  internal_link_plan: {
    in_body_slots: number;
    end_related_posts: number;
    candidates: string[];
  };
  image_plan: {
    slot: string;
    intent: string;
    avoid: string;
    alt_hint: string;
  }[];
  open_questions: string[];
}
```

### Stage 3: 記事執筆

**入力:**
```typescript
interface Stage3Input {
  topicBrief: Stage1Output['selected_topics'][0];
  outlinePackage: Stage2Output;
  infoBank: KnowledgeItem[];
  reviewerProfile: AuthorProfile;
  brandRules: BrandRules;
}
```

**出力:**
```typescript
interface Stage3Output {
  meta: {
    title: string;
    metaTitle: string;
    metaDescription: string;
  };
  html: string; // 記事本文HTML
  schema_jsonld: object;
  internal_links: { slug: string; anchor: string; position: string }[];
  image_jobs: { slot: string; prompt: string; alt: string }[];
}
```

### Stage 4: SEO/LLMO最適化

**入力:**
```typescript
interface Stage4Input {
  draft: Stage3Output;
  topicBrief: Stage1Output['selected_topics'][0];
  outlinePackage: Stage2Output;
  infoBank: KnowledgeItem[];
  brandRules: BrandRules;
}
```

**出力:**
```typescript
interface Stage4Output {
  meta: Stage3Output['meta'];
  optimized_html: string;
  schema_jsonld: object;
  llmo_snippets: {
    short_summary: string;
    key_takeaways: string[];
  };
  internal_links_used: { slug: string; anchor: string }[];
  image_jobs: Stage3Output['image_jobs'];
  issues: string[];
}
```

### Stage 5: 監修・校正

**入力:**
```typescript
interface Stage5Input {
  articlePackage: Stage4Output;
  reviewerProfile: AuthorProfile;
  infoBank: KnowledgeItem[];
  brandRules: BrandRules;
  conversionGoal: string;
}
```

**出力:**
```typescript
interface Stage5Output {
  status: 'approved' | 'needs_changes';
  summary: string;
  required_changes: {
    location: string;
    problem: string;
    fix: string;
  }[];
  optional_suggestions: {
    suggestion: string;
    reason: string;
  }[];
  reviewer_note_to_publish: string;
  final_html?: string; // approved時のみ
  final_meta?: object; // approved時のみ
}
```

---

## Inngest フロー

### メインオーケストレーター
```typescript
export const generateArticlePipeline = inngest.createFunction(
  {
    id: "generate-article-pipeline",
    name: "Generate Article Pipeline",
    retries: 1, // 各ステージで個別にリトライ
  },
  { event: "article/generate" },
  async ({ event, step }) => {
    const { jobId, keyword, ... } = event.data;

    // Stage 1: キーワード分析
    const stage1Result = await step.run("stage-1-keyword", async () => {
      return executeStage1(jobId, keyword, ...);
    });

    // Stage 2: 構成設計
    const stage2Result = await step.run("stage-2-structure", async () => {
      return executeStage2(jobId, stage1Result, ...);
    });

    // Stage 3: 記事執筆
    const stage3Result = await step.run("stage-3-draft", async () => {
      return executeStage3(jobId, stage1Result, stage2Result, ...);
    });

    // Stage 4: SEO最適化
    const stage4Result = await step.run("stage-4-seo", async () => {
      return executeStage4(jobId, stage3Result, ...);
    });

    // Stage 5: 監修・校正
    const stage5Result = await step.run("stage-5-proofread", async () => {
      return executeStage5(jobId, stage4Result, ...);
    });

    // 記事保存
    const article = await step.run("save-article", async () => {
      return saveArticle(jobId, stage5Result, ...);
    });

    // 画像生成トリガー
    await step.sendEvent("trigger-images", {
      name: "article/generate-images",
      data: { articleId: article.id, imageJobs: stage4Result.image_jobs },
    });

    return { articleId: article.id };
  }
);
```

---

## 進捗表示

### フロントエンド更新
```typescript
// generation_jobs のprogress計算
const STAGE_PROGRESS = {
  0: 0,    // 未開始
  1: 15,   // キーワード分析完了
  2: 35,   // 構成設計完了
  3: 60,   // 記事執筆完了
  4: 80,   // SEO最適化完了
  5: 95,   // 監修・校正完了
  6: 100,  // 保存完了
};

// UIでの表示
const STAGE_LABELS = {
  1: "キーワード分析中...",
  2: "構成を設計中...",
  3: "記事を執筆中...",
  4: "SEO最適化中...",
  5: "監修・校正中...",
  6: "保存中...",
};
```

---

## 実装順序

### Phase 1: 基盤整備（1日目）✅ 完了
1. [x] DBスキーマ変更（generation_stages追加）
2. [x] Prisma migration実行
3. [x] 型定義ファイル作成（types.ts）
4. [x] OpenRouter APIユーティリティ作成

### Phase 2: ステージ実装（2-3日目）✅ 完了
5. [x] Stage 1: キーワード分析実装
6. [x] Stage 2: 構成設計実装
7. [x] Stage 3: 記事執筆実装
8. [x] Stage 4: SEO最適化実装
9. [x] Stage 5: 監修・校正実装

### Phase 3: 統合（4日目）✅ 完了
10. [x] パイプラインオーケストレーター実装
11. [x] 既存generate-article.tsをリファクタリング
12. [x] 進捗更新ロジック実装

### Phase 4: フロントエンド（5日目）
13. [ ] 生成ジョブ詳細画面でステージ表示
14. [ ] 各ステージの出力プレビュー機能
15. [ ] 失敗時の再開機能

### Phase 5: テスト・最適化（6日目）
16. [x] E2Eテスト（基本動作確認完了）
17. [ ] プロンプトチューニング（品質向上）
18. [ ] パフォーマンス最適化

---

## リスクと対策

| リスク | 対策 |
|--------|------|
| API呼び出し回数増加（5回/記事） | 並列実行不可のため順次実行、キャッシュ活用 |
| トークン消費増加 | 各ステージでmax_tokensを適切に設定 |
| 中間ステージ失敗 | 各ステージの出力をDBに保存、再開可能に |
| プロンプト調整が困難 | system_settingsで管理、CMS上で編集可能 |

---

## 設定可能項目

CMS設定画面で調整可能な項目：
- 各ステージのプロンプト（既存4つ + 執筆用1つ追加）
- 使用AIモデル（ステージごとに変更可能）
- スキップ可能ステージ（例：Stage 1をスキップして直接キーワード指定）

---

## 実装完了メモ（2024-12-11）

### 完了した実装
- **6ステージパイプライン**: Stage 1〜6が全て動作確認済み
- **バリデーション強化**: snake_case/camelCase両対応、ブロックキー検証
- **DBプロンプト設定**: seoPrompt、proofreadingPromptを正しい出力形式に修正済み
- **エラーハンドリング**: 各ステージの失敗をDBに記録、失敗ハンドラー実装

### 動作確認済み
- キーワード「ヨガ 肩こり解消」で記事生成成功
- 全ステージのトークン消費量を記録
- 生成記事がarticlesテーブルに保存

### 残課題
1. **プロンプト品質改善**: 現状の記事品質は10点未満、プロンプトチューニングが必要
2. **フロントエンド**: ステージ進捗表示、出力プレビュー機能
3. **再開機能**: 失敗したステージからの再開
4. **画像生成連携**: image_jobsを使った画像生成トリガー

### 修正履歴
| 日付 | 修正内容 |
|------|----------|
| 2024-12-11 | Stage 3: `section.h3`、`info_bank_refs`のnull安全対応 |
| 2024-12-11 | Stage 4: `optimized_html`→`optimized_blocks`形式に対応 |
| 2024-12-11 | Stage 5: `final_blocks`、`final_meta`、`quality_score`形式に対応 |
| 2024-12-11 | バリデーション: snake_case/camelCase両対応追加 |
