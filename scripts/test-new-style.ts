import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";
import { PublishStrategy, GenerationJobStatus } from "@prisma/client";
import { randomUUID } from "crypto";

async function main() {
  console.log("=== 新スタイル画像テスト（日本風ファッションイラスト） ===\n");

  // 必要なデータを取得
  const [category, author, brand, user] = await Promise.all([
    prisma.categories.findFirst(),
    prisma.authors.findFirst(),
    prisma.brands.findFirst(),
    prisma.users.findFirst(),
  ]);

  if (!category || !author || !brand || !user) {
    console.error("必要なデータが見つかりません");
    return;
  }

  // キーワードを設定
  const keyword = "ヨガ 瞑想 効果";

  console.log("キーワード:", keyword);

  // ジョブを作成
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

  console.log("ジョブID:", job.id);

  // Inngestにイベントを送信
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

  console.log("\nパイプラインをトリガー中...");

  const response = await fetch("http://localhost:8288/e/dev", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Inngestエラー:", response.status, errorText);
    return;
  }

  console.log("✅ パイプライン開始");
  console.log("\n📷 画像スタイル:");
  console.log("  - 日本風ファッションイラスト");
  console.log("  - 繊細なブラウン/ゴールドのラインアート");
  console.log("  - 白背景、柔らかい水彩風シェーディング");
  console.log("  - ※アスペクト比は正方形（Geminiの制限）");
  console.log("\nInngestダッシュボード: http://localhost:8288");

  await prisma.$disconnect();
}

main().catch(console.error);
