import { PrismaClient, ImageStyle } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  // カテゴリー一覧を取得
  const categories = await prisma.categories.findMany({
    orderBy: { name: "asc" },
  });

  if (categories.length < 6) {
    console.error("カテゴリーが6件未満です");
    return;
  }

  // 情報バンクから6つのアイテムを取得（使用回数が少ない順）
  const knowledgeItems = await prisma.knowledge_items.findMany({
    take: 6,
    orderBy: { usageCount: "asc" },
  });

  if (knowledgeItems.length < 6) {
    console.error(`情報バンクアイテムが${knowledgeItems.length}件しかありません`);
    return;
  }

  // コンバージョンを取得
  const conversion = await prisma.conversions.findFirst({
    where: { status: "ACTIVE" },
  });

  if (!conversion) {
    console.error("アクティブなコンバージョンがありません");
    return;
  }

  // 固定値
  const authorId = "5603b5ae-b0fe-4bee-911d-2438d248b42d";
  const brandId = "d23546a5-6bbb-40e6-80f3-18e60fbaca34";
  const userId = "684d65d7-baef-4538-938b-f58bc670ace2";

  const createdJobs: { id: string; style: string; category: string; knowledgeTitle: string }[] = [];

  // 手書き風水彩画（WATERCOLOR）で3記事（カテゴリー 1, 2, 3）
  console.log("\n=== 手書き風水彩画（WATERCOLOR）で3記事作成 ===");
  for (let i = 0; i < 3; i++) {
    const knowledgeItem = knowledgeItems[i];
    const category = categories[i];
    const jobId = randomUUID();

    const job = await prisma.generation_jobs.create({
      data: {
        id: jobId,
        keyword: `V6テスト-手書き-${category.name}`,
        status: "PENDING",
        progress: 0,
        currentStage: 0,
        statusMessage: "ジョブ作成完了",
        totalArticles: 1,
        publishStrategy: "DRAFT",
        imageStyle: ImageStyle.WATERCOLOR,
        categoryId: category.id,
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
      category: category.name,
      knowledgeTitle: knowledgeItem.title,
    });

    console.log(`  [${i + 1}] カテゴリー: ${category.name}`);
    console.log(`      Job ID: ${job.id}`);
  }

  // リアルな写真風（REALISTIC）で3記事（カテゴリー 4, 5, 6）
  console.log("\n=== リアルな写真風（REALISTIC）で3記事作成 ===");
  for (let i = 3; i < 6; i++) {
    const knowledgeItem = knowledgeItems[i];
    const category = categories[i];
    const jobId = randomUUID();

    const job = await prisma.generation_jobs.create({
      data: {
        id: jobId,
        keyword: `V6テスト-リアル-${category.name}`,
        status: "PENDING",
        progress: 0,
        currentStage: 0,
        statusMessage: "ジョブ作成完了",
        totalArticles: 1,
        publishStrategy: "DRAFT",
        imageStyle: ImageStyle.REALISTIC,
        categoryId: category.id,
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
      category: category.name,
      knowledgeTitle: knowledgeItem.title,
    });

    console.log(`  [${i - 2}] カテゴリー: ${category.name}`);
    console.log(`      Job ID: ${job.id}`);
  }

  console.log("\n=== 作成したジョブ一覧 ===");
  console.log("スタイル    | カテゴリー | Job ID");
  console.log("-".repeat(60));
  for (const job of createdJobs) {
    console.log(`${job.style.padEnd(11)} | ${job.category.padEnd(10)} | ${job.id}`);
  }

  // ジョブIDをファイルに保存
  const fs = await import("fs");
  fs.writeFileSync(
    "/tmp/multi-category-job-ids.json",
    JSON.stringify(createdJobs, null, 2)
  );
  console.log("\nジョブIDを /tmp/multi-category-job-ids.json に保存しました");

  await prisma.$disconnect();
}

main().catch(console.error);
