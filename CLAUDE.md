# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language

**Output must be in Japanese.** All responses, comments, commit messages, and documentation should be written in Japanese.

## Project Overview

ヨガメディア管理システム - AI生成コンテンツを管理するCMS。Next.jsベースの統合アプリケーション。

## プロジェクト構成

| 名称 | ポート | 説明 |
|------|--------|------|
| **メディアサイト・管理画面** | 3000 | 公開サイト + CMS管理画面 (Next.js) |

- 公開サイト: `http://localhost:3000/`
- 管理画面: `http://localhost:3000/admin`

※「バックエンド」はSupabase等のデータベース/API層を指す。

### 開発用ログイン情報
- **メール**: admin@radiance.jp
- **パスワード**: dev123

※開発環境限定。本番ではSupabase Authで認証。

## Development Commands

```bash
npm install    # 依存関係インストール
npm run dev    # 開発サーバー起動 (http://localhost:3000)
npm run build  # 本番ビルド
```

## Architecture

### Stack
- Next.js 16 + TypeScript
- Tailwind CSS + shadcn/ui (Radix UI)
- Prisma + Supabase (PostgreSQL)
- Inngest for async AI generation
- TanStack Query for data fetching

### Key File Structure
```
├── src/
│   ├── app/
│   │   ├── (public)/         # 公開サイトのページ
│   │   ├── admin/            # 管理画面
│   │   └── api/              # APIルート
│   ├── components/
│   │   ├── admin/            # 管理画面コンポーネント
│   │   │   ├── dashboard/    # ダッシュボードビュー
│   │   │   └── ui/           # UIプリミティブ
│   │   └── public/           # 公開サイトコンポーネント
│   ├── inngest/              # Inngest関数（AI生成パイプライン）
│   └── lib/                  # ユーティリティ
├── prisma/                   # Prismaスキーマ・マイグレーション
├── public/                   # 静的ファイル
└── e2e/                      # E2Eテスト
```

### AI生成パイプライン
3ステップパイプライン:
1. タイトル生成 (`anthropic/claude-opus-4.5`)
2. 記事生成 (`anthropic/claude-opus-4.5`)
3. 画像生成 (`google/gemini-3-pro-image-preview`)

設定は `/src/inngest/functions/pipeline/common/openrouter.ts` の `STAGE_MODEL_CONFIG` でハードコード。

## External APIs
- **OpenRouter**: AI生成（記事・画像）
- **DataForSEO**: 検索ボリューム取得
- **Supabase**: データベース・認証・ストレージ

## Documentation
- `docs/requirements-v2.md` - 要件仕様
- `docs/schema-design.md` - Prismaスキーマ設計

## Implementation Notes
- Import `motion` from `'motion/react'` (not `framer-motion`)
- Import `toast` from `'sonner'`
- UI follows shadcn/ui patterns with `cn()` utility
- All timestamps use JST (Japan Standard Time)
