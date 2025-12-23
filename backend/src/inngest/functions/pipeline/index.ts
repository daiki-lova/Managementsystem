// 3ステップ記事生成パイプライン

import { inngest } from "../../client";
import prisma from "@/lib/prisma";
import { ArticleStatus, GenerationJobStatus, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { getDecryptedSettings } from "@/lib/settings";
import {
  type Stage1Input,
  type Stage1Output,
  type Stage2Input,
  type Stage2Output,
  type AllStageOutputs,
  STAGE_PROGRESS,
  STAGE_LABELS,
} from "./common/types";
import {
  callOpenRouter,
  callOpenRouterText,
  STAGE_MODEL_CONFIG,
} from "./common/openrouter";
import {
  extractImagePlaceholders,
  replacePromptVariables,
  cleanGeneratedHtml,
  insertCTABanner,
  insertRelatedArticles,
  insertSupervisorQuote,
  fixTableHtml,
  improveFaqStyle,
  DEFAULT_TITLE_PROMPT,
  DEFAULT_ARTICLE_PROMPT,
} from "./common/prompts";

// 記事生成パイプライン
export const generateArticlePipeline = inngest.createFunction(
  {
    id: "generate-article-pipeline",
    name: "Generate Article Pipeline (3 Steps)",
    retries: 2,
    onFailure: async ({ error, event }) => {
      const eventData = (event as { data?: { jobId?: string; userId?: string; keyword?: string } }).data;
      const jobId = eventData?.jobId;
      const userId = eventData?.userId;
      const keyword = eventData?.keyword;
      console.error("Pipeline failed:", error?.message, "Job:", jobId);

      if (!jobId || !userId) return;
      try {
        await prisma.generation_jobs.update({
          where: { id: jobId },
          data: {
            status: GenerationJobStatus.FAILED,
            errorMessage: error?.message || "Unknown error",
          },
        });
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
    cancelOn: [
      {
        event: "article/cancel-generation",
        match: "data.jobId",
      },
    ],
  },
  { event: "article/generate-pipeline" },
  async ({ event, step }) => {
    const {
      jobId,
      keyword,
      categoryId,
      authorId,
      brandId,
      conversionIds,
      userId,
    } = event.data;

    // 進捗更新ヘルパー
    const updateProgress = async (stage: number, label: string) => {
      const progress = STAGE_PROGRESS[stage as keyof typeof STAGE_PROGRESS] || 0;
      await prisma.generation_jobs.update({
        where: { id: jobId },
        data: {
          progress,
          currentStage: stage,
          statusMessage: label,
        },
      });
    };

    // ========================================
    // Step 0: ジョブを開始状態に更新 & データ取得
    // ========================================
    const pipelineData = await step.run("start-and-fetch-data", async () => {
      // ジョブを開始状態に更新
      await prisma.generation_jobs.update({
        where: { id: jobId },
        data: {
          status: GenerationJobStatus.RUNNING,
          progress: 0,
          currentStage: 0,
          statusMessage: "パイプライン開始...",
        },
      });

      // 必要なデータを取得
      const [category, author, brand, conversions, knowledgeItems] = await Promise.all([
        prisma.categories.findUnique({ where: { id: categoryId } }),
        prisma.authors.findUnique({ where: { id: authorId } }),
        prisma.brands.findUnique({ where: { id: brandId } }),
        // conversionIdsが空の場合はアクティブなconversionsを全て取得
        conversionIds && conversionIds.length > 0
          ? prisma.conversions.findMany({
              where: { id: { in: conversionIds } },
            })
          : prisma.conversions.findMany({
              where: { status: "ACTIVE" },
              take: 1, // 最初の1件のみ使用
            }),
        // 監修者に紐づく情報バンクを取得
        prisma.knowledge_items.findMany({
          where: { authorId },
        }),
      ]);

      if (!category || !author || !brand) {
        throw new Error("必要なデータが見つかりません");
      }

      // 設定を取得
      const settings = await getDecryptedSettings();
      if (!settings?.openRouterApiKey) {
        throw new Error("OpenRouter APIキーが設定されていません");
      }

      return {
        category,
        author,
        brand,
        conversions,
        knowledgeItems,
        settings,
      };
    });

    // 全ステージの出力を保持
    const stageOutputs: AllStageOutputs = {};

    // ========================================
    // Step 1: タイトル生成
    // ========================================
    await step.run("update-stage-1-progress", async () => {
      await updateProgress(1, STAGE_LABELS[1]);
    });

    // サイトドメインを環境変数から取得（なければスラッグを使用）
    const siteDomain = process.env.SITE_DOMAIN || `${pipelineData.brand.slug}.jp`;

    const stage1Result = await step.run("execute-stage-1-title", async () => {
      const input: Stage1Input = {
        keyword,
        categoryId,
        categoryName: pipelineData.category.name,
        brandName: pipelineData.brand.name,
        brandDomain: siteDomain,
      };

      // 設定のtitlePromptがあればそれを使用、なければDEFAULT_TITLE_PROMPTを使用
      // どちらの場合も同じ変数置換を適用（UIと同じロジック）
      const baseTitlePrompt = pipelineData.settings.titlePrompt || DEFAULT_TITLE_PROMPT;
      const prompt = baseTitlePrompt
        .replace(/\{\{KEYWORD\}\}/g, keyword)
        .replace(/\{\{CATEGORY\}\}/g, pipelineData.category.name)
        .replace(/\{\{BRAND_NAME\}\}/g, pipelineData.brand.name);
      // OpenRouter用システムプロンプト（短く固定）
      const systemPrompt = "あなたはSEOに精通した編集者です。指示に従ってJSONのみを出力してください。";

      const response = await callOpenRouter<Stage1Output>(
        systemPrompt,
        prompt,
        {
          apiKey: pipelineData.settings.openRouterApiKey!,
          ...STAGE_MODEL_CONFIG.title_generation,
        }
      );

      // ステージ記録を保存
      await prisma.generation_stages.create({
        data: {
          id: randomUUID(),
          jobId,
          stage: 1,
          stageName: "title_generation",
          status: response.success ? "COMPLETED" : "FAILED",
          input: input as unknown as Prisma.InputJsonValue,
          output: response.data as unknown as Prisma.InputJsonValue,
          promptUsed: prompt,
          tokensUsed: response.tokensUsed,
          completedAt: new Date(),
        },
      });

      return response;
    });

    if (!stage1Result.success || !stage1Result.data) {
      throw new Error(`Stage 1 failed: ${stage1Result.error}`);
    }
    stageOutputs.stage1 = stage1Result.data;

    // ========================================
    // Step 2: 記事生成
    // ========================================
    await step.run("update-stage-2-progress", async () => {
      await updateProgress(2, STAGE_LABELS[2]);
    });

    const stage2Result = await step.run("execute-stage-2-article", async () => {
      // JSON型のフィールドをパース
      const author = pipelineData.author;
      const certifications = author.certifications as { name: string; year?: number; location?: string }[] | null;
      const episodes = author.episodes as { type: 'transformation' | 'student' | 'teaching' | 'other'; title: string; content: string }[] | null;
      const signaturePhrases = author.signaturePhrases as string[] | null;
      const specialties = author.specialties as string[] | null;
      const avoidWords = author.avoidWords as string[] | null;
      const influences = author.influences as string[] | null;

      const input: Stage2Input = {
        title: stageOutputs.stage1!.title,
        keyword,
        categoryName: pipelineData.category.name,
        supervisor: {
          id: author.id,
          name: author.name,
          profile: author.bio || "",
          role: author.role,
          // キャリアデータフィールド
          careerStartYear: author.careerStartYear ?? undefined,
          teachingStartYear: author.teachingStartYear ?? undefined,
          totalStudentsTaught: author.totalStudentsTaught ?? undefined,
          graduatesCount: author.graduatesCount ?? undefined,
          weeklyLessons: author.weeklyLessons ?? undefined,
          certifications: certifications ?? undefined,
          episodes: episodes ?? undefined,
          signaturePhrases: signaturePhrases ?? undefined,
          specialties: specialties ?? undefined,
          // パーソナリティフィールド
          writingStyle: author.writingStyle as 'formal' | 'casual' | 'professional' | undefined,
          philosophy: author.philosophy ?? undefined,
          avoidWords: avoidWords ?? undefined,
          targetAudience: author.targetAudience ?? undefined,
          teachingApproach: author.teachingApproach ?? undefined,
          influences: influences ?? undefined,
          locationContext: author.locationContext ?? undefined,
        },
        infoBank: pipelineData.knowledgeItems.map((k) => ({
          id: k.id,
          title: k.title,
          type: k.type,
          content: k.content,
        })),
        brand: {
          name: pipelineData.brand.name,
          domain: siteDomain,
          tone: pipelineData.brand.tone || undefined,
        },
        conversionGoal: pipelineData.conversions[0]?.name,
      };

      // 設定のsystemPromptがあればそれを使用、なければDEFAULT_ARTICLE_PROMPTを使用
      // どちらの場合もreplacePromptVariablesで変数を置換（UIと同じロジック）
      const basePrompt = pipelineData.settings.systemPrompt || DEFAULT_ARTICLE_PROMPT;
      const prompt = replacePromptVariables(basePrompt, input);

      // OpenRouter用のシステムプロンプト（短く固定）
      const systemPrompt = "あなたは経験豊富なSEOライターです。指示に従って完全なHTMLのみを出力してください。説明文やMarkdownは不要です。";

      // HTMLを直接取得（JSONパースしない）
      const response = await callOpenRouterText(
        systemPrompt,
        prompt,
        {
          apiKey: pipelineData.settings.openRouterApiKey!,
          ...STAGE_MODEL_CONFIG.article_generation,
        }
      );

      if (!response.success || !response.data) {
        return { success: false as const, error: response.error, data: null, tokensUsed: 0 };
      }

      // AIが生成したHTMLをクリーンアップ（DOCTYPE, head, bodyなどを除去）
      let cleanedHtml = cleanGeneratedHtml(response.data);
      console.log(`[Pipeline] HTML cleaned: ${response.data.length} -> ${cleanedHtml.length} chars`);

      // CTAバナーを挿入（conversionsがある場合）
      const ctaConversion = pipelineData.conversions[0];
      if (ctaConversion) {
        cleanedHtml = insertCTABanner(cleanedHtml, {
          name: ctaConversion.name,
          url: ctaConversion.url,
          thumbnailUrl: ctaConversion.thumbnailUrl,
          context: ctaConversion.context,
        });
        console.log(`[Pipeline] CTA banner inserted: ${ctaConversion.name}`);
      }

      // 内部リンクが無い場合、関連記事セクションを自動挿入
      cleanedHtml = insertRelatedArticles(cleanedHtml, pipelineData.category.slug);

      // blockquote監修者引用がない場合、自動挿入
      cleanedHtml = insertSupervisorQuote(cleanedHtml, {
        name: author.name,
        role: author.role,
      });

      // 表のHTML修正（壊れた構造を修正 + スタイル統一）
      cleanedHtml = fixTableHtml(cleanedHtml);

      // FAQのスタイル改善
      cleanedHtml = improveFaqStyle(cleanedHtml);

      // HTMLから画像プレースホルダーを抽出
      const imagePlaceholders = extractImagePlaceholders(cleanedHtml);

      const output: Stage2Output = {
        html: cleanedHtml,
        imagePlaceholders,
      };

      // ステージ記録を保存
      await prisma.generation_stages.create({
        data: {
          id: randomUUID(),
          jobId,
          stage: 2,
          stageName: "article_generation",
          status: "COMPLETED",
          input: { title: input.title, keyword: input.keyword } as Prisma.InputJsonValue,
          output: { htmlLength: cleanedHtml.length, imagePlaceholders } as unknown as Prisma.InputJsonValue,
          promptUsed: prompt.substring(0, 5000), // プロンプトが長いので切り詰め
          tokensUsed: response.tokensUsed,
          completedAt: new Date(),
        },
      });

      return { success: true as const, data: output, tokensUsed: response.tokensUsed, error: null };
    });

    if (!stage2Result.success || !stage2Result.data) {
      throw new Error(`Stage 2 failed: ${stage2Result.error || "Unknown error"}`);
    }
    stageOutputs.stage2 = stage2Result.data;

    // ========================================
    // Step 3: 記事を保存 & 画像生成イベント発火
    // ========================================
    await step.run("update-stage-3-progress", async () => {
      await updateProgress(3, STAGE_LABELS[3]);
    });

    const article = await step.run("save-article", async () => {
      const { title, slug, metaTitle, metaDescription } = stageOutputs.stage1!;
      const { html } = stageOutputs.stage2!;

      // slugの重複チェック
      let finalSlug = slug;
      const existingArticle = await prisma.articles.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (existingArticle) {
        // 重複する場合はランダムサフィックスを追加
        const suffix = randomUUID().substring(0, 8);
        finalSlug = `${slug}-${suffix}`;
        console.log(`[Pipeline] Slug conflict detected. Using: ${finalSlug}`);
      }

      // blocksにHTMLを保存（type: 'html'として）
      const blocks = [
        {
          id: randomUUID(),
          type: "html",
          content: html,
        },
      ];

      // 記事を作成
      const newArticle = await prisma.articles.create({
        data: {
          id: randomUUID(),
          title,
          slug: finalSlug,
          blocks: blocks as unknown as Prisma.InputJsonValue,
          status: ArticleStatus.DRAFT,
          categoryId,
          authorId,
          brandId,
          createdById: userId,
          generationJobId: jobId,
          metaTitle,
          metaDescription,
          // コンバージョンを紐づけ
          article_conversions: {
            create: (conversionIds || []).map((conversionId: string, index: number) => ({
              id: randomUUID(),
              conversionId,
              position: index,
            })),
          },
        },
      });

      // 情報バンクの使用回数を更新
      if (pipelineData.knowledgeItems.length > 0) {
        await prisma.knowledge_items.updateMany({
          where: { id: { in: pipelineData.knowledgeItems.map(k => k.id) } },
          data: { usageCount: { increment: 1 } },
        });
      }

      // カテゴリの記事数を更新
      await prisma.categories.update({
        where: { id: categoryId },
        data: { articlesCount: { increment: 1 } },
      });

      return newArticle;
    });

    // 画像生成イベントを発火
    if (stageOutputs.stage2?.imagePlaceholders && stageOutputs.stage2.imagePlaceholders.length > 0) {
      await step.sendEvent("trigger-image-generation", {
        name: "article/generate-images",
        data: {
          articleId: article.id,
          jobId,
          // 新形式: プレースホルダー情報を渡す
          imagePlaceholders: stageOutputs.stage2.imagePlaceholders,
          articleTitle: stageOutputs.stage1!.title,
          categoryName: pipelineData.category.name,
          brandTone: pipelineData.brand.tone,
        },
      });
    }

    // ジョブを完了
    await step.run("complete-job", async () => {
      // トークン使用量を集計
      const stages = await prisma.generation_stages.findMany({
        where: { jobId },
        select: { tokensUsed: true },
      });
      const totalTokens = stages.reduce((sum, s) => sum + (s.tokensUsed || 0), 0);

      await prisma.generation_jobs.update({
        where: { id: jobId },
        data: {
          status: GenerationJobStatus.COMPLETED,
          progress: 100,
          currentStage: 3,
          statusMessage: "完了",
          completedAt: new Date(),
          tokensUsed: totalTokens,
          stageOutputs: stageOutputs as unknown as Prisma.InputJsonValue,
        },
      });

      // 通知を作成
      await prisma.notifications.create({
        data: {
          id: randomUUID(),
          userId,
          type: "GENERATION_COMPLETE",
          title: "記事生成完了",
          message: `「${article.title}」の生成が完了しました`,
          metadata: { articleId: article.id, jobId, totalTokens },
        },
      });
    });

    return {
      articleId: article.id,
      title: article.title,
      stageOutputs,
    };
  }
);
