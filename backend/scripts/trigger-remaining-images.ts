import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";

async function main() {
  // 最新の完了ジョブを取得
  const article = await prisma.articles.findFirst({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      blocks: true,
      generationJobId: true,
    },
  });

  if (!article) {
    console.log("記事が見つかりません");
    return;
  }

  const blocks = article.blocks as { type: string; content: string }[];
  const htmlBlock = blocks.find((b) => b.type === "html");

  if (!htmlBlock) {
    console.log("HTMLブロックが見つかりません");
    return;
  }

  // 残っているプレースホルダーを抽出
  const regex = /<!-- IMAGE_PLACEHOLDER: position="([^"]+)" context="([^"]+)" alt_hint="([^"]+)" -->/g;
  const remainingPlaceholders: { position: string; context: string; altHint: string }[] = [];

  let match;
  while ((match = regex.exec(htmlBlock.content)) !== null) {
    remainingPlaceholders.push({
      position: match[1],
      context: match[2],
      altHint: match[3],
    });
  }

  console.log("=== 残りの画像プレースホルダーを処理 ===");
  console.log("記事タイトル:", article.title);
  console.log("残りプレースホルダー数:", remainingPlaceholders.length);

  if (remainingPlaceholders.length === 0) {
    console.log("✅ すべてのプレースホルダーが処理済みです");
    return;
  }

  for (const ph of remainingPlaceholders) {
    console.log(`  - position: ${ph.position}`);
  }

  // Inngestにイベントを送信
  const eventPayload = {
    name: "article/generate-images",
    data: {
      articleId: article.id,
      jobId: article.generationJobId,
      imagePlaceholders: remainingPlaceholders,
      articleTitle: article.title,
      categoryName: "ヨガ資格",
    },
  };

  console.log("\nイベント送信中...");

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
  console.log("✅ イベント送信成功:", result);

  await prisma.$disconnect();
}

main().catch(console.error);
