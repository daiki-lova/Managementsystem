import { PrismaClient, ImageStyle } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  // 情報バンクから未使用のアイテムを6つ取得
  const knowledgeItems = await prisma.knowledge_items.findMany({
    where: { usageCount: 0 },
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  if (knowledgeItems.length < 6) {
    console.error(`未使用の情報バンクアイテムが${knowledgeItems.length}件しかありません。6件必要です。`);
    // 使用済みも含めて取得
    const allItems = await prisma.knowledge_items.findMany({
      take: 6,
      orderBy: { usageCount: "asc" },
    });
    knowledgeItems.length = 0;
    knowledgeItems.push(...allItems);
  }

  console.log(`${knowledgeItems.length}件の情報バンクアイテムを使用します`);

  // コンバージョンを取得
  const conversion = await prisma.conversions.findFirst({
    where: { status: "ACTIVE" },
  });

  if (!conversion) {
    console.error("アクティブなコンバージョンがありません");
    return;
  }

  // 固定値（前回のテストから）
  const categoryId = "91f8e2bd-3703-4868-be4b-9a238de5734c";
  const authorId = "5603b5ae-b0fe-4bee-911d-2438d248b42d";
  const brandId = "d23546a5-6bbb-40e6-80f3-18e60fbaca34";
  const userId = "684d65d7-baef-4538-938b-f58bc670ace2";

  const createdJobs: { id: string; style: string; knowledgeTitle: string }[] = [];

  // 手書き風水彩画（WATERCOLOR）で3記事
  console.log("\n=== 手書き風水彩画（WATERCOLOR）で3記事作成 ===");
  for (let i = 0; i < 3; i++) {
    const knowledgeItem = knowledgeItems[i];
    const jobId = randomUUID();

    const job = await prisma.generation_jobs.create({
      data: {
        id: jobId,
        keyword: `V6テスト-手書き風-${i + 1}`,
        status: "PENDING",
        progress: 0,
        currentStage: 0,
        statusMessage: "ジョブ作成完了",
        totalArticles: 1,
        publishStrategy: "DRAFT",
        imageStyle: ImageStyle.WATERCOLOR,
        categoryId,
        authorId,
        brandId,
        userId,
      },
    });

    await prisma.generation_job_conversions.create({
      data: {
        generationJobId: job.id,
        conversionId: conversion.id,
      },
    });

    await prisma.generation_job_knowledge_items.create({
      data: {
        generationJobId: job.id,
        knowledgeItemId: knowledgeItem.id,
      },
    });

    createdJobs.push({
      id: job.id,
      style: "WATERCOLOR",
      knowledgeTitle: knowledgeItem.title,
    });

    console.log(`  [${i + 1}] Job ID: ${job.id}`);
    console.log(`      情報: ${knowledgeItem.title.substring(0, 50)}...`);
  }

  // リアルな写真風（REALISTIC）で3記事
  console.log("\n=== リアルな写真風（REALISTIC）で3記事作成 ===");
  for (let i = 3; i < 6; i++) {
    const knowledgeItem = knowledgeItems[i];
    const jobId = randomUUID();

    const job = await prisma.generation_jobs.create({
      data: {
        id: jobId,
        keyword: `V6テスト-リアル-${i - 2}`,
        status: "PENDING",
        progress: 0,
        currentStage: 0,
        statusMessage: "ジョブ作成完了",
        totalArticles: 1,
        publishStrategy: "DRAFT",
        imageStyle: ImageStyle.REALISTIC,
        categoryId,
        authorId,
        brandId,
        userId,
      },
    });

    await prisma.generation_job_conversions.create({
      data: {
        generationJobId: job.id,
        conversionId: conversion.id,
      },
    });

    await prisma.generation_job_knowledge_items.create({
      data: {
        generationJobId: job.id,
        knowledgeItemId: knowledgeItem.id,
      },
    });

    createdJobs.push({
      id: job.id,
      style: "REALISTIC",
      knowledgeTitle: knowledgeItem.title,
    });

    console.log(`  [${i - 2}] Job ID: ${job.id}`);
    console.log(`      情報: ${knowledgeItem.title.substring(0, 50)}...`);
  }

  console.log("\n=== 作成したジョブ一覧 ===");
  for (const job of createdJobs) {
    console.log(`${job.style}: ${job.id}`);
  }

  // ジョブIDをファイルに保存
  const fs = await import("fs");
  fs.writeFileSync(
    "/tmp/dual-style-job-ids.json",
    JSON.stringify(createdJobs, null, 2)
  );
  console.log("\nジョブIDを /tmp/dual-style-job-ids.json に保存しました");

  await prisma.$disconnect();
}

main().catch(console.error);
