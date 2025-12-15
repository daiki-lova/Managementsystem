# 実装報告書: 記事生成パイプライン改善

**作成日**: 2024-12-15
**対象タスク**: Task 1, 2, 3, 4, 5
**ステータス**: レビュー待ち

---

## 概要

記事生成パイプラインの再現性向上、キーワード重複検出、画像生成フロー改善、表示バグ修正のため、以下の5つのタスクを実装しました。

| Task | 内容 | 目的 |
|------|------|------|
| 1 | Stage1のキーワード固定を強制 | AIが入力キーワードを勝手に変更する問題を解消 |
| 2 | キーワード候補生成のプロンプトを分離 | Stage1分析とAI候補生成で異なるプロンプトを使用可能に |
| 3 | カニバリ判定を候補生成に組み込む | 既存記事との重複リスクを検出・可視化 |
| 4 | 画像生成をimageJobsベースに変更 | パイプラインの画像プロンプトを画像生成に反映 |
| 5 | 公開側レンダリングをデータ揺れに強くする | ブロックデータのフォーマット差異による表示バグを解消 |

---

## Task 1: Stage1のキーワード固定を強制

### 問題

Stage1（キーワード分析）において、AIが入力されたキーワードを「より適切」と判断したキーワードに勝手に変更してしまう問題がありました。これにより同じ入力でも異なる出力が生成され、再現性が損なわれていました。

### 解決策

1. デフォルトプロンプトを「キーワード選定」から「キーワード分析専用」に変更
2. バリデーション時に入力キーワードと出力キーワードの一致チェックを追加
3. 不一致の場合は強制的に入力値で上書き

### 変更ファイル

#### 1. `backend/src/inngest/functions/pipeline/stage-1-keyword.ts`

**変更箇所**: `getDefaultKeywordPrompt()`関数

```typescript
// Before: キーワードを「選ぶ」プロンプト
function getDefaultKeywordPrompt(): string {
  return `...今日生成する1テーマを選べ...`;
}

// After: キーワードを「固定」するプロンプト
function getDefaultKeywordPrompt(): string {
  return `【キーワード分析プロンプト】
あなたは「ヨガメディアの編集長 兼 企画責任者」です。目的はコンバージョン最大化です。

【絶対ルール】
- 入力された「対象キーワード」は人が選定済みです。絶対に変更しないでください。
- primary_keyword は入力された対象キーワードをそのまま使用してください。
- 別のキーワードを提案したり、キーワードを言い換えたりしないでください。
...`;
}
```

**変更箇所**: `executeStage1()`関数（バリデーション呼び出し）

```typescript
// Before
const validatedOutput = validateStage1Output(result.data);

// After: 入力キーワードを渡してマッチングチェック
const validatedOutput = validateStage1Output(result.data, input.keyword);
```

#### 2. `backend/src/inngest/functions/pipeline/common/validation.ts`

**変更箇所**: `validateStage1Output()`関数

```typescript
// 追加: 入力キーワードとの一致チェック
export function validateStage1Output(output: unknown, inputKeyword?: string): Stage1Output {
  // ... 既存のバリデーション ...

  // 【重要】入力キーワードとの一致チェック（再現性確保のため）
  if (inputKeyword && topic.primary_keyword) {
    const normalizedInput = inputKeyword.trim().toLowerCase();
    const normalizedOutput = topic.primary_keyword.trim().toLowerCase();

    if (normalizedInput !== normalizedOutput) {
      console.warn(
        `[Stage1] キーワード不一致を検出: 入力="${inputKeyword}" → 出力="${topic.primary_keyword}". 入力値に強制補正します。`
      );
      data.selected_topics[0].primary_keyword = inputKeyword;
    }
  }

  return data;
}
```

### 動作確認方法

```bash
# ログで確認（不一致時にwarnが出力される）
# 入力: "ヨガ 初心者"
# AIが "初心者 ヨガ" を返した場合:
# → [Stage1] キーワード不一致を検出: 入力="ヨガ 初心者" → 出力="初心者 ヨガ". 入力値に強制補正します。
```

