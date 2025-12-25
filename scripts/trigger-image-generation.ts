import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";

async function main() {
  // 最新の完了ジョブを取得
  const job = await prisma.generation_jobs.findFirst({
    where: { status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    include: {
      articles: true,
    },
  });

  if (!job || job.articles.length === 0) {
    console.log("記事が見つかりません");
    return;
  }

  const article = job.articles[0];
  const stageOutputs = job.stageOutputs as {
    stage1?: { title: string };
    stage2?: { imagePlaceholders?: Array<{ position: string; context: string; altHint: string }> };
  };

  const imagePlaceholders = stageOutputs.stage2?.imagePlaceholders || [];

  console.log("=== 画像生成イベントをトリガー ===");
  console.log("ジョブID:", job.id);
  console.log("記事タイトル:", article.title);
  console.log("プレースホルダー数:", imagePlaceholders.length);

  if (imagePlaceholders.length === 0) {
    console.log("プレースホルダーがありません");
    return;
  }

  // Inngestにイベントを送信
  const eventPayload = {
    name: "article/generate-images",
    data: {
      articleId: article.id,
      jobId: job.id,
      imagePlaceholders,
      articleTitle: article.title,
      categoryName: "ヨガ資格", // カテゴリ名
      brandTone: undefined,
    },
  };

  console.log("\nイベントペイロード:", JSON.stringify(eventPayload, null, 2));

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
  console.log("\n✅ イベント送信成功:", result);

  await prisma.$disconnect();
}

main().catch(console.error);
