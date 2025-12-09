# ヨガメディア管理システム 要件定義書 v2

## 1. プロジェクト概要

### 1.1 システム名
ヨガメディア管理システム（Yoga Media Management System）

### 1.2 目的
ヨガ・ウェルネス領域に特化したWebメディアの記事コンテンツを、AIを活用して効率的に企画・生成・管理・公開するための統合管理システム。

### 1.3 ターゲットユーザー
- **オーナー**: メディア運営責任者（全機能へのアクセス権限）
- **ライター**: 記事作成担当者（限定された機能へのアクセス権限）

### 1.4 想定規模
- 記事数: 500〜1,000本
- 月間PV: 〜10万PV
- 同時利用ユーザー: 〜5名

---

## 2. システムアーキテクチャ

### 2.1 技術スタック

#### フロントエンド
- **フレームワーク**: React 18 + TypeScript
- **ビルドツール**: Vite
- **スタイリング**: Tailwind CSS
- **UIコンポーネント**: shadcn/ui (Radix UI)
- **アニメーション**: Framer Motion
- **状態管理**: React Hooks (useState, useEffect)

#### バックエンド
- **ランタイム**: Node.js
- **フレームワーク**: Next.js API Routes または Express
- **ORM**: Prisma
- **データベース**: PostgreSQL (Supabase)
- **認証**: Supabase Auth
- **非同期ジョブ**: Inngest

#### 外部サービス連携
- **AI生成**: OpenRouter API
- **検索ボリューム**: Keywords Everywhere API
- **アナリティクス**: Google Analytics 4 API
- **検索パフォーマンス**: Google Search Console API
- **画像生成**: OpenRouter経由（DALL-E 3 / Stable Diffusion等）

### 2.2 デプロイ・ホスティング
- **ホスティング**: Vercel
- **データベース**: Supabase
- **ファイルストレージ**: Supabase Storage

---

## 3. ユーザー管理・認証

### 3.1 認証方式
- メールアドレス + パスワード認証
- Supabase Auth使用

### 3.2 ユーザーロール

| ロール | 説明 |
|-------|------|
| owner | オーナー。全機能へのフルアクセス |
| writer | ライター。記事作成・編集に限定 |

### 3.3 権限マトリクス

| 機能 | オーナー | ライター |
|-----|---------|---------|
| 記事の作成・編集・削除 | ✅ | ✅ |
| 記事の一括操作 | ✅ | ✅ |
| メディアライブラリへのアップロード | ✅ | ✅ |
| 情報バンクへの登録 | ✅ | ✅ |
| 監修者の基本情報編集 | ✅ | ❌ |
| 監修者のシステムプロンプト編集 | ✅ | ❌ |
| カテゴリ管理 | ✅ | ❌ |
| タグ管理 | ✅ | ❌ |
| コンバージョン管理 | ✅ | ❌ |
| システム設定（API連携等） | ✅ | ❌ |
| アナリティクス閲覧 | ✅ | ❌ |

### 3.4 ユーザー管理
- v1ではユーザー招待機能はスコープ外
- 初期ユーザーはシステム側で作成
- メール招待機能は将来バージョンで対応

---

## 4. 記事管理

### 4.1 記事のデータ構造