---

## Task 2: キーワード候補生成のプロンプトを分離

### 問題

Stage1（人が選んだキーワードを分析）とAIキーワード候補生成（AIがキーワードを提案）で同じプロンプト（`keywordPrompt`）を共用していたため、用途に応じたチューニングができませんでした。

### 解決策

新しいフィールド `keywordSuggestPrompt` を追加し、用途を分離しました。

| フィールド | 用途 |
|-----------|------|
| `keywordPrompt` | Stage1: 人が選んだキーワードを分析 |
| `keywordSuggestPrompt` | AIキーワード候補生成（StrategyViewのAI提案機能） |

### 変更ファイル

#### 1. `backend/prisma/schema.prisma`

```prisma
model system_settings {
  // ...
  keywordPrompt        String?  @db.Text
  keywordSuggestPrompt String?  @db.Text  // 追加
  structurePrompt      String?  @db.Text
  // ...
}
```

#### 2. `backend/src/lib/settings.ts`

```typescript
export interface SystemSettings {
  // ...
  keywordPrompt: string | null;
  keywordSuggestPrompt: string | null;  // 追加
  structurePrompt: string | null;
  // ...
}
```

#### 3. `backend/src/app/api/settings/route.ts`

```typescript
const updateSettingsSchema = z.object({
  // ...
  keywordPrompt: z.string().optional().nullable(),
  keywordSuggestPrompt: z.string().optional().nullable(),  // 追加
  structurePrompt: z.string().optional().nullable(),
  // ...
});
```

#### 4. `backend/src/app/api/keywords/suggest/route.ts`

```typescript
// Before
const systemPrompt = buildSystemPrompt(settings.keywordPrompt);

// After: keywordSuggestPrompt を優先、なければ keywordPrompt にフォールバック
const basePrompt = settings.keywordSuggestPrompt || settings.keywordPrompt || null;
const systemPrompt = buildSystemPrompt(basePrompt);
```

#### 5. `src/components/dashboard/SettingsView.tsx`

設定画面に「キーワード候補生成プロンプト」のテキストエリアを追加。

#### 6. `src/lib/api.ts`

```typescript
// SystemSettings型にkeywordSuggestPromptを追加
keywordSuggestPrompt: string | null;
```

### マイグレーション

```bash
# スキーマ同期（driftエラーのためdb pushを使用）
npx prisma db push
```

### 動作確認方法

1. CMS設定画面（/settings）を開く
2. 「キーワード候補生成プロンプト」フィールドが表示されることを確認
3. プロンプトを入力して保存
4. StrategyViewでAIキーワード提案を実行
5. 設定したプロンプトが使用されることを確認（ログまたは出力内容で判断）

---

## Task 3: カニバリ判定を候補生成に組み込む

### 問題

AIキーワード提案で、既存記事と重複するキーワードが提案されてしまい、カニバリゼーション（同一サイト内での競合）が発生するリスクがありました。

### 解決策

Jaccard類似度を用いたカニバリゼーション検出機能を実装し、キーワード候補にリスクスコアと重複記事情報を付与しました。

### アルゴリズム

```
1. テキスト正規化: 小文字化、記号除去、空白正規化
2. 2-gramトークン化: 日本語テキスト対応（例: "ヨガ初心者" → {"ヨガ", "ガ初", "初心", "心者"}）
3. Jaccard類似度: intersection(A, B) / union(A, B) × 100
4. カニバリスコア: max(類似度) + (マッチ数ボーナス) ※上限100
5. ソート調整: adjustedScore = baseScore - (cannibalScore × 0.5)
```

### 変更ファイル

#### 1. `backend/src/app/api/keywords/suggest/route.ts`

**追加**: カニバリ関連の型定義

