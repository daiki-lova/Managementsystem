// 8ステップパイプラインの型定義
// v1仕様書: article-generation-orchestration-v1.md

// ステージ名定義
export const STAGE_NAMES = {
  1: "outline_generation",      // タイトル・アウトライン生成
  2: "primary_info_extraction", // 一次情報抽出
  3: "external_sources",        // 外部根拠の探索
  4: "html_generation",         // 本文HTML生成
  5: "image_jobs",              // 画像ジョブ生成
  6: "image_generation",        // 画像生成実行
  7: "image_insertion",         // HTMLへ画像差し込み
  8: "save_draft",              // 下書き保存
} as const;

export type StageName = (typeof STAGE_NAMES)[keyof typeof STAGE_NAMES];

// 進捗率定義
export const STAGE_PROGRESS = {
  0: 0,    // 未開始
  1: 10,   // アウトライン生成完了
  2: 20,   // 一次情報抽出完了
  3: 30,   // 外部根拠探索完了
  4: 55,   // HTML生成完了
  5: 60,   // 画像ジョブ生成完了
  6: 85,   // 画像生成完了
  7: 95,   // 画像差し込み完了
  8: 100,  // 保存完了
} as const;

// ステージラベル（UI表示用）
export const STAGE_LABELS = {
  1: "アウトライン生成中...",
  2: "一次情報を抽出中...",
  3: "外部根拠を探索中...",
  4: "本文を執筆中...",
  5: "画像プロンプトを生成中...",
  6: "画像を生成中...",
  7: "画像を挿入中...",
  8: "下書きを保存中...",
} as const;

