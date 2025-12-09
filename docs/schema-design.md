# Prisma スキーマ設計書

**プロジェクト**: ヨガメディア運用管理・分析・記事生成システム
**データベース**: PostgreSQL (Supabase)
**ORM**: Prisma
**認証**: NextAuth.js / Supabase Auth
**作成日**: 2025-12-09

---

## 目次

1. [ER図](#er図)
2. [Prismaスキーマ定義](#prismaスキーマ定義)
3. [各テーブルの説明](#各テーブルの説明)
4. [インデックス設計](#インデックス設計)
5. [マイグレーション戦略](#マイグレーション戦略)
6. [セキュリティ考慮事項](#セキュリティ考慮事項)

---

## ER図

```mermaid
erDiagram
    User ||--o{ Article : "creates"
    User ||--o{ GenerationJob : "initiates"
    User {
        string id PK
        string email UK
        string password
        enum role
        datetime createdAt
        datetime updatedAt
    }

    Article ||--|| Category : "belongs to"
    Article ||--o{ ArticleTag : "has many"
    Article ||--|| Author : "supervised by"
    Article ||--o{ ArticleConversion : "has many"
    Article ||--o{ ArticleImage : "has many"
    Article ||--o| MediaAsset : "thumbnail"
    Article ||--o| GenerationJob : "generated from"
    Article ||--o{ ArticleKnowledgeItem : "references"
    Article {
        string id PK
        string title
        json blocks
        string slug UK
        enum status
        datetime publishedAt
        string metaTitle
        string metaDescription
        string ogpImageUrl
        string categoryId FK
        string authorId FK
        string thumbnailId FK
        string generationJobId FK
        string createdById FK
        datetime createdAt
        datetime updatedAt
    }

    Category {
        string id PK
        string name
        string slug UK
        string description
        string color
        int articlesCount
        datetime createdAt
        datetime updatedAt
    }

    Tag ||--o{ ArticleTag : "applied to"
    Tag {
        string id PK
        string name
        string slug UK
        int articlesCount
        datetime createdAt
        datetime updatedAt
    }

    ArticleTag {
        string articleId FK
        string tagId FK
        datetime createdAt
    }

    Author {
        string id PK
        string name
        string role
        json qualifications
        string bio
        string imageUrl
        json socialLinks
        string systemPrompt
        datetime createdAt
        datetime updatedAt
    }

    Conversion ||--o{ ArticleConversion : "applied to"
    Conversion {
        string id PK
        string name
        enum type
        enum status
        string url
        string thumbnailUrl
        string context
        datetime periodStart
        datetime periodEnd
        datetime createdAt
        datetime updatedAt
    }

    ArticleConversion {
        string id PK
        string articleId FK
        string conversionId FK
        int position
        int clickCount
        datetime createdAt
    }

    MediaAsset ||--o{ ArticleImage : "used in"
    MediaAsset ||--o{ MediaAssetTag : "has many"
    MediaAsset {
        string id PK
        string url
        string fileName
        string altText
        enum source
        boolean showInLibrary
        boolean isDeleted
        int width
        int height
        int fileSize
        datetime createdAt
        datetime updatedAt
    }

    MediaAssetTag {
        string mediaAssetId FK
        string tagId FK
        datetime createdAt
    }

    ArticleImage {
        string id PK
        string articleId FK
        string mediaAssetId FK
        enum type
        int position
        datetime createdAt
    }

    KnowledgeItem ||--o| Author : "supervised by"
    KnowledgeItem ||--o{ ArticleKnowledgeItem : "referenced in"
    KnowledgeItem {
        string id PK
        string title
        string type
        string brand
        string course
        string authorId FK
        string content
        string sourceUrl
        datetime sourceScrapedAt
        int usageCount
        datetime createdAt
        datetime updatedAt
    }

    ArticleKnowledgeItem {
        string articleId FK
        string knowledgeItemId FK
        datetime createdAt
    }

    GenerationJob ||--|| Category : "targets"
    GenerationJob ||--|| Author : "uses"
    GenerationJob ||--o{ GenerationJobConversion : "includes"
    GenerationJob ||--o{ GenerationJobKnowledgeItem : "references"
    GenerationJob ||--o{ Article : "generates"
    GenerationJob {
        string id PK
        string keyword
        int searchVolume
        enum status
        int progress
        string errorMessage
        string categoryId FK
        string authorId FK
        enum publishStrategy
        datetime scheduledAt
        int totalArticles
        string userId FK
        datetime createdAt
        datetime updatedAt
        datetime completedAt
    }

    GenerationJobConversion {
        string generationJobId FK
        string conversionId FK
        datetime createdAt
    }

    GenerationJobKnowledgeItem {
        string generationJobId FK
        string knowledgeItemId FK
        datetime createdAt
    }

    SystemSettings {
        string id PK
        string gaApiKey
        string gaPropertyId
        string searchConsoleApiKey
        string searchConsoleSiteUrl
        string searchVolumeApiKey
        string openRouterApiKey
        string aiModel
        int minSearchVolume
        int maxSearchVolume
        json volumeZones
        datetime createdAt
        datetime updatedAt
    }

    AnalyticsData {
        string id PK
        string articleId FK
        date date
        int pageViews
        int organicViews
        int conversionClicks
        int bounceRate
        float avgTimeOnPage
        json keywords
        datetime createdAt
        datetime updatedAt
    }
```

---

## Prismaスキーマ定義

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==========================================
// ユーザー・認証
// ==========================================

enum UserRole {
  OWNER
  WRITER
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // ハッシュ化されたパスワード
  role      UserRole @default(WRITER)
  name      String?

  // リレーション
  articles        Article[]
  generationJobs  GenerationJob[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@map("users")
}

// ==========================================
// 記事
// ==========================================

enum ArticleStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
}

model Article {
  id          String        @id @default(cuid())
  title       String
  blocks      Json          // ブロックデータ（Notion風エディタ）
  slug        String        @unique
  status      ArticleStatus @default(DRAFT)
  publishedAt DateTime?

  // SEO・OGP
  metaTitle       String?
  metaDescription String?
  ogpImageUrl     String?

  // 外部キー
  categoryId       String
  authorId         String
  thumbnailId      String?
  generationJobId  String?
  createdById      String

  // リレーション
  category        Category              @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  author          Author                @relation(fields: [authorId], references: [id], onDelete: Restrict)
  thumbnail       MediaAsset?           @relation("ArticleThumbnail", fields: [thumbnailId], references: [id], onDelete: SetNull)
  generationJob   GenerationJob?        @relation(fields: [generationJobId], references: [id], onDelete: SetNull)
  createdBy       User                  @relation(fields: [createdById], references: [id], onDelete: Restrict)

  tags            ArticleTag[]
  conversions     ArticleConversion[]
  images          ArticleImage[]
  knowledgeItems  ArticleKnowledgeItem[]
  analytics       AnalyticsData[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([slug])
  @@index([status])
  @@index([publishedAt])
  @@index([categoryId])
  @@index([authorId])
  @@index([createdById])
  @@index([generationJobId])
  @@map("articles")
}

// ==========================================
// カテゴリ
// ==========================================

model Category {
  id          String @id @default(cuid())
  name        String
  slug        String @unique
  description String?
  color       String? // HEXカラーコード

  // 統計
  articlesCount Int @default(0)

  // リレーション
  articles       Article[]
  generationJobs GenerationJob[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([slug])
  @@map("categories")
}

// ==========================================
// タグ
// ==========================================

model Tag {
  id   String @id @default(cuid())
  name String
  slug String @unique

  // 統計
  articlesCount Int @default(0)

  // リレーション
  articles    ArticleTag[]
  mediaAssets MediaAssetTag[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([slug])
  @@map("tags")
}

model ArticleTag {
  articleId String
  tagId     String

  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)
  tag     Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@id([articleId, tagId])
  @@index([articleId])
  @@index([tagId])
  @@map("article_tags")
}

// ==========================================
// 監修者
// ==========================================

model Author {
  id             String  @id @default(cuid())
  name           String
  role           String  // 肩書き
  qualifications Json    // 資格リスト（配列）
  bio            String  @db.Text
  imageUrl       String?
  socialLinks    Json?   // { twitter, instagram, etc }

  // AI生成用
  systemPrompt String @db.Text // オーナーのみ編集可

  // リレーション
  articles       Article[]
  knowledgeItems KnowledgeItem[]
  generationJobs GenerationJob[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("authors")
}

// ==========================================
// コンバージョン（CTA）
// ==========================================

enum ConversionType {
  BANNER
  TEXT
  INLINE
}

enum ConversionStatus {
  ACTIVE
  INACTIVE
}

model Conversion {
  id           String            @id @default(cuid())
  name         String
  type         ConversionType
  status       ConversionStatus  @default(ACTIVE)
  url          String
  thumbnailUrl String?

  // AI生成用
  context String @db.Text // 訴求コンテキスト

  // 期間限定設定
  periodStart DateTime?
  periodEnd   DateTime?

  // リレーション
  articles       ArticleConversion[]
  generationJobs GenerationJobConversion[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
  @@map("conversions")
}

model ArticleConversion {
  id           String @id @default(cuid())
  articleId    String
  conversionId String

  position   Int @default(0) // 記事内での位置
  clickCount Int @default(0) // クリック計測

  article    Article    @relation(fields: [articleId], references: [id], onDelete: Cascade)
  conversion Conversion @relation(fields: [conversionId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@index([articleId])
  @@index([conversionId])
  @@map("article_conversions")
}

// ==========================================
// メディア（画像）
// ==========================================

enum MediaSource {
  UPLOAD
  AI_GENERATED
}

model MediaAsset {
  id            String      @id @default(cuid())
  url           String
  fileName      String
  altText       String?
  source        MediaSource @default(UPLOAD)

  // 表示制御
  showInLibrary Boolean @default(true)  // ライブラリ一覧に表示するか
  isDeleted     Boolean @default(false) // 論理削除フラグ

  // メタデータ
  width    Int?
  height   Int?
  fileSize Int? // bytes

  // リレーション
  thumbnailArticles Article[]      @relation("ArticleThumbnail")
  articleImages     ArticleImage[]
  tags              MediaAssetTag[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([source])
  @@index([showInLibrary, isDeleted])
  @@map("media_assets")
}

model MediaAssetTag {
  mediaAssetId String
  tagId        String

  mediaAsset MediaAsset @relation(fields: [mediaAssetId], references: [id], onDelete: Cascade)
  tag        Tag        @relation(fields: [tagId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@id([mediaAssetId, tagId])
  @@index([mediaAssetId])
  @@index([tagId])
  @@map("media_asset_tags")
}

enum ArticleImageType {
  INSERTED_1
  INSERTED_2
}

model ArticleImage {
  id           String           @id @default(cuid())
  articleId    String
  mediaAssetId String
  type         ArticleImageType // 差し込み1 or 2
  position     Int              @default(0) // 記事内での位置

  article    Article    @relation(fields: [articleId], references: [id], onDelete: Cascade)
  mediaAsset MediaAsset @relation(fields: [mediaAssetId], references: [id], onDelete: Restrict)

  createdAt DateTime @default(now())

  @@index([articleId])
  @@index([mediaAssetId])
  @@map("article_images")
}

// ==========================================
// 情報バンク
// ==========================================

model KnowledgeItem {
  id       String  @id @default(cuid())
  title    String
  type     String  // お客様の声、体験談、事例、講座情報など
  brand    String?
  course   String?
  authorId String?

  content  String   @db.Text // 本文（URLから取得した場合もここに保存）
  sourceUrl String? // 元URL
  sourceScrapedAt DateTime? // 最終取得日時

  // 統計
  usageCount Int @default(0) // 記事生成で参照された回数

  // リレーション
  author         Author?                     @relation(fields: [authorId], references: [id], onDelete: SetNull)
  articles       ArticleKnowledgeItem[]
  generationJobs GenerationJobKnowledgeItem[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([type])
  @@index([brand])
  @@index([course])
  @@index([authorId])
  @@map("knowledge_items")
}

model ArticleKnowledgeItem {
  articleId       String
  knowledgeItemId String

  article       Article       @relation(fields: [articleId], references: [id], onDelete: Cascade)
  knowledgeItem KnowledgeItem @relation(fields: [knowledgeItemId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@id([articleId, knowledgeItemId])
  @@index([articleId])
  @@index([knowledgeItemId])
  @@map("article_knowledge_items")
}

// ==========================================
// 生成ジョブ
// ==========================================

enum GenerationJobStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}

enum PublishStrategy {
  DRAFT
  PUBLISH_NOW
  SCHEDULED
}

model GenerationJob {
  id           String               @id @default(cuid())
  keyword      String
  searchVolume Int?

  status       GenerationJobStatus  @default(PENDING)
  progress     Int                  @default(0) // 0-100
  errorMessage String?              @db.Text

  // 生成パラメータ
  categoryId       String
  authorId         String
  publishStrategy  PublishStrategy @default(DRAFT)
  scheduledAt      DateTime?
  totalArticles    Int             @default(5) // キーワード1つで最大5本

  // 実行者
  userId String

  // リレーション
  category       Category                      @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  author         Author                        @relation(fields: [authorId], references: [id], onDelete: Restrict)
  user           User                          @relation(fields: [userId], references: [id], onDelete: Restrict)
  conversions    GenerationJobConversion[]
  knowledgeItems GenerationJobKnowledgeItem[]
  articles       Article[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  completedAt DateTime?

  @@index([status])
  @@index([userId])
  @@index([categoryId])
  @@index([authorId])
  @@index([createdAt])
  @@map("generation_jobs")
}

model GenerationJobConversion {
  generationJobId String
  conversionId    String

  generationJob GenerationJob @relation(fields: [generationJobId], references: [id], onDelete: Cascade)
  conversion    Conversion    @relation(fields: [conversionId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@id([generationJobId, conversionId])
  @@index([generationJobId])
  @@index([conversionId])
  @@map("generation_job_conversions")
}

model GenerationJobKnowledgeItem {
  generationJobId String
  knowledgeItemId String

  generationJob GenerationJob @relation(fields: [generationJobId], references: [id], onDelete: Cascade)
  knowledgeItem KnowledgeItem @relation(fields: [knowledgeItemId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@id([generationJobId, knowledgeItemId])
  @@index([generationJobId])
  @@index([knowledgeItemId])
  @@map("generation_job_knowledge_items")
}

// ==========================================
// システム設定
// ==========================================

model SystemSettings {
  id String @id @default("default") // シングルトン

  // 外部API設定
  gaApiKey             String?
  gaPropertyId         String?
  searchConsoleApiKey  String?
  searchConsoleSiteUrl String?
  searchVolumeApiKey   String?
  openRouterApiKey     String?
  aiModel              String? @default("openai/gpt-4-turbo")

  // 検索ボリューム設定
  minSearchVolume Int  @default(100)
  maxSearchVolume Int  @default(10000)
  volumeZones     Json? // カスタムボリュームゾーン定義

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("system_settings")
}

// ==========================================
// 分析データ
// ==========================================

model AnalyticsData {
  id        String @id @default(cuid())
  articleId String
  date      DateTime @db.Date

  // GA/SC データ
  pageViews       Int   @default(0)
  organicViews    Int   @default(0)
  conversionClicks Int  @default(0)
  bounceRate      Int   @default(0) // パーセンテージ
  avgTimeOnPage   Float @default(0) // 秒

  // キーワードデータ
  keywords Json? // [{keyword: string, position: number, clicks: number}]

  // リレーション
  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([articleId, date])
  @@index([articleId])
  @@index([date])
  @@map("analytics_data")
}
```

---

## 各テーブルの説明

### 1. User（ユーザー）

**目的**: システム利用者の認証・権限管理

| フィールド | 型 | 説明 |
|-----------|---|------|
| id | String | 主キー（cuid） |
| email | String | メールアドレス（ユニーク） |
| password | String | ハッシュ化されたパスワード（bcryptを推奨） |
| role | UserRole | OWNER または WRITER |
| name | String? | 表示名（オプション） |

**設計ポイント**:
- パスワードは必ずハッシュ化して保存（bcrypt推奨）
- NextAuth.jsを使う場合、アダプターに合わせて拡張が必要
- Supabase Authを使う場合、このテーブルは参照用として利用

---

### 2. Article（記事）

**目的**: 記事の本体データとメタ情報

| フィールド | 型 | 説明 |
|-----------|---|------|
| id | String | 主キー |
| title | String | タイトル |
| blocks | Json | ブロックエディタのデータ（Notion風） |
| slug | String | URLスラッグ（ユニーク） |
| status | ArticleStatus | DRAFT / SCHEDULED / PUBLISHED |
| publishedAt | DateTime? | 公開日時 |
| metaTitle | String? | メタタイトル |
| metaDescription | String? | メタディスクリプション |
| ogpImageUrl | String? | OGP画像URL（アイキャッチと同じでもOK） |
| categoryId | String | カテゴリFK |
| authorId | String | 監修者FK |
| thumbnailId | String? | サムネイル画像FK |
| generationJobId | String? | 生成ジョブFK（AI生成の場合） |
| createdById | String | 作成者（UserのFK） |

**設計ポイント**:
- `blocks`は JSON で柔軟に構造を保存
- `slug`はユニーク制約で重複防止
- 削除制約: カテゴリ・監修者は `Restrict`（削除時に記事がある場合は削除不可）
- サムネイルは `SetNull`（削除されても記事は残る）

---

### 3. Category（カテゴリ）

**目的**: 記事のカテゴリ分類

| フィールド | 型 | 説明 |
|-----------|---|------|
| id | String | 主キー |
| name | String | カテゴリ名 |
| slug | String | URLスラッグ（ユニーク） |
| description | String? | 説明 |
| color | String? | 色コード（#RRGGBB） |
| articlesCount | Int | 記事数（集計キャッシュ） |

**設計ポイント**:
- `articlesCount`はトリガーまたはアプリケーション側で更新
- カテゴリ削除時は記事との関連をチェック（Restrict）

---

### 4. Tag（タグ）

**目的**: 記事と画像の横断的なタグ付け

| フィールド | 型 | 説明 |
|-----------|---|------|
| id | String | 主キー |
| name | String | タグ名 |
| slug | String | URLスラッグ（ユニーク） |
| articlesCount | Int | 記事数（集計キャッシュ） |

**設計ポイント**:
- 記事とタグは多対多（ArticleTag）
- 画像とタグも多対多（MediaAssetTag）
- タグ検索・絞り込みが必須要件

---

### 5. ArticleTag（記事タグ中間テーブル）

**目的**: 記事とタグの多対多リレーション

| フィールド | 型 | 説明 |
|-----------|---|------|
| articleId | String | 記事FK |
| tagId | String | タグFK |

**設計ポイント**:
- 複合主キー `[articleId, tagId]`
- 記事削除時は `Cascade`（タグとの関連も削除）

---

### 6. Author（監修者）

**目的**: 記事の監修者情報とAI生成用プロンプト

| フィールド | 型 | 説明 |
|-----------|---|------|
| id | String | 主キー |
| name | String | 名前 |
| role | String | 肩書き |
| qualifications | Json | 資格リスト |
| bio | String | 自己紹介（TEXT型） |
| imageUrl | String? | プロフィール画像URL |
| socialLinks | Json? | SNSリンク |
| systemPrompt | String | AI生成用プロンプト（TEXT型） |

**設計ポイント**:
- `systemPrompt`はオーナーのみ編集可（アプリケーション側で制御）
- `qualifications`と`socialLinks`はJSON配列

---

### 7. Conversion（コンバージョン）

**目的**: CTA（Call To Action）の定義

| フィールド | 型 | 説明 |
|-----------|---|------|
| id | String | 主キー |
| name | String | 名称 |
| type | ConversionType | BANNER / TEXT / INLINE |
| status | ConversionStatus | ACTIVE / INACTIVE |
| url | String | 遷移先URL |
| thumbnailUrl | String? | サムネイル画像URL |
| context | String | AI生成用コンテキスト（TEXT型） |
| periodStart | DateTime? | 期間開始 |
| periodEnd | DateTime? | 期間終了 |

**設計ポイント**:
- `context`はAI生成時に訴求内容を伝えるための文章
- 期間限定CTAの場合のみ期間設定を使用

---

### 8. ArticleConversion（記事コンバージョン中間テーブル）

**目的**: 記事とCTAの多対多リレーション

| フィールド | 型 | 説明 |
|-----------|---|------|
| id | String | 主キー |
| articleId | String | 記事FK |
| conversionId | String | コンバージョンFK |
| position | Int | 記事内での位置 |
| clickCount | Int | クリック計測 |

**設計ポイント**:
- `position`で記事内での差し込み位置を管理
- `clickCount`でCTAクリック数を計測

---

### 9. MediaAsset（画像）

**目的**: 画像の実体データとメタ情報

| フィールド | 型 | 説明 |
|-----------|---|------|
| id | String | 主キー |
| url | String | 画像URL |
| fileName | String | ファイル名 |
| altText | String? | alt属性 |
| source | MediaSource | UPLOAD / AI_GENERATED |
| showInLibrary | Boolean | ライブラリ一覧に表示するか |
| isDeleted | Boolean | 論理削除フラグ |
| width | Int? | 幅（ピクセル） |
| height | Int? | 高さ（ピクセル） |
| fileSize | Int? | ファイルサイズ（bytes） |

**設計ポイント**:
- **物理削除はしない**（`isDeleted`で論理削除）
- 手動アップロード: `source=UPLOAD`, `showInLibrary=true`
- AI生成画像: `source=AI_GENERATED`, `showInLibrary=false`（デフォルト）
- ユーザーが明示的に保存: `showInLibrary=true`に変更

---

### 10. MediaAssetTag（画像タグ中間テーブル）

**目的**: 画像とタグの多対多リレーション

| フィールド | 型 | 説明 |
|-----------|---|------|
| mediaAssetId | String | 画像FK |
| tagId | String | タグFK |

**設計ポイント**:
- 画像をタグで整理・検索可能にする
- 複合主キー `[mediaAssetId, tagId]`

---

### 11. ArticleImage（記事内画像）

**目的**: 記事に差し込まれた画像の管理

| フィールド | 型 | 説明 |
|-----------|---|------|
| id | String | 主キー |
| articleId | String | 記事FK |
| mediaAssetId | String | 画像FK |
| type | ArticleImageType | INSERTED_1 / INSERTED_2 |
| position | Int | 記事内での位置 |

**設計ポイント**:
- 差し込み画像は最大2枚（type で区別）
- サムネイルは Article.thumbnailId で別管理

---

### 12. KnowledgeItem（情報バンク）

**目的**: 一次情報（お客様の声、体験談、講座情報など）の蓄積

| フィールド | 型 | 説明 |
|-----------|---|------|
| id | String | 主キー |
| title | String | タイトル |
| type | String | 種類（お客様の声、体験談など） |
| brand | String? | ブランド |
| course | String? | コース |
| authorId | String? | 監修者FK |
| content | String | 本文（TEXT型） |
| sourceUrl | String? | 元URL |
| sourceScrapedAt | DateTime? | 最終取得日時 |
| usageCount | Int | 記事生成で参照された回数 |

**設計ポイント**:
- URLを登録した場合、登録時にページ本文をスクレイピングして`content`に保存
- `sourceScrapedAt`で最終取得日時を記録
- 記事生成時は保存された`content`を参照（リアルタイム取得しない）

---

### 13. ArticleKnowledgeItem（記事と情報バンク中間テーブル）

**目的**: 記事が参照した情報バンク項目の記録

| フィールド | 型 | 説明 |
|-----------|---|------|
| articleId | String | 記事FK |
| knowledgeItemId | String | 情報バンクFK |

**設計ポイント**:
- 記事生成時に参照した情報バンク項目を紐づける
- 情報バンク側の`usageCount`更新に利用

---

### 14. GenerationJob（生成ジョブ）

**目的**: AI記事生成の実行管理

| フィールド | 型 | 説明 |
|-----------|---|------|
| id | String | 主キー |
| keyword | String | キーワード |
| searchVolume | Int? | 検索ボリューム |
| status | GenerationJobStatus | PENDING / RUNNING / COMPLETED / FAILED / CANCELLED |
| progress | Int | 進捗（0-100） |
| errorMessage | String? | エラーメッセージ（TEXT型） |
| categoryId | String | カテゴリFK |
| authorId | String | 監修者FK |
| publishStrategy | PublishStrategy | DRAFT / PUBLISH_NOW / SCHEDULED |
| scheduledAt | DateTime? | 予約公開日時 |
| totalArticles | Int | 生成する記事数（最大5） |
| userId | String | 実行者FK |
| completedAt | DateTime? | 完了日時 |

**設計ポイント**:
- 生成処理は外部ワークフロー（Inngest等）で実行
- `progress`でフロント側に進捗表示
- 失敗時は`errorMessage`に詳細を保存

---

### 15. GenerationJobConversion（生成ジョブとコンバージョン中間テーブル）

**目的**: 生成ジョブで使用するCTAの指定

| フィールド | 型 | 説明 |
|-----------|---|------|
| generationJobId | String | 生成ジョブFK |
| conversionId | String | コンバージョンFK |

**設計ポイント**:
- 生成時に複数のCTAを選択可能
- 記事生成時にAIがこれらのCTAを適切に配置

---

### 16. GenerationJobKnowledgeItem（生成ジョブと情報バンク中間テーブル）

**目的**: 生成ジョブで参照する情報バンク項目の指定

| フィールド | 型 | 説明 |
|-----------|---|------|
| generationJobId | String | 生成ジョブFK |
| knowledgeItemId | String | 情報バンクFK |

**設計ポイント**:
- 生成時に参照する一次情報を明示的に指定
- または自動でブランド・コース・監修者等の条件で検索

---

### 17. SystemSettings（システム設定）

**目的**: 外部API設定とシステムパラメータ

| フィールド | 型 | 説明 |
|-----------|---|------|
| id | String | 主キー（"default"固定 = シングルトン） |
| gaApiKey | String? | Google Analytics APIキー |
| gaPropertyId | String? | GAプロパティID |
| searchConsoleApiKey | String? | Search Console APIキー |
| searchConsoleSiteUrl | String? | SCサイトURL |
| searchVolumeApiKey | String? | 検索ボリュームAPIキー |
| openRouterApiKey | String? | OpenRouter APIキー |
| aiModel | String? | 使用AIモデル |
| minSearchVolume | Int | 最小検索ボリューム |
| maxSearchVolume | Int | 最大検索ボリューム |
| volumeZones | Json? | ボリュームゾーン定義 |

**設計ポイント**:
- シングルトンパターン（id="default"のレコード1つのみ）
- オーナーのみ編集可（アプリケーション側で制御）

---

### 18. AnalyticsData（分析データ）

**目的**: GA/SCデータの日次集計

| フィールド | 型 | 説明 |
|-----------|---|------|
| id | String | 主キー |
| articleId | String | 記事FK |
| date | Date | 日付 |
| pageViews | Int | ページビュー |
| organicViews | Int | オーガニック流入 |
| conversionClicks | Int | CTAクリック数 |
| bounceRate | Int | 直帰率（%） |
| avgTimeOnPage | Float | 平均滞在時間（秒） |
| keywords | Json? | キーワードデータ（配列） |

**設計ポイント**:
- `[articleId, date]`でユニーク制約（1記事1日1レコード）
- 毎日1回のバッチ取り込みで更新
- `keywords`は `[{keyword, position, clicks}]` の配列

---

## インデックス設計

### パフォーマンス最適化のための主要インデックス

#### 1. User
```sql
INDEX (email)  -- ログイン時の高速検索
```

#### 2. Article
```sql
INDEX (slug)              -- URL検索
INDEX (status)            -- 公開状態フィルタ
INDEX (publishedAt)       -- 公開日ソート
INDEX (categoryId)        -- カテゴリフィルタ
INDEX (authorId)          -- 監修者フィルタ
INDEX (createdById)       -- 作成者フィルタ
INDEX (generationJobId)   -- 生成ジョブとの紐づけ
```

#### 3. Category / Tag
```sql
INDEX (slug)  -- URL検索
```

#### 4. ArticleTag / MediaAssetTag
```sql
INDEX (articleId)      -- 記事からタグ取得
INDEX (tagId)          -- タグから記事取得
INDEX (mediaAssetId)   -- 画像からタグ取得
```

#### 5. MediaAsset
```sql
INDEX (source)                     -- ソースフィルタ
INDEX (showInLibrary, isDeleted)   -- ライブラリ一覧取得
```

#### 6. KnowledgeItem
```sql
INDEX (type)      -- 種類フィルタ
INDEX (brand)     -- ブランドフィルタ
INDEX (course)    -- コースフィルタ
INDEX (authorId)  -- 監修者フィルタ
```

#### 7. GenerationJob
```sql
INDEX (status)     -- ステータスフィルタ
INDEX (userId)     -- ユーザーの生成履歴
INDEX (categoryId) -- カテゴリフィルタ
INDEX (authorId)   -- 監修者フィルタ
INDEX (createdAt)  -- 作成日ソート
```

#### 8. AnalyticsData
```sql
INDEX (articleId)  -- 記事の分析データ取得
INDEX (date)       -- 日付範囲検索
UNIQUE INDEX (articleId, date)  -- 1記事1日1レコード保証
```

#### 9. Conversion
```sql
INDEX (status)  -- アクティブなCTA取得
```

---

## マイグレーション戦略

### 1. 初期セットアップ

```bash
# Prisma初期化
npx prisma init

# .envファイルにDATABASE_URL設定
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"

# マイグレーション作成
npx prisma migrate dev --name init

# Prisma Clientの生成
npx prisma generate
```

### 2. 開発フロー

```bash
# スキーマ変更後、マイグレーションを作成
npx prisma migrate dev --name add_new_field

# 本番環境へのデプロイ前に検証
npx prisma migrate deploy --preview-feature
```

### 3. 本番デプロイ

```bash
# 本番環境でマイグレーション実行
npx prisma migrate deploy

# Prisma Studio（管理画面）の起動
npx prisma studio
```

### 4. データシーディング

初期データの投入（`prisma/seed.ts`）:

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // デフォルト設定の作成
  await prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      minSearchVolume: 100,
      maxSearchVolume: 10000,
      aiModel: 'openai/gpt-4-turbo',
    },
  });

  // デフォルトカテゴリの作成
  await prisma.category.createMany({
    data: [
      { name: 'ヨガポーズ', slug: 'yoga-poses', color: '#3B82F6' },
      { name: 'ヨガ哲学', slug: 'yoga-philosophy', color: '#8B5CF6' },
      { name: '健康・ウェルネス', slug: 'health-wellness', color: '#10B981' },
    ],
  });

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

`package.json`に追加:
```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

実行:
```bash
npx prisma db seed
```

### 5. バックアップ戦略

**Supabaseの場合**:
- 自動日次バックアップが有効
- Point-in-Time Recovery（PITR）で過去7日間復元可能

**手動バックアップ**:
```bash
# PostgreSQLのダンプ
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# 復元
psql $DATABASE_URL < backup_20250101.sql
```

### 6. マイグレーションのロールバック

```bash
# 最新のマイグレーションを取り消す
npx prisma migrate resolve --rolled-back <migration_name>
```

---

## セキュリティ考慮事項

### 1. 認証・認可

- **パスワード**: bcryptで必ずハッシュ化（ソルトラウンド10以上）
- **セッション**: HTTPOnly, Secure, SameSite=Strict クッキー
- **API**: JWTトークンまたはセッションベース認証
- **ロール制御**: アプリケーション層で OWNER/WRITER を厳密にチェック

```typescript
// 例: 監修者のsystemPrompt編集チェック
if (user.role !== 'OWNER') {
  throw new Error('Forbidden: Only owners can edit system prompts');
}
```

### 2. SQL インジェクション対策

- Prismaは自動的にパラメータ化されたクエリを使用
- `prisma.$queryRaw`を使う場合は必ずプレースホルダーを使用

```typescript
// 安全
const result = await prisma.$queryRaw`SELECT * FROM articles WHERE id = ${id}`;

// 危険（使わない）
const result = await prisma.$queryRawUnsafe(`SELECT * FROM articles WHERE id = '${id}'`);
```

### 3. XSS対策

- フロントエンドでの出力時にサニタイズ
- `blocks`（JSON）の内容は信頼できるユーザーのみが編集
- iframe埋め込みは Content Security Policy (CSP) で制御

### 4. CSRF対策

- Next.jsの場合、next-auth等のライブラリがCSRFトークンを自動管理
- カスタムAPIの場合、CSRFトークン検証を実装

### 5. レート制限

- API呼び出しにレート制限を設定（例: 1分間に60リクエスト）
- 生成ジョブは重い処理なので特に厳しく制限

### 6. 環境変数の管理

- APIキーは必ず環境変数で管理
- `.env`ファイルは`.gitignore`に追加
- 本番環境ではVercel/Supabaseの環境変数設定を使用

```bash
# .env.example
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-here"
OPENROUTER_API_KEY="sk-..."
```

### 7. データアクセス制御

- ユーザーは自分の所属するプロジェクトのデータのみアクセス可能
- Prismaミドルウェアで自動的にフィルタリング

```typescript
// 例: グローバルフィルタ
prisma.$use(async (params, next) => {
  if (params.model === 'Article') {
    // ログインユーザーの記事のみ取得
    params.args.where = { ...params.args.where, createdById: currentUserId };
  }
  return next(params);
});
```

---

## 付録: よくある質問

### Q1. 記事の下書き保存はどうする？

A: `status=DRAFT`で保存します。自動保存を実装する場合は、フロント側でデバウンスして定期的に保存APIを呼び出します。

### Q2. 画像のWebP変換はどこで行う？

A: アップロード時にサーバー側（Next.js API Route）でSharpライブラリを使って変換し、変換後のURLを`MediaAsset.url`に保存します。

### Q3. 記事のバージョン履歴は必要？

A: v1では不要と定義されています。必要になった場合は`ArticleVersion`テーブルを追加します。

### Q4. タグの自動補完はどうする？

A: フロント側で`Tag`テーブルから候補を取得し、インクリメンタルサーチを実装します。新規タグは入力時に自動作成します。

### Q5. 生成ジョブの進捗更新は？

A: 外部ワークフロー（Inngest等）から定期的に`GenerationJob.progress`を更新します。フロント側はポーリングまたはWebSocketで進捗を取得します。

---

## まとめ

このスキーマ設計は以下を実現します：

1. **スケーラビリティ**: 500〜1000記事、PV 10万超にも対応可能なインデックス設計
2. **柔軟性**: JSON型を活用し、将来の機能拡張に対応
3. **データ整合性**: 適切な外部キー制約と削除ルール
4. **セキュリティ**: ロールベースのアクセス制御と論理削除
5. **パフォーマンス**: 検索・フィルタに最適化されたインデックス

次のステップ:
1. `schema.prisma`ファイルの作成
2. 初期マイグレーションの実行
3. API層の実装（tRPCまたはNext.js API Routes）
4. フロントエンドとの統合

---

**作成者**: Backend Engineer
**更新日**: 2025-12-09
**バージョン**: v1.0
