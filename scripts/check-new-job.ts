import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";

async function main() {
  const jobId = "4d443ce9-2469-4daa-b442-78c669076e72";

  const job = await prisma.generation_jobs.findUnique({
    where: { id: jobId },
    include: {
      generation_stages: { orderBy: { stage: "asc" } },
      articles: true,
    },
  });

  if (!job) {
    console.log("ジョブが見つかりません");
    return;
  }

  console.log("=== ジョブ状態 ===");
  console.log("ステータス:", job.status);
  console.log("進捗:", job.progress + "%");
  console.log("メッセージ:", job.statusMessage);
  console.log("エラー:", job.errorMessage || "なし");

  console.log("\n=== ステージ ===");
  for (const stage of job.generation_stages) {
    console.log(`Stage ${stage.stage} (${stage.stageName}): ${stage.status}`);
    if (stage.errorMessage) {
      console.log("  エラー:", stage.errorMessage);
    }
  }

  if (job.articles.length > 0) {
    const article = job.articles[0];
    console.log("\n=== 記事 ===");
    console.log("タイトル:", article.title);
    console.log("スラッグ:", article.slug);

    const blocks = article.blocks as { type: string; content: string }[];
    const htmlBlock = blocks.find((b) => b.type === "html");
    if (htmlBlock) {
      console.log("HTMLの長さ:", htmlBlock.content.length, "文字");

      // プレースホルダーを確認
      const placeholders = htmlBlock.content.match(/<!-- IMAGE_PLACEHOLDER[^>]+-->/g);
      console.log("画像プレースホルダー:", placeholders?.length || 0, "個");

      // imgタグを確認
      const imgTags = htmlBlock.content.match(/<img[^>]+>/g);
      console.log("<img>タグ:", imgTags?.length || 0, "個");

      // 最初の500文字を表示
      console.log("\n--- HTML冒頭 ---");
      console.log(htmlBlock.content.substring(0, 800));
    }
  } else {
    console.log("\n記事: まだ生成されていません");
  }

  await prisma.$disconnect();
}

main().catch(console.error);
