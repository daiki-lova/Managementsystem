import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";

// モノトーンのスタイル定義
const ARTICLE_STYLES = {
  h2: 'font-size:1.5em;font-weight:bold;margin:48px 0 24px;color:#333;border-bottom:3px solid #333;padding-bottom:12px;',
  h3: 'font-size:1.25em;font-weight:bold;margin:32px 0 16px;color:#333;padding-left:12px;border-left:4px solid #666;',
  h4: 'font-size:1.1em;font-weight:bold;margin:24px 0 12px;color:#333;'
};

async function fixAllArticles() {
  const articles = await prisma.articles.findMany({
    select: { id: true, title: true, blocks: true }
  });

  console.log(`全${articles.length}件の記事を修正中...\n`);
  let fixed = 0;

  for (const article of articles) {
    const blocks = article.blocks as any[];
    if (!blocks) continue;
    const htmlBlockIndex = blocks.findIndex((b: any) => b.type === 'html');
    if (htmlBlockIndex === -1) continue;

    let html = blocks[htmlBlockIndex].content as string;
    const originalHtml = html;

    // H2/H3/H4を固定スタイルに置換
    html = html.replace(/<h2[^>]*>/gi, `<h2 style="${ARTICLE_STYLES.h2}">`);
    html = html.replace(/<h3[^>]*>/gi, `<h3 style="${ARTICLE_STYLES.h3}">`);
    html = html.replace(/<h4[^>]*>/gi, `<h4 style="${ARTICLE_STYLES.h4}">`);

    // 紫色をグレー系に置換
    html = html.replace(/#8B5CF6/gi, '#333');
    html = html.replace(/#A78BFA/gi, '#666');
    html = html.replace(/#f8f4ff/gi, '#F5F5F5');

    if (html !== originalHtml) {
      blocks[htmlBlockIndex].content = html;
      await prisma.articles.update({
        where: { id: article.id },
        data: { blocks: blocks as any }
      });
      console.log(`✅ ${article.title.substring(0, 30)}...`);
      fixed++;
    }
  }

  console.log(`\n完了: ${fixed}件を修正`);
  await prisma.$disconnect();
}

fixAllArticles().catch(console.error);
