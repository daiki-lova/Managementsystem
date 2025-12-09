# フロントエンド構造ドキュメント

## 概要

このドキュメントは、Figma Makeで生成されたヨガメディア管理システムのフロントエンド構造を詳細に説明します。

---

## 技術スタック

- **フレームワーク**: React + TypeScript
- **ビルドツール**: Vite
- **スタイリング**: Tailwind CSS
- **UIコンポーネント**: shadcn/ui（Radix UIベース）
- **アニメーション**: Framer Motion
- **アイコン**: Lucide React

---

## ディレクトリ構造

```
src/
├── components/
│   ├── ui/                    # shadcn/ui 基本コンポーネント
│   ├── auth/                  # 認証関連
│   │   └── LoginView.tsx      # ログイン画面
│   ├── dashboard/             # ダッシュボード関連
│   │   ├── Dashboard.tsx      # メインレイアウト（サイドバー + タブ）
│   │   ├── AnalyticsView.tsx  # ホーム / 分析ビュー
│   │   ├── PostsView.tsx      # 記事一覧
│   │   ├── StrategyView.tsx   # AI記事企画
│   │   ├── KnowledgeBankView.tsx  # 情報バンク
│   │   ├── AuthorsView.tsx    # 監修者管理
│   │   ├── ConversionsView.tsx    # コンバージョン管理
│   │   ├── MediaLibraryView.tsx   # メディアライブラリ
│   │   ├── CategoriesView.tsx # カテゴリ管理
│   │   ├── TagsView.tsx       # タグ管理
│   │   ├── SettingsView.tsx   # システム設定
│   │   ├── AnalyticsDetailView.tsx  # 分析詳細
│   │   ├── BulkActionBar.tsx  # 一括操作バー
│   │   ├── TaskSummaryCards.tsx   # タスクサマリーカード
│   │   ├── GenerationProgressModal.tsx  # 生成進捗モーダル
│   │   ├── GenerationErrorState.tsx     # 生成エラー表示
│   │   ├── ArticlePreviewModal.tsx      # 記事プレビューモーダル
│   │   └── PublishedEditWarning.tsx     # 公開済み編集警告
│   ├── editor/                # エディタ関連
│   │   ├── EditorCanvas.tsx   # メインエディタ
│   │   ├── HtmlBlock.tsx      # HTML埋め込みブロック
│   │   └── ArticleSettingsSheet.tsx  # 記事設定シート
│   ├── preview/               # プレビュー関連
│   │   └── ArticlePreview.tsx # 記事プレビュー
│   ├── analytics/             # 分析コンポーネント
│   │   ├── AnalyticsOverlay.tsx   # 分析オーバーレイ
│   │   ├── ScoreCard.tsx      # スコアカード
│   │   ├── KeywordCloud.tsx   # キーワードクラウド
│   │   └── AiSuggestions.tsx  # AI提案
│   ├── mobile/                # モバイル対応
│   │   └── MobileRestrictionView.tsx  # モバイル制限表示
│   ├── figma/                 # Figma関連ユーティリティ
│   │   └── ImageWithFallback.tsx  # フォールバック付き画像
│   └── GlobalHeader.tsx       # グローバルヘッダー
├── lib/
│   └── utils.ts               # ユーティリティ関数（cn等）
├── styles/
│   └── globals.css            # グローバルスタイル
├── types.ts                   # 型定義
├── App.tsx                    # メインアプリケーション
└── main.tsx                   # エントリーポイント
```

---

## 画面一覧と機能

### 1. ログイン画面 (`LoginView.tsx`)
- メール + パスワード認証
- シンプルなフォーム
- 「ログイン」ボタン

### 2. ダッシュボード (`Dashboard.tsx`)
**メインレイアウト構成：**
- 左サイドバー（ナビゲーション）
- メインコンテンツエリア
- タブによるビュー切り替え

**サイドバーメニュー：**
| メニュー | コンポーネント | 説明 |
|---------|--------------|------|
| ホーム | AnalyticsView | 統計ダッシュボード |
| 記事一覧 | PostsView | 記事管理 |
| AI記事企画 | StrategyView | キーワード選定・記事生成 |
| 情報バンク | KnowledgeBankView | 一次情報管理 |
| 監修者 | AuthorsView | 監修者プロフィール管理 |
| コンバージョン | ConversionsView | CTA管理 |
| メディア | MediaLibraryView | 画像ライブラリ |
| カテゴリー | CategoriesView | カテゴリ管理 |
| タグ | TagsView | タグ管理 |
| 設定 | SettingsView | システム設定 |