```typescript
// カニバリマッチの型
interface CannibalMatch {
  articleId: string;
  title: string;
  slug: string;
  similarity: number; // 0-100
  matchType: "title" | "slug" | "keyword";
}

// EnrichedKeywordに追加
interface EnrichedKeyword {
  // ... 既存フィールド ...
  cannibalScore: number;      // 0-100（高いほど被りリスク大）
  cannibalMatches: CannibalMatch[];
}
```

**追加**: ヘルパー関数

```typescript
// テキスト正規化
function normalizeText(text: string): string {
  return text.toLowerCase()
    .replace(/[・、。！？!?（）()「」【】\[\]]/g, " ")
    .replace(/\s+/g, " ").trim();
}

// 2-gramトークン化
function tokenize(text: string): Set<string> {
  const normalized = normalizeText(text);
  const tokens = new Set<string>();
  const words = normalized.split(" ").filter(w => w.length > 0);
  for (const word of words) {
    tokens.add(word);
    for (let i = 0; i < word.length - 1; i++) {
      tokens.add(word.slice(i, i + 2));
    }
  }
  return tokens;
}

// Jaccard類似度計算
function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  if (union.size === 0) return 0;
  return Math.round((intersection.size / union.size) * 100);
}

// カニバリマッチ計算
function calculateCannibalMatches(keyword: string, existingArticles: ExistingArticle[]): CannibalMatch[] {
  const keywordTokens = tokenize(keyword);
  const matches: CannibalMatch[] = [];

  for (const article of existingArticles) {
    // タイトル類似度
    const titleTokens = tokenize(article.title);
    const titleSimilarity = jaccardSimilarity(keywordTokens, titleTokens);

    // スラッグ類似度
    const slugTokens = tokenize(article.slug.replace(/-/g, " "));
    const slugSimilarity = jaccardSimilarity(keywordTokens, slugTokens);

    // 最大類似度を採用
    const maxSimilarity = Math.max(titleSimilarity, slugSimilarity);

    if (maxSimilarity >= 30) {  // 閾値: 30%以上で記録
      matches.push({
        articleId: article.id,
        title: article.title,
        slug: article.slug,
        similarity: maxSimilarity,
        matchType: titleSimilarity >= slugSimilarity ? "title" : "slug",
      });
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
}
```

**変更**: 既存記事の取得を追加

```typescript
const [category, conversion, author, settings, existingArticlesRaw] = await Promise.all([
  // ... 既存クエリ ...
  prisma.articles.findMany({
    where: { categoryId: validated.categoryId, status: "PUBLISHED", deletedAt: null },
    select: { id: true, title: true, slug: true },
    orderBy: { publishedAt: "desc" },
    take: 100,
  }),
]);
```

**変更**: ソートロジックの更新

```typescript
// カニバリスコアを考慮したソート
enrichedKeywords.sort((a, b) => {
  const adjustedScoreA = a.score - a.cannibalScore * 0.5;
  const adjustedScoreB = b.score - b.cannibalScore * 0.5;
  return adjustedScoreB - adjustedScoreA;
});
```

#### 2. `src/components/dashboard/StrategyView.tsx`

**追加**: カニバリ警告UI

```tsx
// 型定義
type CannibalMatch = {
  articleId: string;
  title: string;
  slug: string;
  similarity: number;
  matchType: "title" | "slug" | "keyword";
};

type KeywordCandidate = {
  // ... 既存フィールド ...
  cannibalScore?: number;
  cannibalMatches?: CannibalMatch[];
};

// UI: 警告バッジ（cannibalScore >= 50で表示）
{candidate.cannibalScore && candidate.cannibalScore >= 50 && (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded text-xs",
          candidate.cannibalScore >= 70
            ? "bg-red-100 text-red-700"
            : "bg-amber-100 text-amber-700"
        )}>
          <AlertTriangle className="w-3 h-3" />
          <span>カニバリ{candidate.cannibalScore}%</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div>
          <p className="font-medium">類似記事あり:</p>
          {candidate.cannibalMatches?.map((match, i) => (
            <p key={i}>・{match.title} ({match.similarity}%)</p>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)}
```