// ========================================
// Step 1: タイトル・アウトライン生成
// ========================================
export interface OutlineSection {
  h2: string;
  purpose: string;
  h3?: { title: string; purpose: string }[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ImageSlot {
  slot: 'cover' | 'inbody_1' | 'inbody_2';
}

export interface Step1Input {
  keyword: string;
  categoryId: string;
  categoryName: string;
  brandName: string;
  brandDomain: string;
  conversionGoal?: string;
}

export interface Step1Output {
  title: string;
  slug: string;
  metaTitleDraft: string;
  metaDescriptionDraft: string;
  outline: OutlineSection[];
  faqCandidates: FAQItem[];
  internalLinkSlots: number;
  imageSlots: ImageSlot[];
}

// ========================================
// Step 2: 一次情報抽出
// ========================================
export interface Fact {
  content: string;
  sourceId: string;
}

export interface ExtractedEpisode {
  content: string;
  sourceId: string;
  type: 'transformation' | 'student' | 'teaching' | 'other';
}

export interface Constraint {
  content: string;
  sourceId: string;
}

export interface Step2Input {
  outline: OutlineSection[];
  keyword: string;
  knowledgeItems: {
    id: string;
    title: string;
    type: string;
    content: string;
  }[];
}

export interface Step2Output {
  facts: Fact[];
  episodes: ExtractedEpisode[];
  constraints: Constraint[];
}

// ========================================
// Step 3: 外部根拠探索 (v1ではスキップ)
// ========================================
export interface VerifiedSource {
  type: 'doi' | 'pmid' | 'url';
  identifier: string;
  title: string;
  summary: string;
  verifiedAt: string;
}

export interface Step3Input {
  outline: OutlineSection[];
  keyword: string;
}

export interface Step3Output {
  verifiedSources: VerifiedSource[];
  skipped: boolean;
}

// ========================================
// Step 4: 本文HTML生成
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

export interface Step4Input {
  title: string;
  keyword: string;
  outline: OutlineSection[];
  primaryInfo: Step2Output;
  externalSources: Step3Output;
  supervisor: SupervisorInfo;
  categoryName: string;
  brand: {
    name: string;
    domain: string;
    tone?: string;
  };
  conversionGoal?: string;
}

export interface Step4Output {
  html: string;
  metaTitle: string;
  metaDescription: string;
}

// ========================================
// Step 5: 画像ジョブ生成
// ========================================
export interface ImageJob {
  slot: 'cover' | 'inbody_1' | 'inbody_2';
  prompt: string;
  alt: string;
  width: number;
  height: number;
  avoid: string[];
}

export interface Step5Input {
  html: string;
  title: string;
  outline: OutlineSection[];
  categoryName: string;
  brandTone?: string;
}

export interface Step5Output {
  imageJobs: ImageJob[];
}

// ========================================
// Step 6: 画像生成実行 (現状維持)
// ========================================
export interface GeneratedImage {
  slot: 'cover' | 'inbody_1' | 'inbody_2';
  url: string;
  assetId: string;
  alt: string;
  width: number;
  height: number;
}

export interface Step6Input {
  imageJobs: ImageJob[];
  articleId: string;
  jobId: string;
}

export interface Step6Output {
  generatedImages: GeneratedImage[];
}

// ========================================
// Step 7: HTMLへ画像差し込み
// ========================================
export interface Step7Input {
  html: string;
  generatedImages: GeneratedImage[];
}

export interface Step7Output {
  finalHtml: string;
}

// ========================================
// Step 8: 下書き保存
// ========================================
export interface Step8Input {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  finalHtml: string;
  categoryId: string;
  authorId: string;
  brandId: string;
  userId: string;
  jobId: string;
  conversionIds?: string[];
}

export interface Step8Output {
  articleId: string;
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

// 全ステージの出力を保持（v2パイプライン用）
export interface AllStageOutputs {
  // v2パイプライン（8ステップ）
  step1?: Step1Output;
  step2?: Step2Output;
  step3?: Step3Output;
  step4?: Step4Output;
  step5?: Step5Output;
  step6?: Step6Output;
  step7?: Step7Output;
  step8?: Step8Output;
  // レガシー互換（3ステップパイプライン）
  stage1?: Stage1Output;
  stage2?: Stage2Output;
  stage3?: Stage3Output;
}

// ========================================
// レガシー互換: 旧3ステップパイプライン用
// ========================================
export interface Stage1Input {
  keyword: string;
  categoryId: string;
  categoryName: string;
  brandName: string;
  brandDomain: string;
}

export interface Stage1Output {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
}

export interface ImagePlaceholder {
  position: string;
  context: string;
  altHint: string;
}

export interface Stage2Input {
  title: string;
  keyword: string;
  categoryName: string;
  supervisor: SupervisorInfo;
  infoBank: {
    id: string;
    title: string;
    type: string;
    content: string;
  }[];
  brand: {
    name: string;
    domain: string;
    tone?: string;
  };
  conversionGoal?: string;
}

export interface Stage2Output {
  html: string;
  imagePlaceholders: ImagePlaceholder[];
}

export interface Stage3Input {
  articleHtml: string;
  imagePlaceholders: ImagePlaceholder[];
  articleTitle: string;
  categoryName: string;
  brandTone?: string;
}

export interface LegacyGeneratedImage {
  position: string;
  url: string;
  alt: string;
  prompt: string;
}

export interface Stage3Output {
  finalHtml: string;
  generatedImages: LegacyGeneratedImage[];
}

// ========================================
// V4パイプライン追加型
// ========================================

// ホワイトデータ（Web検索で取得した権威あるデータ）
export interface WhiteDataItem {
  content: string;        // データ内容（例: "RYT資格取得者の78%が..."）
  sourceName: string;     // ソース名（例: "全米ヨガアライアンス"）
  sourceUrl: string;      // 検証可能なURL
  publishedYear: number;  // 発行年
  dataType: 'statistics' | 'research' | 'survey' | 'report';
}

// LLMo最適化データ
export interface LlmoData {
  llmoShortSummary: string;      // 100文字以内の要約
  llmoKeyTakeaways: string[];    // 5つの重要ポイント
  schemaJsonLd: object;          // Article + FAQ構造化データ
}

// V4ステージ出力
export interface V4StageOutputs {
  stage1?: Stage1Output;
  whiteData?: WhiteDataItem[];
  stage2?: Stage2Output;
  llmoData?: LlmoData;
  stage3?: Stage3Output;
}

// V4用の拡張Stage2Input
export interface Stage2InputV4 extends Stage2Input {
  whiteData: WhiteDataItem[];  // ホワイトデータを追加
}