### 3. 記事エディタ (`EditorCanvas.tsx`)
**機能：**
- ブロックベースのエディタ（Notion風）
- タイトル入力
- ブロックタイプ：テキスト(p), 見出し(h2,h3,h4), 画像, HTML埋め込み
- 右サイドバー（設定パネル）
  - Slug設定
  - カバー画像
  - カテゴリ選択
  - タグ選択
  - SEO設定（メタタイトル、ディスクリプション）
  - OGP設定

**メディア機能：**
- ライブラリから選択
- アップロード
- AI画像生成（NanoBanana）

### 4. 各管理画面の共通パターン

**テーブルビュー構造：**
```
┌─────────────────────────────────────────────────┐
│ ヘッダー（タイトル + 検索 + 追加ボタン）          │
├─────────────────────────────────────────────────┤
│ ツールバー（件数表示 + フィルタ + 一括操作）      │
├─────────────────────────────────────────────────┤
│ テーブル                                        │
│ - チェックボックス（一括選択）                   │
│ - ソート・フィルタ機能付きヘッダー               │
│ - 行アクション（編集・削除・複製）               │
├─────────────────────────────────────────────────┤
│ BulkActionBar（選択時に表示）                   │
└─────────────────────────────────────────────────┘
```

---

## 型定義 (`types.ts`)

### 主要な型

```typescript
// アプリケーションモード
type AppMode = 'view' | 'edit' | 'preview';

// 記事
interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  status: 'draft' | 'scheduled' | 'published';
  publishedAt?: string;
  author: string;
  thumbnail?: string;
  // ...
}

// カテゴリ
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  count: number;
  color?: string;
}

// 監修者
interface Author {
  id: string;
  name: string;
  role: string;
  qualifications: string[];
  bio: string;
  image?: string;
  socialLinks?: { twitter?: string; instagram?: string; };
  systemPrompt?: string;  // 専門性・トーン指定
}

// コンバージョン
interface Conversion {
  id: string;
  name: string;
  type: 'banner' | 'text' | 'inline';
  status: 'active' | 'inactive';
  url: string;
  thumbnail?: string;
  context?: string;  // AI生成用コンテキスト
  period?: { start?: string; end?: string; };
}

// 情報バンク
interface KnowledgeItem {
  id: string;
  title: string;
  type: string;  // お客様の声、体験談、事例など
  brand?: string;
  course?: string;
  author?: string;
  content: string;
  sourceUrl?: string;
  usageCount?: number;
}

// エディタブロック
interface BlockData {
  id: string;
  type: 'p' | 'h2' | 'h3' | 'h4' | 'image' | 'html';
  content: string;
}
```

---

## 状態管理

### 現在の状態管理方式
- **ローカルステート**: React `useState` を各コンポーネントで使用
- **props経由のデータ受け渡し**: 親コンポーネントからpropsで渡す
- **モックデータ**: 各コンポーネント内にMOCK_DATAとしてハードコード

### 今後必要な状態管理
バックエンド連携時に以下を検討：
- グローバル状態管理（Zustand/Jotai/Context）
- サーバー状態管理（TanStack Query/SWR）
- フォーム状態管理（React Hook Form）

---

## UIコンポーネント一覧 (`components/ui/`)

shadcn/uiベースのコンポーネント：

| コンポーネント | 用途 |
|--------------|------|
| Button | ボタン |
| Input | テキスト入力 |
| Textarea | 複数行入力 |
| Select | セレクトボックス |
| Checkbox | チェックボックス |
| Switch | トグルスイッチ |
| Dialog | モーダルダイアログ |
| Sheet | サイドシート |
| Popover | ポップオーバー |
| DropdownMenu | ドロップダウンメニュー |
| Table | テーブル |
| Badge | バッジ |
| Tabs | タブ |
| Tooltip | ツールチップ |
| Progress | プログレスバー |
| Skeleton | ローディングスケルトン |
| ...他多数 |

---

## デザインシステム

### カラーパレット（Tailwind）
- **Primary**: neutral-900（黒系）
- **Background**: white, neutral-50
- **Border**: neutral-100, neutral-200
- **Text**: neutral-900, neutral-700, neutral-500, neutral-400
- **Accent**: blue-600, emerald-500, yellow-400, red-500

### タイポグラフィ
- **見出し**: font-bold, tracking-tight
- **本文**: text-sm, text-neutral-700
- **ラベル**: text-xs, font-medium, text-neutral-500

### スペーシング
- **パディング**: px-4, px-6, px-8
- **ギャップ**: gap-2, gap-3, gap-4
- **角丸**: rounded-lg, rounded-xl, rounded-2xl, rounded-full

---

## 次のステップ

1. **データフロー整理**: 各画面で必要なAPI呼び出しを特定
2. **バックエンドスキーマ設計**: 型定義からDBスキーマを導出
3. **API設計**: RESTful APIエンドポイントの設計
4. **状態管理導入**: TanStack Query等の導入検討
