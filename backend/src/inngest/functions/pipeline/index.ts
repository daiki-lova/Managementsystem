// 6ステージ記事生成パイプライン オーケストレーター

import { inngest } from "../../client";
import prisma from "@/lib/prisma";
import { ArticleStatus, GenerationJobStatus, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import {
  type Stage1Input,
  type Stage1Output,
  type Stage2Input,
  type Stage2Output,
  type Stage3Input,
  type Stage3Output,
  type Stage4Input,
  type Stage4Output,
  type Stage5Input,
  type Stage5Output,
  type AllStageOutputs,
  STAGE_PROGRESS,
  STAGE_LABELS,
} from "./common";
import { executeStage1 } from "./stage-1-keyword";
import { executeStage2 } from "./stage-2-structure";
import { executeStage3 } from "./stage-3-draft";
import { executeStage4 } from "./stage-4-seo";
import { executeStage5 } from "./stage-5-proofread";

// 記事生成パイプライン
export const generateArticlePipeline = inngest.createFunction(
  {
    id: "generate-article-pipeline",
    name: "Generate Article Pipeline (6 Stages)",
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
      knowledgeItemIds,
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
    // ステップ0: ジョブを開始状態に更新
    // ========================================
    await step.run("start-pipeline", async () => {
      await prisma.generation_jobs.update({
        where: { id: jobId },
        data: {
          status: GenerationJobStatus.RUNNING,
          progress: 0,
          currentStage: 0,
          statusMessage: "パイプライン開始...",
        },
      });
    });

    // ========================================
    // ステップ1: 必要なデータを取得
    // ========================================
    const pipelineData = await step.run("fetch-pipeline-data", async () => {
      const [
        category,
        author,
        brand,
        conversions,
        knowledgeItems,
        existingArticles,
      ] = await Promise.all([
        prisma.categories.findUnique({ where: { id: categoryId } }),
        prisma.authors.findUnique({ where: { id: authorId } }),
        prisma.brands.findUnique({ where: { id: brandId } }),
        prisma.conversions.findMany({
          where: { id: { in: conversionIds } },
        }),
        prisma.knowledge_items.findMany({
          where: { id: { in: knowledgeItemIds } },
        }),
        // 既存記事一覧（内部リンク候補用）
        prisma.articles.findMany({
          where: { status: ArticleStatus.PUBLISHED },
          select: {
            slug: true,
            title: true,
            categoryId: true,
          },
          take: 100,
        }),
      ]);

      if (!category || !author || !brand) {
        throw new Error("必要なデータが見つかりません");
      }

      return {
        category,
        author,
        brand,
        conversions,
        knowledgeItems,
        existingArticles,
      };
    });

    // 全ステージの出力を保持
    const stageOutputs: AllStageOutputs = {};

    // ========================================
    // Stage 1: キーワード分析・企画
    // ========================================
    await step.run("update-stage-1-progress", async () => {
      await updateProgress(1, STAGE_LABELS[1]);
    });

    const stage1Result = await step.run("execute-stage-1", async () => {
      const input: Stage1Input = {
        keyword,
        categoryId,
        categoryName: pipelineData.category.name,
        conversionGoal: pipelineData.conversions[0]?.name || "一般的な集客",
        existingArticles: pipelineData.existingArticles.map((a) => ({
          slug: a.slug,
          title: a.title,
          categoryId: a.categoryId,
        })),
        infoBank: pipelineData.knowledgeItems.map((k) => ({
          id: k.id,
          title: k.title,
          type: k.type,
          content: k.content,
        })),
      };

      return executeStage1(jobId, input);
    });

    if (!stage1Result.success || !stage1Result.output) {
      throw new Error(`Stage 1 failed: ${stage1Result.error}`);
    }
    stageOutputs.stage1 = stage1Result.output;

    // ========================================
    // Stage 2: 構成・安全設計
    // ========================================
    await step.run("update-stage-2-progress", async () => {
      await updateProgress(2, STAGE_LABELS[2]);
    });

    const stage2Result = await step.run("execute-stage-2", async () => {
      const topicBrief = stageOutputs.stage1!.selected_topics[0];
      if (!topicBrief) {
        throw new Error("Stage 1でトピックが選択されませんでした");
      }

      const input: Stage2Input = {
        topicBrief,
        infoBank: pipelineData.knowledgeItems.map((k) => ({
          id: k.id,
          title: k.title,
          type: k.type,
          content: k.content,
        })),
        reviewerProfile: {
          id: pipelineData.author.id,
          name: pipelineData.author.name,
          role: pipelineData.author.role,
          systemPrompt: pipelineData.author.systemPrompt || "",
        },
        contentIndex: pipelineData.existingArticles.map((a) => ({
          slug: a.slug,
          title: a.title,
        })),
        brandRules: {
          name: pipelineData.brand.name,
          description: pipelineData.brand.description || "",
          tone: pipelineData.brand.tone || undefined,
        },
      };

      return executeStage2(jobId, input);
    });

    if (!stage2Result.success || !stage2Result.output) {
      throw new Error(`Stage 2 failed: ${stage2Result.error}`);
    }
    stageOutputs.stage2 = stage2Result.output;

    // ========================================
    // Stage 3: 記事執筆
    // ========================================
    await step.run("update-stage-3-progress", async () => {
      await updateProgress(3, STAGE_LABELS[3]);
    });

    const stage3Result = await step.run("execute-stage-3", async () => {
      const input: Stage3Input = {
        topicBrief: stageOutputs.stage1!.selected_topics[0],
        outlinePackage: stageOutputs.stage2!,
        infoBank: pipelineData.knowledgeItems.map((k) => ({
          id: k.id,
          title: k.title,
          type: k.type,
          content: k.content,
        })),
        reviewerProfile: {
          id: pipelineData.author.id,
          name: pipelineData.author.name,
          role: pipelineData.author.role,
          systemPrompt: pipelineData.author.systemPrompt || "",
        },
        brandRules: {
          name: pipelineData.brand.name,
          description: pipelineData.brand.description || "",
          tone: pipelineData.brand.tone || undefined,
        },
      };

      return executeStage3(jobId, input);
    });

    if (!stage3Result.success || !stage3Result.output) {
      throw new Error(`Stage 3 failed: ${stage3Result.error}`);
    }
    stageOutputs.stage3 = stage3Result.output;

    // ========================================
    // Stage 4: SEO/LLMO最適化
    // ========================================
    await step.run("update-stage-4-progress", async () => {
      await updateProgress(4, STAGE_LABELS[4]);
    });

    const stage4Result = await step.run("execute-stage-4", async () => {
      const input: Stage4Input = {
        draft: stageOutputs.stage3!,
        topicBrief: stageOutputs.stage1!.selected_topics[0],
        outlinePackage: stageOutputs.stage2!,
        infoBank: pipelineData.knowledgeItems.map((k) => ({
          id: k.id,
          title: k.title,
          type: k.type,
          content: k.content,
        })),
        brandRules: {
          name: pipelineData.brand.name,
          description: pipelineData.brand.description || "",
          tone: pipelineData.brand.tone || undefined,
        },
      };

      // Stage 3のimage_jobsをフォールバック用に渡す
      return executeStage4(jobId, input, stageOutputs.stage3!.image_jobs);
    });

    if (!stage4Result.success || !stage4Result.output) {
      throw new Error(`Stage 4 failed: ${stage4Result.error}`);
    }
    stageOutputs.stage4 = stage4Result.output;

    // ========================================
    // Stage 5: 監修・校正
    // ========================================
    await step.run("update-stage-5-progress", async () => {
      await updateProgress(5, STAGE_LABELS[5]);
    });

    const stage5Result = await step.run("execute-stage-5", async () => {
      const input: Stage5Input = {
        articlePackage: stageOutputs.stage4!,
        reviewerProfile: {
          id: pipelineData.author.id,
          name: pipelineData.author.name,
          role: pipelineData.author.role,
          systemPrompt: pipelineData.author.systemPrompt || "",
        },
        infoBank: pipelineData.knowledgeItems.map((k) => ({
          id: k.id,
          title: k.title,
          type: k.type,
          content: k.content,
        })),
        brandRules: {
          name: pipelineData.brand.name,
          description: pipelineData.brand.description || "",
          tone: pipelineData.brand.tone || undefined,
        },
        conversionGoal: pipelineData.conversions[0]?.name || "一般的な集客",
      };

      return executeStage5(jobId, input);
    });

    if (!stage5Result.success || !stage5Result.output) {
      throw new Error(`Stage 5 failed: ${stage5Result.error}`);
    }
    stageOutputs.stage5 = stage5Result.output;

    // ========================================
    // 校正結果の確認
    // ========================================
    // needs_changesの場合は差戻し
    if (stageOutputs.stage5.status === "needs_changes") {
      await step.run("handle-needs-changes", async () => {
        // トークン使用量を集計
        const stages = await prisma.generation_stages.findMany({
          where: { jobId },
          select: { tokensUsed: true },
        });
        const totalTokens = stages.reduce((sum, s) => sum + (s.tokensUsed || 0), 0);

        // ジョブを差戻し状態に更新
        await prisma.generation_jobs.update({
          where: { id: jobId },
          data: {
            status: GenerationJobStatus.FAILED,
            progress: 95,
            currentStage: 5,
            statusMessage: "校正で差戻し - 要修正",
            errorMessage: `品質スコア: ${stageOutputs.stage5!.quality_score?.overall || 0}点 - ${stageOutputs.stage5!.required_changes?.map(c => c.problem).join(", ") || "要確認"}`,
            stageOutputs: stageOutputs as unknown as Prisma.InputJsonValue,
            tokensUsed: totalTokens,
          },
        });

        // 差戻し通知を作成
        await prisma.notifications.create({
          data: {
            id: randomUUID(),
            userId,
            type: "GENERATION_FAILED",
            title: "記事生成 - 校正差戻し",
            message: `「${keyword}」の記事が校正で差戻されました。品質スコア: ${stageOutputs.stage5!.quality_score?.overall || 0}点`,
            metadata: {
              jobId,
              qualityScore: stageOutputs.stage5!.quality_score,
              requiredChanges: stageOutputs.stage5!.required_changes,
            },
          },
        });
      });

      return {
        status: "needs_changes",
        jobId,
        keyword,
        qualityScore: stageOutputs.stage5.quality_score,
        requiredChanges: stageOutputs.stage5.required_changes,
        stageOutputs,
      };
    }

    // ========================================
    // Stage 6: 記事を保存（校正承認済み）
    // ========================================
    await step.run("update-stage-6-progress", async () => {
      await updateProgress(6, STAGE_LABELS[6]);
    });

    const article = await step.run("save-article", async () => {
      // 最終的なブロックとメタを決定（Stage5が必須で返すように変更済み）
      const finalBlocks = stageOutputs.stage5!.final_blocks;
      const finalMeta = stageOutputs.stage5!.final_meta;

      // バリデーション: 必須フィールドの存在確認
      if (!finalBlocks || finalBlocks.length === 0) {
        throw new Error("Stage 5 output missing final_blocks");
      }
      if (!finalMeta || !finalMeta.title) {
        throw new Error("Stage 5 output missing final_meta");
      }

      // スラッグを生成
      const slug = generateSlug(keyword);

      // 記事を作成
      const newArticle = await prisma.articles.create({
        data: {
          id: randomUUID(),
          title: finalMeta.title,
          slug,
          blocks: finalBlocks as unknown as object[],
          status: ArticleStatus.DRAFT,
          categoryId,
          authorId,
          brandId,
          createdById: userId,
          generationJobId: jobId,
          metaTitle: finalMeta.metaTitle,
          metaDescription: finalMeta.metaDescription,
          // LLMO snippets
          llmoShortSummary: stageOutputs.stage4!.llmo_snippets?.short_summary,
          llmoKeyTakeaways: stageOutputs.stage4!.llmo_snippets?.key_takeaways as Prisma.InputJsonValue | undefined,
          // Schema.org JSON-LD
          schemaJsonLd: stageOutputs.stage4!.schema_jsonld as Prisma.InputJsonValue | undefined,
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

      // ジョブのstageOutputsを保存
      await prisma.generation_jobs.update({
        where: { id: jobId },
        data: {
          stageOutputs: stageOutputs as unknown as Prisma.InputJsonValue,
        },
      });

      return newArticle;
    });

    // 画像生成イベントを発火（Stage 4で生成されたimage_jobsを使用）
    if (stageOutputs.stage4?.image_jobs && stageOutputs.stage4.image_jobs.length > 0) {
      await step.sendEvent("trigger-image-generation", {
        name: "article/generate-images",
        data: {
          articleId: article.id,
          jobId,
          imageJobs: stageOutputs.stage4.image_jobs,
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
          currentStage: 6,
          statusMessage: "完了",
          completedAt: new Date(),
          tokensUsed: totalTokens,
        },
      });

      // 通知を作成
      await prisma.notifications.create({
        data: {
          id: randomUUID(),
          userId,
          type: "GENERATION_COMPLETE",
          title: "記事生成完了",
          message: `「${article.title}」の生成が完了しました（6ステージパイプライン）`,
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

// スラッグ生成
function generateSlug(keyword: string): string {
  const romanized = keyword
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const randomId = Math.random().toString(36).substring(2, 8);
  return `${romanized}-${randomId}`;
}
