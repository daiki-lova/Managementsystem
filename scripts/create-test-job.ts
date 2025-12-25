import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  const jobId = randomUUID();

  // 新しいジョブを作成
  const job = await prisma.generation_jobs.create({
    data: {
      id: jobId,
      keyword: "RYT200 主婦 取得",
      status: "PENDING",
      progress: 0,
      currentStage: 0,
      statusMessage: "ジョブ作成完了",
      totalArticles: 1,
      publishStrategy: "DRAFT",
      categoryId: "91f8e2bd-3703-4868-be4b-9a238de5734c",
      authorId: "5603b5ae-b0fe-4bee-911d-2438d248b42d",
      brandId: "d23546a5-6bbb-40e6-80f3-18e60fbaca34",
      userId: "684d65d7-baef-4538-938b-f58bc670ace2",
    },
  });

  // コンバージョンを紐付け
  const conversion = await prisma.conversions.findFirst();
  if (conversion) {
    await prisma.generation_job_conversions.create({
      data: {
        generationJobId: job.id,
        conversionId: conversion.id,
      },
    });
    console.log("Conversion attached:", conversion.name);
  }

  console.log("Job ID:", job.id);
  await prisma.$disconnect();
}

main();