```typescript
interface Article {
  id: string;
  title: string;                    // 記事タイトル
  slug: string;                     // URLスラグ
  blocks: BlockData[];              // 本文（ブロックデータ）

  // リレーション
  categoryId: string;               // カテゴリ（1つ）
  tagIds: string[];                 // タグ（複数）
  authorId: string;                 // 監修者（1人）
  conversionIds: string[];          // コンバージョン（複数）

  // 画像
  featuredImageId: string;          // アイキャッチ画像
  insertImageIds: string[];         // 差し込み画像（最大2枚）

  // 公開設定
  status: 'draft' | 'scheduled' | 'published' | 'changed' | 'deleted';
  publishedAt: Date | null;         // 公開日時
  scheduledAt: Date | null;         // 予約公開日時
  deletedAt: Date | null;           // 削除日時（ゴミ箱）

  // メタ情報
  metaTitle: string;                // メタタイトル
  metaDescription: string;          // メタディスクリプション
  ogImageId: string;                // OGP画像
  canonicalUrl: string | null;      // canonical URL
  noIndex: boolean;                 // noindex設定
  structuredData: object;           // 構造化データ（JSON-LD）

  // 監査情報
  createdById: string;              // 作成者
  updatedById: string;              // 更新者
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.2 記事ステータス

| ステータス | 説明 |
|-----------|------|
| draft | 下書き（未公開） |
| scheduled | 予約投稿（指定日時に自動公開） |
| published | 公開済み |
| changed | 公開後に編集があり、更新未反映 |
| deleted | ゴミ箱（7日後に自動削除） |

#### changedステータスの扱い
- 公開済み記事を編集すると `changed` ステータスになる
- **「更新を公開」ボタンを押すと公開版に反映**（手動操作）
- 保存だけでは公開版は更新されない

### 4.3 URL構造
```
/{カテゴリslug}/{記事slug}
```
例: `/yoga-beginner/morning-yoga-5min`

### 4.4 ブロックエディタ

#### ブロックタイプ
| タイプ | 説明 |
|-------|------|
| p | 段落 |
| h2 | 見出し2 |
| h3 | 見出し3 |
| h4 | 見出し4 |
| image | 画像 |
| html | HTMLブロック |
| blockquote | 引用 |
| ul | 箇条書きリスト（順序なし） |
| ol | 番号付きリスト（順序あり） |
| hr | 区切り線 |
| table | 表 |
| code | コードブロック |

#### インライン装飾
| 装飾 | タグ |
|-----|-----|
| 太字 | `<strong>` |
| 斜体 | `<em>` |
| リンク | `<a href="">` |
| マーカー/ハイライト | `<mark>` |
| 打ち消し線 | `<del>` |

### 4.5 画像制限
- アイキャッチ画像: 1枚（必須）
- 差し込み画像: 最大2枚

### 4.6 記事の削除
- 論理削除（ゴミ箱方式）
- ゴミ箱保持期間: 7日間
- 7日経過後に自動で物理削除
- **削除後のURL**: 404表示

### 4.7 slug変更時のリダイレクト
- 記事のslugを変更した場合、**旧URLから新URLへ301リダイレクトを自動生成**
- リダイレクト履歴をDBに保存

### 4.8 一括操作機能
- 一括削除
- 一括カテゴリ変更
- 一括公開状態変更
- 一括監修者変更

### 4.9 同時編集の扱い
- **最後に保存した人の内容が優先**（シンプル方式）
- 編集ロック機能はv1ではスコープ外

### 4.10 リビジョン管理
- v1ではスコープ外
- 最新版のみ保存

### 4.11 プレビュー機能
- 公開時のフロントデザインでプレビュー表示
- 編集中にリアルタイムで確認可能

---

## 5. AI記事生成

### 5.1 生成フロー

```
Step 1: カテゴリ選択（複数可）
    ↓
Step 2: コンバージョン選択（複数可）
    ↓
Step 3: 監修者選択（1人）
    ↓
Step 4: キーワード分析・選定
    - AIがコンテキストに基づきキーワードを提案
    - 手動入力も可能
    - 最大5キーワードを選択
    ↓
Step 5: 生成オプション設定
    - 下書き / 即時公開 / 予約投稿
    ↓
Step 6: 一括生成実行
```

### 5.2 生成処理ステップ

```
1. 構成案の生成（見出し構造）
    ↓
2. 本文執筆
    ↓
3. 校正・推敲
    ↓
4. SEO・LLMO最適化
    ↓
5. メタデータ生成
    ↓
6. 画像生成（アイキャッチ + 差し込み画像）
    ↓
