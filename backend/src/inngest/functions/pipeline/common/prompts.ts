// プロンプト構築ユーティリティ

import type {
  Stage1Input,
  Stage2Input,
  Stage3Input,
  Stage4Input,
  Stage5Input,
} from "./types";

/**
 * 共通ルール（全ステージで参照）
 */
export const COMMON_RULES = `【共通ルール】
あなたは当社メディアの編集AIです。最優先は「正確さ」「読者の安全」「事業ゴール（コンバージョン）」です。

絶対ルール：
- 情報バンク（一次情報）に無い事実を"事実のように"書かない。断定できない場合は「不明」「要確認」と明記する。
- 監修者プロフィールに反する肩書・資格・経験を捏造しない。
- 医療・治療・妊娠・持病・怪我など健康に関わる話題では、断定・診断・治療指示を避け、一般情報として書く。危険な場合は受診・専門家相談を促す。
- 出力仕様に従い、指定フォーマット以外の文章を混ぜない（テキスト汚染を防ぐ）。
- 目的は「検索上位」ではなく「読者が納得して行動できる記事」である。SEOは手段。

【情報バンク活用ルール】
- 記事内の重要主張（強み、比較優位、提供価値、導線）には、必ずinfo_bank_refs（参照ID）を紐づけてから書く。
- 参照IDが無い主張は「一般論」として書く。自社固有の強みとしては書かない。
- 監修者に紐づくカテゴリでは、reviewer_profile内の得意領域・語り口・注意点を優先して構成と表現を決める。
`;

/**
 * Stage 1用ユーザープロンプトを構築
 */
export function buildStage1UserPrompt(input: Stage1Input): string {
  const {
    keyword,
    categoryName,
    conversionGoal,
    existingArticles,
    infoBank,
    gscData,
    ga4Data,
  } = input;

  let prompt = `以下の入力を基に、狙うべきテーマとタイトル案を決定してください。

【入力データ】
対象キーワード: ${keyword}
カテゴリ: ${categoryName}
コンバージョン目標: ${conversionGoal}

【情報バンク】
${infoBank.map((item) => `- [${item.id}] ${item.title} (${item.type}): ${item.content.slice(0, 300)}...`).join("\n")}

【既存記事一覧】
${existingArticles.length > 0
  ? existingArticles.map((a) => `- ${a.slug}: ${a.title}`).join("\n")
  : "なし"
}
`;

  if (gscData && gscData.length > 0) {
    prompt += `\n【GSCデータ（直近28日）】
${gscData.slice(0, 20).map((d) => `- ${d.query}: ${d.clicks}クリック, ${d.impressions}表示, CTR ${(d.ctr * 100).toFixed(1)}%, 順位${d.position.toFixed(1)}`).join("\n")}
`;
  }

  if (ga4Data && ga4Data.length > 0) {
    prompt += `\n【GA4データ（直近28日）】
${ga4Data.slice(0, 10).map((d) => `- ${d.pagePath}: ${d.pageViews}PV, 平均${d.avgSessionDuration.toFixed(0)}秒`).join("\n")}
`;
  }

  prompt += `\n**重要**: 必ずJSON形式のみで出力してください。説明文やMarkdownは不要です。`;
  return prompt;
}

/**
 * Stage 2用ユーザープロンプトを構築
 */
export function buildStage2UserPrompt(input: Stage2Input): string {
  const { topicBrief, infoBank, reviewerProfile, contentIndex, brandRules } = input;

  return `以下の入力を基に、記事の構成案と安全ガードを作成してください。

【テーマ概要】
キーワード: ${topicBrief.primary_keyword}
検索意図: ${topicBrief.search_intent}
切り口: ${topicBrief.angle}
タイトル候補: ${topicBrief.title_candidates.join(" / ")}

【監修者プロフィール】
${reviewerProfile.name}（${reviewerProfile.role}）
${reviewerProfile.systemPrompt}

【情報バンク】
${infoBank.map((item) => `- [${item.id}] ${item.title} (${item.type}): ${item.content.slice(0, 300)}...`).join("\n")}

【既存記事（内部リンク候補）】
${contentIndex.slice(0, 20).map((a) => `- ${a.slug}: ${a.title}`).join("\n")}

【ブランドルール】
ブランド名: ${brandRules.name}
${brandRules.description}
${brandRules.tone ? `トーン: ${brandRules.tone}` : ""}
${brandRules.prohibitedExpressions ? `禁止表現: ${brandRules.prohibitedExpressions.join(", ")}` : ""}

**重要**: 必ずJSON形式のみで出力してください。説明文やMarkdownは不要です。`;
}

/**
 * Stage 3用ユーザープロンプトを構築
 */
