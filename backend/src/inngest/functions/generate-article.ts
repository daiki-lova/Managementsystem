import { inngest } from "../client";
import prisma from "@/lib/prisma";
import { ArticleStatus, GenerationJobStatus } from "@prisma/client";
import { getDecryptedSettings } from "@/lib/settings";
import { randomUUID } from "crypto";

// 記事生成関数
export const generateArticle = inngest.createFunction(
  {
    id: "generate-article",
    name: "Generate Article",
    retries: 3,
    // リトライ間隔の設定（指数バックオフ）
    onFailure: async ({ error, event }) => {
      const eventData = (event as { data?: { jobId?: string; userId?: string; keyword?: string } }).data;
      const jobId = eventData?.jobId;
      const userId = eventData?.userId;
      const keyword = eventData?.keyword;
      console.error("Article generation failed:", error?.message, "Job:", jobId);
      // ジョブをFAILEDに更新
      if (!jobId || !userId) return;
      try {
        await prisma.generation_jobs.update({
          where: { id: jobId },
          data: {
            status: GenerationJobStatus.FAILED,
            errorMessage: error?.message || "Unknown error",
          },
        });
        // 失敗通知を作成
        await prisma.notifications.create({
          data: {
            id: randomUUID(),
            userId,
            type: "GENERATION_FAILED",
            title: "記事生成失敗",
            message: `「${keyword || "不明"}」の記事生成に失敗しました: ${error?.message || "Unknown error"}`,
            metadata: { jobId },
          },
        });
      } catch (e) {
        console.error("Failed to update job status:", e);
      }
    },
    // タイムアウト設定（5分）
    cancelOn: [
      {
        event: "article/cancel-generation",
        match: "data.jobId",
      },
    ],
  },
  { event: "article/generate" },
  async ({ event, step }) => {
    // 冪等性: Inngestのstep.run()は名前をキーとして同じステップを二度実行しない
    // さらにjobId単位でイベント発火を制御することで重複生成を防止
    const {
      jobId,
      keyword,
      categoryId,
      authorId,
      brandId,
      conversionIds,
      knowledgeItemIds,
      userId,
    } = event.data;

    // ジョブステータスを「実行中」に更新
    await step.run("update-job-running", async () => {
      await prisma.generation_jobs.update({
        where: { id: jobId },
        data: {
          status: GenerationJobStatus.RUNNING,
          progress: 10,
        },
      });
    });

    // 必要なデータを取得
    const [category, author, brand, conversions, knowledgeItems, settings] =
      await step.run("fetch-data", async () => {
        return Promise.all([
          prisma.categories.findUnique({ where: { id: categoryId } }),
          prisma.authors.findUnique({ where: { id: authorId } }),
          prisma.brands.findUnique({ where: { id: brandId } }),
          prisma.conversions.findMany({
            where: { id: { in: conversionIds } },
          }),
          prisma.knowledge_items.findMany({
            where: { id: { in: knowledgeItemIds } },
          }),
          // 暗号化されたAPIキーを復号して取得
          getDecryptedSettings(),
        ]);
      });

    if (!category || !author || !brand) {
      await prisma.generation_jobs.update({
        where: { id: jobId },
        data: {
          status: GenerationJobStatus.FAILED,
          errorMessage: "必要なデータが見つかりません",
        },
      });
      throw new Error("Required data not found");
    }

    // 進捗更新
    await step.run("update-progress-20", async () => {
      await prisma.generation_jobs.update({
        where: { id: jobId },
        data: { progress: 20 },
      });
    });

    // 記事を生成
    const articleContent = await step.run("generate-content", async () => {
      if (!settings?.openRouterApiKey) {
        throw new Error("OpenRouter API key is not configured");
      }

      return generateArticleContent({
        keyword,
        category: category.name,
        authors: {
          name: author.name,
          role: author.role,
          systemPrompt: author.systemPrompt,
        },
        conversions: conversions.map((c) => ({
          name: c.name,
          context: c.context,
        })),
        knowledgeItems: knowledgeItems.map((k) => ({
          title: k.title,
          content: k.content,
        })),
        apiKey: settings.openRouterApiKey,
        model: settings.articleModel || "openai/gpt-4o",
      });
    });

    // 進捗更新
    await step.run("update-progress-70", async () => {
      await prisma.generation_jobs.update({
        where: { id: jobId },
        data: { progress: 70 },
      });
    });

    // 記事を保存
    const article = await step.run("save-article", async () => {
      // スラッグを生成
      const slug = generateSlug(keyword);

      // 記事を作成
      const newArticle = await prisma.articles.create({
        data: {
          id: randomUUID(),
          title: articleContent.title,
          slug,
          blocks: articleContent.blocks,
          status: ArticleStatus.DRAFT,
          categoryId,
          authorId,
          brandId,
          createdById: userId,
          generationJobId: jobId,
          metaTitle: articleContent.metaTitle,
          metaDescription: articleContent.metaDescription,
          // コンバージョンを紐づけ
          article_conversions: {
            create: conversionIds.map((conversionId: string, index: number) => ({
              id: randomUUID(),
              conversionId,
              position: index,
            })),
          },
          // 情報バンクを紐づけ
          article_knowledge_items: {
            create: knowledgeItemIds.map((knowledgeItemId: string) => ({
              knowledgeItemId,
            })),
          },
        },
      });

      // 情報バンクの使用回数を更新
      await prisma.knowledge_items.updateMany({
        where: { id: { in: knowledgeItemIds } },
        data: { usageCount: { increment: 1 } },
      });

      // カテゴリの記事数を更新
      await prisma.categories.update({
        where: { id: categoryId },
        data: { articlesCount: { increment: 1 } },
      });

      return newArticle;
    });

    // 画像生成イベントを発火
    await step.sendEvent("trigger-image-generation", {
      name: "article/generate-images",
      data: {
        articleId: article.id,
        jobId,
      },
    });

    // ジョブを完了
    await step.run("complete-job", async () => {
      await prisma.generation_jobs.update({
        where: { id: jobId },
        data: {
          status: GenerationJobStatus.COMPLETED,
          progress: 100,
          completedAt: new Date(),
        },
      });

      // 通知を作成
      await prisma.notifications.create({
        data: {
          id: randomUUID(),
          userId,
          type: "GENERATION_COMPLETE",
          title: "記事生成完了",
          message: `「${articleContent.title}」の生成が完了しました`,
          metadata: { articleId: article.id, jobId },
        },
      });
    });

    return { articleId: article.id, title: articleContent.title };
  }
);