7. 公開準備完了
```

### 5.3 キーワード分析

#### データソース
1. **Keywords Everywhere API** - 検索ボリューム取得
2. **Google Search Console API** - 自サイトの検索クエリ
3. **AI分析** - カテゴリ・監修者のコンテキストから推測

#### 検索ボリューム設定
- **下限**: 100
- **上限**: 5,000
- **推奨ゾーン**: 300〜2,000（AIが優先的に提案）
- 設定はシステム設定で変更可能

### 5.4 生成制限
- 1キーワード = 1記事
- 同時生成: 最大5記事（5キーワード選択）
- 生成上限: なし（API残高がある限り無制限）

### 5.5 文字数
- システムプロンプトで制御
- 固定値は設けない

### 5.6 CTA挿入
- AIが本文の文脈に応じて自動配置
- 形式（バナー、テキスト、ボタン等）もAIが判断
- ガイドライン: バナー型は記事内2回程度、合計5回程度を目安

### 5.7 情報バンク活用
- AIがカテゴリ・監修者・キーワードのコンテキストから自動選択
- 手動選択は不要

### 5.8 引用表記
- **外部情報（研究結果・学術論文等）**: 出典を明記
- **内部情報（お客様の声・体験談等）**: 出典表記なし（自然に組み込む）

### 5.9 エラーハンドリング
- 生成失敗時: 途中の成果物は破棄
- 完了した記事のみ保存
- リトライ機能あり

---

## 6. カテゴリ管理

### 6.1 データ構造

```typescript
interface Category {
  id: string;
  name: string;           // カテゴリ名
  slug: string;           // URLスラグ（英語）
  description: string;    // 説明
  color: string;          // 表示色
  sortOrder: number;      // 並び順
  createdAt: Date;
  updatedAt: Date;
}
```

### 6.2 仕様
- 記事は1つのカテゴリに所属
- カテゴリと監修者の紐づけは不要（記事ごとに選択）
- slugは英語・短く設定（URL構造に使用）

---

## 7. タグ管理

### 7.1 データ構造

```typescript
interface Tag {
  id: string;
  name: string;           // タグ名
  slug: string;           // URLスラグ
  createdAt: Date;
  updatedAt: Date;
}
```

### 7.2 仕様
- 記事に複数のタグを設定可能
- メディアアセットにもタグ設定可能

---

## 8. 監修者（Author）管理

### 8.1 データ構造

```typescript
interface Author {
  id: string;
  name: string;               // 名前
  slug: string;               // URLスラグ
  role: string;               // 肩書き
  qualifications: string;     // 保有資格（カンマ区切り）
  categories: string[];       // 得意カテゴリ
  tags: string[];             // タグ
  bio: string;                // 自己紹介文
  avatar: string;             // プロフィール画像URL

  // SNSリンク
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  tiktok: string | null;
  website: string | null;     // 公式サイトURL

  // AI設定（オーナーのみ編集可）
  systemPrompt: string;       // 専門性・トーンの指定

  createdAt: Date;
  updatedAt: Date;
}
```

### 8.2 システムプロンプト
- 記事生成時にAIのRole（役割）として設定
- E-E-A-T（経験・専門性・権威性・信頼性）を高めるための指示
- オーナーのみ編集可能

---

## 9. コンバージョン（CTA）管理

### 9.1 データ構造

```typescript
interface Conversion {
  id: string;
  name: string;               // 名称
  description: string;        // 説明
  destinationUrl: string;     // 遷移先URL
  thumbnailUrl: string;       // サムネイル画像
  context: string;            // AIへのコンテキスト情報
  isActive: boolean;          // 有効/無効
  startDate: Date | null;     // 掲載開始日
  endDate: Date | null;       // 掲載終了日
  createdAt: Date;
  updatedAt: Date;
}
```

### 9.2 用途例
- 説明会申し込みバナー
- キャンペーン申し込み
- LINE登録
- 資料請求
- 無料体験予約

---

## 10. 情報バンク（Knowledge Bank）

### 10.1 データ構造

```typescript
interface KnowledgeItem {
  id: string;
  title: string;              // タイトル
  kind: KnowledgeKind;        // 種類
  brandId: string;            // ブランド
  courseId: string | null;    // コース（任意）
  authorId: string | null;    // 関連監修者
  content: string;            // 内容（AI要約済み）
  originalContent: string;    // 元の内容（スクレイピング結果）
  sourceUrl: string | null;   // 元URL
  usageCount: number;         // 使用回数
  createdAt: Date;
  updatedAt: Date;
}

