# 記事生成オーケストレーション 実装タスクリスト

## 前提条件

- **手動起点**: カテゴリ → CV → 監修者 → キーワードを人が選ぶ
- **下書き固定**: 勝手に公開しない（DRAFT運用）
- **画像生成**: 記事完成後に画像を生成して差し替える
- **内部リンク**: 関連記事（公開済みのみ）

---

## 現状の問題点（コード上の事実）

### 1. 画像ブロックのデータ形式の不一致

**公開側** (`backend/src/app/(public)/[category]/[slug]/page.tsx`)
- 画像ブロックを `src/alt` で読みに行く

**生成側** (パイプライン)
- `content` や `metadata` に画像情報を入れている場合がある
- → 画像が表示されない

### 2. 画像生成の設計と実装のズレ

**設計意図**:
- パイプラインは `image_jobs` を持ち、画像スロット（cover/inserted）を設計
- 記事内容に合わせた画像を後から生成

**現状実装** (`generate-images.ts`):
- 「タイトルから固定で3枚作る」実装
- `imageJobs` を使う設計になっていない

### 3. Stage1のプロンプトと要件のズレ

**要件**: 人が選んだキーワードを固定で分析する

**現状**: デフォルトが「今日生成する1テーマを選べ」系
- AIがキーワードを変更してしまうリスク

### 4. プロンプト共有による崩壊リスク

- `/api/keywords/suggest` が `system_settings.keywordPrompt` を参照
- パイプラインの Stage1 も同じ変数を参照しがち
- Stage1用に最適化すると、候補生成側が壊れる

---

## 実装タスク（優先度順）

### タスク1: 人が選んだキーワード固定を強制（再現性の核）

**目的**: 同じキーワードで生成ジョブを複数回回しても、Stage1起点で別テーマに飛ばない

**対象ファイル**:
- `backend/src/inngest/functions/pipeline/stage-1-keyword.ts`

**変更内容**:
1. `DEFAULT_KEYWORD_PROMPT` から「テーマを選ぶ」要素を除去
2. `primary_keyword` は入力keywordと一致させる
3. ずれた場合はエラー or 強制補正 + warning

**受け入れ条件**:
- [ ] 入力キーワードと `stage1.selected_topics[0].primary_keyword` が一致する
- [ ] 複数回実行しても結果が安定する

---

### タスク2: キーワード候補生成のプロンプトを分離

**目的**: Stage1プロンプトをいじっても、キーワード候補生成が崩れない

**対象ファイル**:
- `backend/prisma/schema.prisma` (system_settings)
- `backend/src/app/api/keywords/suggest/route.ts`
- `backend/src/app/api/settings/route.ts`
- `src/components/dashboard/SettingsView.tsx`

**変更内容**:
1. `system_settings` に `keywordSuggestPrompt` を追加（マイグレーション）
2. `/api/keywords/suggest` は `keywordSuggestPrompt` を優先、なければ `keywordPrompt` にフォールバック
3. 設定API（GET/PUT）に `keywordSuggestPrompt` を追加
4. 管理画面の設定UIにも追加

**受け入れ条件**:
- [ ] Stage1の `keywordPrompt` を変更しても候補生成が正常動作
- [ ] 設定画面から `keywordSuggestPrompt` を編集可能

---

### タスク3: カニバリ判定を候補生成に組み込む

**目的**: 人が選ぶ前に、既存記事との被りを可視化

**対象ファイル**:
- `backend/src/app/api/keywords/suggest/route.ts`
- `src/components/dashboard/StrategyView.tsx` (UI表示)

**変更内容**:
1. 同カテゴリの既存記事（公開済み）を取得
2. 候補KWとの類似度を計算（正規化→トークンJaccard + タイトル/slug比較）
3. レスポンスに `cannibalScore`, `cannibalMatches` を追加
4. 並び順は「スコアが良いが、カニバリ高いものは下げる」
5. UI表示は注意マーク + 理由程度

**受け入れ条件**:
- [ ] 候補キーワードにカニバリスコアが付与される
- [ ] 既存記事と被りが高い候補に注意表示

---

### タスク4: 画像生成を imageJobs ベースに（記事完成後に生成→差し戻し）

**目的**: 記事が完成 → その内容に合う画像を生成 → ライブラリ参照できる形で差し替え

**対象ファイル**:
- `backend/src/inngest/client.ts` (イベント型)
- `backend/src/inngest/functions/generate-images.ts`
- `backend/src/inngest/functions/pipeline/index.ts` (画像差し戻しロジック)

**変更内容**:
1. イベント型に `imageJobs` を追加
2. `generate-images.ts` を修正:
   - `event.data.imageJobs` があればそれを使用
   - なければ現状のフォールバック（タイトルから3枚）
   - 生成画像を Supabase Storage に保存 → `media_assets` に登録
   - `showInLibrary=true` で差し替え参照可能に
3. `articles.blocks` 内の画像プレースホルダを実URLへ差し替え
   - `src` と `alt` を確実に埋める

**受け入れ条件**:
- [ ] 生成記事の本文中に cover/inserted 画像が実際に表示される
- [ ] プレースホルダのまま残らない
- [ ] メディアライブラリから差し替え可能

---

### タスク5: 公開側レンダリングをデータ揺れに強くする

**目的**: 生成側のデータ形式の揺れを吸収し、表示バグを潰す

**対象ファイル**:
- `backend/src/app/(public)/[category]/[slug]/page.tsx`

**変更内容**:
1. 画像ブロックの処理を変更:
   ```typescript
   src = block.src ?? block.content ?? ''
   alt = block.alt ?? block.data?.altText ?? block.metadata?.altText ?? ''
   ```
2. ul/ol の処理にフォールバックを追加:
   - `items` が無い場合は `content` を行分割して表示

**受け入れ条件**:
- [ ] `src` が無くても `content` から画像表示可能
- [ ] リストブロックが `items` 無しでも表示可能

---

### タスク6: （次フェーズ）関連記事のAI最適化

**優先度**: 低（v2以降）

**現状**: 同カテゴリの最新n件

**将来実装**:
- パイプラインの `internal_links_used` を記事に保存
- 公開側の Related にそれを優先適用

---

## 実装順序

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: 再現性確保                                         │
├─────────────────────────────────────────────────────────────┤
│  タスク1: Stage1のキーワード固定                             │
│  タスク2: プロンプト分離                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 2: 画像生成の完成                                     │
├─────────────────────────────────────────────────────────────┤
│  タスク4: imageJobsベース画像生成                            │
│  タスク5: 公開側レンダリング修正                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 3: 品質向上                                           │
├─────────────────────────────────────────────────────────────┤
│  タスク3: カニバリ判定                                       │
│  タスク6: 関連記事最適化（v2）                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 更新履歴

| 日付 | 更新内容 |
|------|----------|
| 2024-12-15 | 実装タスクリスト作成 |
