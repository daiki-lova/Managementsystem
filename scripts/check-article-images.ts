import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";

async function main() {
  const article = await prisma.articles.findUnique({
    where: { id: "5214220c-8947-43a1-a753-ec4dfa628dfa" },
    include: {
      media_assets: true,
      article_images: { include: { media_assets: true } }
    }
  });

  if (!article) {
    console.log("記事が見つかりません");
    await prisma.$disconnect();
    return;
  }

  console.log("=== 記事情報 ===");
  console.log("タイトル:", article.title);
  console.log("スラッグ:", article.slug);
  console.log("サムネイルID:", article.thumbnailId || "なし");

  if (article.thumbnailId) {
    const thumbnail = await prisma.media_assets.findUnique({
      where: { id: article.thumbnailId }
    });
    console.log("サムネイルURL:", thumbnail?.url);
  }

  console.log("\n=== 記事内画像 ===");
  console.log("画像数:", article.article_images?.length || 0);

  if (article.article_images) {
    article.article_images.forEach((img, i) => {
      console.log(`画像${i + 1}: ${img.media_assets?.url}`);
    });
  }

  await prisma.$disconnect();
}

main().catch(console.error);
