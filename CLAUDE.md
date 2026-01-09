# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language

**Output must be in Japanese.** All responses, comments, commit messages, and documentation should be written in Japanese.

## Project Overview

ヨガメディア管理システム - A CMS for managing AI-generated yoga/wellness content. The frontend was generated via Figma Make and currently uses mock data. Backend integration with Prisma/Supabase is planned.

## Development Commands

```bash
npm install    # Install dependencies
npm run dev    # Start dev server (http://localhost:3000)
npm run build  # Production build
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

## 重要: 環境変数

**このプロジェクトの正しいSupabase設定:**
```
SUPABASE_URL="https://towhsfpfillkftcgqflp.supabase.co"
ref: towhsfpfillkftcgqflp
```

**開発サーバー起動方法:**
並行プロジェクトの環境変数と競合を避けるため、必ず以下のスクリプトを使用:
```bash
./start-dev.sh        # デフォルト: ポート3001
./start-dev.sh 3002   # 別のポートを指定
```

このスクリプトは他プロジェクトのSUPABASE_*環境変数をクリアし、
正しいURLとキーを設定してからサーバーを起動する。

**注意:** dotenvはデフォルトで既存の環境変数を上書きしない。
シェルに別プロジェクトのSUPABASE_SERVICE_ROLE_KEYが設定されていると
署名検証エラー(signature verification failed)が発生する。

## Implementation Notes
- Import `motion` from `'motion/react'` (not `framer-motion`)
- Import `toast` from `'sonner'` (not `sonner@version`)
- UI follows shadcn/ui patterns with `cn()` utility for class merging
- All timestamps use JST (Japan Standard Time)
