import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";
import { writeFileSync } from "fs";

async function main() {
  const article = await prisma.articles.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, blocks: true },
  });

  if (!article) {
    console.log("記事が見つかりません");
    await prisma.$disconnect();
    return;
  }

  const blocks = article.blocks as any[];
  const htmlBlock = blocks?.find((b: any) => b.type === "html");

  if (htmlBlock) {
    writeFileSync("/tmp/latest-article.html", htmlBlock.content);
    console.log("HTMLを /tmp/latest-article.html に保存しました");
    console.log("記事ID:", article.id);
    console.log("タイトル:", article.title);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
