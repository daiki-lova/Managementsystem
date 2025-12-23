import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";

/**
 * 既存記事の見出し色を#333に統一
 */
async function main() {
  const articles = await prisma.articles.findMany({
    select: { id: true, title: true, blocks: true },
  });

  console.log(`=== 全${articles.length}件の記事をチェック ===\n`);

  let fixedCount = 0;
  // 見出しの色を統一する対象パターン
  const colorPatterns = [
    /#2c3e50/gi,  // 濃い青灰色
    /#34495e/gi,  // 薄い青灰色
    /#1a1a1a/gi,  // ほぼ黒
    /#1f2937/gi,  // 濃いグレー
  ];

  for (const article of articles) {
    const blocks = article.blocks as any[];
    const htmlBlockIndex = blocks?.findIndex((b: any) => b.type === "html");
    if (htmlBlockIndex === -1 || !blocks) continue;

    let html = blocks[htmlBlockIndex].content as string;
    let changed = false;

    // h2タグの色を修正
    const h2Pattern = /<h2([^>]*)color:#[0-9a-f]{3,6}([^>]*)>/gi;
    if (h2Pattern.test(html)) {
      html = html.replace(/<h2([^>]*)color:#[0-9a-f]{3,6}([^>]*)>/gi, '<h2$1color:#333$2>');
      changed = true;
    }

    // h3タグの色を修正
    const h3Pattern = /<h3([^>]*)color:#[0-9a-f]{3,6}([^>]*)>/gi;
    if (h3Pattern.test(html)) {
      html = html.replace(/<h3([^>]*)color:#[0-9a-f]{3,6}([^>]*)>/gi, '<h3$1color:#333$2>');
      changed = true;
    }

    if (changed) {
      console.log(`修正中: ${article.title.substring(0, 40)}...`);
      blocks[htmlBlockIndex].content = html;
      await prisma.articles.update({
        where: { id: article.id },
        data: { blocks: blocks as any },
      });
      console.log(`  ✅ 修正完了`);
      fixedCount++;
    }
  }

  console.log(`\n=== 完了: ${fixedCount}件を修正 ===`);
  await prisma.$disconnect();
}

main().catch(console.error);
