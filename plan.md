# キーワード提案API実装計画

## 概要

カテゴリ、コンバージョン、監修者の3つのコンテキストを総合的に分析し、AIがキーワード候補を提案するAPIを実装する。

## ファイル構成

### バックエンド（新規作成）
- `backend/src/app/api/keywords/suggest/route.ts` - 新規APIルート

### フロントエンド（既存ファイル編集）
- `src/lib/api.ts` - `keywordsApi.suggest` 追加
- `src/lib/hooks.ts` - `useKeywordSuggestions` フック追加

---

## 実装ステップ

### Step 1: APIルート作成
`POST /api/keywords/suggest`

**入力:**
```typescript
{
  categoryId: string;      // カテゴリID
  conversionId: string;    // コンバージョンID
  authorId: string;        // 監修者ID
  seedKeywords?: string[]; // オプション：ヒントキーワード
  candidateCount?: number; // オプション：候補数（デフォルト25）
}
```

**出力:**
```typescript
{
  keywords: Array<{
    keyword: string;
    searchVolume: number;
    competition: number;
    cpc: number;
    trend: number[];
    score: number;
    reasoning: string;      // なぜこのキーワードを提案したか
    isRecommended: boolean; // 推奨範囲内かどうか
  }>;
  context: {
    category: { id, name, description };
    conversion: { id, name, context };
    author: { id, name, role };
  };
  volumeRange: { min: number; max: number };
  generatedCount: number;
  filteredCount: number;
}
```

### Step 2: 処理フロー

1. **認証・バリデーション**
   - `withAuth()` でラップ
   - Zodスキーマでバリデーション
   - レート制限チェック（10回/時）

2. **コンテキスト取得（並行処理）**
   - カテゴリ（description）
   - コンバージョン（context）
   - 監修者（bio, systemPrompt, qualifications）
   - 情報バンク（監修者に紐づく上位20件）
   - システム設定（APIキー、ボリューム範囲）

3. **AIキーワード生成**
   - `callOpenRouter()` でキーワード候補生成
   - プロンプトに3つのコンテキスト + 情報バンクを含める
   - 25個のキーワードを提案させる

4. **検索ボリューム取得**
   - `KeywordsEverywhereClient` でボリュームデータ取得
   - 20キーワードずつバッチ処理

5. **フィルタリング・スコアリング**
   - `minSearchVolume` 〜 `maxSearchVolume` でフィルタ
   - 既存の `scoreKeyword()` 関数でスコア計算
   - スコア順にソート

### Step 3: フロントエンド実装

1. **API関数追加** (`src/lib/api.ts`)
   - `keywordsApi.suggest()` メソッド

2. **カスタムフック追加** (`src/lib/hooks.ts`)
   - `useKeywordSuggestions()` - useMutationパターン

---

## プロンプト設計

### システムプロンプト
```
【キーワード提案AI】
あなたはヨガ・ウェルネスメディアのSEOストラテジストです。
与えられた3つのコンテキストを総合的に分析し、記事化に最適なキーワード候補を提案してください。

【分析の観点】
1. カテゴリ: そのカテゴリで読者が検索しそうなキーワード
2. コンバージョン: その商品/サービスに興味を持つユーザーの検索意図
3. 監修者: 監修者の専門性を活かせるテーマ

【キーワード選定基準】
- 検索ボリューム300〜2000程度のミドルテールを優先
- 具体的で記事化しやすいもの
- コンバージョンにつながりやすい検索意図
- 監修者の資格・経験と整合性があるもの
```

### ユーザープロンプト
- カテゴリ情報（name, description）
- コンバージョン目標（name, type, context）
- 監修者プロフィール（name, role, qualifications, bio, systemPrompt）
- 情報バンク（上位10件のタイトル・内容要約）
- ヒントキーワード（あれば）

---

## エラーハンドリング

| エラー条件 | 対応 |
|-----------|------|
| OpenRouter APIキー未設定 | 400エラー |
| リソースが見つからない | 404エラー |
| OpenRouter API失敗 | 500エラー |
| Keywords Everywhere未設定 | 警告付きで続行（ボリューム=0） |
| Keywords Everywhere失敗 | 警告付きで続行 |
| レート制限 | 429エラー |

---

## 確認項目

- [ ] Step 1: `backend/src/app/api/keywords/suggest/route.ts` 作成
- [ ] Step 2: プロンプト構築関数の実装
- [ ] Step 3: Keywords Everywhere連携
- [ ] Step 4: `src/lib/api.ts` に `keywordsApi.suggest` 追加
- [ ] Step 5: `src/lib/hooks.ts` に `useKeywordSuggestions` 追加
- [ ] Step 6: 動作確認テスト
