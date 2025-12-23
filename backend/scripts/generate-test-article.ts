import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";
import { PublishStrategy, GenerationJobStatus } from "@prisma/client";
import { randomUUID } from "crypto";

const KEYWORD = "ホットヨガ 効果 ダイエット";

async function generateArticle(): Promise<string | null> {
  console.log(`\n=== テスト記事生成: ${KEYWORD} ===`);

  const [category, author, brand, user] = await Promise.all([
    prisma.categories.findFirst(),
    prisma.authors.findFirst(),
    prisma.brands.findFirst(),
    prisma.users.findFirst(),
  ]);

  if (!category || !author || !brand || !user) {
    console.error("必要なデータが見つかりません");
    return null;
  }

  const jobId = randomUUID();
  const job = await prisma.generation_jobs.create({
    data: {
      id: jobId,
      keyword: KEYWORD,
      status: GenerationJobStatus.PENDING,
      progress: 0,
      categoryId: category.id,
      authorId: author.id,
      brandId: brand.id,
      userId: user.id,
      publishStrategy: PublishStrategy.MANUAL,
    },
  });

  console.log("ジョブ作成:", job.id);

  const eventPayload = {
    name: "article/generate-pipeline",
    data: {
      jobId: job.id,
      keyword: KEYWORD,
      categoryId: category.id,
      authorId: author.id,
      brandId: brand.id,
      conversionIds: [],
      userId: user.id,
    },
  };

  const response = await fetch("http://localhost:8288/e/dev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventPayload),
  });

  if (!response.ok) {
    console.error("Inngestエラー:", response.status);
    return null;
  }

  console.log("✅ パイプライン開始");
  console.log("ジョブID:", job.id);
  console.log("\nInngestダッシュボードで進捗を確認: http://localhost:8288");

  await prisma.$disconnect();
  return job.id;
}

generateArticle().catch(console.error);
