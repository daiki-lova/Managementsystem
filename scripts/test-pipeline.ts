// 3ステップパイプラインのテストスクリプト

import prisma from "../src/lib/prisma";
import { inngest } from "../src/inngest/client";
import { randomUUID } from "crypto";

async function main() {
  console.log("=== 3ステップパイプライン テスト ===\n");

  // 1. 必要なデータを取得
  const [category, author, brand, user] = await Promise.all([
    prisma.categories.findFirst(),
    prisma.authors.findFirst(),
    prisma.brands.findFirst(),
    prisma.users.findFirst(),
  ]);

  if (!category || !author || !brand || !user) {
    console.error("必要なデータが見つかりません:");
    console.log("  category:", category?.id || "なし");
    console.log("  author:", author?.id || "なし");
    console.log("  brand:", brand?.id || "なし");
    console.log("  user:", user?.id || "なし");
    process.exit(1);
  }

  console.log("データ確認:");
  console.log(`  カテゴリ: ${category.name} (${category.id})`);
  console.log(`  監修者: ${author.name} (${author.id})`);
  console.log(`  ブランド: ${brand.name} (${brand.id})`);
  console.log(`  ユーザー: ${user.email} (${user.id})`);

  // 2. 情報バンクを取得（監修者に紐づくもの）
  const knowledgeItems = await prisma.knowledge_items.findMany({
    where: { authorId: author.id },
    take: 5,
  });
  console.log(`  情報バンク: ${knowledgeItems.length}件`);

  // 3. ジョブを作成
  const keyword = "ヨガインストラクター 資格 費用";
  const jobId = randomUUID();

  const job = await prisma.generation_jobs.create({
    data: {
      id: jobId,
      keyword,
      categoryId: category.id,
      authorId: author.id,
      brandId: brand.id,
      userId: user.id,
      status: "PENDING",
    },
  });

  console.log(`\nジョブ作成: ${job.id}`);
  console.log(`キーワード: ${keyword}`);

  // 4. パイプラインイベントを発火
  console.log("\nパイプライン開始...");

  await inngest.send({
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
  });

  console.log("イベント発火完了！");
  console.log("\nInngestダッシュボードで進捗を確認してください:");
  console.log("  http://localhost:8288");

  // 少し待ってからジョブの状態を確認
  console.log("\n5秒後にジョブの状態を確認...");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const updatedJob = await prisma.generation_jobs.findUnique({
    where: { id: job.id },
    include: {
      generation_stages: {
        orderBy: { stage: "asc" },
      },
    },
  });

  console.log("\nジョブ状態:");
  console.log(`  ステータス: ${updatedJob?.status}`);
  console.log(`  進捗: ${updatedJob?.progress}%`);
  console.log(`  現在のステージ: ${updatedJob?.currentStage}`);
  console.log(`  メッセージ: ${updatedJob?.statusMessage}`);

  if (updatedJob?.generation_stages && updatedJob.generation_stages.length > 0) {
    console.log("\nステージ詳細:");
    for (const stage of updatedJob.generation_stages) {
      console.log(`  Stage ${stage.stage} (${stage.stageName}): ${stage.status}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("エラー:", error);
  process.exit(1);
});
