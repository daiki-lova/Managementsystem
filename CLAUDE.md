# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language

**出力は日本語で行うこと。** レスポンス、コメント、コミットメッセージ、ドキュメントはすべて日本語で記述する。

## プロジェクト概要

ヨガメディア管理システム - AI生成コンテンツを管理するCMS。Next.jsベースの統合アプリケーション。

- 公開サイト: `http://localhost:3000/`
- 管理画面: `http://localhost:3000/admin`

### 開発用ログイン情報
- メール: `admin@radiance.jp`
- パスワード: `dev123`

## 開発コマンド

```bash
npm install              # 依存関係インストール（自動でprisma generate実行）
npm run dev              # 開発サーバー起動（Next.js + Inngest DevServer同時起動）
npm run build            # 本番ビルド
npm run lint             # ESLint実行

# E2Eテスト（Playwright）
npm run test:e2e         # ヘッドレス実行
npm run test:e2e:ui      # UI付きテストランナー
npm run test:e2e:headed  # ブラウザ表示付き実行

# Prismaコマンド
npx prisma studio        # データベースGUI
npx prisma migrate dev   # マイグレーション作成・適用
npx prisma db push       # スキーマをDBに直接反映（開発時）
```

## アーキテクチャ

### 技術スタック
- Next.js 16 + TypeScript + React 19
- Tailwind CSS 4 + shadcn/ui (Radix UI)
- Prisma + Supabase (PostgreSQL)
- Inngest（非同期AI生成パイプライン）
- TanStack Query（データフェッチ）

### データフロー

```
管理画面 → API Routes → Prisma → Supabase (PostgreSQL)
     ↓
generation-jobs → Inngest → OpenRouter API → AI生成
                              ↓
                        記事・画像をDBに保存
```

### AI生成パイプライン（Inngest）

`src/inngest/functions/pipeline/` に記事生成パイプラインを実装。

3ステップ構成:
1. **タイトル生成** - `anthropic/claude-opus-4.5`
2. **記事本文生成** - `anthropic/claude-opus-4.5`
3. **画像生成** - `google/gemini-3-pro-image-preview`

モデル設定は `src/inngest/functions/pipeline/common/openrouter.ts` でハードコード。

### 主要ディレクトリ

| パス | 説明 |
|------|------|
| `src/app/(public)/` | 公開サイトのページ |
| `src/app/admin/` | 管理画面 |
| `src/app/api/` | APIルート（REST API） |
| `src/components/admin/ui/` | shadcn/uiベースのUIコンポーネント |
| `src/inngest/` | Inngest関数（AI生成パイプライン） |
| `src/lib/` | ユーティリティ（Prisma、Supabase、認証など） |
| `prisma/` | スキーマ・マイグレーション |
| `e2e/` | Playwrightテスト |

### 主要モデル（Prisma）

| モデル | 説明 |
|--------|------|
| `articles` | 記事（ブロックエディタ形式、LLMO対応フィールド含む） |
| `generation_jobs` | AI生成ジョブ（ステータス、進捗管理） |
| `generation_stages` | パイプラインの各ステージ記録 |
| `authors` | 著者プロファイル（執筆スタイル、専門分野等の詳細情報） |
| `knowledge_items` | ナレッジバンク（記事生成時の参照データ） |
| `media_assets` | メディアファイル |

## 実装時の注意事項

### インポート
```typescript
// アニメーション
import { motion } from 'motion/react'  // framer-motionではない

// トースト通知
import { toast } from 'sonner'

// UIユーティリティ
import { cn } from '@/components/admin/ui/utils'
```

### shadcn/uiパターン
UIコンポーネントは `src/components/admin/ui/` に配置。`cn()` ユーティリティでクラス名を結合する。

### タイムスタンプ
すべてのタイムスタンプはJST（日本標準時）で表示。

### 外部API
- **OpenRouter**: AI生成（記事・画像）
- **DataForSEO**: 検索ボリューム取得
- **Supabase**: データベース・認証・ストレージ

## ドキュメント

- `docs/requirements-v2.md` - 要件仕様
- `docs/schema-design.md` - Prismaスキーマ設計
- `docs/6-stage-pipeline-plan.md` - AI生成パイプライン設計