#### 3. `src/lib/api.ts`

```typescript
export interface CannibalMatch {
  articleId: string;
  title: string;
  slug: string;
  similarity: number;
  matchType: "title" | "slug" | "keyword";
}

export interface KeywordSuggestion {
  // ... 既存フィールド ...
  cannibalScore: number;
  cannibalMatches: CannibalMatch[];
}
```

### 動作確認方法

1. StrategyViewでAIキーワード提案を実行
2. 既存記事と類似するキーワードに警告バッジが表示されることを確認
3. バッジをホバーして類似記事の詳細が表示されることを確認
4. 高リスク（70%以上）は赤、中リスク（50-69%）は黄色で表示

---

## Task 4: 画像生成をimageJobsベースに変更

### 問題

パイプラインのStage 3/4で生成される`image_jobs`（画像生成プロンプト）が画像生成処理に渡されず、汎用的なプロンプトで画像が生成されていました。

### 解決策

`generate-images.ts`を改修し、パイプラインから渡される`imageJobs`を使用して画像を生成するようにしました。

### 変更ファイル

#### `backend/src/inngest/functions/generate-images.ts`

**追加**: 型定義

```typescript
// image_jobの型定義（パイプラインから渡される）
interface ImageJob {
  slot: string;   // "cover", "inserted_1", "inserted_2", etc.
  prompt: string; // 画像生成プロンプト
  alt: string;    // alt属性
}

// 生成結果の型
interface GeneratedImage {
  slot: string;
  url: string;
  alt: string;
  mediaAssetId: string;
}
```

**変更**: イベントデータの取得

```typescript
// Before
const { articleId, jobId } = event.data;

// After: imageJobsも取得
const { articleId, jobId, imageJobs } = event.data as {
  articleId: string;
  jobId: string;
  imageJobs?: ImageJob[];
};
```

**追加**: imageJobsベースの画像生成

```typescript
if (imageJobs && imageJobs.length > 0) {
  console.log(`[ImageGeneration] Processing ${imageJobs.length} image jobs from pipeline`);

  for (let i = 0; i < imageJobs.length; i++) {
    const job = imageJobs[i];

    // パイプラインのプロンプトで画像生成
    const imageUrl = await step.run(`generate-image-${job.slot}-${i}`, async () => {
      const fullPrompt = `${systemPrompt}\n\n${job.prompt}`;
      return generateImage({ prompt: fullPrompt, apiKey, model });
    });

    if (imageUrl) {
      await step.run(`save-image-${job.slot}-${i}`, async () => {
        const mediaAsset = await prisma.media_assets.create({
          data: {
            id: randomUUID(),
            url: imageUrl,
            fileName: `${job.slot}-${articleId}.png`,
            altText: job.alt,
            source: MediaSource.AI_GENERATED,
            showInLibrary: false,
          },
        });

        // スロットに応じた処理
        if (job.slot === "cover" || job.slot === "thumbnail") {
          await prisma.articles.update({
            where: { id: articleId },
            data: { thumbnailId: mediaAsset.id },
          });
        } else {
          // article_imagesに追加
          await prisma.article_images.create({ ... });
        }
      });
    }
  }

	  // 記事ブロックの画像URLを更新（slot/alt/順序フォールバック）
	  await step.run("update-article-blocks", async () => {
	    // マッチング優先度:
	    // 1) metadata.slot で一致（最優先）
	    // 2) slotが無い場合は alt の部分一致（block.alt / metadata.alt / metadata.altText）
	    // 3) それでも一致しない場合は出現順で未使用画像を割り当て
	    // ※ マッチ後は metadata.slot を保持/追加して後続処理でも参照可能にする
	    const usedImageSlots = new Set<string>();

	    const updatedBlocks = currentBlocks.map((block, blockIndex) => {
	      if (block.type !== "image") return block;

	      // 1) slotで一致
	      const blockSlot = block.metadata?.slot as string | undefined;
	      let matchingImage = blockSlot
	        ? generatedImages.find((img) => img.slot === blockSlot && !usedImageSlots.has(img.slot))
	        : null;

	      // 2) altの部分一致
	      const blockAlt =
	        block.alt
	        ?? (block.metadata?.alt as string | undefined)
	        ?? (block.metadata?.altText as string | undefined);
	      if (!matchingImage && blockAlt) {
	        matchingImage = generatedImages.find((img) => !usedImageSlots.has(img.slot) && img.alt.includes(blockAlt));
	      }

	      // 3) 出現順（未使用画像の先頭を割り当て）
	      if (!matchingImage) {
	        const unusedImages = generatedImages.filter((img) => !usedImageSlots.has(img.slot));
	        matchingImage = unusedImages[0] ?? null;
	      }

	      if (!matchingImage) return block;

	      usedImageSlots.add(matchingImage.slot);
	      return {
	        ...block,
	        src: matchingImage.url,
	        alt: matchingImage.alt,
	        content: matchingImage.url,
	        metadata: { ...block.metadata, slot: matchingImage.slot },
	      };
	    });
	    await prisma.articles.update({ ... });
	  });
	}
```