type KnowledgeKind =
  | 'student_voice'      // お客様の声（受講生の体験談）
  | 'instructor_column'  // インストラクターのコラム・ブログ
  | 'research'           // 研究結果・学術情報
  | 'external';          // 外部記事・参考URL
```

### 10.2 ブランド管理
- マスタデータとして管理
- 今後増える可能性あり
- 例: OREO、SEQUENCE 等

### 10.3 URL登録機能
1. URLを入力
2. ページのテキストを自動スクレイピング
3. AIが要点を抽出・要約して保存
4. 元URLも保持（原文参照用）

---

## 11. メディアライブラリ

### 11.1 データ構造

```typescript
interface MediaAsset {
  id: string;
  url: string;                // ファイルURL
  fileName: string;           // ファイル名
  alt: string;                // alt属性
  source: 'upload' | 'ai_generated';  // ソース
  tagIds: string[];           // タグ
  showInLibrary: boolean;     // ライブラリ表示
  isDeleted: boolean;         // 論理削除フラグ
  createdAt: Date;
  updatedAt: Date;
}
```

### 11.2 仕様
- **手動アップロード画像**: ライブラリに表示
- **AI生成画像**: ライブラリに表示しない（記事に直接紐づく）
- 削除は論理削除（物理削除しない）
- タグ付けによる整理

### 11.3 アップロード制限
- **ファイルサイズ上限**: 1ファイル10MBまで
- **対応形式**: JPEG, PNG, WebP, GIF

### 11.4 画像の差し替え
- AI生成画像の再生成が可能
- メディアライブラリから手動画像への差し替えも可能

---

## 12. システム設定

### 12.1 外部連携設定

#### Google Analytics 4
- OAuth認証
- プロパティ選択
- データ受信ON/OFF

#### Google Search Console
- OAuth認証
- サイト選択
- 自動同期ON/OFF

#### OpenRouter API
- APIキー設定
- 残高表示
- 使用モデル設定
  - 画像生成用モデル
  - 記事作成用モデル
  - 分析・リサーチ用モデル

#### Keywords Everywhere API
- APIキー設定
- 検索ボリューム取得用

### 12.2 システムプロンプト設定

以下の4種類のシステムプロンプトを設定可能：

1. **キーワード分析・企画**
   - キーワードの検索意図分析
   - 記事企画の作成時に使用

2. **構成案生成**
   - H2・H3見出しの階層構造作成時に使用

3. **校正・推敲**
   - 誤字脱字、表記ゆれ、ファクトチェックの基準

4. **SEO最適化**
   - メタ情報の生成
   - キーワード配置
   - 内部リンク提案

### 12.3 検索ボリューム設定
- 下限値（デフォルト: 100）
- 上限値（デフォルト: 5,000）
- 推奨ゾーン（デフォルト: 300〜2,000）

---

## 13. アナリティクス・分析

### 13.1 記事単位の指標
- PV（ページビュー）
- ユニークユーザー数
- 平均滞在時間
- 直帰率
- 検索クエリ（流入キーワード）
- 検索順位
- 検索CTR（クリック率）
- 検索表示回数
- CTAクリック数

### 13.2 サイト全体の指標
- 総PV
- 総ユニークユーザー数
- オーガニック流入数
- 人気記事ランキング
- 検索パフォーマンス推移
- カテゴリ別パフォーマンス

### 13.3 データ取得
- GA4 API: トラフィックデータ
- Search Console API: 検索パフォーマンス
- 日次で自動同期

---

## 14. SEO・LLMO対策

### 14.1 SEOメタ情報
- メタタイトル
- メタディスクリプション
- OGP画像
- canonical URL
- noindex設定
- 構造化データ（JSON-LD）
  - Article
  - FAQPage
  - HowTo
  - BreadcrumbList
  - Person（監修者）

### 14.2 URL設計
- カテゴリ階層を含むURL構造
- 英語slug使用
- 短く簡潔なURL

### 14.3 LLMO対策
- システムプロンプトで制御
- 新しい知見に応じて柔軟にアップデート
- 主な対策ポイント:
  - 明確で構造化された回答形式
  - 引用されやすい一次情報の記載
  - 信頼性の高いソース明記
  - 簡潔で要約しやすい文章構成

---

## 15. 通知・エラーハンドリング

### 15.1 通知対象イベント
- 記事生成完了/失敗
- 予約投稿完了/失敗
- 外部API接続エラー
- API残高警告

### 15.2 通知方式
- v1: 管理画面内通知のみ（ベルアイコン）
- 将来: メール通知、Slack通知

---

## 16. 予約投稿

### 16.1 仕様
- 日時を指定して予約
- 指定時刻に自動で公開状態に変更
- **タイムゾーン: JST（日本標準時）固定**
- v1では外部通知なし（公開されるだけ）
- 実行基盤: Inngest

### 16.2 将来対応
- Search Console Indexing APIで即時インデックス申請
- SNS自動投稿連携

---

## 17. フロントエンド（読者向け）

### 17.1 概要
- 管理システムと一体型
- Figma Makeで作成済みのデザインを統合
- このシステム自体がCMSとして記事を配信

### 17.2 表示制御
- 目次、シェアボタン等のレイアウトはフロントデザイン側で制御
- 記事の構成指示はシステムプロンプトで制御

---

## 18. データバックアップ

### 18.1 バックアップ方式
- Supabase/PostgreSQLの自動バックアップを利用
- 管理画面からのエクスポート機能はv1ではスコープ外

---

## 19. 非機能要件

### 19.1 パフォーマンス
- 管理画面の初期表示: 3秒以内
- 記事一覧の表示: 1秒以内（100件）
- 記事生成: 5分以内（1記事あたり）

### 19.2 可用性
- 稼働率: 99.5%以上
- 計画メンテナンス: 月1回程度

### 19.3 セキュリティ
- HTTPS必須
- APIキーは暗号化して保存
- 認証トークンの適切な管理
- XSS/CSRF対策

### 19.4 対応ブラウザ
- Chrome（最新版）
- Safari（最新版）
- Firefox（最新版）
- Edge（最新版）

### 19.5 対応言語
- 日本語のみ（多言語対応なし）

---

## 20. 画面一覧

| 画面名 | パス | 説明 |
|-------|------|------|
| ログイン | /login | メール+パスワード認証 |
| ダッシュボード | /dashboard | 統計サマリー、クイックアクション |
| 記事一覧 | /posts | 記事の検索・フィルタ・一括操作 |
| 記事編集 | /posts/:id/edit | ブロックエディタ |
| AI記事企画 | /strategy | 記事生成ウィザード |
| カテゴリ管理 | /categories | カテゴリCRUD |
| タグ管理 | /tags | タグCRUD |
| 監修者管理 | /authors | 監修者CRUD |
| コンバージョン管理 | /conversions | CTA管理 |
| 情報バンク | /knowledge | 一次情報管理 |
| メディアライブラリ | /media | 画像管理 |
| アナリティクス | /analytics | GA/SC統合ダッシュボード |
| 設定 | /settings | システム設定 |

---

## 21. v1スコープ外（将来対応）

以下の機能はv1では対応せず、将来バージョンで検討：

- ユーザー招待機能
- リビジョン管理（編集履歴）
- 予約投稿時のSNS自動投稿
- Search Console Indexing API連携
- メール/Slack通知
- データエクスポート機能
- 多言語対応

---

## 22. 用語集

| 用語 | 説明 |
|-----|------|
| ブロック | 記事本文を構成する最小単位（段落、見出し、画像等） |
| システムプロンプト | AI生成時の指示・制約を定義するテキスト |
| 情報バンク | 記事生成時に参照する一次情報のデータベース |
| コンバージョン | 読者を誘導するCTA（Call to Action） |
| LLMO | Large Language Model Optimization（LLM最適化） |
| E-E-A-T | Experience, Expertise, Authoritativeness, Trustworthiness |

---

## 更新履歴

| バージョン | 日付 | 更新内容 |
|-----------|------|---------|
| v1 | 2024-XX-XX | 初版作成 |
| v2 | 2024-12-09 | 一問一答による仕様確定・全面改訂 |
| v2.1 | 2024-12-09 | Codexレビュー指摘事項の追記（タイムゾーン、changed運用、リダイレクト、同時編集、アップロード制限） |
