import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";

async function main() {
  const article = await prisma.articles.findUnique({
    where: { id: "5214220c-8947-43a1-a753-ec4dfa628dfa" },
    select: { title: true, blocks: true },
  });

  if (!article) {
    console.log("記事が見つかりません");
    await prisma.$disconnect();
    return;
  }

  console.log("=== 記事:", article.title, "===\n");

  const blocks = article.blocks as any[];
  if (blocks && blocks.length > 0) {
    const htmlBlock = blocks.find((b: any) => b.type === "html");
    if (htmlBlock) {
      const html = htmlBlock.content as string;

      // 未置換プレースホルダーの確認
      const placeholders = html.match(/<!-- IMAGE_PLACEHOLDER:.*?-->/g);
      console.log("未置換プレースホルダー:", placeholders ? placeholders.length : 0);
      if (placeholders) {
        placeholders.forEach(p => console.log("  ", p.substring(0, 80)));
      }

      // 画像タグの確認
      const imgTags = html.match(/<img[^>]+>/g);
      console.log("\n画像タグ:", imgTags ? imgTags.length : 0);
      if (imgTags) {
        imgTags.forEach((img, i) => {
          const src = img.match(/src="([^"]+)"/);
          if (src) {
            console.log(`  ${i + 1}:`, src[1].substring(0, 70));
          }
        });
      }
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