// 記事コンテンツ生成
interface GenerateContentParams {
  keyword: string;
  category: string;
  authors: {
    name: string;
    role: string;
    systemPrompt: string;
  };
  conversions: { name: string; context: string }[];
  knowledgeItems: { title: string; content: string }[];
  apiKey: string;
  model: string;
}

interface GeneratedContent {
  title: string;
  blocks: object[];
  metaTitle: string;
  metaDescription: string;
}

async function generateArticleContent(
  params: GenerateContentParams
): Promise<GeneratedContent> {
  const { keyword, category, authors: author, conversions, knowledgeItems, apiKey, model } =
    params;

  // コンテキスト情報を構築
  const knowledgeContext = knowledgeItems.length > 0
    ? `\n\n【参考情報】\n${knowledgeItems.map((k) => `- ${k.title}: ${k.content.slice(0, 500)}`).join("\n")}`
    : "";

  const conversionContext = conversions.length > 0
    ? `\n\n【訴求ポイント】\n${conversions.map((c) => `- ${c.name}: ${c.context}`).join("\n")}`
    : "";

  const GLOBAL_RULES = `
【構成作成・執筆・SEOの共通ルール】
1. **構成作成（PREP法）**:
   - 読者が知りたい結論を最初に提示する。
   - 各見出しは具体的かつ魅力的にし、読み飛ばしを防ぐ。
   - 記事の最後には具体的なアクションプランを提示する。

2. **SEO最適化**:
   - メインキーワード、共起語、関連クエリを自然に網羅する。
   - タイトルは32文字以内、メタディスクリプションは120文字以内とし、クリック率を意識する。
   - 内部リンクの提案を含め、サイト回遊率を高める構造にする。

3. **品質管理（E-E-A-T）**:
   - 断定表現を使う場合は根拠を明確にする。
   - 専門用語には補足を入れ、誰にでもわかる表現にする。
   - ユーザーの潜在的な悩み（インサイト）に寄り添い、感情を動かす執筆をする。`;

  const systemPrompt = `${author.systemPrompt}

${GLOBAL_RULES}

あなたは「${author.name}」（${author.role}）として、ヨガに関する記事を執筆します。
カテゴリ: ${category}
${knowledgeContext}
${conversionContext}

記事はJSON形式で出力してください。以下の形式に従ってください：
{
  "title": "記事タイトル（32文字以内・SEO最適化）",
  "metaTitle": "SEOタイトル（32文字以内）",
  "metaDescription": "メタディスクリプション（120文字以内・興味付け）",
  "blocks": [
    {"id": "unique-id", "type": "p", "content": "段落テキスト"},
    {"id": "unique-id", "type": "h2", "content": "見出し2"},
    {"id": "unique-id", "type": "h3", "content": "見出し3"},
    {"id": "unique-id", "type": "ul", "content": "リスト項目1\\nリスト項目2"},
    {"id": "unique-id", "type": "blockquote", "content": "引用文"},
    {"id": "unique-id", "type": "callout", "content": "重要なポイント"},
    {"id": "unique-id", "type": "internal-link", "content": "関連記事: [記事タイトル]"}
  ]
}

記事の構成：
1. 導入部（共感＋結論）
2. 本題（H2で3-5セクション、各セクションにH3を含む、PREP法）
3. 実践的なアドバイス（今すぐできること）
4. まとめ（アクションプラン）

注意点：
- 各ブロックのidはユニークな文字列
- 3000-5000文字程度の充実した内容
- 読みやすく、SEOに最適化された内容
- ユーザーに語りかけるような文体（です・ます調）`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3001",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `以下のキーワードで記事を作成してください: 「${keyword}」`,
        },
      ],
      max_tokens: 4000,
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouter API error:", errorText);
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content generated");
  }

  try {
    return JSON.parse(content) as GeneratedContent;
  } catch {
    throw new Error("Failed to parse generated content");
  }
}

// スラッグ生成
function generateSlug(keyword: string): string {
  // キーワードをローマ字化（簡易実装）
  const romanized = keyword
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  // ランダムIDを付与して一意性を確保
  const randomId = Math.random().toString(36).substring(2, 8);

  return `${romanized}-${randomId}`;
}