**保持**: フォールバックロジック

```typescript
// imageJobsがない場合は従来のロジック（後方互換性）
console.log("[ImageGeneration] No imageJobs provided, using fallback generation");
// 従来の3画像生成ロジック...
```

### データフロー

```
Stage 3 (draft) → image_jobs生成
    ↓
Stage 4 (seo) → image_jobs継承/更新
    ↓
Pipeline index → article/generate-images イベント発火
    ↓
generate-images.ts → imageJobs受け取り
    ↓
各jobのpromptで画像生成
    ↓
media_assets/article_images保存
    ↓
記事blocksのsrc更新
```

### 動作確認方法

1. 記事生成パイプラインを実行
2. ログで「Processing N image jobs from pipeline」が出力されることを確認
3. 生成された記事の画像がimageJobsのプロンプトに基づいていることを確認
4. 記事のブロックデータにsrcが設定されていることを確認

---

## Task 5: 公開側レンダリングをデータ揺れに強くする

### 問題

記事のブロックデータが複数のフォーマットで保存される可能性があり、`renderBlock`関数が特定のフォーマットのみを想定していたため、表示されない・エラーになるケースがありました。

| ケース | 問題 |
|--------|------|
| 画像の`src` | `block.src`のみ参照。`block.content`に入っている場合に画像が表示されない |
| 画像の`alt` | `block.alt`のみ参照。`block.data.altText`や`block.metadata.altText`に入っている場合にaltが取得できない |
| リストの`items` | `block.items`のみ参照。`block.content`に改行区切りで入っている場合にリストが表示されない |

### 解決策

フォールバックチェーンを実装し、複数のデータパスから値を取得するようにしました。

### 変更ファイル

#### `backend/src/app/(public)/[category]/[slug]/page.tsx`

**追加**: 型定義とヘルパー関数

```typescript
// ブロックデータの型（データ揺れに対応）
interface BlockData {
  type: string;
  content?: string;
  src?: string;
  alt?: string;
  level?: number;
  items?: string[];
  data?: { altText?: string };
  metadata?: { altText?: string };
}

// リストアイテムを取得（itemsがない場合はcontentを行分割）
function getListItems(block: BlockData): string[] {
  if (block.items && block.items.length > 0) {
    return block.items;
  }
  if (block.content) {
    return block.content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }
  return [];
}

// 画像のalt属性を取得（複数のパスからフォールバック）
function getImageAlt(block: BlockData): string {
  return block.alt ?? block.data?.altText ?? block.metadata?.altText ?? '';
}

// 画像のsrc属性を取得（srcがない場合はcontentを使用）
function getImageSrc(block: BlockData): string {
  return block.src ?? block.content ?? '';
}
```

**変更**: `renderBlock`関数（フォールバック対応）

