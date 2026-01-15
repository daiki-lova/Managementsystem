// V5パイプライン: V3（受講生の声ベース） + Web検索 + LLMo最適化
// 設計書: docs/article-generation-v5-design.md
//
// 特徴:
// - 受講生の声から自動でキーワード抽出（V3継承）
// - Web検索で最新データを取得
// - LLMo最適化（AI検索エンジン対策）
// - ヨガをする人物の高品質画像

import { inngest } from "../../client";
import prisma from "@/lib/prisma";
import { ArticleStatus, GenerationJobStatus, MediaSource, ArticleImageType, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { getDecryptedSettings, DecryptedSettings } from "@/lib/settings";
import { uploadImage } from "@/lib/supabase";
import sharp from "sharp";
import { DataForSEOClient, scoreKeyword } from "@/lib/dataforseo";
import {
  type SupervisorInfo,
  type GeneratedImage,
} from "./common/types";
import {
  callOpenRouter,
  STEP_MODEL_CONFIG,
  STAGE_MODEL_CONFIG,
} from "./common/openrouter";
import {
  DEFAULT_KEYWORD_ANALYSIS_PROMPT,
  DEFAULT_ARTICLE_PROMPT,
  DEFAULT_WHITE_DATA_PROMPT,
  DEFAULT_LLMO_PROMPT,
  // 100点品質HTML処理関数
  cleanGeneratedHtml,
  insertCTABanner,
  insertRelatedArticles,
  insertSupervisorQuote,
  fixTableHtml,
  improveFaqStyle,
} from "./common/prompts";

// ========================================
// V5専用の型定義
// ========================================

interface StudentVoice {
  id: string;
  title: string;
  content: string;
}

interface ThemeKeywordCandidate {
  keyword: string;
  searchIntent: string;
  relevance: "high" | "medium" | "low";
}

interface ThemeAnalysis {
  mainThemes: string[];
  keywordCandidates: ThemeKeywordCandidate[];
  storyAngles: string[];
}

interface SelectedKeyword {
  keyword: string;
  volume: number;
  competition: number;
  score: number;
}

// Web検索結果
interface WebSearchSource {
  title: string;
  url: string;
  summary: string;
  reliability: "high" | "medium" | "low";
  dataPoints?: string[];
}

interface WebSearchResult {
  sources: WebSearchSource[];
  keyInsights: string[];
  latestTrends: string;
  statistics?: string[];
}

// LLMo最適化結果
interface LlmoOptimization {
  llmoShortSummary: string;
  llmoKeyTakeaways: string[];
  schemaJsonLd: Record<string, unknown>;
}

interface ArticleStructure {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  html: string;
  tagSlugs: string[];
}

// プロンプト設定
interface PromptSettings {
  keywordPrompt: string | null;
  systemPrompt: string | null;
  imagePrompt: string | null;
  whiteDataPrompt: string | null;
  llmoPrompt: string | null;
}

// 画像生成モデル（共通設定から取得 - gemini-3-pro-image-preview）
const IMAGE_MODEL = STAGE_MODEL_CONFIG.image_generation.model;

// V5進捗ステージ
const V5_STAGE_PROGRESS: Record<number, number> = {
  1: 5,   // 受講生の声選択
  2: 15,  // テーマ分析
  3: 25,  // キーワード選定
  4: 35,  // Web検索
  5: 55,  // 記事生成
  6: 75,  // 画像生成
  7: 88,  // LLMo最適化
  8: 100, // 保存
};

// ========================================
// ヨガ画像プロンプト（人物・テキストなし）
// ========================================

const YOGA_IMAGE_PROMPT = `Delicate line art illustration of a woman doing yoga on a mat. Thin pen outlines with soft watercolor wash. White background. Pale muted colors - beige, soft green, light gray. Small watercolor dots as decoration. Japanese illustration style. Peaceful expression. Simple and elegant. No text. No words.

Theme: {{THEME}}`;

// ========================================
// ユーティリティ関数
// ========================================

async function fitTo16by9(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    return imageBuffer;
  }

  const targetHeight = Math.round(metadata.width / (16 / 9));

  return await sharp(imageBuffer)
    .resize(metadata.width, targetHeight, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .webp({ quality: 80 })
    .toBuffer();
}

async function generateImageWithGemini(prompt: string, apiKey: string): Promise<string | null> {
  try {
    // プロンプトを400文字に制限（トークンオーバー対策）
    const shortPrompt = prompt.length > 400 ? prompt.substring(0, 400) : prompt;

    console.log(`[V5] Generating image with model: ${IMAGE_MODEL}`);
    console.log(`[V5] Prompt length: ${shortPrompt.length} chars`);
    console.log(`[V5] Prompt preview: ${shortPrompt.substring(0, 80)}...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const requestBody = {
      model: IMAGE_MODEL,
      messages: [{ role: "user", content: shortPrompt }],
      modalities: ["image", "text"],
    };

    console.log(`[V5] Request body size: ${JSON.stringify(requestBody).length} bytes`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[V5] Image generation error: ${response.status}`);
      console.error(`[V5] Error details: ${errorText.substring(0, 500)}`);
      return null;
    }

    const data = await response.json();
    console.log("[V5] Response received from OpenRouter");

    const message = data.choices?.[0]?.message;
    if (!message) {
      console.error("[V5] No message in response");
      return null;
    }

    const extractBase64 = async (dataUrl: string): Promise<string | null> => {
      const base64Match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
      if (base64Match) {
        console.log(`[V5] Extracting base64 image, format: ${base64Match[1]}`);
        const imageBuffer = Buffer.from(base64Match[2], "base64");
        const fittedBuffer = await fitTo16by9(imageBuffer);
        const filePath = `generated/${Date.now()}-${randomUUID()}.webp`;
        const { url } = await uploadImage("MEDIA", filePath, fittedBuffer, "image/webp");
        console.log(`[V5] Image uploaded: ${url}`);
        return url;
      }
      return null;
    };

    // 形式1: message.images配列
    if (message.images?.[0]?.image_url?.url) {
      console.log("[V5] Found image in message.images format");
      return await extractBase64(message.images[0].image_url.url);
    }
    // 形式2: contentがdata URL形式
    if (typeof message.content === "string" && message.content.startsWith("data:image")) {
      console.log("[V5] Found image in message.content (string) format");
      return await extractBase64(message.content);
    }
    // 形式3: content配列内にimage_url
    if (Array.isArray(message.content)) {
      for (const part of message.content) {
        if (part.type === "image_url" && part.image_url?.url?.startsWith("data:image")) {
          console.log("[V5] Found image in message.content (array) format");
          return await extractBase64(part.image_url.url);
        }
      }
    }

    // 画像が見つからなかった場合
    console.error("[V5] No image found in response. Response structure:", JSON.stringify(data).substring(0, 500));
    return null;
  } catch (error) {
    console.error("[V5] Image generation failed:", error);
    return null;
  }
}

