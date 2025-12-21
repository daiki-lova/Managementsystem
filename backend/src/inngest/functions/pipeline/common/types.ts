// 3.5ステップパイプラインの型定義（検索意図分析追加版）

// ステージ名定義
export const STAGE_NAMES = {
  0: "search_intent_analysis",  // 新規: 検索意図分析
  1: "title_generation",
  2: "article_generation",
  3: "image_generation",
} as const;

export type StageName = (typeof STAGE_NAMES)[keyof typeof STAGE_NAMES];

// 進捗率定義
export const STAGE_PROGRESS = {
  0: 5,    // 検索意図分析完了
  1: 20,   // タイトル生成完了
  2: 80,   // 記事生成完了
  3: 100,  // 画像生成・挿入完了
} as const;

// ステージラベル（UI表示用）
export const STAGE_LABELS = {
  0: "検索意図を分析中...",
  1: "タイトル生成中...",
  2: "記事を執筆中...",
  3: "画像を生成中...",
} as const;

// ========================================
// Stage 0: 検索意図分析（新規）
// ========================================
export interface Stage0Input {
  keyword: string;
  categoryId: string;
}

export interface Stage0Output {
  // PAA（People Also Ask）
  peopleAlsoAsk: Array<{
    question: string;
    answer?: string;
  }>;
  // 上位記事のタイトル
  topResults: Array<{
    rank: number;
    title: string;
    url: string;
  }>;
  // 関連検索クエリ
  relatedSearches: string[];
  // 分析メタデータ
  fetchedAt: Date;
  // APIエラーの場合はフォールバックフラグ
  isFallback: boolean;
}

// ========================================
// Stage 1: タイトル生成
// ========================================
export interface Stage1Input {
  keyword: string;
  categoryId: string;
  categoryName: string;
  brandName: string;
  brandDomain: string;
  // 検索意図分析結果（Stage 0から）
  searchAnalysis?: Stage0Output;
}

export interface Stage1Output {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
}

// ========================================
// Stage 2: 記事生成
// ========================================

// 資格情報
export interface Certification {
  name: string;
  year?: number;
  location?: string;
}

// エピソード
export interface Episode {
  type: 'transformation' | 'student' | 'teaching' | 'other';
  title: string;
  content: string;
}

// 監修者の詳細情報
export interface SupervisorInfo {
  id: string;
  name: string;
  profile: string;          // bio（経歴）
  role: string;
  // キャリアデータ（具体的な数値）
  careerStartYear?: number;     // ヨガ開始年
  teachingStartYear?: number;   // 指導開始年
  totalStudentsTaught?: number; // 累計指導人数
  graduatesCount?: number;      // 養成講座卒業生数
  weeklyLessons?: number;       // 週あたりレッスン数
  // 資格情報
  certifications?: Certification[];
  // エピソード（経験談）
  episodes?: Episode[];
  // よく使うフレーズ
  signaturePhrases?: string[];
  // 専門・得意分野
  specialties?: string[];
  // パーソナリティフィールド
  writingStyle?: 'formal' | 'casual' | 'professional';
  philosophy?: string;          // 指導理念・信念
  avoidWords?: string[];        // 使わない言葉・表現
  targetAudience?: string;      // 主な指導対象
  teachingApproach?: string;    // 指導スタイル
  influences?: string[];        // 師事した先生・流派
  locationContext?: string;     // 活動拠点
}

export interface Stage2Input {
  title: string;
  keyword: string;
  categoryName: string;
  // 監修者情報（詳細）
  supervisor: SupervisorInfo;
  // 情報バンク（監修者でフィルタ済み）
  infoBank: {
    id: string;
    title: string;
    type: string;
    content: string;
  }[];
  // ブランド情報
  brand: {
    name: string;
    domain: string;
    tone?: string;
  };
  // コンバージョン目標（オプション）
  conversionGoal?: string;
  // 検索意図分析結果（Stage 0から）
  searchAnalysis?: Stage0Output;
}

export interface ImagePlaceholder {
  position: string;
  context: string;
  altHint: string;
}

export interface Stage2Output {
  html: string;
  imagePlaceholders: ImagePlaceholder[];
}

// ========================================
// Stage 3: 画像生成
// ========================================
export interface Stage3Input {
  articleHtml: string;
  imagePlaceholders: ImagePlaceholder[];
  articleTitle: string;
  categoryName: string;
  brandTone?: string;
}

export interface GeneratedImage {
  position: string;
  url: string;
  alt: string;
  prompt: string;
}

export interface Stage3Output {
  finalHtml: string;
  generatedImages: GeneratedImage[];
}

// ========================================
// パイプライン全体
// ========================================
export interface PipelineInput {
  jobId: string;
  keyword: string;
  categoryId: string;
  authorId: string;
  brandId: string;
  conversionIds?: string[];
  userId: string;
}

export interface StageResult<T> {
  success: boolean;
  output?: T;
  error?: string;
  tokensUsed?: number;
}

// 全ステージの出力を保持
export interface AllStageOutputs {
  stage0?: Stage0Output;  // 検索意図分析
  stage1?: Stage1Output;
  stage2?: Stage2Output;
  stage3?: Stage3Output;
  qualityCheck?: QualityCheckResult;  // 品質チェック結果
}

// ========================================
// 品質チェック結果
// ========================================
export interface QualityCheckResult {
  // 基本メトリクス
  wordCount: number;
  keywordCount: number;
  keywordDensity: number;  // キーワード出現率（%）
  h2Count: number;
  h3Count: number;

  // 構造チェック
  hasSummaryBox: boolean;      // 要約ボックスあり
  hasFaq: boolean;             // FAQセクションあり
  hasImages: boolean;          // 画像プレースホルダーあり
  hasSupervisorProfile: boolean; // 監修者プロフィールあり

  // スコア（0-100）
  overallScore: number;

  // 警告
  warnings: string[];

  // 自動修正が必要か
  needsRevision: boolean;
}
