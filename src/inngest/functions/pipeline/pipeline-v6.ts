// V6パイプライン: 体験談深掘り + 監修者コメント強化 + 自然なスクール紹介
// 設計書: docs/article-generation-v6-design.md
//
// 特徴:
// - 複数の受講生の声（2-3件）
// - 監修者コメントを複数箇所に配置
// - 体験談を深掘りした自然な記事構成
// - 8,000-10,000文字目標
// - 押し売り感のないスクール紹介

import { inngest } from "../../client";
import prisma from "@/lib/prisma";
import { ArticleStatus, GenerationJobStatus, MediaSource, ArticleImageType, Prisma, ImageStyle } from "@prisma/client";
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
  cleanGeneratedHtml,
  insertCTABanner,
  insertNaturalCTA,
  insertRelatedArticles,
  fixTableHtml,
  improveFaqStyle,
} from "./common/prompts";

// ========================================
// V6専用の型定義
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

// 監修者コンテキスト（V6強化版）
interface SupervisorContext {
  name: string;
  role: string;
  qualifications: string[];
  bio: string;
  imageUrl?: string;
  philosophy?: string;
  teachingApproach?: string;
  signaturePhrases?: string[];
  avoidWords?: string[];
  // 新規追加フィールド
  careerStartYear?: number;      // ヨガ・フィットネス開始年
  teachingStartYear?: number;    // 指導開始年
  totalStudentsTaught?: number;  // これまでの指導人数
  graduatesCount?: number;       // インストラクター養成講座卒業生数
  weeklyLessons?: number;        // 現在の週あたりレッスン本数
  certifications?: Array<{name: string; year?: number; location?: string}>;
  episodes?: Array<{type: string; title: string; content: string}>;
  specialties?: string[];        // 専門分野
  writingStyle?: string;         // "formal", "casual", "professional"
  targetAudience?: string;       // 主な指導対象
  influences?: string[];         // 影響を受けた人物・思想
}

interface ArticleStructure {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  html: string;
  tagSlugs: string[];
  // LLMO (Large Language Model Optimization) fields
  llmoShortSummary: string;      // AI検索で引用されやすい2-3文の要約
  llmoKeyTakeaways: string[];    // 5つの重要ポイント（箇条書き）
  faqItems: FaqItem[];           // FAQ項目（構造化データ生成用）
}

interface FaqItem {
  question: string;
  answer: string;
}

// プロンプト設定
interface PromptSettings {
  keywordPrompt: string | null;
  systemPrompt: string | null;
  imagePrompt: string | null;
}

// 画像生成モデル
const IMAGE_MODEL = STAGE_MODEL_CONFIG.image_generation.model;

// V6進捗ステージ
const V6_STAGE_PROGRESS: Record<number, number> = {
  1: 5,   // 複数の受講生の声を取得
  2: 15,  // 監修者コンテキスト取得
  3: 25,  // テーマ分析
  4: 35,  // キーワード選定
  5: 60,  // 記事生成（メイン）
  6: 80,  // 画像生成
  7: 100, // 保存
};

// ========================================
// ユーティリティ関数
// ========================================

/**
 * Schema.org Article + FAQ 構造化データを生成
 * Google リッチスニペット、AI検索最適化用
 */
function generateSchemaJsonLd(
  article: ArticleStructure,
  supervisor: SupervisorContext,
  brandName: string,
  brandUrl: string,
  coverImageUrl?: string
): Record<string, unknown> {
  const now = new Date().toISOString();

  // メインのArticleスキーマ
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.metaDescription,
    "image": coverImageUrl || undefined,
    "author": {
      "@type": "Person",
      "name": supervisor.name,
      "jobTitle": supervisor.role,
      "description": supervisor.bio,
    },
    "publisher": {
      "@type": "Organization",
      "name": brandName,
      "url": brandUrl,
    },
    "datePublished": now,
    "dateModified": now,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${brandUrl}/articles/${article.slug}`,
    },
    // LLMO最適化: AI検索向けの要約
    "abstract": article.llmoShortSummary,
  };

  // FAQスキーマ（Google FAQ リッチスニペット用）
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": article.faqItems.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };

  // HowToスキーマ（ハウツー系記事向け）- タイトルに「方法」「やり方」が含まれる場合
  const isHowTo = /方法|やり方|始め方|コツ|ポイント/.test(article.title);

  // 複数のスキーマを@graphで結合
  return {
    "@context": "https://schema.org",
    "@graph": [
      articleSchema,
      faqSchema,
      // BreadcrumbListスキーマ
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "ホーム",
            "item": brandUrl,
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "記事一覧",
            "item": `${brandUrl}/articles`,
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": article.title,
          },
        ],
      },
    ],
  };
}

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
    const shortPrompt = prompt.length > 400 ? prompt.substring(0, 400) : prompt;

    console.log(`[V6] Generating image with model: ${IMAGE_MODEL}`);
    console.log(`[V6] Prompt length: ${shortPrompt.length} chars`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const requestBody = {
      model: IMAGE_MODEL,
      messages: [{ role: "user", content: shortPrompt }],
      modalities: ["image", "text"],
    };

    console.log(`[V6] Request body size: ${JSON.stringify(requestBody).length} chars`);

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
      console.error(`[V6] Image generation error: ${response.status}`);
      console.error(`[V6] Error details: ${errorText.substring(0, 500)}`);
      return null;
    }

    const data = await response.json();

    const message = data.choices?.[0]?.message;
    if (!message) {
      console.error("[V6] No message in response");
      return null;
    }

    const extractBase64 = async (dataUrl: string): Promise<string | null> => {
      const base64Match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
      if (base64Match) {
        const imageBuffer = Buffer.from(base64Match[2], "base64");
        const fittedBuffer = await fitTo16by9(imageBuffer);
        const filePath = `generated/${Date.now()}-${randomUUID()}.webp`;
        const { url } = await uploadImage("MEDIA", filePath, fittedBuffer, "image/webp");
        console.log(`[V6] Image uploaded: ${url}`);
        return url;
      }
      return null;
    };

    if (message.images?.[0]?.image_url?.url) {
      return await extractBase64(message.images[0].image_url.url);
    }
    if (typeof message.content === "string" && message.content.startsWith("data:image")) {
      return await extractBase64(message.content);
    }
    if (Array.isArray(message.content)) {
      for (const part of message.content) {
        if (part.type === "image_url" && part.image_url?.url?.startsWith("data:image")) {
          return await extractBase64(part.image_url.url);
        }
      }
    }

    console.error("[V6] No image found in response");
    return null;
  } catch (error) {
    console.error("[V6] Image generation failed:", error);
    return null;
  }
}

// ========================================
// Step 1: 複数の受講生の声を取得（適合度+使用頻度バランス）
// ========================================

interface AuthorContext {
  specialties?: string[];
  categories?: string[];
  tags?: string[];
  targetAudience?: string[];
  philosophy?: string;
}

// 適合度スコアを計算（監修者の専門分野と受講生の声の内容のマッチング）
function calculateRelevanceScore(
  voiceContent: string,
  authorContext: AuthorContext
): number {
  let score = 0;
  const contentLower = voiceContent.toLowerCase();

  // 専門分野とのマッチング（各マッチ +3点）
  const specialties = authorContext.specialties || [];
  for (const specialty of specialties) {
    if (contentLower.includes(specialty.toLowerCase())) {
      score += 3;
    }
  }

  // カテゴリとのマッチング（各マッチ +2点）
  const categories = authorContext.categories || [];
  for (const category of categories) {
    if (contentLower.includes(category.toLowerCase())) {
      score += 2;
    }
  }

  // タグとのマッチング（各マッチ +1点）
  const tags = authorContext.tags || [];
  for (const tag of tags) {
    if (contentLower.includes(tag.toLowerCase())) {
      score += 1;
    }
  }

  // 対象者とのマッチング（各マッチ +2点）
  const targetAudience = authorContext.targetAudience || [];
  for (const target of targetAudience) {
    if (contentLower.includes(target.toLowerCase())) {
      score += 2;
    }
  }

  // 共通キーワードのマッチング
  const yogaKeywords = ["初心者", "体験", "資格", "オンライン", "変化", "成長", "継続"];
  for (const keyword of yogaKeywords) {
    if (contentLower.includes(keyword)) {
      score += 0.5;
    }
  }

  return score;
}

// 使用頻度スコアを計算（使用回数が少ないほど高スコア）
function calculateFreshnessScore(usageCount: number, maxUsage: number): number {
  if (maxUsage === 0) return 10;
  // 使用回数0 → 10点、最大使用回数 → 0点
  return Math.max(0, 10 - (usageCount / maxUsage) * 10);
}

async function collectMultipleTestimonials(
  mainKnowledgeId?: string,
  _categoryId?: string,  // 将来の機能拡張用
  authorId?: string
): Promise<StudentVoice[]> {
  const voices: StudentVoice[] = [];

  // 監修者情報を取得（適合度計算用）
  let authorContext: AuthorContext = {};
  if (authorId) {
    const author = await prisma.authors.findUnique({
      where: { id: authorId }
    });
    if (author) {
      // Json?型フィールドを配列に変換
      const parseJsonArray = (val: unknown): string[] => {
        if (Array.isArray(val)) return val as string[];
        return [];
      };
      authorContext = {
        specialties: parseJsonArray(author.specialties),
        categories: parseJsonArray(author.categories),
        tags: parseJsonArray(author.tags),
        targetAudience: author.targetAudience ? [author.targetAudience] : [],
        philosophy: author.philosophy || "",
      };
    }
  }

  // メインの声を取得（指定されている場合）
  if (mainKnowledgeId) {
    const mainVoice = await prisma.knowledge_items.findUnique({
      where: { id: mainKnowledgeId }
    });
    if (mainVoice) {
      voices.push({ id: mainVoice.id, title: mainVoice.title, content: mainVoice.content });
    }
  }

  // 全ての受講生の声を取得
  const allVoices = await prisma.knowledge_items.findMany({
    where: {
      type: "STUDENT_VOICE",
      id: voices.length > 0 ? { notIn: voices.map(v => v.id) } : undefined
    }
  });

  if (allVoices.length === 0 && voices.length === 0) {
    return [];
  }

  // 最大使用回数を取得
  const maxUsage = Math.max(...allVoices.map(v => v.usageCount || 0), 1);

  // 各声にスコアを計算
  const scoredVoices = allVoices.map(voice => {
    const relevanceScore = calculateRelevanceScore(voice.content, authorContext);
    const freshnessScore = calculateFreshnessScore(voice.usageCount || 0, maxUsage);

    // 総合スコア: 適合度60% + 使用頻度40%
    const totalScore = relevanceScore * 0.6 + freshnessScore * 0.4;

    return {
      id: voice.id,
      title: voice.title,
      content: voice.content,
      usageCount: voice.usageCount || 0,
      relevanceScore,
      freshnessScore,
      totalScore
    };
  });

  // スコア順にソート
  scoredVoices.sort((a, b) => b.totalScore - a.totalScore);

  // メインがない場合、最高スコアの声を選択
  if (voices.length === 0 && scoredVoices.length > 0) {
    const best = scoredVoices[0];
    voices.push({ id: best.id, title: best.title, content: best.content });
    console.log(`[V6] Main voice selected: "${best.title}" (relevance: ${best.relevanceScore.toFixed(1)}, freshness: ${best.freshnessScore.toFixed(1)}, usage: ${best.usageCount})`);
    scoredVoices.shift();
  }

  // 追加の声を2件取得（スコア上位から）
  const additionalCount = Math.min(2, scoredVoices.length);
  for (let i = 0; i < additionalCount; i++) {
    const voice = scoredVoices[i];
    voices.push({ id: voice.id, title: voice.title, content: voice.content });
    console.log(`[V6] Additional voice ${i + 1}: "${voice.title}" (relevance: ${voice.relevanceScore.toFixed(1)}, freshness: ${voice.freshnessScore.toFixed(1)}, usage: ${voice.usageCount})`);
  }

  console.log(`[V6] Collected ${voices.length} testimonials with balanced selection`);
  return voices;
}

// ========================================
// Step 2: 監修者コンテキスト取得
// ========================================

async function getSupervisorContext(authorId: string): Promise<SupervisorContext | null> {
  const author = await prisma.authors.findUnique({
    where: { id: authorId }
  });

  if (!author) return null;

  return {
    name: author.name,
    role: author.role || "",
    qualifications: (author.qualifications as string[]) || [],
    bio: author.bio || "",
    imageUrl: author.imageUrl || undefined,
    philosophy: author.philosophy || undefined,
    teachingApproach: author.teachingApproach || undefined,
    signaturePhrases: (author.signaturePhrases as string[]) || [],
    avoidWords: (author.avoidWords as string[]) || [],
    // 新規追加フィールド
    careerStartYear: author.careerStartYear || undefined,
    teachingStartYear: author.teachingStartYear || undefined,
    totalStudentsTaught: author.totalStudentsTaught || undefined,
    graduatesCount: author.graduatesCount || undefined,
    weeklyLessons: author.weeklyLessons || undefined,
    certifications: (author.certifications as Array<{name: string; year?: number; location?: string}>) || undefined,
    episodes: (author.episodes as Array<{type: string; title: string; content: string}>) || undefined,
    specialties: (author.specialties as string[]) || undefined,
    writingStyle: author.writingStyle || undefined,
    targetAudience: author.targetAudience || undefined,
    influences: (author.influences as string[]) || undefined,
  };
}

// ========================================
// Step 3: テーマ・キーワード候補抽出
// ========================================

async function analyzeThemeAndKeywords(
  mainVoice: StudentVoice,
  apiKey: string,
  settings: PromptSettings
): Promise<ThemeAnalysis | null> {
  const basePrompt = settings.keywordPrompt || DEFAULT_KEYWORD_ANALYSIS_PROMPT;

  const prompt = `${basePrompt}

【分析対象: 受講生の体験談】
${mainVoice.content}

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
    console.error("[V6] Theme analysis failed:", response.error);
    return null;
  }

  return response.data;
}