// ========================================
// Step 1: 受講生の声を選択
// ========================================

async function selectStudentVoice(specifiedId?: string): Promise<StudentVoice | null> {
  if (specifiedId) {
    const voice = await prisma.knowledge_items.findUnique({
      where: { id: specifiedId }
    });
    if (voice) {
      return { id: voice.id, title: voice.title, content: voice.content };
    }
  }

  const usedItems = await prisma.article_knowledge_items.findMany({
    select: { knowledgeItemId: true }
  });
  const usedIds = usedItems.map(i => i.knowledgeItemId);

  // 未使用のアイテムを全件取得してランダムに選択
  const availableVoices = await prisma.knowledge_items.findMany({
    where: {
      type: "STUDENT_VOICE",
      id: usedIds.length > 0 ? { notIn: usedIds } : undefined
    }
  });

  if (availableVoices.length === 0) return null;

  // ランダムに1件選択
  const randomIndex = Math.floor(Math.random() * availableVoices.length);
  const voice = availableVoices[randomIndex];

  return { id: voice.id, title: voice.title, content: voice.content };
}

// ========================================
// Step 2: テーマ・キーワード候補抽出
// ========================================

async function analyzeThemeAndKeywords(
  voice: StudentVoice,
  apiKey: string,
  settings: PromptSettings
): Promise<ThemeAnalysis | null> {
  const basePrompt = settings.keywordPrompt || DEFAULT_KEYWORD_ANALYSIS_PROMPT;

  const prompt = `${basePrompt}

【分析対象: 受講生の体験談】
${voice.content}

【出力形式】JSONのみを出力してください。

{
  "mainThemes": [
    "この体験の主要テーマを3つ程度"
  ],
  "keywordCandidates": [
    {
      "keyword": "SEOで狙えるキーワード",
      "searchIntent": "このキーワードで検索する人が求めていること",
      "relevance": "high/medium/low"
    }
  ],
  "storyAngles": [
    "この体験を記事にする際の切り口"
  ]
}

【重要】
- キーワードは10〜15個提案
- 検索ボリュームがありそうな一般的なキーワードを優先`;

  const systemPrompt = "あなたはSEOとコンテンツマーケティングの専門家です。JSONのみを出力してください。";

  const response = await callOpenRouter<ThemeAnalysis>(
    systemPrompt,
    prompt,
    {
      apiKey,
      ...STEP_MODEL_CONFIG.outline_generation,
    }
  );

  if (!response.success || !response.data) {
    console.error("[V5] Theme analysis failed:", response.error);
    return null;
  }

  return response.data;
}

