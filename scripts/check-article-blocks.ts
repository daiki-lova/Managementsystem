import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";

async function main() {
  const article = await prisma.articles.findUnique({
    where: { id: "c8c45757-c2ec-4cc4-a67b-a1e2f7f1789b" },
    select: { title: true, blocks: true }
  });

  if (!article) {
    console.log("記事が見つかりません");
    await prisma.$disconnect();
    return;
  }

  console.log("タイトル:", article.title);
  console.log("ブロック:", JSON.stringify(article.blocks, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
