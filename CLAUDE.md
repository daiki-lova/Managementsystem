# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language

**Output must be in Japanese.** All responses, comments, commit messages, and documentation should be written in Japanese.

## Project Overview

ヨガメディア管理システム - A CMS for managing AI-generated yoga/wellness content. The frontend was generated via Figma Make and currently uses mock data. Backend integration with Prisma/Supabase is planned.

## プロジェクト構成

このリポジトリには2つのアプリケーションがある：

| 名称 | ディレクトリ | ポート | 説明 |
|------|-------------|--------|------|
| **CMS管理画面** | `/` (ルート) | 5173 | 記事・コンテンツ管理用の管理画面 (Vite + React) |
| **メディアサイト** | `/backend` | 3000 | 公開用ウェブサイト (Next.js) |

※「バックエンド」はSupabase等のデータベース/API層を指す。メディアサイトを「バックエンド」と呼ばないこと。

### 開発用ログイン情報
- **メール**: admin@radiance.jp
- **パスワード**: dev123

※開発環境限定。本番ではSupabase Authで認証。

## Development Commands

```bash
# CMS管理画面
npm install    # 依存関係インストール
npm run dev    # 開発サーバー起動 (http://localhost:5173)
npm run build  # 本番ビルド

# メディアサイト
npm run dev --prefix backend  # 開発サーバー起動 (http://localhost:3000)
```

## Architecture

### Frontend Stack
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui (Radix UI)
- Framer Motion for animations
- State: React hooks only (no global state management yet)

### Key File Structure
```
src/
├── App.tsx              # Main routing: login → dashboard → editor
├── types.ts             # Core type definitions
├── components/
│   ├── ui/              # shadcn/ui primitives
│   ├── dashboard/       # All dashboard views (PostsView, StrategyView, etc.)
│   ├── editor/          # Block-based article editor
│   └── auth/            # LoginView
```

### View State Flow
`App.tsx` manages view state via `useState<ViewState>`:
- `'dashboard'` → renders `Dashboard` component with tab-based navigation
- `'editor'` → renders `EditorCanvas` for article editing

Dashboard uses internal `DashboardTab` state for sub-navigation (home, posts, strategy, knowledge, authors, conversions, media, categories, tags, settings).

### Block Editor
Articles use a Notion-style block structure defined in `types.ts`:
```typescript
interface BlockData {
  id: string;
  type: 'p' | 'h2' | 'h3' | 'h4' | 'image' | 'html';
  content: string;
  metadata?: any;
}
```

### Data Layer (Current State)
- All data is mock/hardcoded within components
- Each dashboard view contains its own `MOCK_*` data arrays
- No API calls implemented yet

## Planned Backend (see docs/)
- **ORM**: Prisma with PostgreSQL (Supabase)
- **Auth**: Supabase Auth
- **Jobs**: Inngest for async AI generation
- **External APIs**: OpenRouter (AI), Keywords Everywhere, GA4, Search Console

## Documentation
- `docs/requirements-v2.md` - Complete requirements specification
- `docs/schema-design.md` - Prisma schema design
- `docs/frontend-structure.md` - Frontend architecture details

## Implementation Notes
- Import `motion` from `'motion/react'` (not `framer-motion`)
- Import `toast` from `'sonner'` (not `sonner@version`)
- UI follows shadcn/ui patterns with `cn()` utility for class merging
- All timestamps use JST (Japan Standard Time)