// ========================================
// Step 3: キーワードフィルタリング
// ========================================

async function filterAndSelectKeyword(
  candidates: ThemeKeywordCandidate[],
  dataforSeoApiKey: string,
  existingKeywords: string[]
): Promise<SelectedKeyword | null> {
  const client = new DataForSEOClient(dataforSeoApiKey);
  const keywords = candidates.map(c => c.keyword);

  console.log(`[V5] Fetching volume for ${keywords.length} keywords...`);

  let keywordData;
  try {
    keywordData = await client.getKeywordData({ keywords });
  } catch (error) {
    console.error("[V5] DataForSEO error:", error);
    return {
      keyword: candidates[0].keyword,
      volume: 0,
      competition: 0,
      score: 0,
    };
  }

  const available = keywordData.filter(
    kd => !existingKeywords.some(
      existing => existing.toLowerCase() === kd.keyword.toLowerCase()
    )
  );

  if (available.length === 0) {
    console.log("[V5] All keywords already used, using first candidate");
    return {
      keyword: candidates[0].keyword,
      volume: 0,
      competition: 0,
      score: 0,
    };
  }

  const scored = available.map(kd => ({
    ...kd,
    score: scoreKeyword(kd),
  }));

  scored.sort((a, b) => {
    if (b.volume !== a.volume) return b.volume - a.volume;
    return b.score - a.score;
  });

  const selected = scored[0];
  console.log(`[V5] Selected keyword: "${selected.keyword}" (volume: ${selected.volume})`);

  return {
    keyword: selected.keyword,
    volume: selected.volume,
    competition: selected.competition,
    score: selected.score,
  };
}

// ========================================
// Step 4: Web検索（ホワイトデータ取得）【V5新規】
// ========================================

function buildWebSearchPrompt(keyword: string, customPrompt?: string | null): string {
  const currentYear = new Date().getFullYear();

  if (customPrompt) {
    return customPrompt
      .replace(/\{\{KEYWORD\}\}/g, keyword)
      .replace(/\{\{CURRENT_YEAR\}\}/g, String(currentYear));
  }

  return DEFAULT_WHITE_DATA_PROMPT
    .replace(/\{\{KEYWORD\}\}/g, keyword)
    .replace(/\{\{CURRENT_YEAR\}\}/g, String(currentYear));
}

async function searchWebForLatestData(
  keyword: string,
  apiKey: string,
  settings: PromptSettings
): Promise<WebSearchResult | null> {
  const prompt = buildWebSearchPrompt(keyword, settings.whiteDataPrompt);

  console.log(`[V5] Searching web for: ${keyword}`);

  // Perplexity Sonar Pro (Web検索能力あり)
  const response = await callOpenRouter<WebSearchResult>(
    "あなたはWeb検索の専門家です。信頼性の高い最新データを収集してください。JSONのみを出力。",
    prompt,
    {
      apiKey,
      model: "perplexity/sonar-pro",
      maxTokens: 4000,
      temperature: 0.3,
    }
  );

  if (!response.success || !response.data) {
    console.error("[V5] Web search failed:", response.error);
    // 失敗してもパイプラインは継続（Web検索なしで記事生成）
    return {
      sources: [],
      keyInsights: [],
      latestTrends: "",
    };
  }

  console.log(`[V5] Web search completed: ${response.data.sources?.length || 0} sources found`);
  return response.data;
}

// ========================================
// Step 5: 記事生成（Web検索結果統合）【V5拡張】
// ========================================

