// ステージ出力バリデーション

import type {
  Stage1Output,
  Stage2Output,
  Stage3Output,
  Stage4Output,
  Stage5Output,
} from "./types";

/**
 * バリデーションエラー
 */
export class StageValidationError extends Error {
  constructor(
    public stage: number,
    public missingFields: string[],
    message?: string
  ) {
    super(message || `Stage ${stage} output validation failed: missing ${missingFields.join(", ")}`);
    this.name = "StageValidationError";
  }
}

/**
 * Stage 1出力のバリデーション
 */
export function validateStage1Output(output: unknown): Stage1Output {
  const data = output as Stage1Output;
  const missing: string[] = [];

  if (!data) {
    throw new StageValidationError(1, ["output"], "Stage 1 returned null/undefined output");
  }

  if (!data.selected_topics || !Array.isArray(data.selected_topics) || data.selected_topics.length === 0) {
    missing.push("selected_topics");
  } else {
    const topic = data.selected_topics[0];
    if (!topic.primary_keyword) missing.push("selected_topics[0].primary_keyword");
    if (!topic.title_candidates || topic.title_candidates.length === 0) missing.push("selected_topics[0].title_candidates");
  }

  if (!data.conversion_goal) missing.push("conversion_goal");

  if (missing.length > 0) {
    throw new StageValidationError(1, missing);
  }

  return data;
}

/**
 * Stage 2出力のバリデーション
 */
export function validateStage2Output(output: unknown): Stage2Output {
  const data = output as Stage2Output;
  const missing: string[] = [];

  if (!data) {
    throw new StageValidationError(2, ["output"], "Stage 2 returned null/undefined output");
  }

  if (!data.risk_level) missing.push("risk_level");
  if (!data.outline || !Array.isArray(data.outline) || data.outline.length === 0) {
    missing.push("outline");
  }
  if (!data.must_answer_questions || !Array.isArray(data.must_answer_questions)) {
    missing.push("must_answer_questions");
  }
  if (!data.image_plan || !Array.isArray(data.image_plan)) {
    missing.push("image_plan");
  }

  if (missing.length > 0) {
    throw new StageValidationError(2, missing);
  }

  return data;
}

/**
 * Stage 3出力のバリデーション
 */
export function validateStage3Output(output: unknown): Stage3Output {
  const data = output as Stage3Output;
  const missing: string[] = [];

  if (!data) {
    throw new StageValidationError(3, ["output"], "Stage 3 returned null/undefined output");
  }

  if (!data.meta) {
    missing.push("meta");
  } else {
    if (!data.meta.title) missing.push("meta.title");
    if (!data.meta.metaTitle) missing.push("meta.metaTitle");
    if (!data.meta.metaDescription) missing.push("meta.metaDescription");
  }

  if (!data.blocks || !Array.isArray(data.blocks) || data.blocks.length === 0) {
    missing.push("blocks");
  }

  // image_jobsは空配列でもOK
  if (!data.image_jobs) {
    data.image_jobs = [];
  }

  // internal_linksは空配列でもOK
  if (!data.internal_links) {
    data.internal_links = [];
  }

  if (missing.length > 0) {
    throw new StageValidationError(3, missing);
  }

  return data;
}

/**
 * Stage 4出力のバリデーション
 * @param output - LLM出力
 * @param stage3ImageJobs - Stage 3のimage_jobs（フォールバック用）
 */
