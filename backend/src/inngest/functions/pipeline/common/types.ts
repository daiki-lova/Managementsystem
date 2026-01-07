// 6ステージパイプラインの型定義

// ステージ名定義
export const STAGE_NAMES = {
  1: "keyword_analysis",
  2: "structure",
  3: "draft",
  4: "seo",
  5: "proofreading",
} as const;

export type StageName = (typeof STAGE_NAMES)[keyof typeof STAGE_NAMES];

// 進捗率定義
export const STAGE_PROGRESS = {
  0: 0,    // 未開始
  1: 15,   // キーワード分析完了
  2: 35,   // 構成設計完了
  3: 60,   // 記事執筆完了
  4: 80,   // SEO最適化完了
  5: 95,   // 監修・校正完了
  6: 100,  // 保存完了
} as const;

// ステージラベル（UI表示用）
export const STAGE_LABELS = {
  1: "キーワード分析中...",
  2: "構成を設計中...",
  3: "記事を執筆中...",
  4: "SEO最適化中...",
  5: "監修・校正中...",
  6: "保存中...",
} as const;

// ========================================
// Stage 1: キーワード分析・企画
// ========================================
export interface Stage1Input {
  keyword: string;
  categoryId: string;
  categoryName: string;
  conversionGoal: string;
  existingArticles: {
    slug: string;
    title: string;
    summary?: string;
    categoryId: string;
  }[];
  infoBank: {
    id: string;
    title: string;
    type: string;
    content: string;
  }[];
  // オプション: GSC/GA4データ
  gscData?: {
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[];
  ga4Data?: {
    pagePath: string;
    pageViews: number;
    avgSessionDuration: number;
  }[];
}

export interface Stage1Output {
  date: string;
  conversion_goal: string;
  selected_topics: {
    category: string;
    primary_keyword: string;
    secondary_keywords: string[];
    search_intent: string;
    angle: string;
    title_candidates: string[];
    why_now: string;
    priority_score: number;
    internal_link_candidates: string[];
    missing_info_questions: string[];
  }[];
}

// ========================================
// Stage 2: 構成・安全設計
// ========================================
export interface Stage2Input {
  topicBrief: Stage1Output["selected_topics"][0];
  infoBank: Stage1Input["infoBank"];
  reviewerProfile: {
    id: string;
    name: string;
    role: string;
    systemPrompt: string;
  };
  contentIndex: {
    slug: string;
    title: string;
  }[];
  brandRules: {
    name: string;
    description: string;
    tone?: string;
    prohibitedExpressions?: string[];
  };
}

export interface Stage2Output {
  risk_level: "low" | "medium" | "high";
  must_answer_questions: string[];
  outline: {
    h2: string;
    purpose: string;
    info_bank_refs: string[];
    h3: {
      title: string;
      purpose: string;
    }[];
  }[];
  citation_needs: {
    claim: string;
    preferred_source_type: string;
  }[];
  internal_link_plan: {
    in_body_slots: number;
    end_related_posts: number;
    candidates: string[];
  };
  image_plan: {
    slot: string;
    intent: string;
    avoid: string;
    alt_hint: string;
  }[];
  open_questions: string[];
}

// ========================================
// Stage 3: 記事執筆
// ========================================
export interface Stage3Input {
  topicBrief: Stage1Output["selected_topics"][0];
  outlinePackage: Stage2Output;
  infoBank: Stage1Input["infoBank"];
  reviewerProfile: Stage2Input["reviewerProfile"];
  brandRules: Stage2Input["brandRules"];
}

export interface Stage3Output {
  meta: {
    title: string;
    metaTitle: string;
    metaDescription: string;
  };
  blocks: {
    id: string;
    type: "p" | "h2" | "h3" | "h4" | "ul" | "ol" | "blockquote" | "callout" | "image";
    content: string;
    metadata?: Record<string, unknown>;
  }[];
  schema_jsonld: Record<string, unknown>;
  internal_links: {
    slug: string;
    anchor: string;
    position: string;
  }[];
  image_jobs: {
    slot: string;
    prompt: string;
    alt: string;
  }[];
}

// ========================================
// Stage 4: SEO/LLMO最適化
// ========================================
export interface Stage4Input {
  draft: Stage3Output;
  topicBrief: Stage1Output["selected_topics"][0];
  outlinePackage: Stage2Output;
  infoBank: Stage1Input["infoBank"];
  brandRules: Stage2Input["brandRules"];
}

export interface Stage4Output {
  meta: Stage3Output["meta"];
  optimized_blocks: Stage3Output["blocks"];
  schema_jsonld: Record<string, unknown>;
  llmo_snippets: {
    short_summary: string;
    key_takeaways: string[];
  };
  internal_links_used: {
    slug: string;
    anchor: string;
  }[];
  image_jobs: Stage3Output["image_jobs"];
  issues: string[];
}

// ========================================
// Stage 5: 監修・校正
// ========================================
export interface Stage5Input {
  articlePackage: Stage4Output;
  reviewerProfile: Stage2Input["reviewerProfile"];
  infoBank: Stage1Input["infoBank"];
  brandRules: Stage2Input["brandRules"];
  conversionGoal: string;
}

export interface Stage5Output {
  // 校正ステータス: approved=承認, needs_changes=要修正
  status: "approved" | "needs_changes";
  // 最終ブロック（承認時は必須）
  final_blocks: Stage3Output["blocks"];
  // 最終メタ情報（承認時は必須）
  final_meta: Stage3Output["meta"];
  // 変更内容
  changes_made: {
    original: string;
    revised: string;
    reason: string;
  }[];
  // 安全性に関する注記
  safety_notes: string[];
  // 免責事項が追加されたか
  disclaimer_added: boolean;
  // 品質スコア
  quality_score: {
    accuracy: number;
    readability: number;
    seo_optimization: number;
    brand_alignment: number;
    overall: number;
  };
  // 最終レビューコメント
  final_review_comments: string[];
  // 要修正時の必須変更点（status=needs_changesの場合）
  required_changes?: {
    location: string;
    problem: string;
    suggested_fix: string;
  }[];
}

// ========================================
// パイプライン全体
// ========================================
export interface PipelineContext {
  jobId: string;
  keyword: string;
  categoryId: string;
  authorId: string;
  brandId: string;
  conversionIds: string[];
  knowledgeItemIds: string[];
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
  stage1?: Stage1Output;
  stage2?: Stage2Output;
  stage3?: Stage3Output;
  stage4?: Stage4Output;
  stage5?: Stage5Output;
}
