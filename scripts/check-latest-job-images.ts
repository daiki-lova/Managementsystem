import prisma from "../src/lib/prisma";

async function main() {
  // 最新の完了ジョブを取得
  const job = await prisma.generation_jobs.findFirst({
    where: { status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    include: {
      articles: {
        include: {
          media_assets: true,
          article_images: {
            include: {
              media_assets: true,
            },
          },
        },
      },
    },
  });

  if (!job) {
    console.log("完了したジョブがありません");
    return;
  }

  console.log("=== ジョブ詳細 ===");
  console.log("ジョブID:", job.id);
  console.log("キーワード:", job.keyword);

  // stageOutputs を確認
  const stageOutputs = job.stageOutputs as {
    stage1?: { title: string };
    stage2?: { html: string; imagePlaceholders?: Array<{ position: string; context: string; altHint: string }> };
  };

  console.log("\n=== Stage 2 出力 ===");
  if (stageOutputs.stage2) {
    console.log("HTMLの長さ:", stageOutputs.stage2.html?.length || 0, "文字");
    console.log("画像プレースホルダー数:", stageOutputs.stage2.imagePlaceholders?.length || 0);
    if (stageOutputs.stage2.imagePlaceholders) {
      for (const ph of stageOutputs.stage2.imagePlaceholders) {
        console.log(`  - position: ${ph.position}, context: ${ph.context.substring(0, 50)}...`);
      }
    }

    // HTML内のプレースホルダーを確認
    const html = stageOutputs.stage2.html;
    const placeholderRegex = /<!-- IMAGE_PLACEHOLDER[^>]+-->/g;
    const foundPlaceholders = html.match(placeholderRegex);
    console.log("\nHTML内のプレースホルダー:", foundPlaceholders?.length || 0, "個");
    if (foundPlaceholders) {
      for (const p of foundPlaceholders) {
        console.log(`  ${p.substring(0, 80)}...`);
      }
    }
  } else {
    console.log("Stage 2 の出力がありません");
  }

  // 記事情報
  console.log("\n=== 記事情報 ===");
  if (job.articles.length > 0) {
    const article = job.articles[0];
    console.log("タイトル:", article.title);
    console.log("サムネイルID:", article.thumbnailId || "なし");
    console.log("サムネイルURL:", article.media_assets?.url || "なし");
    console.log("挿入画像数:", article.article_images.length);
    for (const img of article.article_images) {
      console.log(`  - type: ${img.type}, url: ${img.media_assets.url}`);
    }

    // 記事のblocksを確認
    const blocks = article.blocks as { id: string; type: string; content: string }[];
    console.log("\n=== 記事ブロック ===");
    for (const block of blocks) {
      console.log(`type: ${block.type}, contentLength: ${block.content?.length || 0}`);
      if (block.type === "html") {
        // 画像タグがあるか確認
        const imgTags = block.content.match(/<img[^>]+>/g);
        console.log("  <img>タグ数:", imgTags?.length || 0);

        // プレースホルダーが残っているか確認
        const remainingPlaceholders = block.content.match(/<!-- IMAGE_PLACEHOLDER[^>]+-->/g);
        console.log("  残っているプレースホルダー:", remainingPlaceholders?.length || 0);
        if (remainingPlaceholders) {
          for (const p of remainingPlaceholders) {
            console.log(`    ${p.substring(0, 60)}...`);
          }
        }
      }
    }
  } else {
    console.log("記事がありません");
  }

  await prisma.$disconnect();
}

main().catch(console.error);