// ========================================
// Step 4: キーワードフィルタリング
// ========================================

async function filterAndSelectKeyword(
  candidates: ThemeKeywordCandidate[],
  dataforSeoApiKey: string,
  existingKeywords: string[]
): Promise<SelectedKeyword | null> {
  const client = new DataForSEOClient(dataforSeoApiKey);
  const keywords = candidates.map(c => c.keyword);

  console.log(`[V6] Fetching volume for ${keywords.length} keywords...`);

  let keywordData;
  try {
    keywordData = await client.getKeywordData({ keywords });
  } catch (error) {
    console.error("[V6] DataForSEO error:", error);
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
    console.log("[V6] All keywords already used, using first candidate");
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
  console.log(`[V6] Selected keyword: "${selected.keyword}" (volume: ${selected.volume})`);

  return {
    keyword: selected.keyword,
    volume: selected.volume,
    competition: selected.competition,
    score: selected.score,
  };
}

// ========================================
// Step 5: V6記事生成プロンプト（体験談深掘り）
// ========================================

function buildV6ArticlePrompt(
  testimonials: StudentVoice[],
  keyword: string,
  supervisor: SupervisorContext,
  conversion: { name: string; url: string },
  categoryName: string,
  brandName: string,
  availableTags: { name: string; slug: string }[],
  existingTitles: string[] | undefined,
  customSystemPrompt: string | null
): string {
  const mainTestimonial = testimonials[0];
  const additionalTestimonials = testimonials.slice(1);

  // 監修者フレーズ
  const supervisorPhrases = supervisor.signaturePhrases?.join("」「") || "";
  const avoidWords = supervisor.avoidWords?.join("、") || "";

  // 監修者の拡張情報を動的に構築
  const supervisorExtendedInfo: string[] = [];

  // 経験年数（計算可能な場合）
  const currentYear = new Date().getFullYear();
  if (supervisor.careerStartYear) {
    const yearsInYoga = currentYear - supervisor.careerStartYear;
    supervisorExtendedInfo.push(`ヨガ歴: ${yearsInYoga}年（${supervisor.careerStartYear}年開始）`);
  }
  if (supervisor.teachingStartYear) {
    const teachingYears = currentYear - supervisor.teachingStartYear;
    supervisorExtendedInfo.push(`指導歴: ${teachingYears}年（${supervisor.teachingStartYear}年開始）`);
  }

  // 実績（数値がある場合）
  if (supervisor.totalStudentsTaught) {
    supervisorExtendedInfo.push(`指導人数: ${supervisor.totalStudentsTaught.toLocaleString()}人以上`);
  }
  if (supervisor.graduatesCount) {
    supervisorExtendedInfo.push(`インストラクター養成実績: ${supervisor.graduatesCount}名`);
  }
  if (supervisor.weeklyLessons) {
    supervisorExtendedInfo.push(`現在の週間レッスン数: ${supervisor.weeklyLessons}本`);
  }

  // 資格（ある場合）
  if (supervisor.certifications && supervisor.certifications.length > 0) {
    const certList = supervisor.certifications.map(c => c.name).join("、");
    supervisorExtendedInfo.push(`保有資格: ${certList}`);
  }

  // 専門分野
  if (supervisor.specialties && supervisor.specialties.length > 0) {
    supervisorExtendedInfo.push(`専門分野: ${supervisor.specialties.join("、")}`);
  }

  // 主な指導対象
  if (supervisor.targetAudience) {
    supervisorExtendedInfo.push(`主な指導対象: ${supervisor.targetAudience}`);
  }

  // 影響を受けた人物・思想
  if (supervisor.influences && supervisor.influences.length > 0) {
    supervisorExtendedInfo.push(`影響を受けた人物・思想: ${supervisor.influences.join("、")}`);
  }

  // 執筆スタイル
  const writingStyleMap: Record<string, string> = {
    formal: "フォーマル（丁寧語中心）",
    casual: "カジュアル（親しみやすい口調）",
    professional: "プロフェッショナル（専門家としての語り口）"
  };
  if (supervisor.writingStyle && writingStyleMap[supervisor.writingStyle]) {
    supervisorExtendedInfo.push(`執筆トーン: ${writingStyleMap[supervisor.writingStyle]}`);
  }

  const supervisorExtendedText = supervisorExtendedInfo.length > 0
    ? supervisorExtendedInfo.join("\n")
    : "";

  // エピソードを文字列化（最大3つまで）
  const supervisorEpisodesText = supervisor.episodes && supervisor.episodes.length > 0
    ? supervisor.episodes.slice(0, 3).map(ep => `【${ep.type}】${ep.title}\n${ep.content}`).join("\n\n")
    : "";

  // 追加の体験談テキスト
  const additionalTestimonialsText = additionalTestimonials.map((t, i) =>
    `【受講生${i + 2}の体験】\n${t.content}`
  ).join("\n\n");

  return `あなたはプロのライター・編集者です。
「読者の心を動かし、行動を促す記事」を書いてください。

══════════════════════════════════════════════════════════════════
【このプロンプトの目的】
══════════════════════════════════════════════════════════════════

以下の体験談を「深掘り」して、読者が「私もやってみたい」と思う記事を作成します。
単なる引用の羅列ではなく、体験者の人物像・感情・変化を立体的に描写してください。

【文字数目標】8,000〜10,000文字（HTML込み）

══════════════════════════════════════════════════════════════════
【メインの体験談】
══════════════════════════════════════════════════════════════════

${mainTestimonial.content}

══════════════════════════════════════════════════════════════════
【追加の体験談】
══════════════════════════════════════════════════════════════════

${additionalTestimonialsText || "（追加の体験談なし）"}

══════════════════════════════════════════════════════════════════
【体験談の深掘り方：具体的な指示】
══════════════════════════════════════════════════════════════════

体験談を引用するだけでなく、以下の要素を推測・補完して「人物像」を描いてください：

■ 人物像を明確に（推測でOK）
- 年代（20代後半、30代前半など）
- 生活環境（都内在住OL、地方在住ママなど）
- 性格・タイプ（完璧主義、慎重派など）

■ 具体的な数字・期間を入れる
✗ 悪い例：「しばらく悩んでいた」
✓ 良い例：「3ヶ月ほど、毎晩ネットで調べては閉じてを繰り返していた」

■ 感情の変化を描く
✗ 悪い例：「最初は不安でしたが、だんだん慣れてきました」
✓ 良い例：「初回のZoomセッション、カメラの前で固まった。『私のダウンドッグ、こんなに膝曲がってる？』恥ずかしさで顔が熱くなった。でも3週目には『今日は少し伸びたかも』と思える瞬間があった」

■ 「壁」と「乗り越え方」を具体的に
- どんな壁にぶつかったのか（時間がない、体が硬い、挫折しかけた等）
- どう乗り越えたのか（講師の一言、仲間の存在、小さな成功体験等）

══════════════════════════════════════════════════════════════════
【監修者情報】
══════════════════════════════════════════════════════════════════

■ 基本情報
名前: ${supervisor.name}
役職: ${supervisor.role}
プロフィール: ${supervisor.bio}

■ 指導方針
指導理念: ${supervisor.philosophy || "（未設定）"}
指導スタイル: ${supervisor.teachingApproach || "（未設定）"}

■ 経歴・実績
${supervisorExtendedText || "（詳細情報なし）"}

■ 表現スタイル
よく使うフレーズ: 「${supervisorPhrases}」
避ける言葉: ${avoidWords || "（特になし）"}

${supervisorEpisodesText ? `■ 監修者のエピソード（記事内で自然に活用してください）\n${supervisorEpisodesText}` : ""}
══════════════════════════════════════════════════════════════════
【監修者コメントの書き方：超重要】
══════════════════════════════════════════════════════════════════

監修者コメントは「誰でも言えること」を言わせてはダメです。

■ ダメな例（一般論・空虚）
「ピラティス経験者がヨガに興味を持つケースはよくあります」
「完璧を求めすぎないことが大切です」

■ 良い例（具体的・専門的・独自の視点）
「私のクラスにも、ピラティス歴5年の方がいました。最初は『呼吸が浅い』と悩んでいたんです。ピラティスの腹式呼吸とヨガの完全呼吸は似ているようで違う。でも、彼女は2ヶ月で『体幹の使い方がわかってきた』と言い始めた。ピラティスで培った体幹意識が、ヨガのアーサナを安定させる土台になったんです」

■ 監修者コメントに必ず含めるもの
1. 具体的なエピソード（「私の生徒で〇〇さんは...」）
2. 専門用語の適切な使用（アーサナ、プラナヤマ、バンダなど）
3. 監修者ならではの視点・気づき

■ コメントの配置（2〜3箇所）
- 体験談セクション：受講生の体験への専門家としての補足
- 実践セクション：プロとしての具体的アドバイス
- まとめ：読者への励ましと次の一歩

【監修者コメントのHTML形式】
<blockquote class="supervisor-comment">
  <div class="comment-header">
    <span class="supervisor-name">${supervisor.name}</span>
    <span class="supervisor-role">${supervisor.role}</span>
  </div>
  <p>コメント内容（150〜250文字）</p>
</blockquote>

══════════════════════════════════════════════════════════════════
【絶対禁止：AI文体】
══════════════════════════════════════════════════════════════════

以下のパターンは「AIっぽい」ので絶対禁止：

■ 禁止フレーズ
- 「〜一方、」「〜重視します」「〜といえます」「〜ではないでしょうか」
- 「非常に」「大変」「とても」（数字で表現せよ）
- 「〜かもしれません」「〜と考えられます」
- 文頭の「また、」「そして、」「さらに、」「加えて、」

■ 禁止パターン
- 教科書的な説明（「〇〇とは、〜です」で始まる段落）
- 箇条書きの乱用（特に「ポイント」「メリット」の羅列）
- 「読者の皆様」「あなた」の過剰使用

■ 人間らしい文体の例
✗「ヨガとピラティスは、どちらも身体を動かすエクササイズですが、アプローチが異なります」
✓「ピラティスは"鍛える"。ヨガは"ほぐす"。私はずっと鍛えることしか知らなかった」

✗「オンライン講座は時間と場所の制約がないため、忙しい方におすすめです」
✓「朝6時、子どもが起きる前の1時間。これが私のヨガ時間になった」

══════════════════════════════════════════════════════════════════
【受講生・体験者の発言スタイル：最重要】
══════════════════════════════════════════════════════════════════

「」で囲まれた発言・セリフは、**必ず左ボーダー付きスタイル**で視覚的に区別すること。
通常の<p>タグで発言を書くのは禁止！

■ 正しい書き方（左ボーダー付き）

単独の発言：
<p style="margin:20px 0;padding-left:20px;border-left:3px solid #ccc;color:#333;">「毎日10分のヨガで、肩こりがかなり楽になりました」と田中さん（30代・会社員）は話します。</p>

複数の声を並べる場合：
<ul style="list-style:none;margin:20px 0;padding:0;">
  <li style="margin:12px 0;padding-left:16px;border-left:3px solid #999;color:#333;">「最初は体が硬くて不安でした」（40代・主婦）</li>
  <li style="margin:12px 0;padding-left:16px;border-left:3px solid #999;color:#333;">「3ヶ月で姿勢が変わった実感があります」（30代・デスクワーク）</li>
</ul>

■ 絶対ダメな例

❌ 以下のように通常の<p>で発言を書くのは禁止：
<p style="margin-bottom:20px;color:#333;">「ヨガを始めてよかった」と田中さんは話す。</p>

↑ 発言なのに左ボーダーがない＝読者が発言だと認識しにくい＝NG！

■ なぜ左ボーダーが必要か
- 読者がスクロールしながら「誰かの声」と一目で認識できる
- 体験談の信頼性・臨場感がアップする
- 他のメディアとの差別化

══════════════════════════════════════════════════════════════════
【記事構成】
══════════════════════════════════════════════════════════════════

1. 導入（300〜400文字）
   - 読者の「心の声」を代弁する
   - 例：「『体硬いし、ヨガなんて無理』そう思っていませんか？」

2. 体験談の深掘り（2,500〜3,500文字）
   - 人物像を立体的に描く
   - Before（受講前の状況・悩み）
   - During（受講中の体験・壁・気づき）
   - After（変化・成果・今の気持ち）
   - 【監修者コメント①】

3. 他の受講生の声（800〜1,200文字）
   - 異なる視点・属性の体験を紹介
   - 「地方在住」「子育て中」など多様性を示す
   - メイン体験談との共通点を見つける

4. 実践情報（1,200〜1,500文字）
   - 具体的なステップ（3〜5ステップ）
   - よくある失敗と対策
   - 【監修者コメント②】

5. スクール紹介（400〜600文字）
   - 「〇〇さんが学んだシークエンスでは...」の形で
   - 体験談の延長として自然に紹介
   ※紹介可能：オレオヨガアカデミー、シークエンス

6. FAQ（5問のみ、800〜1,000文字）
   - 読者の「核心的な不安」に答える
   - 薄い回答禁止。1問あたり150〜200文字で深く答える

   【良いFAQ例】
   Q: オンラインだけで本当にインストラクターになれますか？
   A: なれます。ただし「動画を見るだけ」では不十分です。シークエンスでは週1回のZoomセッションで実際にポーズを見てもらい、個別にフィードバックをもらえます。卒業生の〇%が資格取得後1年以内にインストラクターデビューしています。

7. まとめ（300〜400文字）
   - 要点を3つに絞る
   - 【監修者コメント③】読者への励まし
   - 次のアクションへの自然な誘導

8. CTA
   - 「${conversion.name}」への自然な誘導
   - URL: ${conversion.url}

══════════════════════════════════════════════════════════════════
【タイトル生成：最重要セクション】
══════════════════════════════════════════════════════════════════

タイトルは記事の命です。80%の読者はタイトルしか見ません。

【超重要】以下は「パターン例」です。例文をコピーせず、
体験談の内容から【完全オリジナル】のタイトルを作成してください。

■ パターンA：数字×具体性（例の形式を参考に、内容は体験談から）
- 形式：「年齢、状況から始めた〇〇への道」
- 形式：「頻度×期間で結果。理由を語る」
- 形式：「金額は高い？〇〇人に聞いた本音」

■ パターンB：疑問形×共感（読者の不安を疑問文に）
- 形式：「〇〇なのに△△、できる？」
- 形式：「〇〇で△△って、本当に□□？」
- 形式：「〇〇歳から△△、遅すぎる？」

■ パターンC：意外性×逆張り（常識の逆を突く）
- 形式：「"弱点"は才能だった｜逆転の発想」
- 形式：「〇〇したら逆に△△になった話」
- 形式：「〇〇しない方がいい？プロの本音」

■ パターンD：ストーリー冒頭（記事の印象的なシーンを切り取る）
- 形式：「あの日、〇〇で△△した」
- 形式：「『具体的なセリフ』が私を変えた」
- 形式：「〇〇した翌日、△△に申し込んだ」

■ パターンE：ビフォーアフター（変化を矢印で表現）【使用非推奨・他を優先】
- 形式：「職業〇年→新しい状態の現実」
- 形式：「〇〇を始めたら、△△が終わった」
※「〜だった私が〜まで」は禁止パターンのため使用不可

■ パターンF：読者への問いかけ（あなた、という呼びかけ）
- 形式：「あなたは"〇〇"になりたいですか？」
- 形式：「〇〇。でも現実は？」
- 形式：「〇〇な人が8割。あなたはどっち？」

■ パターンG：損失回避（知らないと損、という切り口）
- 形式：「知らないと損する、〇〇の選び方」
- 形式：「この〇つを知らずに△△すると後悔」
- 形式：「〇〇、しないという選択肢も考えてみた」

■ パターンH：権威性×専門性（経験者・専門家の視点）
- 形式：「上位資格者が本音で語る〇〇」
- 形式：「指導歴〇年の講師が選ぶ△△」
- 形式：「〇人を教えてわかった共通点」

■ パターンI：シンプル×パワーワード
- 形式：「〇〇、結局どれがいい？【完全版】」
- 形式：「〇〇の全種類｜目的別一覧」
- 形式：「〇〇の真実【経験者が語る】」

■ パターンJ：感情×変化（内面の変化を表現）
- 形式：「"〇〇"と思っていた私へ」
- 形式：「〇〇に出会って、△△が楽しみになった」
- 形式：「〇〇した日、なぜか涙が止まらなかった」

■ パターンK：具体的シーン（体験の一場面を切り取る）
- 形式：「初めての〇〇で△△した日のこと」
- 形式：「〇〇で言われた忘れられない一言」
- 形式：「〇〇の△△、全部見せます」

■ パターンL：比較×選択（二択で読者に考えさせる）
- 形式：「〇〇と△△、どっちにする？」
- 形式：「A vs B｜両方試した結論」
- 形式：「〇〇 vs △△｜コスパがいいのは？」

【必須】体験談に含まれる以下の要素をタイトルに反映：
- 具体的な年齢・期間・数字
- 職業や生活環境
- 感情的なターニングポイント
- 意外な結果や変化

══════════════════════════════════════════════════════════════════
【タイトル禁止パターン】
══════════════════════════════════════════════════════════════════

以下のパターンは【絶対禁止】です。使用しないでください：

✗「【体験談】〇〇した話」
✗「【実体験】〇〇してみた」
✗「〇〇の本音レビュー」
✗「〇〇の本音口コミ」
✗「〜を解説」「〜のコツを解説」
✗「〜とは？〜を解説」
✗「〜のメリット・デメリット」
✗「30代OLが〜した体験談」（具体的すぎる定型文）
✗「〜で人生が変わった」（使い古された表現）
✗「〇〇だった私が、〜まで」（パターンEの乱用禁止）
✗「「〇〇」だった私が〜」（同上）
✗「〜するまで」で終わるタイトル（使い古された）

■ 多様性の強制ルール
同じパターンは連続して使用禁止。
特にパターンE（ビフォーアフター型）は使用頻度が高いため、
パターンA、B、C、D、F、G、K、Lを優先的に使用すること。

■ ダメな理由
これらは「AIが書いた感」「量産記事感」を出してしまい、
読者の目に留まらず、クリックされません。

${existingTitles && existingTitles.length > 0 ? `
══════════════════════════════════════════════════════════════════
【タイトル重複回避】
══════════════════════════════════════════════════════════════════

以下は同カテゴリの既存タイトルです。これらと被らない、新鮮なタイトルを作成してください：
${existingTitles.map(t => `- ${t}`).join('\n')}

※ 似た構造・言い回し・数字の使い方も避けてください。
` : ''}
══════════════════════════════════════════════════════════════════
【その他禁止事項】
══════════════════════════════════════════════════════════════════

- 比較表（A社 vs B社のような表）
- 押し売り感のあるスクール紹介
- インラインスタイル
- 10問以上のFAQ（5問に絞ること）

══════════════════════════════════════════════════════════════════
【メタ情報】
══════════════════════════════════════════════════════════════════

【カテゴリ】${categoryName}
【メディア名】${brandName}
【狙うキーワード】${keyword}

【利用可能なタグ一覧】
${availableTags.map(t => `${t.name} (${t.slug})`).join(', ')}
→ この中から記事に最も関連する3〜5個のタグを選んでください

══════════════════════════════════════════════════════════════════
【出力形式】
══════════════════════════════════════════════════════════════════

【JSON形式で出力】
{
  "title": "【重要】上記12カテゴリから選んだ独自タイトル（32文字以内・禁止パターン厳守）",
  "slug": "url-slug-in-romaji",
  "metaTitle": "メタタイトル | ${brandName}",
  "metaDescription": "120〜140文字のディスクリプション",
  "html": "完全なHTML記事本文（<article>タグで囲む）",
  "tagSlugs": ["slug1", "slug2", "slug3"],
  "llmoShortSummary": "【LLMO最適化】2-3文で記事の核心を要約。AI検索（ChatGPT、Perplexity、Google AI Overview）で引用されやすい、情報密度の高い要約文。",
  "llmoKeyTakeaways": [
    "【具体的な価値1】読者が得られる具体的なメリットや学び",
    "【具体的な価値2】実践可能なアクションや気づき",
    "【具体的な価値3】数字や事例を含む説得力のあるポイント",
    "【具体的な価値4】他の記事にはない独自の視点",
    "【具体的な価値5】読者の悩みに対する明確な解決策"
  ],
  "faqItems": [
    { "question": "よくある質問1", "answer": "具体的で簡潔な回答（100-200文字）" },
    { "question": "よくある質問2", "answer": "具体的で簡潔な回答（100-200文字）" },
    { "question": "よくある質問3", "answer": "具体的で簡潔な回答（100-200文字）" },
    { "question": "よくある質問4", "answer": "具体的で簡潔な回答（100-200文字）" },
    { "question": "よくある質問5", "answer": "具体的で簡潔な回答（100-200文字）" }
  ]
}

【HTMLの注意点】
- 見出しはH2、H3を適切に使用
- 画像プレースホルダー（本文用2箇所のみ）: <!-- IMAGE_PLACEHOLDER: inbody_1 -->, <!-- IMAGE_PLACEHOLDER: inbody_2 -->
  ※カバー画像は別途自動設定されるため、本文には含めないこと
- 監修者コメントは上記の形式で
- インラインスタイルは使用禁止
- 8,000〜10,000文字を目標に
- 🚨【必須】発言・セリフは左ボーダー付きスタイルで視覚的に区別（上記【受講生・体験者の発言スタイル】参照）

【LLMO最適化の重要ポイント】
- llmoShortSummary: AI検索エンジンが引用しやすい、自己完結型の要約文。「〜とは」「〜の方法」など検索意図に直接答える形式
- llmoKeyTakeaways: 箇条書きで5つ。具体的な数字、期間、効果を含める。抽象的な表現を避ける
- faqItems: Google FAQ リッチスニペット用。HTMLのFAQセクションと同じ内容を構造化データとして出力
${customSystemPrompt ? `

══════════════════════════════════════════════════════════════════
【追加のカスタム指示】
══════════════════════════════════════════════════════════════════

${customSystemPrompt}

上記のカスタム指示に従いつつ、デフォルトの構造と形式を維持してください。
` : ''}`;
}

async function generateArticleV6(
  testimonials: StudentVoice[],
  keyword: string,
  supervisor: SupervisorContext,
  conversion: { name: string; url: string },
  categoryName: string,
  brandName: string,
  apiKey: string,
  availableTags: { name: string; slug: string }[],
  existingTitles: string[] | undefined,
  customSystemPrompt: string | null
): Promise<ArticleStructure | null> {
  const prompt = buildV6ArticlePrompt(
    testimonials,
    keyword,
    supervisor,
    conversion,
    categoryName,
    brandName,
    availableTags,
    existingTitles,
    customSystemPrompt
  );

  const systemPrompt = "あなたは経験豊富なSEOライターです。指示に従って8,000〜10,000文字の記事をJSONのみで出力してください。";

  console.log("[V6] Generating article with enhanced prompt...");

  const response = await callOpenRouter<ArticleStructure>(
    systemPrompt,
    prompt,
    {
      apiKey,
      model: "anthropic/claude-sonnet-4",
      maxTokens: 20000,
      temperature: 0.7,
    }
  );

  if (!response.success || !response.data) {
    console.error("[V6] Article generation failed:", response.error);
    return null;
  }

  // 文字数チェック
  const textOnly = response.data.html.replace(/<[^>]*>/g, "");
  console.log(`[V6] Generated article: ${textOnly.length} characters`);

  return response.data;
}

// ========================================
// Step 6: 画像生成（記事内容に合わせた画像）
// ========================================

interface ArticleImageContext {
  title: string;
  testimonialSummary: string; // 体験者の属性・状況
  categoryName: string;
}

/**
 * ヨガポーズのバリエーション（45種類）
 * カバー画像・本文画像両方で使用
 */
const YOGA_POSES = [
  // 立位ポーズ (12種類)
  { name: 'Mountain Pose (Tadasana)', description: 'standing tall with feet together, arms at sides' },
  { name: 'Tree Pose (Vrksasana)', description: 'standing on one leg with other foot on inner thigh, hands in prayer or raised' },
  { name: 'Warrior I (Virabhadrasana I)', description: 'lunging forward with arms raised overhead' },
  { name: 'Warrior II (Virabhadrasana II)', description: 'lunging with arms extended horizontally to sides' },
  { name: 'Warrior III (Virabhadrasana III)', description: 'balancing on one leg with body and back leg parallel to floor' },
  { name: 'Extended Side Angle (Utthita Parsvakonasana)', description: 'lunging with one arm reaching over ear' },
  { name: 'Triangle Pose (Trikonasana)', description: 'standing with legs wide, reaching down to ankle and up to sky' },
  { name: 'Half Moon (Ardha Chandrasana)', description: 'balancing on one leg with other leg and arm extended horizontally' },
  { name: 'Chair Pose (Utkatasana)', description: 'sitting back with knees bent, arms raised overhead' },
  { name: 'Eagle Pose (Garudasana)', description: 'standing on one leg with arms and legs wrapped' },
  { name: 'Standing Forward Fold (Uttanasana)', description: 'bending forward from hips with hands reaching to floor' },
  { name: 'Extended Hand to Toe (Utthita Hasta Padangusthasana)', description: 'standing on one leg holding other foot extended' },

  // 座位ポーズ (9種類)
  { name: 'Easy Pose (Sukhasana)', description: 'sitting cross-legged with straight spine' },
  { name: 'Lotus Pose (Padmasana)', description: 'sitting with feet on opposite thighs' },
  { name: 'Staff Pose (Dandasana)', description: 'sitting with legs extended straight, hands beside hips' },
  { name: 'Seated Forward Fold (Paschimottanasana)', description: 'sitting with legs extended, folding forward over legs' },
  { name: 'Head to Knee (Janu Sirsasana)', description: 'sitting with one leg extended, folding toward that leg' },
  { name: 'Bound Angle (Baddha Konasana)', description: 'sitting with soles of feet together, knees open' },
  { name: 'Cow Face Pose (Gomukhasana)', description: 'sitting with legs crossed, arms behind back' },
  { name: 'Seated Twist (Ardha Matsyendrasana)', description: 'sitting with one leg crossed, twisting toward bent knee' },
  { name: 'Boat Pose (Navasana)', description: 'sitting with legs and torso lifted, balancing on sit bones' },

  // 後屈ポーズ (7種類)
  { name: 'Cobra Pose (Bhujangasana)', description: 'lying prone with upper body lifted, arms supporting' },
  { name: 'Upward Dog (Urdhva Mukha Svanasana)', description: 'arms straight, body lifted off floor, tops of feet down' },
  { name: 'Bridge Pose (Setu Bandhasana)', description: 'lying on back with hips lifted, feet flat on floor' },
  { name: 'Wheel Pose (Urdhva Dhanurasana)', description: 'full backbend with hands and feet on floor, body arched' },
  { name: 'Camel Pose (Ustrasana)', description: 'kneeling with hips forward, reaching back to heels' },
  { name: 'Bow Pose (Dhanurasana)', description: 'lying prone, holding ankles with back arched' },
  { name: 'Fish Pose (Matsyasana)', description: 'lying on back with chest lifted, head tilted back' },

  // 前屈・ストレッチ (6種類)
  { name: 'Downward Dog (Adho Mukha Svanasana)', description: 'inverted V-shape with hands and feet on floor' },
  { name: "Child's Pose (Balasana)", description: 'kneeling with forehead on floor, arms extended or beside body' },
  { name: 'Cat-Cow (Marjaryasana-Bitilasana)', description: 'on hands and knees, alternating arched and rounded spine' },
  { name: 'Pigeon Pose (Eka Pada Rajakapotasana)', description: 'one leg bent in front, other leg extended behind' },
  { name: 'Lizard Pose (Utthan Pristhasana)', description: 'low lunge with both hands inside front foot' },
  { name: 'Wide-Legged Forward Fold (Prasarita Padottanasana)', description: 'standing with legs wide, folding forward' },

  // バランス・逆転 (6種類)
  { name: 'Crow Pose (Bakasana)', description: 'balancing on hands with knees on upper arms' },
  { name: 'Side Crow (Parsva Bakasana)', description: 'balancing on hands with both legs to one side' },
  { name: 'Headstand (Sirsasana)', description: 'inverted on head with legs straight up' },
  { name: 'Shoulder Stand (Sarvangasana)', description: 'inverted on shoulders with legs straight up' },
  { name: 'Plow Pose (Halasana)', description: 'lying on back with legs over head, toes touching floor' },
  { name: 'Forearm Stand (Pincha Mayurasana)', description: 'balancing on forearms with legs vertical' },

  // リラックス (5種類)
  { name: 'Corpse Pose (Savasana)', description: 'lying flat on back, completely relaxed' },
  { name: 'Legs Up the Wall (Viparita Karani)', description: 'lying on back with legs extended up against wall' },
  { name: 'Reclined Twist (Supta Matsyendrasana)', description: 'lying on back with knees dropped to one side' },
  { name: 'Happy Baby (Ananda Balasana)', description: 'lying on back holding feet with knees bent toward armpits' },
  { name: 'Supine Bound Angle (Supta Baddha Konasana)', description: 'lying on back with soles of feet together, knees open' },
];

/**
 * 背景/シーンのバリエーション（10種類）
 */
const SCENE_BACKGROUNDS = [
  'modern minimalist yoga studio with natural light streaming through large windows',
  'serene outdoor garden setting with soft morning light and blooming flowers',
  'beach at sunrise with calm ocean waves and golden sand',
  'mountain meadow with wildflowers and distant peaks',
  'zen garden with bamboo, stones, and a peaceful water feature',
  'rooftop terrace overlooking city skyline at golden hour',
  'forest clearing with dappled sunlight filtering through trees',
  'clean white studio with large windows and wooden floors',
  'peaceful lakeside at dawn with mist rising from the water',
  'tropical paradise with palm trees and warm ocean breeze',
];

/**
 * ランダムにヨガポーズを選択
 */
function getRandomYogaPose(): typeof YOGA_POSES[number] {
  return YOGA_POSES[Math.floor(Math.random() * YOGA_POSES.length)];
}

/**
 * ランダムに背景を選択
 */
function getRandomBackground(): string {
  return SCENE_BACKGROUNDS[Math.floor(Math.random() * SCENE_BACKGROUNDS.length)];
}

/**
 * 記事内容に合った画像プロンプトを生成（手書き風水彩画）
 */
function buildContextualImagePrompt(
  slot: "cover" | "inbody_1" | "inbody_2",
  context: ArticleImageContext
): string {
  // ベースのスタイル（統一感を維持）- 現代的な女性、顔あり
  const baseStyle = `Delicate line art illustration with thin pen outlines and soft watercolor wash. White background. Pale muted colors - beige, soft green, light gray. Small watercolor dots as decoration. Simple and elegant minimalist style. No text. No words. IMPORTANT: Draw the woman with a gentle, peaceful face with soft facial features (eyes, nose, mouth). Modern contemporary woman wearing yoga wear (tank top, leggings). NOT traditional clothing, NOT kimono. Must show face clearly.`;

  // 記事タイトルと体験談の両方から人物像を抽出
  const combinedText = `${context.title} ${context.testimonialSummary}`.toLowerCase();

  let personHint: string;
  if (combinedText.includes("ママ") || combinedText.includes("子育て") || combinedText.includes("主婦")) {
    personHint = "young mother in her 30s wearing stylish yoga wear";
  } else if (combinedText.includes("ol") || combinedText.includes("会社員") || combinedText.includes("働きながら")) {
    personHint = "modern woman in her 30s wearing athletic yoga clothes";
  } else if (combinedText.includes("40") || combinedText.includes("四十") || combinedText.includes("アラフォー")) {
    personHint = "elegant woman in her 40s wearing comfortable yoga attire";
  } else if (combinedText.includes("50") || combinedText.includes("五十")) {
    personHint = "graceful woman in her 50s wearing yoga clothes";
  } else {
    personHint = "modern young woman wearing yoga wear";
  }

  // 座禅ポーズを除外した立ちポーズ・動的ポーズを使用
  // 座禅系ポーズはGeminiがデフォルトで生成しやすいため明確に異なるポーズを指定
  const standingPoses = YOGA_POSES.filter(p =>
    !p.name.includes("Easy") &&
    !p.name.includes("Lotus") &&
    !p.name.includes("Seated") &&
    !p.name.includes("Child") &&
    !p.name.includes("Corpse") &&
    !p.description.includes("seated") &&
    !p.description.includes("sitting") &&
    !p.description.includes("cross-legged")
  );

  // 異なるカテゴリからポーズを選択（重複防止）
  const shuffled = [...standingPoses].sort(() => Math.random() - 0.5);
  const pose1 = shuffled[0] || getRandomYogaPose();
  const pose2 = shuffled[1] || getRandomYogaPose();
  const pose3 = shuffled[2] || getRandomYogaPose();
  const background = getRandomBackground();

  console.log(`[Contextual Image] Poses: cover=${pose1.name}, inbody_1=${pose2.name}, inbody_2=${pose3.name}`);

  // スロットごとに異なるシーン・異なるポーズを生成
  // ポーズを最優先にし、座禅ポーズを明示的に禁止
  const scenePrompts: Record<"cover" | "inbody_1" | "inbody_2", string> = {
    cover: `Draw a woman doing ${pose1.name}: ${pose1.description}

NOT seated, NOT cross-legged, NOT meditation pose, NOT lotus position.

Style: Delicate line art with thin pen outlines and soft watercolor wash. White background. Pale muted colors. Simple minimalist style. Modern ${personHint} with gentle face, wearing yoga tank top and leggings.

The woman is ${pose1.description} on a yoga mat. Show this exact body position clearly.`,

    inbody_1: `Draw a woman doing ${pose2.name}: ${pose2.description}

NOT seated, NOT cross-legged, NOT meditation pose, NOT lotus position.

Style: Delicate line art with thin pen outlines and soft watercolor wash. White background. Pale muted colors. Simple minimalist style. Modern ${personHint} with gentle face, wearing yoga tank top and leggings.

The woman is ${pose2.description} on a yoga mat. Show this exact body position clearly.`,

    inbody_2: `Draw a woman doing ${pose3.name}: ${pose3.description}

NOT seated, NOT cross-legged, NOT meditation pose, NOT lotus position.

Style: Delicate line art with thin pen outlines and soft watercolor wash. White background. Pale muted colors. Simple minimalist style. Modern ${personHint} with gentle face, wearing yoga tank top and leggings.

The woman is ${pose3.description} on a yoga mat. Show this exact body position clearly.`,
  };

  return scenePrompts[slot];
}

/**
 * カバー画像専用プロンプトを生成
 * 特徴: 綺麗な背景が主役、ヨガをする女性は小さめ（一覧サムネイル向け）
 * 常にリアルな写真風で生成（イラストNG）
 */
function buildCoverImagePrompt(context: ArticleImageContext): string {
  // 記事タイトルと体験談から人物像を推測
  const combinedText = `${context.title} ${context.testimonialSummary}`.toLowerCase();

  let personHint: string;
  if (combinedText.includes("ママ") || combinedText.includes("子育て")) {
    personHint = "young mother in her 30s in yoga attire";
  } else if (combinedText.includes("40") || combinedText.includes("四十")) {
    personHint = "elegant woman in her 40s in yoga attire";
  } else {
    personHint = "woman in stylish yoga wear";
  }

  // ヨガポーズをランダム選択（座禅系以外）
  const standingPoses = YOGA_POSES.filter(p =>
    !p.name.includes("Easy") &&
    !p.name.includes("Lotus") &&
    !p.name.includes("Seated") &&
    !p.description.includes("seated") &&
    !p.description.includes("cross-legged")
  );
  const selectedPose = standingPoses[Math.floor(Math.random() * standingPoses.length)] || getRandomYogaPose();
  const pose = `doing ${selectedPose.name}, ${selectedPose.description}`;
  console.log(`[Cover Image] Pose selected: ${selectedPose.name}`);

  // 3つの構図パターン
  type CompositionType = "CLOSE" | "MEDIUM" | "WIDE";
  const compositions: Record<CompositionType, { baseStyle: string; sceneryOptions: string[] }> = {
    // CLOSE: 人物にフォーカス（30-50%）、背景ぼかし
    CLOSE: {
      baseStyle: `PHOTOREALISTIC professional yoga photography. Shot with a DSLR camera, real photograph, NOT illustration, NOT drawing, NOT anime, NOT cartoon, NOT watercolor, NOT sketch, NOT digital art. Shallow depth of field with beautiful bokeh. The person takes up 30-50% of the frame. Natural lighting, magazine quality. No text overlays. No watermarks.`,
      sceneryOptions: [
        `A ${personHint} ${pose} in the foreground with soft golden morning light. Blurred mountains and mist in the background. Intimate portrait-style composition with natural warm lighting.`,
        `A ${personHint} ${pose} captured in close-up with ocean waves softly blurred behind. Sunset glow illuminating her face and form. Shallow depth of field creating dreamy atmosphere.`,
        `A ${personHint} ${pose} with a serene expression, soft-focus bamboo forest creating green bokeh behind. Gentle morning light filtering through, highlighting her peaceful practice.`,
        `A ${personHint} ${pose} in sharp focus with a tranquil lake and mountains as soft, painterly background. Early morning golden hour light wrapping around her form.`,
        `A ${personHint} ${pose} on a rooftop at golden hour, city lights creating beautiful bokeh behind. Focus on her graceful form against the dreamy urban sunset backdrop.`,
      ],
    },
    // MEDIUM: 人物と環境のバランス（15-30%）
    MEDIUM: {
      baseStyle: `PHOTOREALISTIC yoga lifestyle photography. Shot with a DSLR camera, real photograph, NOT illustration, NOT drawing, NOT anime, NOT cartoon, NOT watercolor, NOT sketch, NOT digital art. The person takes up 15-30% of the frame within scenic setting. Professional composition, high resolution. No text overlays. No watermarks.`,
      sceneryOptions: [
        `A ${personHint} ${pose} on a wooden deck with misty mountains visible behind. Medium shot showing both her graceful pose and the majestic mountain landscape. Golden sunrise creating warm atmosphere.`,
        `A ${personHint} ${pose} on coastal rocks with the ocean stretching to the horizon. Balanced composition with dramatic sky and waves complementing her flowing pose. Sunset colors reflecting off the water.`,
        `A ${personHint} ${pose} along a bamboo forest path, trees framing her on both sides. The forest creates depth while she remains a clear focal point. Soft morning mist and dappled light.`,
        `A ${personHint} ${pose} at the edge of a pristine lake with mountain reflections. She is positioned to one side, allowing the stunning natural mirror effect to share the frame.`,
        `A ${personHint} ${pose} on a stylish rooftop terrace with city skyline behind. Architectural elements and urban landscape provide context while she remains the clear subject.`,
      ],
    },
    // WIDE: 風景メイン、人物は点景（5-15%）
    WIDE: {
      baseStyle: `PHOTOREALISTIC wide-angle landscape photography featuring yoga. Shot with a DSLR camera, real photograph, NOT illustration, NOT drawing, NOT anime, NOT cartoon, NOT watercolor, NOT sketch, NOT digital art. The yoga practitioner appears small (5-15% of frame) within breathtaking natural backdrop. Cinematic composition, high resolution. No text overlays. No watermarks.`,
      sceneryOptions: [
        `A ${personHint} ${pose} as a small silhouette on a wooden deck overlooking vast misty mountains at golden sunrise. Dramatic orange and pink sky dominates the frame. Breathtaking panoramic mountain landscape as the main subject.`,
        `A ${personHint} ${pose} as a tiny figure on a cliff edge facing an endless ocean at sunset. Warm golden light, dramatic cloudscape. Wide landscape shot with vast ocean horizon commanding attention.`,
        `A ${personHint} ${pose} as a small figure deep within a serene bamboo forest at dawn. Soft misty atmosphere, rays of light filtering through towering bamboo. The peaceful forest environment is the star.`,
        `A ${personHint} ${pose} as a small presence beside a tranquil lake reflecting snow-capped mountains. Mirror-like reflections and grand natural scenery dominate. Wide-angle landscape photography.`,
        `A ${personHint} ${pose} as a silhouette on a distant rooftop terrace at golden hour. Expansive modern city skyline spreads across the frame. Urban landscape is the visual focus.`,
      ],
    },
  };

  // 完全ランダムで構図を選択（Math.random使用）
  const compositionTypes: CompositionType[] = ["CLOSE", "MEDIUM", "WIDE"];
  const randomCompositionIndex = Math.floor(Math.random() * 3);
  const selectedComposition = compositionTypes[randomCompositionIndex];
  const composition = compositions[selectedComposition];
  
  // 風景パターンもランダム選択
  const randomSceneryIndex = Math.floor(Math.random() * composition.sceneryOptions.length);
  const selectedScenery = composition.sceneryOptions[randomSceneryIndex];

  console.log(`[Cover Image] Composition: ${selectedComposition}, Scenery: ${randomSceneryIndex + 1}/5`);

  const finalPrompt = `${composition.baseStyle}\n${selectedScenery}`;
  console.log(`[Cover Image] Prompt (first 300 chars): ${finalPrompt.substring(0, 300)}...`);

  return finalPrompt;
}

/**
 * リアルな写真風画像プロンプトを生成（本文画像向け・人物フォーカス）
 */
function buildRealisticImagePrompt(
  slot: "cover" | "inbody_1" | "inbody_2",
  context: ArticleImageContext
): string {
  // リアルな写真風のベーススタイル
  const baseStyle = `Professional yoga photography with natural lighting. High quality, sharp focus, realistic colors. Modern Japanese woman in her 30s-40s with natural makeup, wearing professional yoga attire (sports bra and leggings or fitted yoga clothes). NOT traditional clothing, NOT kimono. Warm, inviting yoga studio atmosphere. No text overlays. No watermarks.`;

  // 記事タイトルと体験談の両方から人物像を抽出
  const combinedText = `${context.title} ${context.testimonialSummary}`.toLowerCase();

  let personHint: string;
  if (combinedText.includes("ママ") || combinedText.includes("子育て") || combinedText.includes("主婦")) {
    personHint = "friendly young mother in her early 30s wearing stylish yoga wear";
  } else if (combinedText.includes("ol") || combinedText.includes("会社員") || combinedText.includes("働きながら")) {
    personHint = "professional woman in her 30s wearing athletic yoga clothes";
  } else if (combinedText.includes("40") || combinedText.includes("四十") || combinedText.includes("アラフォー")) {
    personHint = "elegant woman in her 40s wearing premium yoga attire";
  } else if (combinedText.includes("50") || combinedText.includes("五十")) {
    personHint = "graceful woman in her 50s wearing comfortable yoga clothes";
  } else {
    personHint = "modern young Japanese woman wearing professional yoga wear";
  }

  // 座禅系ポーズを除外した立ちポーズ・動的ポーズを使用
  const standingPoses = YOGA_POSES.filter(p =>
    !p.name.includes("Easy") &&
    !p.name.includes("Lotus") &&
    !p.name.includes("Seated") &&
    !p.name.includes("Child") &&
    !p.name.includes("Corpse") &&
    !p.description.includes("seated") &&
    !p.description.includes("sitting") &&
    !p.description.includes("cross-legged")
  );

  // 異なるカテゴリからポーズを選択（重複防止）
  const shuffled = [...standingPoses].sort(() => Math.random() - 0.5);
  const pose1 = shuffled[0] || getRandomYogaPose();
  const pose2 = shuffled[1] || getRandomYogaPose();
  const pose3 = shuffled[2] || getRandomYogaPose();

  // 背景をランダム選択
  const background1 = getRandomBackground();
  const background2 = getRandomBackground();
  const background3 = getRandomBackground();

  console.log(`[Realistic Image] Poses: cover=${pose1.name}, inbody_1=${pose2.name}, inbody_2=${pose3.name}`);

  // スロットごとに異なるシーンを生成（ポーズを最優先に強調）
  const scenePrompts: Record<"cover" | "inbody_1" | "inbody_2", string> = {
    cover: `Photograph a woman doing ${pose1.name}: ${pose1.description}

NOT seated, NOT cross-legged, NOT meditation pose, NOT lotus position.

${baseStyle}
A ${personHint} clearly demonstrating ${pose1.name} on a yoga mat in ${background1}. Her body position must show: ${pose1.description}. Professional yoga photography.`,

    inbody_1: `Photograph a woman doing ${pose2.name}: ${pose2.description}

NOT seated, NOT cross-legged, NOT meditation pose, NOT lotus position.

${baseStyle}
A ${personHint} clearly demonstrating ${pose2.name} on a yoga mat in ${background2}. Her body position must show: ${pose2.description}. Peaceful atmosphere.`,

    inbody_2: `Photograph a woman doing ${pose3.name}: ${pose3.description}

NOT seated, NOT cross-legged, NOT meditation pose, NOT lotus position.

${baseStyle}
A ${personHint} clearly demonstrating ${pose3.name} on a yoga mat in ${background3}. Her body position must show: ${pose3.description}. Golden hour lighting.`,
  };

  return scenePrompts[slot];
}

/**
 * 風景・雰囲気系（SCENIC）画像プロンプトを生成
 * 朝日/夕日などの美しい背景と組み合わせたヨガ写真風
 */
function buildScenicImagePrompt(
  slot: "cover" | "inbody_1" | "inbody_2",
  context: ArticleImageContext
): string {
  // 風景・雰囲気系のベーススタイル
  const baseStyle = `Stunning yoga photography with dramatic natural scenery. Professional quality, cinematic composition. Modern Asian woman in her 30s-40s with natural beauty, wearing stylish yoga attire. NOT traditional clothing, NOT kimono. Inspirational and aspirational mood. No text overlays. No watermarks.`;

  // 記事タイトルと体験談の両方から人物像を抽出
  const combinedText = `${context.title} ${context.testimonialSummary}`.toLowerCase();

  let personHint: string;
  if (combinedText.includes("ママ") || combinedText.includes("子育て") || combinedText.includes("主婦")) {
    personHint = "serene young mother in her early 30s wearing elegant yoga clothes";
  } else if (combinedText.includes("ol") || combinedText.includes("会社員") || combinedText.includes("働きながら")) {
    personHint = "professional woman in her 30s wearing premium athletic wear";
  } else if (combinedText.includes("40") || combinedText.includes("四十") || combinedText.includes("アラフォー")) {
    personHint = "graceful woman in her 40s wearing sophisticated yoga attire";
  } else if (combinedText.includes("50") || combinedText.includes("五十")) {
    personHint = "elegant woman in her 50s wearing comfortable yoga clothes";
  } else {
    personHint = "beautiful young woman wearing stylish yoga wear";
  }

  // 座禅系ポーズを除外した立ちポーズ・動的ポーズを使用
  const standingPoses = YOGA_POSES.filter(p =>
    !p.name.includes("Easy") &&
    !p.name.includes("Lotus") &&
    !p.name.includes("Seated") &&
    !p.name.includes("Child") &&
    !p.name.includes("Corpse") &&
    !p.description.includes("seated") &&
    !p.description.includes("sitting") &&
    !p.description.includes("cross-legged")
  );

  // 異なるカテゴリからポーズを選択（重複防止）
  const shuffled = [...standingPoses].sort(() => Math.random() - 0.5);
  const pose1 = shuffled[0] || getRandomYogaPose();
  const pose2 = shuffled[1] || getRandomYogaPose();
  const pose3 = shuffled[2] || getRandomYogaPose();

  // 背景をランダム選択
  const background1 = getRandomBackground();
  const background2 = getRandomBackground();
  const background3 = getRandomBackground();

  console.log(`[Scenic Image] Poses: cover=${pose1.name}, inbody_1=${pose2.name}, inbody_2=${pose3.name}`);

  // スロットごとに異なる風景シーンを生成（ポーズを最優先に強調）
  const scenePrompts: Record<"cover" | "inbody_1" | "inbody_2", string> = {
    cover: `Photograph a woman doing ${pose1.name}: ${pose1.description}

NOT seated, NOT cross-legged, NOT meditation pose, NOT lotus position.

${baseStyle}
A ${personHint} clearly demonstrating ${pose1.name} in ${background1}. Golden hour lighting. Her body position must show: ${pose1.description}.`,

    inbody_1: `Photograph a woman doing ${pose2.name}: ${pose2.description}

NOT seated, NOT cross-legged, NOT meditation pose, NOT lotus position.

${baseStyle}
A ${personHint} clearly demonstrating ${pose2.name} in ${background2}. Morning light. Her body position must show: ${pose2.description}.`,

    inbody_2: `Photograph a woman doing ${pose3.name}: ${pose3.description}

NOT seated, NOT cross-legged, NOT meditation pose, NOT lotus position.

${baseStyle}
A ${personHint} clearly demonstrating ${pose3.name} in ${background3}. Sunset tones. Her body position must show: ${pose3.description}.`,
  };

  return scenePrompts[slot];
}

/**
 * 画像スタイルに応じたプロンプトを取得
 * - カバー画像: 常に背景重視のリアル写真風（一覧サムネイル向け）
 * - 本文画像: 選択されたスタイルを使用
 */
function getImagePrompt(
  slot: "cover" | "inbody_1" | "inbody_2",
  context: ArticleImageContext,
  imageStyle: ImageStyle
): string {
  // カバー画像は常に背景重視のリアル写真風（人物は小さめ）
  if (slot === "cover") {
    return buildCoverImagePrompt(context);
  }

  // 本文画像は選択されたスタイルを使用
  switch (imageStyle) {
    case ImageStyle.REALISTIC:
      return buildRealisticImagePrompt(slot, context);
    case ImageStyle.SCENIC:
      return buildScenicImagePrompt(slot, context);
    case ImageStyle.HANDDRAWN:
      return buildContextualImagePrompt(slot, context);
    case ImageStyle.WATERCOLOR:
      // 後方互換性: WATERCOLORはHANDDRAWNと同じ
      return buildContextualImagePrompt(slot, context);
    default:
      // デフォルト: リアル写真風
      return buildRealisticImagePrompt(slot, context);
  }
}

async function generateImagesV6(
  context: ArticleImageContext,
  apiKey: string,
  imageStyle: ImageStyle = ImageStyle.REALISTIC
): Promise<GeneratedImage[]> {
  const images: GeneratedImage[] = [];

  const styleLabels: Record<ImageStyle, string> = {
    [ImageStyle.REALISTIC]: "リアル写真風",
    [ImageStyle.SCENIC]: "風景・雰囲気系",
    [ImageStyle.HANDDRAWN]: "手書き風イラスト",
    [ImageStyle.WATERCOLOR]: "手書き風水彩画（レガシー）",
  };
  const styleLabel = styleLabels[imageStyle] || "リアル写真風";
  console.log(`[V6] Image style for body: ${styleLabel}, Cover: scenic-realistic (背景重視)`);

  const slots: Array<{ slot: "cover" | "inbody_1" | "inbody_2"; description: string }> = [
    { slot: "cover", description: "カバー画像" },
    { slot: "inbody_1", description: "本文画像1" },
    { slot: "inbody_2", description: "本文画像2" },
  ];

  for (let i = 0; i < slots.length; i++) {
    const { slot, description } = slots[i];

    if (i > 0) {
      console.log(`[V6] Waiting 3 seconds before next image request...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // 記事内容と画像スタイルに合わせたプロンプトを生成
    const prompt = getImagePrompt(slot, context, imageStyle);

    console.log(`[V6] Generating ${slot} image with ${styleLabel} style`);

    let url: string | null = null;
    for (let retry = 0; retry < 2; retry++) {
      url = await generateImageWithGemini(prompt, apiKey);
      if (url) break;
      if (retry < 1) {
        console.log(`[V6] Retrying image generation for ${slot} after 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    if (url) {
      const asset = await prisma.media_assets.create({
        data: {
          id: randomUUID(),
          url,
          fileName: `v6-${slot}-${Date.now()}.webp`,
          altText: `${context.title} - ${description}`,
          source: MediaSource.AI_GENERATED,
          showInLibrary: true,
        }
      });

      images.push({
        slot,
        url,
        assetId: asset.id,
        alt: `${context.title} - ${description}`,
        width: 1024,
        height: 576,
      });

      console.log(`[V6] Generated image for slot: ${slot}`);
    } else {
      console.log(`[V6] Failed to generate image for slot: ${slot}`);
    }
  }

  return images;
}

// ========================================
// 画像挿入
// ========================================

function insertImagesIntoHtml(html: string, images: GeneratedImage[]): string {
  let result = html;

  // AIが様々な形式でプレースホルダーを出力する可能性があるため、
  // 正規表現で全てのIMAGE_PLACEHOLDERを検出し、順番に置換する
  const placeholderRegex = /<!-- IMAGE_PLACEHOLDER:[^>]*-->/g;
  const placeholders = result.match(placeholderRegex) || [];

  // カバー画像を除いた本文用画像を取得
  const inbodyImages = images.filter(img => img.slot !== "cover");

  console.log(`[V6] Found ${placeholders.length} placeholders, ${inbodyImages.length} inbody images`);

  // プレースホルダーを順番に画像で置換
  placeholders.forEach((placeholder, index) => {
    if (index < inbodyImages.length) {
      const image = inbodyImages[index];
      const imgTag = `<img src="${image.url}" alt="${image.alt}" width="${image.width}" height="${image.height}" loading="lazy" />`;
      const figureTag = `<figure style="margin:32px 0;text-align:center;">
  ${imgTag}
  <figcaption style="margin-top:8px;font-size:0.9em;color:#666;">${image.alt}</figcaption>
</figure>`;

      result = result.replace(placeholder, figureTag);
      console.log(`[V6] Inserted image ${index + 1}: ${image.alt?.substring(0, 30)}...`);
    } else {
      // 画像が足りない場合はプレースホルダーを削除
      result = result.replace(placeholder, "");
      console.log(`[V6] Removed excess placeholder ${index + 1}`);
    }
  });

  return result;
}

// ========================================
// メインパイプライン V6
// ========================================

export const generateArticlePipelineV6 = inngest.createFunction(
  {
    id: "generate-article-pipeline-v6",
    name: "Generate Article Pipeline V6 (体験談深掘り + 監修者強化)",
    retries: 2,
    onFailure: async ({ error, event }) => {
      const jobId = (event.data as { jobId?: string }).jobId;
      console.error(`[Pipeline V6] Failed: ${error.message} Job: ${jobId}`);

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
  { event: "article/generate-pipeline-v6" },
  async ({ event, step }) => {
    const { jobId } = event.data;

    console.log(`[Pipeline V6] Starting job: ${jobId}`);

    // 進捗更新ヘルパー
    const updateProgress = async (stage: number, message: string) => {
      await prisma.generation_jobs.update({
        where: { id: jobId },
        data: {
          progress: V6_STAGE_PROGRESS[stage] || 0,
          currentStage: stage,
          statusMessage: message,
        }
      });
    };

    // ========================================
    // 初期データ取得（ジョブIDからデータを取得）
    // ========================================
    const pipelineData = await step.run("v6-fetch-pipeline-data", async () => {
      // まずジョブデータを取得
      const job = await prisma.generation_jobs.findUnique({
        where: { id: jobId },
        include: {
          generation_job_conversions: {
            include: { conversions: true }
          },
          generation_job_knowledge_items: {
            include: { knowledge_items: true }
          }
        }
      });

      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }

      const categoryId = job.categoryId;
      const authorId = job.authorId;
      const brandId = job.brandId;
      const userId = job.userId;
      const keyword = job.keyword;
      const imageStyle = job.imageStyle || ImageStyle.REALISTIC;

      // コンバージョン情報を取得
      const conversions = job.generation_job_conversions.map(gjc => gjc.conversions);

      // ナレッジアイテム情報を取得（最初の1つを使用）
      const knowledgeItem = job.generation_job_knowledge_items[0]?.knowledge_items || null;

      const [settings, category, brand] = await Promise.all([
        getDecryptedSettings(),
        prisma.categories.findUnique({ where: { id: categoryId } }),
        brandId ? prisma.brands.findUnique({ where: { id: brandId } }) : null,
      ]);

      const existingJobs = await prisma.generation_jobs.findMany({
        where: { status: "COMPLETED" },
        select: { keyword: true }
      });
      const existingKeywords = existingJobs.map(j => j.keyword).filter(Boolean) as string[];

      const tags = await prisma.tags.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" }
      });

      // 著者情報を取得
      const author = await prisma.authors.findUnique({ where: { id: authorId } });

      return {
        settings: settings as DecryptedSettings & PromptSettings,
        category,
        brand,
        conversions,
        existingKeywords,
        tags,
        author,
        keyword,
        knowledgeItem,
        userId,
        authorId,
        categoryId,
        imageStyle,
      };
    });

    if (!pipelineData.settings?.openRouterApiKey) {
      throw new Error("OpenRouter API key not configured");
    }
    if (!pipelineData.settings?.dataforSeoApiKey) {
      throw new Error("DataForSEO API key not configured");
    }

    // ========================================
    // Step 1: 複数の受講生の声を取得
    // ========================================
    await step.run("v6-update-step-1", async () => {
      await updateProgress(1, "複数の受講生の声を取得中...");
    });

    const testimonials = await step.run("v6-collect-testimonials", async () => {
      const voices = await collectMultipleTestimonials(
        pipelineData.knowledgeItem?.id,
        pipelineData.categoryId,
        pipelineData.authorId  // 監修者との適合度計算のため
      );
      if (voices.length === 0) {
        throw new Error("No available student voice found");
      }
      console.log(`[V6] Collected ${voices.length} testimonials`);
      return voices;
    });

    // ========================================
    // Step 2: 監修者コンテキスト取得
    // ========================================
    await step.run("v6-update-step-2", async () => {
      await updateProgress(2, "監修者情報を取得中...");
    });

    const supervisor = await step.run("v6-get-supervisor", async () => {
      const ctx = await getSupervisorContext(pipelineData.authorId);
      if (!ctx) {
        throw new Error("Author not found");
      }
      console.log(`[V6] Supervisor: ${ctx.name} (${ctx.role})`);
      return ctx;
    });

    // ========================================
    // Step 3: テーマ・キーワード候補抽出
    // ========================================
    await step.run("v6-update-step-3", async () => {
      await updateProgress(3, "テーマとキーワードを分析中...");
    });

    const themeAnalysis = await step.run("v6-analyze-theme", async () => {
      const analysis = await analyzeThemeAndKeywords(
        testimonials[0],
        pipelineData.settings!.openRouterApiKey!,
        pipelineData.settings!
      );
      if (!analysis || !analysis.mainThemes || !analysis.keywordCandidates) {
        console.error("[V6] Invalid theme analysis response:", JSON.stringify(analysis));
        throw new Error("Theme analysis failed: missing required fields");
      }
      console.log(`[V6] Themes: ${analysis.mainThemes.join(", ")}`);
      return analysis;
    });

    // ========================================
    // Step 4: キーワード選定
    // ========================================
    await step.run("v6-update-step-4", async () => {
      await updateProgress(4, "最適なキーワードを選択中...");
    });

    const selectedKeyword = await step.run("v6-filter-keywords", async () => {
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
    // Step 5: 記事生成
    // ========================================
    await step.run("v6-update-step-5", async () => {
      await updateProgress(5, "記事を執筆中（8,000-10,000文字目標）...");
    });

    // タイトル重複防止用：同カテゴリの既存タイトルを取得
    const existingTitles = await step.run("v6-get-existing-titles", async () => {
      const articles = await prisma.articles.findMany({
        where: {
          categoryId: pipelineData.categoryId,
          status: { in: ["PUBLISHED", "DRAFT"] }
        },
        select: { title: true },
        orderBy: { createdAt: "desc" },
        take: 20
      });
      const titles = articles.map(a => a.title).filter(Boolean);
      console.log(`[V6] Found ${titles.length} existing titles in same category for deduplication`);
      return titles;
    });

    const article = await step.run("v6-generate-article", async () => {
      const conversion = pipelineData.conversions[0] || { name: "無料体験", url: "#" };

      // カスタムプロンプト利用状況をログ出力
      const customPrompt = pipelineData.settings!.systemPrompt || null;
      console.log("[V6] Custom system prompt:", customPrompt ? "Yes" : "No (using default)");
      if (customPrompt) {
        console.log("[V6] Custom prompt preview:", customPrompt.slice(0, 100) + "...");
      }

      const result = await generateArticleV6(
        testimonials,
        selectedKeyword.keyword,
        supervisor,
        { name: conversion.name, url: conversion.url || "#" },
        pipelineData.category!.name,
        pipelineData.brand!.name,
        pipelineData.settings!.openRouterApiKey!,
        pipelineData.tags,
        existingTitles,
        customPrompt
      );

      if (!result) {
        throw new Error("Article generation failed");
      }

      return result;
    });

    // ========================================
    // Step 5.5: 関連記事を取得
    // ========================================
    const relatedArticles = await step.run("v6-fetch-related-articles", async () => {
      // 同カテゴリの公開記事を最大5件取得（生成中の記事タイトルを除外）
      const articles = await prisma.articles.findMany({
        where: {
          categoryId: pipelineData.categoryId,
          status: "PUBLISHED",
          deletedAt: null,
          // 生成中の記事タイトルとの重複を避ける
          title: { not: article.title }
        },
        select: {
          title: true,
          slug: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      console.log(`[V6] Found ${articles.length} related articles in category`);
      return articles;
    });

    // ========================================
    // Step 5.6: HTML後処理
    // ========================================
    const processedArticle = await step.run("v6-post-process-html", async () => {
      let html = article.html;
      const originalLength = html.length;

      // HTMLクリーンアップ
      html = cleanGeneratedHtml(html);
      console.log(`[V6] HTML cleaned: ${originalLength} -> ${html.length} chars`);

      // 自然なテキスト形式のCTAを挿入（バナー画像は使用しない）
      const ctaConversion = pipelineData.conversions[0];
      if (ctaConversion) {
        html = insertNaturalCTA(html, {
          name: ctaConversion.name,
          url: ctaConversion.url || "#",
        });
        console.log(`[V6] Natural CTA inserted: ${ctaConversion.name}`);
      }

      // 関連記事セクション挿入（公開記事がある場合のみ）
      html = insertRelatedArticles(html, pipelineData.category!.slug, relatedArticles);

      // テーブル修正
      html = fixTableHtml(html);

      // FAQスタイル改善
      html = improveFaqStyle(html);

      console.log(`[V6] HTML post-processing completed`);

      return {
        ...article,
        html,
      };
    });

    // ========================================
    // Step 6: 画像生成
    // ========================================
    await step.run("v6-update-step-6", async () => {
      await updateProgress(6, "画像を生成中...");
    });

    const images = await step.run("v6-generate-images", async () => {
      // 体験談の内容から画像コンテキストを作成
      const mainTestimonial = testimonials[0];
      const testimonialSummary = mainTestimonial?.content?.substring(0, 200) || "";

      return await generateImagesV6(
        {
          title: processedArticle.title,
          testimonialSummary,
          categoryName: pipelineData.category!.name,
        },
        pipelineData.settings!.openRouterApiKey!,
        pipelineData.imageStyle
      );
    });

    // 画像挿入
    const htmlWithImages = await step.run("v6-insert-images", async () => {
      return insertImagesIntoHtml(processedArticle.html, images);
    });

    // ========================================
    // Step 7: 下書き保存
    // ========================================
    await step.run("v6-update-step-7", async () => {
      await updateProgress(7, "下書きを保存中...");
    });

    const savedArticle = await step.run("v6-save-draft", async () => {
      let finalSlug = processedArticle.slug;
      const existingSlug = await prisma.articles.findFirst({
        where: { slug: finalSlug }
      });
      if (existingSlug) {
        finalSlug = `${processedArticle.slug}-${randomUUID().substring(0, 8)}`;
        console.log(`[V6] Slug conflict. Using: ${finalSlug}`);
      }

      const coverImage = images.find(img => img.slot === "cover");
      const inbodyImages = images.filter(img => img.slot !== "cover");

      // Schema.org構造化データを生成（SEO/LLMO最適化）
      const brandUrl = pipelineData.brand?.url || `https://${pipelineData.brand?.name?.toLowerCase().replace(/\s+/g, '')}.com`;
      const schemaJsonLd = generateSchemaJsonLd(
        processedArticle,
        supervisor,
        pipelineData.brand!.name,
        brandUrl,
        coverImage?.url
      );

      console.log(`[V6] Generated Schema.org JSON-LD with ${processedArticle.faqItems?.length || 0} FAQ items`);
      console.log(`[V6] LLMO Summary: ${processedArticle.llmoShortSummary?.substring(0, 50)}...`);

      // 記事を保存（LLMO最適化フィールド含む）
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
          categoryId: pipelineData.categoryId,
          authorId: pipelineData.authorId,
          brandId: pipelineData.brand?.id || "",
          generationJobId: jobId,
          createdById: pipelineData.userId,
          thumbnailId: coverImage?.assetId,
          version: 1,
          // LLMO (Large Language Model Optimization) fields
          llmoShortSummary: processedArticle.llmoShortSummary || null,
          llmoKeyTakeaways: processedArticle.llmoKeyTakeaways || [],
          schemaJsonLd: schemaJsonLd as Prisma.InputJsonValue,
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

      // 使用した全ての受講生の声を紐付け（メイン＋追加の声）
      const allVoiceIds = testimonials.map(t => t.id).filter(Boolean);
      if (allVoiceIds.length > 0) {
        await prisma.article_knowledge_items.createMany({
          data: allVoiceIds.map(id => ({
            articleId: newArticle.id,
            knowledgeItemId: id,
          })),
          skipDuplicates: true,
        });

        // usageCountはジョブ作成時点でインクリメント済み（重複選択防止のため）
        // ここでは記事との紐付けのみ行う

        console.log(`[V6] Linked ${allVoiceIds.length} knowledge items to article`);
      }

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

        console.log(`[V6] Attached ${matchedTags.length} tags`);
      }

      // カテゴリの記事数を更新
      await prisma.categories.update({
        where: { id: pipelineData.categoryId },
        data: { articlesCount: { increment: 1 } }
      });

      return newArticle;
    });

    // ========================================
    // 完了
    // ========================================
    await step.run("v6-complete-job", async () => {
      // 文字数を計算
      const textOnly = htmlWithImages.replace(/<[^>]*>/g, "");

      await prisma.generation_jobs.update({
        where: { id: jobId },
        data: {
          status: GenerationJobStatus.COMPLETED,
          progress: 100,
          statusMessage: "完了",
          completedAt: new Date(),
          stageOutputs: {
            testimonialCount: testimonials.length,
            mainVoiceId: testimonials[0].id,
            supervisorName: supervisor.name,
            selectedKeyword: selectedKeyword,
            articleId: savedArticle.id,
            imagesGenerated: images.length,
            characterCount: textOnly.length,
          } as unknown as Prisma.InputJsonValue,
        }
      });
    });

    console.log(`[Pipeline V6] Completed! Article: ${savedArticle.id}`);

    return {
      success: true,
      articleId: savedArticle.id,
      keyword: selectedKeyword.keyword,
      title: processedArticle.title,
      testimonialCount: testimonials.length,
    };
  }
);