```typescript
case 'image': {
  const imgSrc = getImageSrc(block);
  const imgAlt = getImageAlt(block);
  return (
    <figure className="mb-6">
      <ImageWithFallback src={imgSrc} alt={imgAlt} ... />
    </figure>
  );
}

case 'ul': {
  const ulItems = getListItems(block);
  if (ulItems.length === 0) return null;
  return (
    <ul>
      {ulItems.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}
```

### 動作確認方法

以下のパターンのブロックデータが正しくレンダリングされることを確認：

```json
// パターン1: 標準形式（image）
{ "type": "image", "src": "https://example.com/img.jpg", "alt": "説明文" }

// パターン2: srcがcontentに入っている
{ "type": "image", "content": "https://example.com/img.jpg" }

// パターン3: altがmetadataに入っている
{ "type": "image", "src": "https://example.com/img.jpg", "metadata": { "altText": "説明文" } }

// パターン4: 標準形式（list）
{ "type": "ul", "items": ["項目1", "項目2", "項目3"] }

// パターン5: itemsがなくcontentに改行区切りで入っている
{ "type": "ul", "content": "項目1\n項目2\n項目3" }
```

---

## ビルド確認結果

### Root（フロントエンド）

```bash
$ npm run build
# vite build 成功
# ✓ 3732 modules transformed
# ✓ built in 2.68s
```

### Backend

```bash
$ cd backend && npx tsc --noEmit
# エラーなし
```

> **注意**: root直下には`typescript`依存が無く、Viteのaliasもtsconfigにないためrootでの`npx tsc`は失敗します。フロントエンドの検証は`npm run build`で行ってください。

---

## 影響範囲

| ファイル | 影響 |
|----------|------|
| `backend/src/inngest/functions/pipeline/stage-1-keyword.ts` | 記事生成パイプラインStage1 |
| `backend/src/inngest/functions/pipeline/common/validation.ts` | Stage1出力バリデーション |
| `backend/prisma/schema.prisma` | DBスキーマ（system_settingsテーブル） |
| `backend/src/lib/settings.ts` | 設定取得ロジック |
| `backend/src/app/api/settings/route.ts` | 設定API |
| `backend/src/app/api/keywords/suggest/route.ts` | キーワード候補生成API（カニバリ判定追加） |
| `backend/src/inngest/functions/generate-images.ts` | 画像生成関数（imageJobsベース化） |
| `src/components/dashboard/SettingsView.tsx` | CMS設定画面（フォーム定義） |
| `src/components/dashboard/StrategyView.tsx` | 戦略画面（カニバリ警告UI追加） |
| `src/lib/api.ts` | フロントAPI型定義 |
| `backend/src/app/(public)/[category]/[slug]/page.tsx` | 公開記事表示 |

---

## 補足: ロールバック手順

問題が発生した場合のロールバック手順：

```bash
# 1. コード変更を戻す
git checkout HEAD~1 -- backend/src/inngest/functions/pipeline/stage-1-keyword.ts
git checkout HEAD~1 -- backend/src/inngest/functions/pipeline/common/validation.ts
git checkout HEAD~1 -- backend/src/inngest/functions/generate-images.ts
git checkout HEAD~1 -- backend/src/app/api/keywords/suggest/route.ts
git checkout HEAD~1 -- src/components/dashboard/StrategyView.tsx
git checkout HEAD~1 -- backend/src/app/(public)/[category]/[slug]/page.tsx
# ... 他のファイルも同様

# 2. スキーマを戻す場合（keywordSuggestPrompt削除）
# prisma/schema.prismaから該当行を削除後
npx prisma db push
```

---

## 動作環境要件

| 環境 | 要件 |
|------|------|
| Node.js | **>=20.9** （backend/package.json:19で指定） |

> **注意**: Node 18環境では`backend`の`npm run build`が失敗します。CI/CDや開発環境のNode.jsバージョンを確認してください。

---

**レビュー担当者へ**: 上記の変更内容をご確認ください。質問・修正要望があればお知らせください。