function buildArticlePromptV5(
  mainVoice: StudentVoice,
  keyword: string,
  supervisor: SupervisorInfo,
  supportingVoices: StudentVoice[],
  conversion: { name: string; url: string },
  categoryName: string,
  brandName: string,
  availableTags: { name: string; slug: string }[],
  webSearchResult: WebSearchResult | null
): string {
  const supervisorEpisodes = supervisor.episodes?.map(e =>
    `【${e.title}】\n${e.content}`
  ).join("\n\n") || "";

  const supervisorPhrases = supervisor.signaturePhrases?.join("」「") || "";
  const avoidWords = supervisor.avoidWords?.join("、") || "";

  const supportingVoicesText = supportingVoices.map((v, i) =>
    `【他の受講生${i + 1}】\n${v.content.substring(0, 300)}...`
  ).join("\n\n");

  // Web検索結果を整形
  let webSearchSection = "";
  if (webSearchResult && webSearchResult.sources.length > 0) {
    const sourcesText = webSearchResult.sources
      .filter(s => s.reliability === "high" || s.reliability === "medium")
      .slice(0, 5)
      .map(s => `- ${s.title}: ${s.summary}`)
      .join("\n");

    const insightsText = webSearchResult.keyInsights?.join("\n- ") || "";

    webSearchSection = `
【最新データ（${new Date().getFullYear()}年時点のWeb検索結果）】

■ 信頼できる情報源
${sourcesText}

■ 重要な洞察
- ${insightsText}

■ 最新トレンド
${webSearchResult.latestTrends || "特になし"}

${webSearchResult.statistics ? `■ 統計データ\n${webSearchResult.statistics.join("\n")}` : ""}

【重要】上記の最新データを記事中に自然に織り込み、出典を明示してください。`;
  }

  return `あなたは経験豊富なSEOライター兼編集者です。
以下の一次情報（受講生の体験談）を主役にした記事を作成してください。

【重要な方針】
- この受講生の体験談が記事の主役です
- 一般的なハウツー記事ではなく、実体験ベースのストーリー記事を書いてください
- 監修者（${supervisor.name}）の視点やコメントを織り交ぜてください
- キーワード「${keyword}」は自然に織り込む形で、無理に詰め込まないでください
- 最新データがある場合は、出典を明記して記事に活用してください

【メインの受講生体験談】
${mainVoice.content}

【監修者情報: ${supervisor.name}】
役職: ${supervisor.role}
プロフィール: ${supervisor.profile}
指導理念: ${supervisor.philosophy || ""}
指導スタイル: ${supervisor.teachingApproach || ""}
よく使うフレーズ: 「${supervisorPhrases}」
避ける言葉: ${avoidWords}

【監修者のエピソード（参考）】
${supervisorEpisodes}

【他の受講生の声（補助的に使用）】
${supportingVoicesText}
${webSearchSection}

【コンバージョン情報】
名前: ${conversion.name}
URL: ${conversion.url}
→ 記事中盤と末尾に自然な誘導文とともにリンクを入れてください

【カテゴリ】${categoryName}
【メディア名】${brandName}
【狙うキーワード】${keyword}

【利用可能なタグ一覧】
${availableTags.map(t => `${t.name} (${t.slug})`).join(', ')}
→ この中から記事に最も関連する3〜5個のタグを選んでください

【記事構成の指示】（以下の順番で必ず含める）
1. リード文（読者の共感を得る導入、この記事で得られることを提示）
2. **「${keyword}とは？」セクション**（H2見出しで必ず含める。キーワードの定義を説明）
3. メインストーリー
   - 受講生がヨガ資格を取ろうと思ったきっかけ
   - 受講中の体験・気づき・乗り越えた壁
   - 資格取得後の変化・成果
4. 監修者からのコメント（blockquote形式で1〜2回）
5. 最新データ・統計情報（Web検索結果があれば活用）
6. 他の受講生の声（短く紹介）
7. 実践的な情報
8. よくある質問（FAQ）5つ以上
9. まとめ
10. **関連記事セクション**（H2見出しで「関連記事」、2〜3件の内部リンクを含める）
    例: <ul><li><a href="/${categoryName}/yoga-basics">ヨガの基本</a></li></ul>

【禁止フレーズ】
以下の表現は絶対に使用しないでください：
- 「かもしれません」「といえるでしょう」「ではないでしょうか」「と考えられます」
- 文頭の「また、」「そして、」「さらに、」
- 「非常に」「大変」「とても」（具体的な数字で表現すること）

【出力形式】
以下のJSON形式で出力してください：

{
  "title": "記事タイトル（32文字以内、キーワードを含む）",
  "slug": "url-slug-in-romaji",
  "metaTitle": "メタタイトル | ${brandName}",
  "metaDescription": "120〜140文字のディスクリプション",
  "html": "完全なHTML記事本文（<article>タグで囲む）",
  "tagSlugs": ["slug1", "slug2", "slug3"]
}

【HTMLの注意点】
- 見出しはH2、H3を適切に使用
- 画像プレースホルダー: <!-- IMAGE_PLACEHOLDER: cover -->, <!-- IMAGE_PLACEHOLDER: inbody_1 -->, <!-- IMAGE_PLACEHOLDER: inbody_2 -->
- 監修者のコメントは<blockquote>で囲む
- インラインスタイルは使用禁止`;
}

async function generateArticleV5(
  mainVoice: StudentVoice,
  keyword: string,
  supervisor: SupervisorInfo,
  supportingVoices: StudentVoice[],
  conversion: { name: string; url: string },
  categoryName: string,
  brandName: string,
  apiKey: string,
  availableTags: { name: string; slug: string }[],
  settings: PromptSettings,
  webSearchResult: WebSearchResult | null
): Promise<ArticleStructure | null> {
  const baseArticlePrompt = settings.systemPrompt || DEFAULT_ARTICLE_PROMPT;

  const v5Context = buildArticlePromptV5(
    mainVoice,
    keyword,
    supervisor,
    supportingVoices,
    conversion,
    categoryName,
    brandName,
    availableTags,
    webSearchResult
  );

  const prompt = `${baseArticlePrompt}

--- 以下はV5パイプライン固有の追加コンテキストです ---

${v5Context}`;

  const systemPrompt = "あなたは経験豊富なSEOライターです。指示に従ってJSONのみを出力してください。";

  const response = await callOpenRouter<ArticleStructure>(
    systemPrompt,
    prompt,
    {
      apiKey,
      model: "anthropic/claude-sonnet-4",
      maxTokens: 16000,
      temperature: 0.7,
    }
  );

  if (!response.success || !response.data) {
    console.error("[V5] Article generation failed:", response.error);
    return null;
  }

  return response.data;
}

