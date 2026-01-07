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
    .png()
    .toBuffer();
}

async function generateImageWithGemini(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const shortPrompt = prompt.length > 400 ? prompt.substring(0, 400) : prompt;

    console.log(`[V6] Generating image with model: ${IMAGE_MODEL}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const requestBody = {
      model: IMAGE_MODEL,
      messages: [{ role: "user", content: shortPrompt }],
      modalities: ["image", "text"],
    };

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
        const filePath = `generated/${Date.now()}-${randomUUID()}.png`;
        const { url } = await uploadImage("MEDIA", filePath, fittedBuffer, "image/png");
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
// Step 1: 複数の受講生の声を取得
// ========================================

async function collectMultipleTestimonials(
  mainKnowledgeId?: string,
  categoryId?: string
): Promise<StudentVoice[]> {
  const voices: StudentVoice[] = [];

  // メインの声を取得
  if (mainKnowledgeId) {
    const mainVoice = await prisma.knowledge_items.findUnique({
      where: { id: mainKnowledgeId }
    });
    if (mainVoice) {
      voices.push({ id: mainVoice.id, title: mainVoice.title, content: mainVoice.content });
    }
  }

  // メインがない場合、ランダムに1件選択
  if (voices.length === 0) {
    const usedItems = await prisma.article_knowledge_items.findMany({
      select: { knowledgeItemId: true }
    });
    const usedIds = usedItems.map(i => i.knowledgeItemId);

    const availableVoices = await prisma.knowledge_items.findMany({
      where: {
        type: "STUDENT_VOICE",
        id: usedIds.length > 0 ? { notIn: usedIds } : undefined
      }
    });

    if (availableVoices.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableVoices.length);
      const voice = availableVoices[randomIndex];
      voices.push({ id: voice.id, title: voice.title, content: voice.content });
    }
  }

  if (voices.length === 0) {
    return [];
  }

  // 追加の声を2件取得（同じカテゴリまたは全体から）
  const additionalVoices = await prisma.knowledge_items.findMany({
    where: {
      type: "STUDENT_VOICE",
      id: { notIn: voices.map(v => v.id) }
    },
    take: 2,
    orderBy: { createdAt: "desc" }
  });

  for (const voice of additionalVoices) {
    voices.push({ id: voice.id, title: voice.title, content: voice.content });
  }

  console.log(`[V6] Collected ${voices.length} testimonials`);
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
  availableTags: { name: string; slug: string }[]
): string {
  const mainTestimonial = testimonials[0];
  const additionalTestimonials = testimonials.slice(1);

  // 追加の体験談テキスト
  const additionalTestimonialsText = additionalTestimonials.map((t, i) =>
    `【体験者${i + 2}】\n${t.content}`
  ).join("\n\n");

  // ============================================================
  // 新プロンプト：私（Claude）が記事を書くときのアプローチを言語化
  // ============================================================
  return `# 記事執筆の依頼

あなたはプロの編集者・ライターです。以下の体験談をもとに、読者の心を動かす記事を書いてください。

---

## あなたの執筆アプローチ

記事を書く前に、まずこの3つを心に留めてください：

### 1. 読者を想像する
この記事を読む人は「${keyword}」と検索してきた人です。
- 何に悩んでいるのか？
- 何を期待して読み始めるのか？
- 読んだ後、どんな気持ちになってほしいか？

### 2. ストーリーを語る
情報を羅列するのではなく、主人公のいる物語を書いてください。
- 「壁」にぶつかる → 「気づき」を得る → 「変化」が起きる
- 読者が自分を重ね合わせられる描写を

### 3. 映像が浮かぶように書く
抽象的な説明ではなく、具体的なシーンを描いてください。
- ❌「不安だった」→ ✅「初日の朝、玄関で5分間立ち止まった」
- ❌「続けられた」→ ✅「3週目の朝、目覚ましより先に目が覚めた」

---

## 体験談（素材）

### メインの体験談
${mainTestimonial.content}

${additionalTestimonialsText ? `### 追加の体験談\n${additionalTestimonialsText}` : ""}

---

## 監修者情報

- **名前**: ${supervisor.name}
- **役職**: ${supervisor.role}
- **プロフィール**: ${supervisor.bio}
${supervisor.philosophy ? `- **指導理念**: ${supervisor.philosophy}` : ""}

監修者コメントは記事中に2〜3箇所入れてください。
「誰でも言えること」ではなく、**この監修者だからこそ言える具体的なエピソード**を書いてください。

例：「私のクラスにも同じような方がいました。最初は〇〇でしたが、2ヶ月後には△△と言ってくれました」

---

## 記事の構成

1. **導入**（300〜400文字）
   - 読者の心の声を代弁する。「〇〇、と思っていませんか？」

2. **体験談の深掘り**（2,500〜3,500文字）
   - 体験者の人物像を立体的に描く
   - Before → During → After の流れ
   - 監修者コメント①を挿入

3. **他の受講生の声**（800〜1,200文字）
   - 異なる属性・視点の体験を紹介
   - メイン体験談との共通点を見つける

4. **実践情報**（1,200〜1,500文字）
   - 具体的なステップ（3〜5つ）
   - よくある失敗と対策
   - 監修者コメント②を挿入

5. **スクール紹介**（400〜600文字）
   - 体験談の延長として自然に紹介
   - 「〇〇さんが学んだシークエンスでは...」の形で

6. **FAQ**（5問、800〜1,000文字）
   - 読者の核心的な不安に答える
   - 1問あたり150〜200文字で深く回答

7. **まとめ**（300〜400文字）
   - 要点を3つに絞る
   - 監修者コメント③（励まし）
   - 次のアクションへの自然な誘導

8. **CTA**
   - 「${conversion.name}」への誘導
   - URL: ${conversion.url}

---

## 文字数目標
8,000〜10,000文字（HTML込み）

---

## 文体について

人間らしい文体で書いてください。教科書的な説明は不要です。

### 良い例
- 「朝6時、子どもが起きる前の1時間。これが私のヨガ時間になった」
- 「ピラティスは"鍛える"。ヨガは"ほぐす"。私はずっと鍛えることしか知らなかった」

### 避けるべき表現
- 「〜といえます」「〜ではないでしょうか」「〜と考えられます」
- 文頭の「また、」「そして、」「さらに、」
- 「〇〇とは、〜です」で始まる段落

---

## 体験者の発言スタイル

「」で囲まれた発言は、視覚的に区別してください：

\`\`\`html
<p class="voice">「毎日10分のヨガで、肩こりが楽になりました」と田中さん（30代・会社員）は話します。</p>
\`\`\`

複数の声：
\`\`\`html
<ul class="voices">
  <li>「最初は体が硬くて不安でした」（40代・主婦）</li>
  <li>「3ヶ月で姿勢が変わった実感があります」（30代・デスクワーク）</li>
</ul>
\`\`\`

---

## 監修者コメントのHTML

\`\`\`html
<blockquote class="supervisor-comment">
  <div class="comment-header">
    <span class="supervisor-name">${supervisor.name}</span>
    <span class="supervisor-role">${supervisor.role}</span>
  </div>
  <p>コメント内容（150〜250文字）</p>
</blockquote>
\`\`\`

---

## タイトルについて

体験談の内容から、読者が思わずクリックしたくなるタイトルを作成してください。

**良いタイトルの特徴：**
- 具体的な数字や期間が入っている
- 読者の悩みや疑問が反映されている
- 意外性や感情の変化が伝わる

**例：**
- 「週2回、3ヶ月。私の肩こりはどこへ消えた？」
- 「40歳、体硬い、運動嫌い。それでもヨガを始めた理由」
- 「『向いてない』と思っていた私へ」

**避けるパターン：**
- 「【体験談】〇〇した話」「〇〇の本音レビュー」
- 「〇〇だった私が、〜まで」
- 「〜を解説」「〜のメリット・デメリット」

---

## メタ情報

- **カテゴリ**: ${categoryName}
- **メディア名**: ${brandName}
- **狙うキーワード**: ${keyword}

**利用可能なタグ**:
${availableTags.map(t => t.slug).join(', ')}
→ 3〜5個選んでください

---

## 出力形式

JSON形式で出力してください：

\`\`\`json
{
  "title": "タイトル（32文字以内）",
  "slug": "url-slug-in-romaji",
  "metaTitle": "メタタイトル | ${brandName}",
  "metaDescription": "120〜140文字のディスクリプション",
  "html": "記事本文のHTML（<article>タグで囲む）",
  "tagSlugs": ["slug1", "slug2", "slug3"]
}
\`\`\`

**HTMLの注意：**
- 見出しはH2、H3を使用
- 画像: \`<!-- IMAGE_PLACEHOLDER: cover -->\`, \`<!-- IMAGE_PLACEHOLDER: inbody_1 -->\`, \`<!-- IMAGE_PLACEHOLDER: inbody_2 -->\`
- CSSクラスを使用（インラインスタイルは使わない）`;
}

async function generateArticleV6(
  testimonials: StudentVoice[],
  keyword: string,
  supervisor: SupervisorContext,
  conversion: { name: string; url: string },
  categoryName: string,
  brandName: string,
  apiKey: string,
  availableTags: { name: string; slug: string }[]
): Promise<ArticleStructure | null> {
  const prompt = buildV6ArticlePrompt(
    testimonials,
    keyword,
    supervisor,
    conversion,
    categoryName,
    brandName,
    availableTags
  );

  const systemPrompt = "あなたは経験豊富なSEOライターです。指示に従って8,000〜10,000文字の記事をJSONのみで出力してください。";

  console.log("[V6] Generating article with enhanced prompt...");

  const response = await callOpenRouter<ArticleStructure>(
    systemPrompt,
    prompt,
    {
      apiKey,
      // デフォルトの claude-opus-4.5 を使用（高品質な記事生成のため）
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

// ヨガポーズのバリエーション（カバー画像用）
const YOGA_POSES_COVER = [
  "performing Warrior II pose (Virabhadrasana II) with arms extended wide, strong stance, looking over front hand",
  "in a graceful Tree pose (Vrksasana), one leg raised, hands in prayer position above head, balanced and serene",
  "doing Downward-facing Dog pose (Adho Mukha Svanasana), forming an inverted V shape, grounded and stable",
  "in Triangle pose (Trikonasana), one arm reaching up, body forming a beautiful geometric shape",
  "practicing Warrior I pose (Virabhadrasana I), arms raised overhead, powerful lunging stance",
  "in a seated Lotus pose (Padmasana), hands on knees, peaceful meditation posture",
  "doing Cobra pose (Bhujangasana), chest lifted, gentle backbend, looking forward with calm expression",
  "in Cat-Cow pose on all fours, spine arched gracefully, connecting breath with movement",
];

// ヨガポーズのバリエーション（本文画像用）
const YOGA_POSES_INBODY = [
  "in Child's pose (Balasana), resting peacefully, arms extended forward, deeply relaxed",
  "doing Bridge pose (Setu Bandhasana), hips lifted, creating a beautiful arch with the body",
  "in Seated Forward Bend (Paschimottanasana), folding gently over legs, stretching the back",
  "practicing Mountain pose (Tadasana), standing tall with perfect alignment, grounded and present",
  "in Half Moon pose (Ardha Chandrasana), balanced on one leg, other leg extended, arm reaching up",
  "doing Pigeon pose (Eka Pada Rajakapotasana), deep hip opener, peaceful expression",
];

/**
 * タイトルから決定論的にポーズを選択（同じタイトルなら同じポーズ）
 */
function selectYogaPose(title: string, poses: string[]): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i);
    hash = hash & hash;
  }
  return poses[Math.abs(hash) % poses.length];
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

  // タイトルに基づいてヨガポーズを選択
  const coverPose = selectYogaPose(context.title, YOGA_POSES_COVER);
  const inbodyPose1 = selectYogaPose(context.title + "1", YOGA_POSES_INBODY);
  const inbodyPose2 = selectYogaPose(context.title + "2", YOGA_POSES_COVER);

  // スロットごとに異なるシーンを生成（ヨガポーズ中心）
  const scenePrompts: Record<"cover" | "inbody_1" | "inbody_2", string> = {
    cover: `${baseStyle}
A ${personHint} ${coverPose} on a yoga mat in a bright, airy yoga studio. Soft natural light. Focus on the yoga pose and form. The woman looks calm, focused, and confident. Clean, minimal background with subtle plant decoration.`,

    inbody_1: `${baseStyle}
A ${personHint} ${inbodyPose1} on a yoga mat. Peaceful atmosphere with soft lighting. Focus on the yoga practice and inner peace. Serene expression showing mindfulness and concentration.`,

    inbody_2: `${baseStyle}
A ${personHint} ${inbodyPose2} on a yoga mat. Warm, encouraging atmosphere. Showing progress and dedication to yoga practice. Confident posture and peaceful expression. Modern yoga studio setting.`,
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

  // ヨガポーズ選択
  const pose = selectYogaPose(context.title, YOGA_POSES_COVER);

  // 3つの構図パターン
  type CompositionType = "CLOSE" | "MEDIUM" | "WIDE";
  const compositions: Record<CompositionType, { baseStyle: string; sceneryOptions: string[] }> = {
    // CLOSE: 人物にフォーカス（30-50%）、背景ぼかし
    CLOSE: {
      baseStyle: `Professional yoga photography with shallow depth of field. Focus on the yoga practitioner with a beautifully blurred background. The person takes up 30-50% of the frame. Soft, dreamy bokeh effect. Realistic photo style, NOT illustration, NOT cartoon. High resolution, magazine quality. No text overlays. No watermarks.`,
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
      baseStyle: `Balanced yoga lifestyle photography showing both practitioner and environment. The person takes up 15-30% of the frame, harmoniously placed within the scenic setting. Professional composition with clear subject and context. Realistic photo style, NOT illustration, NOT cartoon. High resolution. No text overlays. No watermarks.`,
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
      baseStyle: `Stunning wide-angle landscape photography featuring yoga. Shot from a distance showing the full scenic environment. The focus is on the breathtaking natural backdrop, with the yoga practitioner appearing small (5-15% of frame) as part of the grand scenery. Cinematic composition, high resolution. Realistic photo style, NOT illustration, NOT cartoon. No text overlays. No watermarks.`,
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

  return `${composition.baseStyle}\n${selectedScenery}`;
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

  // タイトルに基づいてヨガポーズを選択
  const coverPose = selectYogaPose(context.title, YOGA_POSES_COVER);
  const inbodyPose1 = selectYogaPose(context.title + "1", YOGA_POSES_INBODY);
  const inbodyPose2 = selectYogaPose(context.title + "2", YOGA_POSES_COVER);

  // スロットごとに異なるシーンを生成（リアル写真風・ヨガポーズ中心）
  const scenePrompts: Record<"cover" | "inbody_1" | "inbody_2", string> = {
    cover: `${baseStyle}
A ${personHint} ${coverPose} on a premium yoga mat in a bright, modern yoga studio. Beautiful natural light streaming through large windows. Focus on perfect yoga form and alignment. Professional yoga photography capturing the essence of practice. Clean, minimalist studio with wooden floors and plants.`,

    inbody_1: `${baseStyle}
A ${personHint} ${inbodyPose1} on a yoga mat. Soft, diffused lighting creating a peaceful atmosphere. Focus on the yoga practice and mindful movement. Serene expression showing deep concentration. Professional fitness photography style.`,

    inbody_2: `${baseStyle}
A ${personHint} ${inbodyPose2} on a yoga mat. Golden hour lighting creating warmth. Capturing strength, flexibility, and inner peace through the pose. Confident and grounded posture. High-end yoga studio or wellness center setting.`,
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

  // タイトルに基づいてヨガポーズを選択
  const coverPose = selectYogaPose(context.title, YOGA_POSES_COVER);
  const inbodyPose1 = selectYogaPose(context.title + "1", YOGA_POSES_INBODY);
  const inbodyPose2 = selectYogaPose(context.title + "2", YOGA_POSES_COVER);

  // スロットごとに異なる風景シーンを生成
  const scenePrompts: Record<"cover" | "inbody_1" | "inbody_2", string> = {
    cover: `${baseStyle}
A ${personHint} ${coverPose} on a wooden deck overlooking misty mountains at sunrise. Golden hour lighting with warm sun rays. Silhouette with beautiful backlighting. Peaceful, meditative atmosphere with breathtaking natural scenery. Shot from behind or side angle.`,

    inbody_1: `${baseStyle}
A ${personHint} ${inbodyPose1} in an outdoor setting with lush green nature. Soft morning light filtering through trees. Yoga mat on grass or natural surface. Serene forest or garden backdrop. Harmonious blend of yoga practice and nature.`,

    inbody_2: `${baseStyle}
A ${personHint} ${inbodyPose2} at sunset on a rooftop or terrace with city skyline in the background. Warm golden and pink tones in the sky. Urban wellness lifestyle. Balance between modern life and mindful practice.`,
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
          fileName: `v6-${slot}-${Date.now()}.png`,
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

  for (const image of images) {
    const placeholder = `<!-- IMAGE_PLACEHOLDER: ${image.slot} -->`;
    const isCover = image.slot === "cover";

    const imgTag = `<img src="${image.url}" alt="${image.alt}" width="${image.width}" height="${image.height}" loading="${isCover ? 'eager' : 'lazy'}" />`;

    result = result.replace(placeholder, imgTag);
  }

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
      const voices = await collectMultipleTestimonials(pipelineData.knowledgeItem?.id, pipelineData.categoryId);
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
      if (!analysis) {
        throw new Error("Theme analysis failed");
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

    const article = await step.run("v6-generate-article", async () => {
      const conversion = pipelineData.conversions[0] || { name: "無料体験", url: "#" };

      const result = await generateArticleV6(
        testimonials,
        selectedKeyword.keyword,
        supervisor,
        { name: conversion.name, url: conversion.url || "#" },
        pipelineData.category!.name,
        pipelineData.brand!.name,
        pipelineData.settings!.openRouterApiKey!,
        pipelineData.tags
      );

      if (!result) {
        throw new Error("Article generation failed");
      }

      return result;
    });

    // ========================================
    // Step 5.5: HTML後処理
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

      // 関連記事セクション挿入
      html = insertRelatedArticles(html, pipelineData.category!.slug);

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

      // 記事を保存
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

      // メインの受講生の声を紐付け
      const mainVoice = testimonials[0];
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
