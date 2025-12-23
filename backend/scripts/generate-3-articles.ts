import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";
import { PublishStrategy, GenerationJobStatus } from "@prisma/client";
import { randomUUID } from "crypto";

const KEYWORDS = [
  "ヨガインストラクター 資格 おすすめ",
  "マタニティヨガ 効果 いつから",
  "ヨガ 瞑想 やり方 初心者",
];

async function generateArticle(keyword: string): Promise<string | null> {
  console.log(`\n=== 記事生成: ${keyword} ===`);

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
      keyword,
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
      keyword,
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
  return job.id;
}

async function main() {
  console.log("=== 3記事連続生成 ===");

  const jobIds: string[] = [];

  for (const keyword of KEYWORDS) {
    const jobId = await generateArticle(keyword);
    if (jobId) {
      jobIds.push(jobId);
    }
    // 少し待機
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log("\n=== 生成開始したジョブ ===");
  jobIds.forEach((id, i) => {
    console.log(`${i + 1}. ${id}`);
  });

  console.log("\nInngestダッシュボードで進捗を確認: http://localhost:8288");

  await prisma.$disconnect();
}

main().catch(console.error);