export function buildStage3UserPrompt(input: Stage3Input): string {
  const { topicBrief, outlinePackage, infoBank, reviewerProfile, brandRules } = input;

  return `以下の構成案に基づいて、記事本文を執筆してください。

【テーマ】
キーワード: ${topicBrief.primary_keyword}
タイトル候補: ${topicBrief.title_candidates[0]}

【構成案】
リスクレベル: ${outlinePackage.risk_level}
必ず答える質問: ${outlinePackage.must_answer_questions.join(" / ")}

アウトライン:
${outlinePackage.outline.map((section) => `
## ${section.h2}
目的: ${section.purpose}
参照: ${(section.info_bank_refs || []).join(", ") || "なし"}
${(section.h3 || []).map((h3) => `  ### ${h3.title}\n  目的: ${h3.purpose}`).join("\n")}
`).join("\n")}

【画像計画】
${outlinePackage.image_plan.map((img) => `- ${img.slot}: ${img.intent} (避ける: ${img.avoid})`).join("\n")}

【内部リンク計画】
本文内: ${outlinePackage.internal_link_plan.in_body_slots}箇所
末尾関連記事: ${outlinePackage.internal_link_plan.end_related_posts}本
候補: ${outlinePackage.internal_link_plan.candidates.join(", ")}

【監修者】
${reviewerProfile.name}（${reviewerProfile.role}）

【情報バンク】
${infoBank.map((item) => `- [${item.id}] ${item.title}: ${item.content.slice(0, 500)}...`).join("\n")}

【ブランドルール】
${brandRules.name}: ${brandRules.description}

**重要**: 必ずJSON形式のみで出力してください。説明文やMarkdownは不要です。`;
}

/**
 * Stage 4用ユーザープロンプトを構築
 */
export function buildStage4UserPrompt(input: Stage4Input): string {
  const { draft, topicBrief, outlinePackage, brandRules } = input;

  return `以下の記事をSEO・LLMO観点で最適化してください。

【メタ情報】
タイトル: ${draft.meta.title}
メタタイトル: ${draft.meta.metaTitle}
メタディスクリプション: ${draft.meta.metaDescription}

【記事本文】
${draft.blocks.map((block) => {
  if (block.type === "h2" || block.type === "h3" || block.type === "h4") {
    return `${"#".repeat(block.type === "h2" ? 2 : block.type === "h3" ? 3 : 4)} ${block.content}`;
  }
  return block.content;
}).join("\n\n")}

【現在の内部リンク】
${draft.internal_links.map((link) => `- ${link.anchor} → ${link.slug}`).join("\n")}

【画像生成ジョブ（Stage 3から引き継ぎ）】
${draft.image_jobs.map((job) => `- ${job.slot}: ${job.alt} (プロンプト: ${job.prompt})`).join("\n")}
※ 上記のimage_jobsは出力JSONのimage_jobsにそのまま含めてください。

【テーマ概要】
キーワード: ${topicBrief.primary_keyword}
関連キーワード: ${topicBrief.secondary_keywords.join(", ")}
検索意図: ${topicBrief.search_intent}

【リスクレベル】
${outlinePackage.risk_level}

【ブランドルール】
${brandRules.name}: ${brandRules.description}

**重要**: 必ずJSON形式のみで出力してください。説明文やMarkdownは不要です。`;
}

/**
 * Stage 5用ユーザープロンプトを構築
 */
export function buildStage5UserPrompt(input: Stage5Input): string {
  const { articlePackage, reviewerProfile, infoBank, brandRules, conversionGoal } = input;

  return `以下の記事を監修・校正してください。

【監修者プロフィール】
${reviewerProfile.name}（${reviewerProfile.role}）
${reviewerProfile.systemPrompt}

【メタ情報】
タイトル: ${articlePackage.meta.title}
メタタイトル: ${articlePackage.meta.metaTitle}
メタディスクリプション: ${articlePackage.meta.metaDescription}

【LLMO対応】
要約: ${articlePackage.llmo_snippets.short_summary}
重要ポイント: ${articlePackage.llmo_snippets.key_takeaways.join(" / ")}

【記事本文】
${articlePackage.optimized_blocks.map((block) => {
  if (block.type === "h2" || block.type === "h3" || block.type === "h4") {
    return `${"#".repeat(block.type === "h2" ? 2 : block.type === "h3" ? 3 : 4)} ${block.content}`;
  }
  return block.content;
}).join("\n\n")}

【SEO課題】
${articlePackage.issues.length > 0 ? articlePackage.issues.join("\n") : "なし"}

【情報バンク（事実確認用）】
${infoBank.map((item) => `- [${item.id}] ${item.title}: ${item.content.slice(0, 300)}...`).join("\n")}

【ブランドルール】
${brandRules.name}: ${brandRules.description}

【コンバージョン目標】
${conversionGoal}

**重要**: 必ずJSON形式のみで出力してください。説明文やMarkdownは不要です。`;
}
