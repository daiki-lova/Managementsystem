# 記事生成パイプライン設計ドキュメント

このドキュメントでは、記事生成パイプラインの各ステージ構成について説明します。

## 目次

1. [現行版: 3.5ステージ](#現行版-35ステージ)
2. [拡張版: 5ステージ](#拡張版-5ステージ)
3. [完全版: 7ステージ](#完全版-7ステージ)
4. [実装ガイド](#実装ガイド)
5. [ステージ比較表](#ステージ比較表)

---

## 現行版: 3.5ステージ

**現在実装済み**。少量記事生成（2-5記事）向けに最適化。

```
┌─────────────────────────────────────────────────────────────┐
│ Stage 0: 検索意図分析                                        │
│ ・DataForSEO SERP APIでPAA/競合タイトル/関連検索取得         │
│ ・Graceful Degradation: エラー時は空データで継続             │
├─────────────────────────────────────────────────────────────┤
│ Stage 1: タイトル生成                                        │
│ ・SEO最適化タイトル、slug、metaDescription生成               │
│ ・検索意図分析結果を参照                                     │
├─────────────────────────────────────────────────────────────┤
│ Stage 2: 記事HTML生成                                        │
│ ・要約ボックス（LLMO対策）必須                               │
│ ・PAA→FAQ反映、競合差別化                                   │
│ ・人間らしさ演出（余談、失敗談、口語表現）                   │
│ ・決定的ハッシュでパターン選択（再現性）                     │
├─────────────────────────────────────────────────────────────┤
│ Step 2.5: 品質チェック（LLM不要）                            │
│ ・文字数、キーワード密度、見出し数評価                       │
│ ・要約ボックス/FAQ/画像の有無チェック                        │
│ ・100点満点スコアリング                                      │
├─────────────────────────────────────────────────────────────┤
│ Stage 3: 画像生成 + 保存                                     │
│ ・プレースホルダーから画像生成                               │
│ ・記事をDBに保存                                             │
└─────────────────────────────────────────────────────────────┘
```

### 特徴
- **処理時間**: 約2-4分/記事
- **コスト**: 低（LLM呼び出し2回 + API1回）
- **品質**: 中〜高（品質チェックで警告表示）

---

## 拡張版: 5ステージ

**推奨: 品質重視の中規模生成（5-20記事）向け**

3.5ステージに「アウトライン生成」と「リビジョン」を追加。

```
┌─────────────────────────────────────────────────────────────┐
│ Stage 0: 検索意図分析                                        │
│ ・DataForSEO SERP APIでPAA/競合タイトル/関連検索取得         │
│ ・競合記事の文字数・見出し構成も取得（オプション）           │
├─────────────────────────────────────────────────────────────┤
│ Stage 1: タイトル生成                                        │
│ ・SEO最適化タイトル、slug、metaDescription生成               │
├─────────────────────────────────────────────────────────────┤
│ Stage 2: アウトライン生成 ★新規                              │
│ ・H2/H3見出し構成を先に生成                                  │
│ ・各セクションの概要・文字数目安を決定                       │
│ ・FAQ質問リストを確定                                        │
├─────────────────────────────────────────────────────────────┤
│ Stage 3: 記事HTML生成                                        │
│ ・アウトラインに従って本文生成                               │
│ ・セクションごとの文字数を遵守                               │
├─────────────────────────────────────────────────────────────┤
│ Stage 4: リビジョン + 品質チェック ★新規                     │
│ ・LLMによる自己レビュー                                      │
│ ・問題箇所の自動修正                                         │
│ ・最終品質スコア算出                                         │
├─────────────────────────────────────────────────────────────┤
│ Stage 5: 画像生成 + 保存                                     │
│ ・プレースホルダーから画像生成                               │
│ ・記事をDBに保存                                             │
└─────────────────────────────────────────────────────────────┘
```

### Stage 2: アウトライン生成の詳細

**入力**:
```typescript
interface OutlineInput {
  keyword: string;
  title: string;
  searchAnalysis: Stage0Output;
  targetWordCount: number; // 目標文字数（デフォルト5000）
}
```

**出力**:
```typescript
interface OutlineOutput {
  sections: {
    level: 'h2' | 'h3';
    title: string;
    summary: string;        // このセクションで書く内容の概要
    targetWordCount: number; // 目標文字数
    includeImage: boolean;
  }[];
  faqQuestions: string[];   // PAA + 独自質問
  summaryPoints: string[];  // 要約ボックスに入れるポイント
}
```

**プロンプト例**:
```
あなたはSEO記事の構成を設計する編集者です。

【タイトル】${title}
【キーワード】${keyword}
【競合記事の見出し構成】
${competitorOutlines}

【PAA（よく検索される質問）】
${paaQuestions}

以下の条件でアウトラインを設計してください：
1. H2見出しは4-6個
2. 各H2の下にH3を1-3個
3. 総文字数${targetWordCount}字を各セクションに配分
4. PAA質問は必ずFAQに含める
5. 競合と被らない独自の切り口を1つ以上入れる

JSON形式で出力してください。
```

### Stage 4: リビジョンの詳細

**入力**:
```typescript
interface RevisionInput {
  html: string;
  keyword: string;
  qualityCheck: QualityCheckResult;
}
```

**プロンプト例**:
```
あなたは編集者です。以下の記事をレビューし、問題があれば修正してください。

【品質チェック結果】
- スコア: ${score}点
- 警告: ${warnings.join(', ')}

【修正指示】
1. 警告項目を修正
2. 「基本的に」「一般的に」などAI臭い表現を削除
3. 同じ語尾が3回以上連続している箇所を修正
4. キーワード密度が高すぎる場合は自然な言い換え

修正後のHTMLのみを出力してください。
```

### 特徴
- **処理時間**: 約4-7分/記事
- **コスト**: 中（LLM呼び出し4回）
- **品質**: 高（構造化 + 自己修正）

---

## 完全版: 7ステージ

**最高品質向け。少量の重要記事（1-3記事）に推奨**

```
┌─────────────────────────────────────────────────────────────┐
│ Stage 0: 検索意図分析                                        │
│ ・SERP API + 競合記事スクレイピング                          │
│ ・競合の見出し構成、文字数、使用キーワード分析               │
├─────────────────────────────────────────────────────────────┤
│ Stage 1: タイトル候補生成                                    │
│ ・複数候補（3-5個）を生成                                    │
│ ・CTR予測スコア付き                                          │
├─────────────────────────────────────────────────────────────┤
│ Stage 2: タイトル選定 + 差別化戦略                           │
│ ・最適タイトルを選定                                         │
│ ・競合との差別化ポイントを明確化                             │
├─────────────────────────────────────────────────────────────┤
│ Stage 3: 詳細アウトライン生成                                │
│ ・見出し構成 + 各セクションの詳細概要                        │
│ ・使用する一次情報（情報バンク）を割り当て                   │
│ ・内部リンク候補を抽出                                       │
├─────────────────────────────────────────────────────────────┤
│ Stage 4: セクション別本文生成                                │
│ ・セクションごとに個別生成（並列実行可）                     │
│ ・各セクションで品質チェック                                 │
├─────────────────────────────────────────────────────────────┤
│ Stage 5: 統合 + 一貫性チェック                               │
│ ・全セクションを結合                                         │
│ ・文体・トーンの一貫性を確認                                 │
│ ・重複表現を削除                                             │
├─────────────────────────────────────────────────────────────┤
│ Stage 6: 最終リビジョン + E-E-A-T強化                        │
│ ・監修者の専門性を強調する修正                               │
│ ・引用・参考文献の追加                                       │
│ ・構造化データ（JSON-LD）生成                                │
├─────────────────────────────────────────────────────────────┤
│ Stage 7: 画像生成 + メディア最適化 + 保存                    │
│ ・高品質画像生成                                             │
│ ・OGP画像生成                                                │
│ ・記事をDBに保存                                             │
└─────────────────────────────────────────────────────────────┘
```

### Stage 4: セクション別本文生成の詳細

**並列実行のメリット**:
- 各セクションを独立して生成可能
- 1セクション失敗しても他に影響なし
- 処理時間短縮（並列度に応じて）

**実装イメージ**:
```typescript
// Inngestでの並列実行
const sectionResults = await Promise.all(
  outline.sections.map((section, index) =>
    step.run(`generate-section-${index}`, async () => {
      return await generateSection(section, context);
    })
  )
);
```

### Stage 6: E-E-A-T強化の詳細

**E-E-A-T（Experience, Expertise, Authoritativeness, Trustworthiness）**

```typescript
interface EEATEnhancement {
  // Experience（経験）
  experienceSignals: {
    personalAnecdotes: string[];     // 監修者の体験談を追加
    caseStudies: string[];           // 具体的な事例
  };

  // Expertise（専門性）
  expertiseSignals: {
    technicalTermsExplained: boolean; // 専門用語に説明を追加
    certificationsMentioned: boolean; // 資格への言及
  };

  // Authoritativeness（権威性）
  authoritySignals: {
    citations: string[];              // 引用元
    externalLinks: string[];          // 権威サイトへのリンク
  };

  // Trustworthiness（信頼性）
  trustSignals: {
    disclaimer: boolean;              // 免責事項
    lastUpdated: boolean;             // 更新日表示
    factChecked: boolean;             // ファクトチェック済みマーク
  };
}
```

### 特徴
- **処理時間**: 約8-15分/記事
- **コスト**: 高（LLM呼び出し7-10回）
- **品質**: 最高（多段階検証 + E-E-A-T強化）

---

## 実装ガイド

### 5ステージ版への拡張手順

1. **types.tsに型追加**
```typescript
// backend/src/inngest/functions/pipeline/common/types.ts

export interface OutlineSection {
  level: 'h2' | 'h3';
  title: string;
  summary: string;
  targetWordCount: number;
  includeImage: boolean;
  knowledgeItemIds?: string[]; // 使用する情報バンクID
}

export interface Stage2OutlineOutput {
  sections: OutlineSection[];
  faqQuestions: string[];
  summaryPoints: string[];
  totalTargetWordCount: number;
}

export interface Stage4RevisionOutput {
  revisedHtml: string;
  changesApplied: string[];
  finalScore: number;
}
```

2. **prompts.tsにプロンプト追加**
```typescript
// backend/src/inngest/functions/pipeline/common/prompts.ts

export function buildOutlinePrompt(input: OutlineInput): string {
  // アウトライン生成プロンプト
}

export function buildRevisionPrompt(input: RevisionInput): string {
  // リビジョンプロンプト
}
```

3. **index.tsにステージ追加**
```typescript
// Stage 2（アウトライン）をStage 1とStage 3の間に挿入
// Stage 4（リビジョン）をStage 3の後に挿入
```

### 7ステージ版への拡張手順

1. **セクション別生成の実装**
```typescript
// backend/src/inngest/functions/pipeline/section-generator.ts

export async function generateSectionContent(
  section: OutlineSection,
  context: SectionContext
): Promise<string> {
  const prompt = buildSectionPrompt(section, context);
  const response = await callOpenRouterText(systemPrompt, prompt, config);
  return response.data;
}
```

2. **E-E-A-T強化の実装**
```typescript
// backend/src/inngest/functions/pipeline/eeat-enhancer.ts

export async function enhanceEEAT(
  html: string,
  supervisor: SupervisorData
): Promise<EEATEnhancedOutput> {
  // 監修者情報を活用した権威性強化
  // 引用・参考文献の追加
  // JSON-LD構造化データ生成
}
```

3. **JSON-LD生成**
```typescript
export function generateArticleJsonLd(article: ArticleData): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "author": {
      "@type": "Person",
      "name": article.supervisor.name,
      "jobTitle": article.supervisor.role,
    },
    "publisher": {
      "@type": "Organization",
      "name": article.brand.name,
    },
    // ... 他のフィールド
  });
}
```

---

## ステージ比較表

| 項目 | 3.5ステージ | 5ステージ | 7ステージ |
|------|------------|----------|----------|
| LLM呼び出し回数 | 2回 | 4回 | 7-10回 |
| 処理時間/記事 | 2-4分 | 4-7分 | 8-15分 |
| API コスト | 低 | 中 | 高 |
| 記事品質 | 中〜高 | 高 | 最高 |
| 構造の一貫性 | 中 | 高 | 最高 |
| E-E-A-T対応 | 基本 | 中 | 完全 |
| 推奨記事数/バッチ | 2-5記事 | 5-20記事 | 1-3記事 |
| 並列生成 | 不可 | 不可 | 可能 |
| 自己修正 | なし | あり | 多段階 |

---

## 環境変数設定

```bash
# .env.local

# パイプラインモード選択（将来実装時）
PIPELINE_MODE=3.5  # 3.5 | 5 | 7

# 品質閾値（この点数未満でリビジョン実行）
QUALITY_THRESHOLD=70

# 並列生成の最大同時実行数（7ステージ用）
MAX_PARALLEL_SECTIONS=3

# E-E-A-T強化を有効化（7ステージ用）
ENABLE_EEAT_ENHANCEMENT=true
```

---

## 今後の拡張案

1. **A/Bテスト機能**: 同じキーワードで異なるステージ数の記事を生成し比較
2. **品質学習**: 過去の高評価記事からパターンを学習
3. **キーワードクラスタリング**: 関連キーワードをまとめて効率的に生成
4. **自動内部リンク**: 既存記事との関連性を分析し自動リンク挿入

---

*最終更新: 2024年*
