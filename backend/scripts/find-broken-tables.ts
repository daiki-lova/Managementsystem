import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";

async function main() {
  const articles = await prisma.articles.findMany({
    select: { id: true, title: true, blocks: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  console.log("=== 壊れたテーブル構造を検索 ===\n");

  for (const article of articles) {
    const blocks = article.blocks as any[];
    const htmlBlock = blocks?.find((b: any) => b.type === "html");
    if (!htmlBlock) continue;

    const html = htmlBlock.content as string;

    // 壊れた構造を検出: <table>直後に<th>がある（<thead>や<tr>ではなく）
    // <th(?!ead) は <th> にマッチするが <thead> にはマッチしない
    const brokenPattern = /<table[^>]*>\s*<th(?!ead)[^>]*>/i;
    const hasBroken = brokenPattern.test(html);

    if (hasBroken) {
      console.log(`❌ 壊れた構造: ${article.title}`);
      console.log(`   ID: ${article.id}`);
      console.log(`   作成: ${article.createdAt}`);

      // 壊れた部分を抽出
      const match = html.match(/<table[^>]*>[\s\S]{0,200}/i);
      if (match) {
        console.log(`   HTML: ${match[0].substring(0, 150)}...`);
      }
      console.log("");
    } else {
      console.log(`✅ 正常: ${article.title.substring(0, 30)}...`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
