// V6パイプラインのテストスクリプト
// 使用方法: npx tsx scripts/test-v6-pipeline.ts

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function testV6Pipeline() {
  console.log("========================================");
  console.log("V6パイプライン テスト");
  console.log("========================================\n");

  // 必要なデータを取得
  const [category, author, brand, knowledgeItem] = await Promise.all([
    prisma.categories.findFirst(),
    prisma.authors.findFirst(),
    prisma.brands.findFirst(),
    prisma.knowledge_items.findFirst({
      where: { type: "STUDENT_VOICE" }
    }),
  ]);

  if (!category || !author || !brand || !knowledgeItem) {
    console.error("必要なデータが見つかりません");
    console.log("Category:", category?.name);
    console.log("Author:", author?.name);
    console.log("Brand:", brand?.name);
    console.log("Knowledge Item:", knowledgeItem?.title);
    await prisma.$disconnect();
    return;
  }

  console.log("使用データ:");
  console.log("- カテゴリ:", category.name);
  console.log("- 監修者:", author.name);
  console.log("- ブランド:", brand.name);
  console.log("- 受講生の声:", knowledgeItem.title);
  console.log();

  // ジョブを作成
  const jobId = randomUUID();
  const job = await prisma.generation_jobs.create({
    data: {
      id: jobId,
      keyword: "V6パイプラインテスト",
      categoryId: category.id,
      authorId: author.id,
      brandId: brand.id,
      userId: "684d65d7-baef-4538-938b-f58bc670ace2", // admin user
      publishStrategy: "DRAFT",
      generation_job_knowledge_items: {
        create: [{ knowledgeItemId: knowledgeItem.id }],
      },
    },
  });

  console.log("ジョブを作成しました:", job.id);
  console.log();

  // Inngestイベントを発火
  const API_URL = "http://localhost:4000/api/inngest";

  const eventPayload = {
    name: "article/generate-pipeline-v6",
    data: {
      jobId: job.id,
      knowledgeItemId: knowledgeItem.id,
      categoryId: category.id,
      authorId: author.id,
      brandId: brand.id,
      conversionIds: [],
      userId: "684d65d7-baef-4538-938b-f58bc670ace2",
    },
    ts: Date.now(),
  };

  console.log("Inngestイベントを発火中...");

  try {
    // Inngest Dev Server経由でイベントを発火
    const response = await fetch("http://localhost:8288/e/yoga-media-cms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "article/generate-pipeline-v6",
        data: eventPayload.data,
      }),
    });

    if (response.ok) {
      console.log("✅ イベント発火成功!");
      console.log();
      console.log("Inngest Dev Server: http://localhost:8288");
      console.log("ジョブID:", job.id);
      console.log();
      console.log("記事生成の進捗を確認するには:");
      console.log(`  npx tsx scripts/check-job-stages.ts ${job.id}`);
    } else {
      const errorText = await response.text();
      console.error("イベント発火失敗:", response.status, errorText);
    }
  } catch (error) {
    console.error("エラー:", error);
  }

  await prisma.$disconnect();
}

testV6Pipeline().catch(console.error);
