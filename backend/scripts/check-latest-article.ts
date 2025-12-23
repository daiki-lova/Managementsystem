import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";

async function main() {
  // 最新の記事を取得
  const article = await prisma.articles.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, blocks: true, createdAt: true },
  });

  if (!article) {
    console.log("記事が見つかりません");
    await prisma.$disconnect();
    return;
  }

  console.log("=== 最新記事 ===");
  console.log("ID:", article.id);
  console.log("タイトル:", article.title);
  console.log("作成日時:", article.createdAt);
  console.log("");

  const blocks = article.blocks as any[];
  if (blocks && blocks.length > 0) {
    const htmlBlock = blocks.find((b: any) => b.type === "html");
    if (htmlBlock) {
      const html = htmlBlock.content as string;

      // テーブル構造のチェック
      console.log("=== テーブル構造チェック ===");
      const tables = html.match(/<table[\s\S]*?<\/table>/gi);
      if (tables) {
        console.log(`テーブル数: ${tables.length}`);
        tables.forEach((table, i) => {
          console.log(`\n--- テーブル ${i + 1} ---`);
          console.log("thead存在:", table.includes("<thead>"));
          console.log("tbody存在:", table.includes("<tbody>"));

          // 壊れた構造の検出
          const hasBrokenTh = /<table[^>]*>\s*<th[^>]*>/i.test(table);
          console.log("壊れた<th>ラッパー:", hasBrokenTh);

          // 最初の300文字を表示
          console.log("\nHTML構造 (最初の300文字):");
          console.log(table.substring(0, 300));
        });
      } else {
        console.log("テーブルなし");
      }

      // CTAバナーのチェック（実際のCTAパターンを探す）
      console.log("\n=== CTAバナーチェック ===");
      // CTAバナーは gradient を含むdivとして挿入される
      const ctaPattern = /linear-gradient\(135deg, #8B5CF6/;
      const hasCta = ctaPattern.test(html);
      console.log("CTAバナー存在:", hasCta);

      if (hasCta) {
        // CTAの位置を確認
        const h2Matches = [...html.matchAll(/<h2[^>]*>/gi)];
        const ctaMatch = html.match(ctaPattern);
        if (ctaMatch && ctaMatch.index && h2Matches.length > 0) {
          const ctaIndex = ctaMatch.index;
          let ctaAfterH2Count = 0;
          for (const h2 of h2Matches) {
            if (h2.index && h2.index < ctaIndex) {
              ctaAfterH2Count++;
            }
          }
          console.log(`CTAは${ctaAfterH2Count}番目のH2の後に配置`);
          console.log(`総H2数: ${h2Matches.length}`);
        }

        // CTAバナーの内容を抽出
        const ctaMatch2 = html.match(/<div style="[^"]*linear-gradient\(135deg, #8B5CF6[\s\S]*?<\/div>/i);
        if (ctaMatch2) {
          console.log("\nCTAバナー内容（最初の300文字）:");
          console.log(ctaMatch2[0].substring(0, 300));
        }
      }

      // FAQのチェック
      console.log("\n=== FAQチェック ===");
      const faqH2 = html.match(/よくある質問/);
      if (faqH2) {
        console.log("FAQ見出し: あり");
        // FAQセクションの形式を確認
        const faqSectionStart = html.indexOf("よくある質問");
        const faqSection = html.substring(faqSectionStart, faqSectionStart + 1000);

        if (faqSection.includes("<details")) {
          console.log("FAQ形式: details/summary");
        } else if (faqSection.match(/Q\s*<\/span>/)) {
          console.log("FAQ形式: div形式（修正済み）");
        } else {
          console.log("FAQ形式: その他");
        }
        console.log("\nFAQサンプル:");
        console.log(faqSection.substring(0, 400));
      } else {
        console.log("FAQセクション: なし");
      }

      // 関連記事リンクのチェック
      console.log("\n=== 関連記事リンクチェック ===");
      const relatedLinks = html.match(/関連記事[\s\S]{0,500}/);
      if (relatedLinks) {
        console.log("関連記事セクション: あり");
        console.log(relatedLinks[0].substring(0, 300));
      } else {
        // 内部リンクを確認
        const internalLinks = html.match(/href="\/[^"]+"/g);
        console.log("内部リンク数:", internalLinks ? internalLinks.length : 0);
        if (internalLinks && internalLinks.length > 0) {
          console.log("内部リンク例:", internalLinks.slice(0, 3).join(", "));
        }
      }
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
