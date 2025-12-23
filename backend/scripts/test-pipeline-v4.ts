// V4パイプラインのテストスクリプト
import { inngest } from "../src/inngest/client";
import prisma from "../src/lib/prisma";
import { randomUUID } from "crypto";

async function testPipelineV4() {
  console.log("[V4 Test] Starting V4 pipeline test...");

  // テスト用データを取得
  const category = await prisma.categories.findFirst({
    where: { slug: "career" },
  });
  const author = await prisma.authors.findFirst({
    where: { name: { contains: "間渕" } },
  });
  const brand = await prisma.brands.findFirst({
    where: { isDefault: true },
  });
  const user = await prisma.users.findFirst();
  const conversion = await prisma.conversions.findFirst({
    where: { status: "ACTIVE" },
  });

  if (!category || !author || !brand || !user) {
    console.error("[V4 Test] Missing required data:");
    console.log("  Category:", category?.name || "NOT FOUND");
    console.log("  Author:", author?.name || "NOT FOUND");
    console.log("  Brand:", brand?.name || "NOT FOUND");
    console.log("  User:", user?.email || "NOT FOUND");
    process.exit(1);
  }

  console.log("[V4 Test] Using:");
  console.log("  Category:", category.name);
  console.log("  Author:", author.name);
  console.log("  Brand:", brand.name);
  console.log("  User:", user.email);

  // テスト用キーワード
  const keyword = "RYT200 オンライン 費用";

  // ジョブを作成
  const jobId = randomUUID();
  await prisma.generation_jobs.create({
    data: {
      id: jobId,
      keyword,
      categoryId: category.id,
      authorId: author.id,
      brandId: brand.id,
      userId: user.id,
      status: "PENDING",
      progress: 0,
      totalArticles: 1,
      publishStrategy: "DRAFT",
    },
  });

  console.log("[V4 Test] Created job:", jobId);

  // V4イベントを発火
  try {
    await inngest.send({
      name: "article/generate-pipeline-v4",
      data: {
        jobId,
        keyword,
        categoryId: category.id,
        authorId: author.id,
        brandId: brand.id,
        conversionIds: conversion ? [conversion.id] : [],
        userId: user.id,
      },
    });

    console.log("[V4 Test] V4 pipeline event sent!");
    console.log("[V4 Test] Check Inngest dashboard: http://localhost:8288");
    console.log("[V4 Test] Job ID:", jobId);
  } catch (error) {
    console.error("[V4 Test] Failed to send event:", error);
    // ジョブを削除
    await prisma.generation_jobs.delete({ where: { id: jobId } });
    process.exit(1);
  }

  // ジョブ完了まで待機（最大5分）
  console.log("[V4 Test] Waiting for job completion...");
  const startTime = Date.now();
  const timeout = 5 * 60 * 1000; // 5分

  while (Date.now() - startTime < timeout) {
    await new Promise((r) => setTimeout(r, 5000)); // 5秒待機

    const job = await prisma.generation_jobs.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      console.error("[V4 Test] Job not found!");
      break;
    }

    console.log(`[V4 Test] Status: ${job.status} (${job.progress}%) - ${job.statusMessage || ""}`);

    if (job.status === "COMPLETED") {
      console.log("\n[V4 Test] SUCCESS! Job completed.");

      // 生成された記事を取得
      const article = await prisma.articles.findFirst({
        where: { generationJobId: jobId },
        include: {
          categories: true,
          authors: true,
        },
      });

      if (article) {
        console.log("\n[V4 Test] Generated Article:");
        console.log("  Title:", article.title);
        console.log("  Slug:", article.slug);
        console.log("  URL:", `http://localhost:3000/${article.categories.slug}/${article.slug}`);
        console.log("  LLMo Summary:", article.llmoShortSummary ? "YES" : "NO");
        console.log("  LLMo Takeaways:", article.llmoKeyTakeaways ? "YES" : "NO");
        console.log("  Schema JSON-LD:", article.schemaJsonLd ? "YES" : "NO");

        // LLMoデータの詳細
        if (article.llmoShortSummary) {
          console.log("\n[V4 Test] LLMo Short Summary:");
          console.log("  ", article.llmoShortSummary);
        }
        if (article.llmoKeyTakeaways) {
          console.log("\n[V4 Test] LLMo Key Takeaways:");
          const takeaways = article.llmoKeyTakeaways as string[];
          takeaways.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
        }
      }

      break;
    }

    if (job.status === "FAILED") {
      console.error("\n[V4 Test] FAILED!");
      console.error("  Error:", job.errorMessage);
      break;
    }
  }

  if (Date.now() - startTime >= timeout) {
    console.error("[V4 Test] Timeout waiting for job completion");
  }

  await prisma.$disconnect();
}

testPipelineV4().catch(console.error);
