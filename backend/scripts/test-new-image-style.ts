import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";
import { PublishStrategy, GenerationJobStatus } from "@prisma/client";
import { randomUUID } from "crypto";

async function main() {
  console.log("=== 新スタイル画像テスト（16:9、日本風イラスト） ===\n");

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

  console.log("カテゴリ:", category.name);
  console.log("著者:", author.name);

  // キーワードを設定
  const keyword = "ヨガ 資格 おすすめ";

  console.log("\nキーワード:", keyword);

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

  console.log("\nジョブ作成:", job.id);

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

  const result = await response.json();
  console.log("✅ パイプライン開始:", result);
  console.log("\nジョブID:", job.id);
  console.log("\n📷 新しい画像スタイル:");
  console.log("  - アスペクト比: 16:9 (1280x720px)");
  console.log("  - スタイル: 日本風ファッションイラスト");
  console.log("  - 特徴: ブラウン/ゴールドの繊細なライン、白背景、水彩風");
  console.log("\nInngestダッシュボードで進捗を確認: http://localhost:8288");

  await prisma.$disconnect();
}

main().catch(console.error);