export function validateStage4Output(
  output: unknown,
  stage3ImageJobs?: Stage3Output["image_jobs"]
): Stage4Output {
  const data = output as Stage4Output;
  const missing: string[] = [];

  if (!data) {
    throw new StageValidationError(4, ["output"], "Stage 4 returned null/undefined output");
  }

  // デバッグログ: 実際に受け取ったデータのキーを出力
  console.log("Stage 4 validation - received keys:", Object.keys(data));
  console.log("Stage 4 validation - meta:", data.meta ? Object.keys(data.meta) : "undefined");

  // meta全項目を検証（snake_caseとcamelCaseの両方に対応）
  if (!data.meta) {
    missing.push("meta");
  } else {
    if (!data.meta.title) missing.push("meta.title");
    // metaTitleまたはmeta_titleを受け入れ
    const metaTitle = data.meta.metaTitle || (data.meta as Record<string, unknown>).meta_title;
    if (!metaTitle) {
      missing.push("meta.metaTitle");
    } else {
      data.meta.metaTitle = metaTitle as string;
    }
    // metaDescriptionまたはmeta_descriptionを受け入れ
    const metaDescription = data.meta.metaDescription || (data.meta as Record<string, unknown>).meta_description;
    if (!metaDescription) {
      missing.push("meta.metaDescription");
    } else {
      data.meta.metaDescription = metaDescription as string;
    }
  }

  // optimized_blocksがない場合、blocksで代替
  if (!data.optimized_blocks && (data as unknown as Record<string, unknown>).blocks) {
    data.optimized_blocks = (data as unknown as Record<string, unknown>).blocks as Stage4Output["optimized_blocks"];
  }

  // optimized_blocksの検証（各ブロックの必須キーもチェック）
  if (!data.optimized_blocks || !Array.isArray(data.optimized_blocks) || data.optimized_blocks.length === 0) {
    missing.push("optimized_blocks");
  } else {
    // 各ブロックのid/type/contentを検証
    data.optimized_blocks.forEach((block, index) => {
      if (!block.id) missing.push(`optimized_blocks[${index}].id`);
      if (!block.type) missing.push(`optimized_blocks[${index}].type`);
      if (block.content === undefined || block.content === null) {
        missing.push(`optimized_blocks[${index}].content`);
      }
    });
  }

  if (!data.llmo_snippets) {
    missing.push("llmo_snippets");
  } else {
    if (!data.llmo_snippets.short_summary) missing.push("llmo_snippets.short_summary");
    if (!data.llmo_snippets.key_takeaways || !Array.isArray(data.llmo_snippets.key_takeaways)) {
      missing.push("llmo_snippets.key_takeaways");
    }
  }

  // image_jobs: LLMが返さなかった場合、または空配列の場合はStage 3からフォールバック
  // Stage 3で画像ジョブが生成されていれば、それを優先的に使用する
  if (!data.image_jobs || !Array.isArray(data.image_jobs) || data.image_jobs.length === 0) {
    if (stage3ImageJobs && stage3ImageJobs.length > 0) {
      console.warn("Stage 4 image_jobs missing or empty, falling back to Stage 3 image_jobs");
      data.image_jobs = stage3ImageJobs;
    } else {
      data.image_jobs = [];
    }
  }

  // issuesは空配列でもOK
  if (!data.issues) {
    data.issues = [];
  }

  if (missing.length > 0) {
    throw new StageValidationError(4, missing);
  }

  return data;
}

/**
 * Stage 5出力のバリデーション
 */
export function validateStage5Output(output: unknown): Stage5Output {
  const data = output as Stage5Output;
  const missing: string[] = [];

  if (!data) {
    throw new StageValidationError(5, ["output"], "Stage 5 returned null/undefined output");
  }

  // statusは必須
  if (!data.status || !["approved", "needs_changes"].includes(data.status)) {
    missing.push("status (must be 'approved' or 'needs_changes')");
  }

  // final_blocksの検証（各ブロックの必須キーもチェック）
  if (!data.final_blocks || !Array.isArray(data.final_blocks) || data.final_blocks.length === 0) {
    missing.push("final_blocks");
  } else {
    // 各ブロックのid/type/contentを検証
    data.final_blocks.forEach((block, index) => {
      if (!block.id) missing.push(`final_blocks[${index}].id`);
      if (!block.type) missing.push(`final_blocks[${index}].type`);
      if (block.content === undefined || block.content === null) {
        missing.push(`final_blocks[${index}].content`);
      }
    });
  }

  // final_meta全項目を検証（snake_caseとcamelCaseの両方に対応）
  if (!data.final_meta) {
    missing.push("final_meta");
  } else {
    if (!data.final_meta.title) missing.push("final_meta.title");
    // metaTitleまたはmeta_titleを受け入れ
    const metaTitle = data.final_meta.metaTitle || (data.final_meta as Record<string, unknown>).meta_title;
    if (!metaTitle) {
      missing.push("final_meta.metaTitle");
    } else {
      data.final_meta.metaTitle = metaTitle as string;
    }
    // metaDescriptionまたはmeta_descriptionを受け入れ
    const metaDescription = data.final_meta.metaDescription || (data.final_meta as Record<string, unknown>).meta_description;
    if (!metaDescription) {
      missing.push("final_meta.metaDescription");
    } else {
      data.final_meta.metaDescription = metaDescription as string;
    }
  }

  // quality_scoreは必須
  if (!data.quality_score) {
    missing.push("quality_score");
  } else {
    if (typeof data.quality_score.overall !== "number") {
      missing.push("quality_score.overall");
    }
  }

  // needs_changesの場合、required_changesがあると良い（警告のみ）
  if (data.status === "needs_changes" && (!data.required_changes || data.required_changes.length === 0)) {
    console.warn("Stage 5 returned needs_changes but no required_changes specified");
  }

  // オプショナルフィールドにデフォルト値を設定
  if (!data.changes_made) data.changes_made = [];
  if (!data.safety_notes) data.safety_notes = [];
  if (!data.final_review_comments) data.final_review_comments = [];
  if (typeof data.disclaimer_added !== "boolean") data.disclaimer_added = false;

  if (missing.length > 0) {
    throw new StageValidationError(5, missing);
  }

  return data;
}
