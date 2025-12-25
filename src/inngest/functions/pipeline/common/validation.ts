// 3ステップパイプライン用バリデーション

import type { Stage1Output, Stage2Output } from "./types";

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
 * Stage 1出力のバリデーション（タイトル生成）
 */
export function validateStage1Output(output: unknown): Stage1Output {
  const data = output as Stage1Output;
  const missing: string[] = [];

  if (!data) {
    throw new StageValidationError(1, ["output"], "Stage 1 returned null/undefined output");
  }

  if (!data.title) missing.push("title");
  if (!data.slug) missing.push("slug");
  if (!data.metaTitle) missing.push("metaTitle");
  if (!data.metaDescription) missing.push("metaDescription");

  if (missing.length > 0) {
    throw new StageValidationError(1, missing);
  }

  return data;
}

/**
 * Stage 2出力のバリデーション（記事生成）
 * HTMLの基本的なチェックのみ
 */
export function validateStage2Output(html: string): Stage2Output {
  if (!html || html.trim().length === 0) {
    throw new StageValidationError(2, ["html"], "Stage 2 returned empty HTML");
  }

  // 基本的なHTML構造チェック
  if (!html.includes("<!DOCTYPE html>") && !html.includes("<html")) {
    console.warn("Stage 2 HTML does not contain <!DOCTYPE html> or <html> tag");
  }

  // プレースホルダーを抽出
  const placeholderRegex = /<!-- IMAGE_PLACEHOLDER: position="([^"]+)" context="([^"]+)" alt_hint="([^"]+)" -->/g;
  const placeholders: { position: string; context: string; altHint: string }[] = [];

  let match;
  while ((match = placeholderRegex.exec(html)) !== null) {
    placeholders.push({
      position: match[1],
      context: match[2],
      altHint: match[3],
    });
  }

  return {
    html,
    imagePlaceholders: placeholders,
  };
}
