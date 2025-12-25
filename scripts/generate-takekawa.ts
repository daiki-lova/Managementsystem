import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";
import { PublishStrategy, GenerationJobStatus } from "@prisma/client";
import { randomUUID } from "crypto";

async function main() {
  console.log("=== 武川 未央さんで記事生成 ===\n");

  const [category, brand, user] = await Promise.all([
    prisma.categories.findFirst(),
    prisma.brands.findFirst(),
    prisma.users.findFirst(),
  ]);

  const authorId = "80896468-d673-43d3-9ff7-edf97584256c";

  if (!category || !brand || !user) {
    console.error("必要なデータが見つかりません");
    return;
  }

  const keyword = "ヨガ 初心者 始め方";

  console.log("著者: 武川 未央");
  console.log("キーワード:", keyword);
  console.log("カテゴリ:", category.name);

  const jobId = randomUUID();
  const job = await prisma.generation_jobs.create({
    data: {
      id: jobId,
      keyword,
      status: GenerationJobStatus.PENDING,
      progress: 0,
      categoryId: category.id,
      authorId: authorId,
      brandId: brand.id,
      userId: user.id,
      publishStrategy: PublishStrategy.MANUAL,
    },
  });

  console.log("\nジョブID:", job.id);

  const eventPayload = {
    name: "article/generate-pipeline",
    data: {
      jobId: job.id,
      keyword,
      categoryId: category.id,
      authorId: authorId,
      brandId: brand.id,
      conversionIds: [],
      userId: user.id,
    },
  };

  console.log("\nパイプラインをトリガー中...");

  const response = await fetch("http://localhost:8288/e/dev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Inngestエラー:", response.status, errorText);
    return;
  }

  const result = await response.json();
  console.log("✅ パイプライン開始:", result);
  console.log("\n📷 画像設定:");
  console.log("  - アスペクト比: 16:9");
  console.log("  - スタイル: 手描き水彩スケッチ風");
  console.log("  - 文字: なし");
  console.log("\nInngestダッシュボード: http://localhost:8288");

  await prisma.$disconnect();
}

main().catch(console.error);