// ========================================
// Step 6: 画像生成（ヨガをする人物）
// ========================================

async function generateImagesV5(
  keyword: string,
  categoryName: string,
  apiKey: string
): Promise<GeneratedImage[]> {
  const images: GeneratedImage[] = [];

  const slots = [
    { slot: "cover" as const, description: "カバー画像" },
    { slot: "inbody_1" as const, description: "本文画像1" },
    { slot: "inbody_2" as const, description: "本文画像2" },
  ];

  for (let i = 0; i < slots.length; i++) {
    const { slot, description } = slots[i];

    // リクエスト間に遅延を追加（OpenRouter APIの安定性向上）
    if (i > 0) {
      console.log(`[V5] Waiting 3 seconds before next image request...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // ヨガ画像プロンプト（人物・テキストなし）
    const prompt = YOGA_IMAGE_PROMPT.replace(
      /\{\{THEME\}\}/g,
      `${keyword} - ${categoryName} - ${description}`
    );

    console.log(`[V5] Generating ${slot} image (yoga person style)`);

    // リトライロジック（最大2回）
    let url: string | null = null;
    for (let retry = 0; retry < 2; retry++) {
      url = await generateImageWithGemini(prompt, apiKey);
      if (url) break;
      if (retry < 1) {
        console.log(`[V5] Retrying image generation for ${slot} after 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    if (url) {
      const asset = await prisma.media_assets.create({
        data: {
          id: randomUUID(),
          url,
          fileName: `v5-${slot}-${Date.now()}.webp`,
          altText: `${keyword} - ${description}`,
          source: MediaSource.AI_GENERATED,
          showInLibrary: true,
        }
      });

      images.push({
        slot,
        url,
        assetId: asset.id,
        alt: `${keyword} - ${description}`,
        width: 1024,
        height: 576,
      });

      console.log(`[V5] Generated image for slot: ${slot}`);
    } else {
      console.log(`[V5] Failed to generate image for slot: ${slot}`);
    }
  }

  return images;
}

// ========================================
// Step 7: LLMo最適化【V5新規】
// ========================================

function buildLlmoPrompt(
  title: string,
  html: string,
  authorName: string,
  customPrompt?: string | null
): string {
  if (customPrompt) {
    return customPrompt
      .replace(/\{\{TITLE\}\}/g, title)
      .replace(/\{\{AUTHOR_NAME\}\}/g, authorName)
      .replace(/\{\{HTML_CONTENT\}\}/g, html.substring(0, 8000));
  }

  return DEFAULT_LLMO_PROMPT
    .replace(/\{\{TITLE\}\}/g, title)
    .replace(/\{\{AUTHOR_NAME\}\}/g, authorName)
    .replace(/\{\{HTML_CONTENT\}\}/g, html.substring(0, 8000));
}

async function optimizeForLlmo(
  article: ArticleStructure,
  authorName: string,
  apiKey: string,
  settings: PromptSettings
): Promise<LlmoOptimization | null> {
  const prompt = buildLlmoPrompt(
    article.title,
    article.html,
    authorName,
    settings.llmoPrompt
  );

  console.log(`[V5] Running LLMo optimization...`);

  const response = await callOpenRouter<LlmoOptimization>(
    "あなたはSEO/LLMo最適化の専門家です。JSONのみを出力してください。",
    prompt,
    {
      apiKey,
      model: "anthropic/claude-sonnet-4",
      maxTokens: 2000,
      temperature: 0.3,
    }
  );

  if (!response.success || !response.data) {
    console.error("[V5] LLMo optimization failed:", response.error);
    return null;
  }

  console.log(`[V5] LLMo optimization completed`);
  return response.data;
}

// ========================================
// 画像挿入
// ========================================

function insertImagesIntoHtml(html: string, images: GeneratedImage[]): string {
  let result = html;

  for (const image of images) {
    const placeholder = `<!-- IMAGE_PLACEHOLDER: ${image.slot} -->`;
    const isCover = image.slot === "cover";

    const imgTag = `<img src="${image.url}" alt="${image.alt}" width="${image.width}" height="${image.height}" loading="${isCover ? 'eager' : 'lazy'}" />`;

    result = result.replace(placeholder, imgTag);
  }

  return result;
}

// ========================================
// メインパイプライン V5
// ========================================

export const generateArticlePipelineV5 = inngest.createFunction(
  {
    id: "generate-article-pipeline-v5",
    name: "Generate Article Pipeline V5 (Web Search + LLMo)",
    retries: 2,
    onFailure: async ({ error, event }) => {
      const jobId = (event.data as { jobId?: string }).jobId;
      console.error(`[Pipeline V5] Failed: ${error.message} Job: ${jobId}`);

      if (jobId) {
        await prisma.generation_jobs.update({
          where: { id: jobId },
          data: {
            status: GenerationJobStatus.FAILED,
            errorMessage: error.message,
          }
        });
      }
    },
  },
  { event: "article/generate-pipeline-v5" },
  async ({ event, step }) => {
    const {
      jobId,
      knowledgeItemId,
      categoryId,
      authorId,
      brandId,
      conversionIds,
      userId
    } = event.data;

    console.log(`[Pipeline V5] Starting job: ${jobId}`);

    // 進捗更新ヘルパー
    const updateProgress = async (stage: number, message: string) => {
      await prisma.generation_jobs.update({
        where: { id: jobId },
        data: {
          progress: V5_STAGE_PROGRESS[stage] || 0,
          currentStage: stage,
          statusMessage: message,
        }
      });
    };

    // ========================================
    // 初期データ取得
    // ========================================
    const pipelineData = await step.run("v5-fetch-pipeline-data", async () => {
      const [settings, category, author, brand, conversions] = await Promise.all([
        getDecryptedSettings(),
        prisma.categories.findUnique({ where: { id: categoryId } }),
        prisma.authors.findUnique({ where: { id: authorId } }),
        prisma.brands.findUnique({ where: { id: brandId } }),
        prisma.conversions.findMany({
          where: conversionIds?.length ? { id: { in: conversionIds } } : undefined,
          take: 1
        }),
      ]);

      const existingJobs = await prisma.generation_jobs.findMany({
        where: { status: "COMPLETED" },
        select: { keyword: true }
      });
      const existingKeywords = existingJobs.map(j => j.keyword).filter(Boolean) as string[];

      const supportingVoices = await prisma.knowledge_items.findMany({
        where: { type: "STUDENT_VOICE" },
        take: 3,
        orderBy: { createdAt: "desc" }
      });

      const tags = await prisma.tags.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" }
      });

      return {
        settings: settings as DecryptedSettings & PromptSettings,
        category,
        author,
        brand,
        conversions,
        existingKeywords,
        supportingVoices: supportingVoices.map(v => ({
          id: v.id,
          title: v.title,
          content: v.content
        })),
        tags,
      };
    });

    if (!pipelineData.settings?.openRouterApiKey) {
      throw new Error("OpenRouter API key not configured");
    }
    if (!pipelineData.settings?.dataforSeoApiKey) {
      throw new Error("DataForSEO API key not configured");
    }

    // ========================================
    // Step 1: 受講生の声を選択
    // ========================================
    await step.run("v5-update-step-1", async () => {
      await updateProgress(1, "受講生の声を選択中...");
    });

    const mainVoice = await step.run("v5-select-student-voice", async () => {
      const voice = await selectStudentVoice(knowledgeItemId);
      if (!voice) {
        throw new Error("No available student voice found");
      }
      console.log(`[V5] Selected voice: ${voice.title}`);
      return voice;
    });

    // ========================================
    // Step 2: テーマ・キーワード候補抽出
    // ========================================
    await step.run("v5-update-step-2", async () => {
      await updateProgress(2, "テーマとキーワードを分析中...");
    });

    const themeAnalysis = await step.run("v5-analyze-theme", async () => {
      const analysis = await analyzeThemeAndKeywords(
        mainVoice,
        pipelineData.settings!.openRouterApiKey!,
        pipelineData.settings!
      );
      if (!analysis) {
        throw new Error("Theme analysis failed");
      }
      console.log(`[V5] Themes: ${analysis.mainThemes.join(", ")}`);
      return analysis;
    });

    // ========================================
    // Step 3: キーワード選定
    // ========================================
    await step.run("v5-update-step-3", async () => {
      await updateProgress(3, "最適なキーワードを選択中...");
    });

    const selectedKeyword = await step.run("v5-filter-keywords", async () => {
      const keyword = await filterAndSelectKeyword(
        themeAnalysis.keywordCandidates,
        pipelineData.settings!.dataforSeoApiKey!,
        pipelineData.existingKeywords
      );
      if (!keyword) {
        throw new Error("Keyword selection failed");
      }

      await prisma.generation_jobs.update({
        where: { id: jobId },
        data: { keyword: keyword.keyword }
      });

      return keyword;
    });

    // ========================================
    // Step 4: Web検索【V5新規】
    // ========================================
    await step.run("v5-update-step-4", async () => {
      await updateProgress(4, "最新データをWeb検索中...");
    });

    const webSearchResult = await step.run("v5-web-search", async () => {
      return await searchWebForLatestData(
        selectedKeyword.keyword,
        pipelineData.settings!.openRouterApiKey!,
        pipelineData.settings!
      );
    });

    // ========================================
    // Step 5: 記事生成
    // ========================================
    await step.run("v5-update-step-5", async () => {
      await updateProgress(5, "記事を執筆中...");
    });

    const article = await step.run("v5-generate-article", async () => {
      const supervisor: SupervisorInfo = {
        id: pipelineData.author!.id,
        name: pipelineData.author!.name,
        profile: pipelineData.author!.bio || "",
        role: pipelineData.author!.role || "",
        careerStartYear: pipelineData.author!.careerStartYear || undefined,
        teachingStartYear: pipelineData.author!.teachingStartYear || undefined,
        totalStudentsTaught: pipelineData.author!.totalStudentsTaught || undefined,
        graduatesCount: pipelineData.author!.graduatesCount || undefined,
        weeklyLessons: pipelineData.author!.weeklyLessons || undefined,
        certifications: pipelineData.author!.certifications as unknown as SupervisorInfo["certifications"],
        episodes: pipelineData.author!.episodes as unknown as SupervisorInfo["episodes"],
        signaturePhrases: pipelineData.author!.signaturePhrases as string[],
        specialties: pipelineData.author!.specialties as string[],
        writingStyle: pipelineData.author!.writingStyle as SupervisorInfo["writingStyle"],
        philosophy: pipelineData.author!.philosophy || undefined,
        avoidWords: pipelineData.author!.avoidWords as string[],
        targetAudience: pipelineData.author!.targetAudience || undefined,
        teachingApproach: pipelineData.author!.teachingApproach || undefined,
      };

      const conversion = pipelineData.conversions[0] || { name: "無料体験", url: "#" };

      const result = await generateArticleV5(
        mainVoice,
        selectedKeyword.keyword,
        supervisor,
        pipelineData.supportingVoices.filter(v => v.id !== mainVoice.id).slice(0, 2),
        { name: conversion.name, url: conversion.url || "#" },
        pipelineData.category!.name,
        pipelineData.brand!.name,
        pipelineData.settings!.openRouterApiKey!,
        pipelineData.tags,
        pipelineData.settings!,
        webSearchResult
      );

      if (!result) {
        throw new Error("Article generation failed");
      }

      return result;
    });

    // ========================================
    // Step 5.5: HTML後処理（100点品質改善）
    // ========================================
    const processedArticle = await step.run("v5-post-process-html", async () => {
      let html = article.html;
      const originalLength = html.length;

      // AIが生成したHTMLをクリーンアップ（DOCTYPE, head, bodyなどを除去 + スタイル統一）
      html = cleanGeneratedHtml(html);
      console.log(`[V5] HTML cleaned: ${originalLength} -> ${html.length} chars`);

      // CTAバナーを挿入（conversionsがある場合）
      const ctaConversion = pipelineData.conversions[0];
      if (ctaConversion) {
        html = insertCTABanner(html, {
          name: ctaConversion.name,
          url: ctaConversion.url,
          thumbnailUrl: ctaConversion.thumbnailUrl,
          context: ctaConversion.context,
        });
        console.log(`[V5] CTA banner inserted: ${ctaConversion.name}`);
      }

      // 内部リンクが無い場合、関連記事セクションを自動挿入
      html = insertRelatedArticles(html, pipelineData.category!.slug);

      // blockquote監修者引用がない場合、自動挿入
      html = insertSupervisorQuote(html, {
        name: pipelineData.author!.name,
        role: pipelineData.author!.role,
      });

      // 表のHTML修正（壊れた構造を修正 + スタイル統一）
      html = fixTableHtml(html);

      // FAQのスタイル改善
      html = improveFaqStyle(html);

      console.log(`[V5] HTML post-processing completed`);

      return {
        ...article,
        html,
      };
    });

    // ========================================
    // Step 6: 画像生成
    // ========================================
    await step.run("v5-update-step-6", async () => {
      await updateProgress(6, "ヨガをする人物の画像を生成中...");
    });

    const images = await step.run("v5-generate-images", async () => {
      return await generateImagesV5(
        selectedKeyword.keyword,
        pipelineData.category!.name,
        pipelineData.settings!.openRouterApiKey!
      );
    });

    // 画像挿入（後処理済みHTMLを使用）
    const htmlWithImages = await step.run("v5-insert-images", async () => {
      return insertImagesIntoHtml(processedArticle.html, images);
    });

    // ========================================
    // Step 7: LLMo最適化【V5新規】
    // ========================================
    await step.run("v5-update-step-7", async () => {
      await updateProgress(7, "LLMo最適化を適用中...");
    });

    const llmoData = await step.run("v5-llmo-optimization", async () => {
      return await optimizeForLlmo(
        { ...processedArticle, html: htmlWithImages },
        pipelineData.author!.name,
        pipelineData.settings!.openRouterApiKey!,
        pipelineData.settings!
      );
    });

    // ========================================
    // Step 8: 下書き保存
    // ========================================
    await step.run("v5-update-step-8", async () => {
      await updateProgress(8, "下書きを保存中...");
    });

    const savedArticle = await step.run("v5-save-draft", async () => {
      let finalSlug = processedArticle.slug;
      const existingSlug = await prisma.articles.findFirst({
        where: { slug: finalSlug }
      });
      if (existingSlug) {
        finalSlug = `${processedArticle.slug}-${randomUUID().substring(0, 8)}`;
        console.log(`[V5] Slug conflict. Using: ${finalSlug}`);
      }

      const coverImage = images.find(img => img.slot === "cover");
      const inbodyImages = images.filter(img => img.slot !== "cover");

      // 記事を保存（LLMoデータ含む）
      const newArticle = await prisma.articles.create({
        data: {
          id: randomUUID(),
          title: processedArticle.title,
          slug: finalSlug,
          status: ArticleStatus.DRAFT,
          metaTitle: processedArticle.metaTitle,
          metaDescription: processedArticle.metaDescription,
          ogpImageUrl: coverImage?.url,
          blocks: [{
            id: randomUUID(),
            type: "html",
            content: htmlWithImages,
          }],
          // LLMo最適化データを保存
          llmoShortSummary: llmoData?.llmoShortSummary || null,
          llmoKeyTakeaways: llmoData?.llmoKeyTakeaways || [],
          schemaJsonLd: llmoData?.schemaJsonLd
            ? (llmoData.schemaJsonLd as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          categoryId,
          authorId,
          brandId,
          generationJobId: jobId,
          createdById: userId,
          thumbnailId: coverImage?.assetId,
          version: 1,
        }
      });

      // 本文中の画像を保存
      for (let i = 0; i < inbodyImages.length; i++) {
        const image = inbodyImages[i];
        const articleImageType = i === 0
          ? ArticleImageType.INSERTED_1
          : ArticleImageType.INSERTED_2;

        await prisma.article_images.create({
          data: {
            id: randomUUID(),
            articleId: newArticle.id,
            mediaAssetId: image.assetId,
            type: articleImageType,
            position: i + 1,
          }
        });
      }

      // 受講生の声を紐付け
      await prisma.article_knowledge_items.create({
        data: {
          articleId: newArticle.id,
          knowledgeItemId: mainVoice.id,
        }
      });

      await prisma.knowledge_items.update({
        where: { id: mainVoice.id },
        data: { usageCount: { increment: 1 } }
      });

      // タグを紐付け
      if (processedArticle.tagSlugs && processedArticle.tagSlugs.length > 0) {
        const matchedTags = pipelineData.tags.filter(t =>
          processedArticle.tagSlugs.includes(t.slug)
        );

        for (const tag of matchedTags) {
          await prisma.article_tags.create({
            data: {
              articleId: newArticle.id,
              tagId: tag.id,
            }
          });
        }

        console.log(`[V5] Attached ${matchedTags.length} tags`);
      }

      // カテゴリの記事数を更新
      await prisma.categories.update({
        where: { id: categoryId },
        data: { articlesCount: { increment: 1 } }
      });

      return newArticle;
    });

    // ========================================
    // 完了
    // ========================================
    await step.run("v5-complete-job", async () => {
      await prisma.generation_jobs.update({
        where: { id: jobId },
        data: {
          status: GenerationJobStatus.COMPLETED,
          progress: 100,
          statusMessage: "完了",
          completedAt: new Date(),
          stageOutputs: {
            mainVoiceId: mainVoice.id,
            themes: themeAnalysis.mainThemes,
            selectedKeyword: selectedKeyword,
            webSearchSources: webSearchResult?.sources?.length || 0,
            llmoOptimized: !!llmoData,
            articleId: savedArticle.id,
            imagesGenerated: images.length,
          } as unknown as Prisma.InputJsonValue,
        }
      });
    });

    console.log(`[Pipeline V5] Completed! Article: ${savedArticle.id}`);

    return {
      success: true,
      articleId: savedArticle.id,
      keyword: selectedKeyword.keyword,
      title: processedArticle.title,
      llmoOptimized: !!llmoData,
    };
  }
);
