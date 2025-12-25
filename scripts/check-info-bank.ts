import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";

async function checkInfoBankUsage() {
  // Get all knowledge items
  const knowledgeItems = await prisma.knowledge_items.findMany({
    select: {
      id: true,
      title: true,
      type: true,
      usageCount: true,
      content: true,
    }
  });

  console.log("=== 情報バンク使用状況 ===\n");

  for (const item of knowledgeItems) {
    console.log(`[${item.type}] ${item.title}`);
    console.log(`  使用回数: ${item.usageCount}回`);
    console.log(`  内容(先頭80文字): ${item.content.substring(0, 80)}...`);
    console.log("");
  }

  // Get recent 5 articles and check their content for knowledge item references
  console.log("\n=== 最新5記事の体験談引用確認 ===\n");

  const articles = await prisma.articles.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      title: true,
      blocks: true,
    }
  });

  // Extract quotes from each article
  for (const article of articles) {
    console.log(`📝 ${article.title}`);

    const blocks = article.blocks as any[];
    const htmlBlock = blocks?.find(b => b.type === "html");

    if (htmlBlock?.content) {
      const content = htmlBlock.content;

      // Find quoted text (student voices)
      const quoteMatches = content.match(/「[^」]{15,150}」/g);
      if (quoteMatches) {
        console.log(`  体験談引用数: ${quoteMatches.length}個`);
        // Show first 3 unique quotes
        const uniqueQuotes = [...new Set(quoteMatches)];
        uniqueQuotes.slice(0, 3).forEach((m: string, i: number) => {
          const shortQuote = m.length > 70 ? m.substring(0, 70) + "..." : m;
          console.log(`  [${i+1}] ${shortQuote}`);
        });
      } else {
        console.log("  体験談引用: なし");
      }

      // Check for specific patterns from knowledge items (direct copy check)
      let directCopyFound = false;
      for (const item of knowledgeItems) {
        if (item.type === "student_voice") {
          // Check if significant portion (30+ chars) of knowledge content appears directly
          const snippets = item.content.match(/.{30,50}/g) || [];
          for (const snippet of snippets.slice(0, 3)) {
            if (content.includes(snippet)) {
              console.log(`  ⚠️ 情報バンク「${item.title}」の内容が直接コピーされている可能性`);
              console.log(`     一致部分: "${snippet.substring(0, 40)}..."`);
              directCopyFound = true;
              break;
            }
          }
          if (directCopyFound) break;
        }
      }
      if (!directCopyFound) {
        console.log("  ✅ 情報バンクの直接コピーなし（仮名で再構成されている）");
      }
    }
    console.log("");
  }

  // Check if same voices are used across multiple articles
  console.log("\n=== 記事間の体験談重複チェック ===\n");

  const articleQuotes: Map<string, string[]> = new Map();

  for (const article of articles) {
    const blocks = article.blocks as any[];
    const htmlBlock = blocks?.find(b => b.type === "html");
    if (htmlBlock?.content) {
      const quotes = htmlBlock.content.match(/「[^」]{20,100}」/g) || [];
      articleQuotes.set(article.title, quotes);
    }
  }

  // Find overlapping quotes
  const allQuotes = new Map<string, string[]>();
  for (const [title, quotes] of articleQuotes) {
    for (const quote of quotes) {
      if (!allQuotes.has(quote)) {
        allQuotes.set(quote, []);
      }
      allQuotes.get(quote)!.push(title);
    }
  }

  const duplicates = [...allQuotes.entries()].filter(([_, titles]) => titles.length > 1);
  if (duplicates.length > 0) {
    console.log(`⚠️ ${duplicates.length}個の体験談が複数記事で重複使用されています:`);
    duplicates.slice(0, 5).forEach(([quote, titles]) => {
      console.log(`  「${quote.substring(1, 50)}...」`);
      console.log(`    使用記事: ${titles.join(", ")}`);
    });
  } else {
    console.log("✅ 記事間での体験談の重複使用はありません");
  }

  await prisma.$disconnect();
}

checkInfoBankUsage().catch(console.error);
