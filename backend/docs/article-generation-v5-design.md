# V5パイプライン設計書

## コンセプト

**V3の進化版**: 受講生の声をベースに、Web検索による最新データとLLMo最適化を統合した高品質記事生成パイプライン。

```
V5 = V3（受講生の声ベース） + Web検索（最新データ） + LLMo最適化（AI検索対策）
```

## V3との違い

| 機能 | V3 | V5 |
|------|----|----|
| 入力 | 受講生の声 | 受講生の声（同じ） |
| キーワード | 自動抽出 | 自動抽出（同じ） |
| Web検索 | なし | **あり（最新データ取得）** |
| 記事生成 | 監修者+受講生の声 | 監修者+受講生の声+**最新データ** |
| LLMo最適化 | なし | **あり（AI検索対策）** |
| 画像生成 | あり | あり（品質向上） |

## パイプラインステップ（7ステップ）

### Step 1: 受講生の声を選択
- **入力**: ユーザーが選択した受講生の声（Knowledge Items）
- **出力**: 選択された声のデータ
- **進捗**: 0-10%

### Step 2: テーマ・キーワード抽出
- **入力**: 受講生の声
- **処理**: AIが声からテーマとSEOキーワード候補を抽出
- **出力**:
  - mainThemes: メインテーマ配列
  - keywordCandidates: キーワード候補（検索意図付き）
  - storyAngles: 記事の切り口
- **進捗**: 10-20%

### Step 3: キーワード選定（検索ボリューム評価）
- **入力**: キーワード候補
- **処理**: DataForSEO APIで検索ボリュームを取得、スコアリング
- **出力**: 最適なキーワード（volume, competition, score付き）
- **進捗**: 20-30%

### Step 4: Web検索（ホワイトデータ取得）【V5新規】
- **入力**: 選定されたキーワード
- **処理**: Web検索で最新の信頼性高いデータを収集
- **出力**:
  - sources: 情報源リスト（タイトル、URL、要約、信頼度）
  - keyInsights: 重要な洞察
  - latestTrends: 最新トレンド
  - statistics: 統計データ
- **進捗**: 30-40%

### Step 5: 記事生成
- **入力**:
  - タイトル、キーワード
  - 監修者情報
  - 受講生の声（一次情報）
  - **Web検索結果（最新データ）**【V5追加】
- **処理**: AIが記事本文を生成
- **出力**: HTML形式の記事本文
- **進捗**: 40-65%

### Step 6: 画像生成
- **入力**: 記事本文から抽出した画像プレースホルダー
- **処理**: 各スロットに最適なスタイルで画像生成
- **出力**: 生成画像（cover, inbody_1, inbody_2）
- **進捗**: 65-85%

### Step 7: LLMo最適化【V5新規】
- **入力**: 生成された記事
- **処理**: AI検索エンジン向けの最適化データを生成
- **出力**:
  - llmoShortSummary: 2-3文の要約（AI引用向け）
  - llmoKeyTakeaways: 箇条書きの要点
  - schemaJsonLd: 構造化データ
- **進捗**: 85-95%

### Step 8: 保存
- **処理**: 記事をDBに保存
- **進捗**: 95-100%

## 記事生成プロンプトへの統合

V5では記事生成プロンプトに以下のセクションを追加:

```
## 最新データ（Web検索結果）

以下の最新データを記事に自然に織り込んでください：

### 信頼できる情報源
{{WEB_SEARCH_SOURCES}}

### 重要な洞察
{{WEB_SEARCH_INSIGHTS}}

### 最新トレンド（{{CURRENT_YEAR}}年時点）
{{WEB_SEARCH_TRENDS}}

### 統計データ
{{WEB_SEARCH_STATISTICS}}

**注意**:
- データの出典を明示すること
- 古い情報より最新データを優先
- 医療・健康情報は慎重に扱う
```

## 画像生成品質向上

### 現在の8スタイル（維持）
1. watercolor - 水彩スケッチ
2. minimalist-flat - ミニマルフラット
3. soft-gradient - ソフトグラデーション
4. line-art - ラインアート
5. isometric - アイソメトリック
6. botanical - ボタニカル
7. paper-cut - ペーパーカット
8. ink-wash - 墨絵

### 品質向上施策
- プロンプトに「16:9 horizontal aspect ratio」を明示
- 「editorial illustration for a blog post」を追加
- 「No text, no letters, no words, no typography」を強調
- テーマとの関連性を明確にしたコンテキスト

## UI変更

### 削除
- V4モード選択（キーワード入力方式）
- キーワード手動入力欄

### 変更
- 生成モード選択を「V3」「V5」に変更
- V5選択時のラベル: 「AI記事生成（Web検索+LLMo最適化）」

### 進捗モーダル
V5用の8ステップ表示:
1. 受講生の声を選択
2. テーマ分析
3. キーワード選定
4. Web検索
5. 記事生成
6. 画像生成
7. LLMo最適化
8. 保存

## 技術仕様

### 使用モデル
- テーマ分析: `anthropic/claude-sonnet-4`
- Web検索: Perplexity API経由または `perplexity/sonar-pro`
- 記事生成: `anthropic/claude-sonnet-4`
- 画像生成: `google/gemini-2.5-flash-image-preview`
- LLMo最適化: `anthropic/claude-sonnet-4`

### イベント名
```typescript
"article/generate.v5"
```

### 設定プロンプト（カスタマイズ可能）
- whiteDataPrompt: Web検索プロンプト
- llmoPrompt: LLMo最適化プロンプト
- systemPrompt: 記事生成プロンプト（V3から継続）
- imagePrompt: 画像生成プロンプト（V3から継続）

## ファイル構成

```
backend/src/inngest/functions/pipeline/
├── pipeline-v3.ts      # 既存（維持）
├── pipeline-v5.ts      # 新規作成
├── common/
│   ├── openrouter.ts   # API呼び出し
│   ├── prompts.ts      # プロンプト定義
│   └── types.ts        # 型定義
```
